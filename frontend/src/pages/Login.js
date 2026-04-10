import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Envelope, Lock, User as UserIcon, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.name, formData.email, formData.password);

      if (result.success) {
        toast.success(isLogin ? 'Login successful!' : 'Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#0047FF] rounded-md flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#0A0A0B]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  ClientHubPro
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#64748B] font-semibold">Enterprise Edition</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#0A0A0B] mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-[#475569]">
              {isLogin ? 'Login to access your dashboard' : 'Join ClientHubPro to manage your clients'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
            {!isLogin && (
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    data-testid="name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
                Email Address
              </label>
              <div className="relative">
                <Envelope size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="email"
                  data-testid="email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  data-testid="password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0A0A0B]"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-[#64748B] mt-1">Must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              data-testid="submit-button"
              disabled={loading}
              className="w-full bg-[#0047FF] text-white hover:bg-[#0036CC] hover:text-white rounded-md px-4 py-3 transition-all duration-200 font-semibold focus:ring-2 focus:ring-[#0047FF]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ name: '', email: '', password: '' });
              }}
              data-testid="toggle-auth-mode"
              className="text-sm text-[#0047FF] hover:text-[#0036CC] font-semibold"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-8 p-4 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md">
              <p className="text-xs uppercase tracking-wider font-bold text-[#64748B] mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-[#475569]">
                <p><strong>Admin:</strong> admin@clienthubpro.com / Admin@2026</p>
                <p><strong>User:</strong> user@clienthubpro.com / User@2026</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="hidden lg:flex flex-1 bg-cover bg-center relative"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1521202850558-0110494d0457?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGdlb21ldHJpYyUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NzU1OTA1MjF8MA&ixlib=rb-4.1.0&q=85)' }}
      >
        <div className="absolute inset-0 bg-[#0047FF]/10"></div>
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-center">
            <h3 className="text-4xl font-black text-[#0A0A0B] mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Enterprise-Grade
              <br />Client Management
            </h3>
            <p className="text-lg text-[#475569] max-w-md">
              Manage your clients with precision, security, and scale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;