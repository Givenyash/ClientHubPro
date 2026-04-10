import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, User } from '@phosphor-icons/react';

const Navbar = ({ title }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0] sticky top-0 z-50" data-testid="navbar">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0B]" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="navbar-title">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            data-testid="notification-button"
            className="w-10 h-10 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8F9FA] hover:text-[#0A0A0B] text-[#475569] flex items-center justify-center transition-all duration-200"
          >
            <Bell size={20} />
          </button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-md border border-[#E2E8F0] bg-white" data-testid="user-info">
            <div className="w-8 h-8 rounded-full bg-[#0047FF] flex items-center justify-center">
              <User size={18} weight="bold" color="white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0A0A0B]">{user?.name}</p>
              <p className="text-xs text-[#64748B] uppercase tracking-wider font-bold">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;