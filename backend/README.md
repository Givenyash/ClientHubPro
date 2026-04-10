# ClientHubPro Backend

MERN stack backend built with Express.js and MongoDB.

## Features

- **Authentication**: JWT-based auth with access & refresh tokens
- **User Management**: Registration, login, password reset
- **Client Management**: CRUD operations for clients (admin only)
- **Analytics**: Dashboard analytics and insights
- **Security**: 
  - Password hashing with bcrypt
  - Rate limiting on login attempts
  - Role-based access control
  - HTTP-only cookies for token storage

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Security**: CORS, cookie-parser

## Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or MongoDB Atlas)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=8001
MONGO_URL=mongodb://localhost:27017
DB_NAME=clienthubpro
JWT_SECRET=your-secret-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Clients (Admin Only for write operations)
- `GET /api/clients` - Get all clients (with pagination, search, filters)
- `POST /api/clients` - Create a new client
- `PUT /api/clients/:client_id` - Update a client
- `DELETE /api/clients/:client_id` - Delete a client

### Analytics
- `GET /api/analytics` - Get dashboard analytics

## Default Credentials

On first run, the backend automatically creates:

**Admin Account:**
- Email: `admin@clienthubpro.com`
- Password: `Admin@2026`

**Test User Account:**
- Email: `user@clienthubpro.com`
- Password: `User@2026`

## Database Collections

- `users` - User accounts with hashed passwords
- `clients` - Client records
- `login_attempts` - Login attempt tracking for rate limiting
- `password_reset_tokens` - Password reset tokens with expiration

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT tokens with 15-minute access token expiry
- 7-day refresh token expiry
- Login attempt rate limiting (5 attempts → 15-minute lockout)
- Role-based access control (admin/user)
- HTTP-only cookies for token storage
- CORS configuration
- Input validation with express-validator

## Project Structure

```
backend/
├── server.js          # Main Express server with all routes
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
└── .env               # Environment variables (not in git)
```
