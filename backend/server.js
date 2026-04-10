import 'dotenv/config';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 8001;

// Trust proxy for proper IP detection
app.set('trust proxy', true);

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';

let db;
const client = new MongoClient(mongoUrl);

await client.connect();
db = client.db(dbName);
console.log('✅ Connected to MongoDB');

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const createAccessToken = (userId, email, role) => {
  return jwt.sign(
    { sub: userId, email, role, type: 'access' },
    JWT_SECRET,
    { algorithm: JWT_ALGORITHM, expiresIn: '15m' }
  );
};

const createRefreshToken = (userId) => {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_SECRET,
    { algorithm: JWT_ALGORITHM, expiresIn: '7d' }
  );
};

const authenticateToken = async (req, res, next) => {
  let token = req.cookies.access_token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    
    if (payload.type !== 'access') {
      return res.status(401).json({ detail: 'Invalid token type' });
    }
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.sub) });
    
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }
};

app.post('/api/auth/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array().map(e => e.msg).join(', ') });
  }
  
  try {
    const { name, email, password, role } = req.body;
    const emailLower = email.toLowerCase();
    
    const existing = await db.collection('users').findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ detail: 'Email already registered' });
    }
    
    const passwordHash = await hashPassword(password);
    const userRole = (role === 'admin' || role === 'user') ? role : 'user';
    
    const result = await db.collection('users').insertOne({
      name,
      email: emailLower,
      password_hash: passwordHash,
      role: userRole,
      created_at: new Date()
    });
    
    const userId = result.insertedId.toString();
    const accessToken = createAccessToken(userId, emailLower, userRole);
    const refreshToken = createRefreshToken(userId);
    
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/'
    });
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    res.json({
      id: userId,
      name,
      email: emailLower,
      role: userRole
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ detail: 'Registration failed' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array().map(e => e.msg).join(', ') });
  }
  
  try {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown';
    const identifier = `${ip}:${emailLower}`;
    
    const attempt = await db.collection('login_attempts').findOne({ identifier });
    if (attempt && attempt.locked_until) {
      if (new Date() < attempt.locked_until) {
        return res.status(429).json({ detail: 'Too many failed attempts. Try again later.' });
      }
    }
    
    const user = await db.collection('users').findOne({ email: emailLower });
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      const failedCount = (attempt?.count || 0) + 1;
      const lockedUntil = failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      
      await db.collection('login_attempts').updateOne(
        { identifier },
        { $set: { count: failedCount, locked_until: lockedUntil, last_attempt: new Date() } },
        { upsert: true }
      );
      
      if (failedCount >= 5) {
        return res.status(429).json({ detail: 'Too many failed attempts. Try again later.' });
      }
      
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    
    await db.collection('login_attempts').deleteOne({ identifier });
    
    const userId = user._id.toString();
    const accessToken = createAccessToken(userId, user.email, user.role);
    const refreshToken = createRefreshToken(userId);
    
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/'
    });
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    res.json({
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Login failed' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

app.post('/api/auth/refresh', async (req, res) => {
  const token = req.cookies.refresh_token;
  
  if (!token) {
    return res.status(401).json({ detail: 'No refresh token' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    
    if (payload.type !== 'refresh') {
      return res.status(401).json({ detail: 'Invalid token type' });
    }
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.sub) });
    
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    const userId = user._id.toString();
    const accessToken = createAccessToken(userId, user.email, user.role);
    
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/'
    });
    
    res.json({ message: 'Token refreshed' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Refresh token expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }
});

app.post('/api/auth/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = email.toLowerCase();
    
    const user = await db.collection('users').findOne({ email: emailLower });
    
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }
    
    const token = crypto.randomBytes(32).toString('base64url');
    
    await db.collection('password_reset_tokens').insertOne({
      token,
      user_id: user._id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used: false
    });
    
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log(`\n\n=== PASSWORD RESET LINK ===\n${resetLink}\n===========================\n\n`);
    
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ detail: 'Failed to process request' });
  }
});

app.post('/api/auth/reset-password', [
  body('token').notEmpty(),
  body('new_password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const { token, new_password } = req.body;
    
    const resetDoc = await db.collection('password_reset_tokens').findOne({ token, used: false });
    
    if (!resetDoc) {
      return res.status(400).json({ detail: 'Invalid or expired reset token' });
    }
    
    if (new Date() > resetDoc.expires_at) {
      return res.status(400).json({ detail: 'Reset token has expired' });
    }
    
    const hashedPassword = await hashPassword(new_password);
    
    await db.collection('users').updateOne(
      { _id: resetDoc.user_id },
      { $set: { password_hash: hashedPassword } }
    );
    
    await db.collection('password_reset_tokens').updateOne(
      { token },
      { $set: { used: true } }
    );
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ detail: 'Failed to reset password' });
  }
});

app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { search, status, company, page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }
    
    const sortDirection = sort_order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const total = await db.collection('clients').countDocuments(query);
    const clients = await db.collection('clients')
      .find(query, { projection: { _id: 0 } })
      .sort({ [sort_by]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    res.json({
      clients,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ detail: 'Failed to fetch clients' });
  }
});

app.post('/api/clients', authenticateToken, [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().notEmpty(),
  body('company').trim().notEmpty(),
  body('status').isIn(['Active', 'Inactive'])
], async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Only admins can create clients' });
  }
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array().map(e => e.msg).join(', ') });
  }
  
  try {
    const { name, email, phone, company, status } = req.body;
    const emailLower = email.toLowerCase();
    
    const existing = await db.collection('clients').findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ detail: 'Client with this email already exists' });
    }
    
    const clientDoc = {
      id: crypto.randomBytes(16).toString('base64url'),
      name,
      email: emailLower,
      phone,
      company,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.collection('clients').insertOne(clientDoc);
    delete clientDoc._id;
    
    res.json(clientDoc);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ detail: 'Failed to create client' });
  }
});

app.put('/api/clients/:client_id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Only admins can update clients' });
  }
  
  try {
    const { client_id } = req.params;
    const updateData = {};
    
    const allowedFields = ['name', 'email', 'phone', 'company', 'status'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
      const emailExists = await db.collection('clients').findOne({
        email: updateData.email,
        id: { $ne: client_id }
      });
      if (emailExists) {
        return res.status(400).json({ detail: 'Email already in use by another client' });
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ detail: 'No data to update' });
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const result = await db.collection('clients').updateOne(
      { id: client_id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: 'Client not found' });
    }
    
    const updatedClient = await db.collection('clients').findOne(
      { id: client_id },
      { projection: { _id: 0 } }
    );
    
    res.json(updatedClient);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ detail: 'Failed to update client' });
  }
});

app.delete('/api/clients/:client_id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Only admins can delete clients' });
  }
  
  try {
    const { client_id } = req.params;
    
    const result = await db.collection('clients').deleteOne({ id: client_id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Client not found' });
    }
    
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ detail: 'Failed to delete client' });
  }
});

app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const totalClients = await db.collection('clients').countDocuments({});
    const activeClients = await db.collection('clients').countDocuments({ status: 'Active' });
    const inactiveClients = await db.collection('clients').countDocuments({ status: 'Inactive' });
    
    const topCompanies = await db.collection('clients').aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]).toArray();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentClients = await db.collection('clients').countDocuments({
      created_at: { $gte: thirtyDaysAgo.toISOString() }
    });
    
    res.json({
      total_clients: totalClients,
      active_clients: activeClients,
      inactive_clients: inactiveClients,
      top_companies: topCompanies,
      recent_clients_30d: recentClients
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ detail: 'Failed to fetch analytics' });
  }
});

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@clienthubpro.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026';
    
    const existing = await db.collection('users').findOne({ email: adminEmail });
    
    if (!existing) {
      const hashedPassword = await hashPassword(adminPassword);
      await db.collection('users').insertOne({
        email: adminEmail,
        password_hash: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        created_at: new Date()
      });
      console.log('✅ Admin user created');
    } else if (!(await verifyPassword(adminPassword, existing.password_hash))) {
      const hashedPassword = await hashPassword(adminPassword);
      await db.collection('users').updateOne(
        { email: adminEmail },
        { $set: { password_hash: hashedPassword } }
      );
      console.log('✅ Admin password updated');
    }
    
    const testUserEmail = 'user@clienthubpro.com';
    const testUserPassword = 'User@2026';
    const existingUser = await db.collection('users').findOne({ email: testUserEmail });
    
    if (!existingUser) {
      const hashedPassword = await hashPassword(testUserPassword);
      await db.collection('users').insertOne({
        email: testUserEmail,
        password_hash: hashedPassword,
        name: 'Test User',
        role: 'user',
        created_at: new Date()
      });
      console.log('✅ Test user created');
    }
    
    const memoryDir = './memory';
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    const credentials = `# Test Credentials\n\n` +
      `## Admin Account\n` +
      `- Email: ${adminEmail}\n` +
      `- Password: ${adminPassword}\n` +
      `- Role: admin\n\n` +
      `## Test User Account\n` +
      `- Email: ${testUserEmail}\n` +
      `- Password: ${testUserPassword}\n` +
      `- Role: user\n\n` +
      `## Endpoints\n` +
      `- POST /api/auth/login\n` +
      `- POST /api/auth/register\n` +
      `- GET /api/auth/me\n` +
      `- POST /api/auth/logout\n` +
      `- GET /api/clients\n` +
      `- POST /api/clients (admin only)\n` +
      `- PUT /api/clients/{id} (admin only)\n` +
      `- DELETE /api/clients/{id} (admin only)\n` +
      `- GET /api/analytics\n`;
    
    fs.writeFileSync(`${memoryDir}/test_credentials.md`, credentials);
    console.log('✅ Test credentials saved');
  } catch (error) {
    console.error('Seed admin error:', error);
  }
};

const createIndexes = async () => {
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('clients').createIndex({ email: 1 });
    await db.collection('clients').createIndex({ id: 1 }, { unique: true });
    await db.collection('password_reset_tokens').createIndex(
      { expires_at: 1 },
      { expireAfterSeconds: 0 }
    );
    await db.collection('login_attempts').createIndex({ identifier: 1 });
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('Create indexes error:', error);
  }
};

await seedAdmin();
await createIndexes();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});

process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});