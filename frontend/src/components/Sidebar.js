import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SquaresFour, Users, ChartBar, SignOut } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: SquaresFour, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 h-screen bg-white border-r border-[#E2E8F0] flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-[#E2E8F0]" data-testid="sidebar-logo">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0047FF] rounded-md flex items-center justify-center">
            <SquaresFour size={24} weight="bold" color="white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0A0A0B]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              ClientHubPro
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">Enterprise</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4" data-testid="sidebar-navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 ${
                  active
                    ? 'bg-[#0047FF] text-white'
                    : 'text-[#475569] hover:bg-[#F8F9FA] hover:text-[#0A0A0B]'
                }`}
              >
                <Icon size={20} weight={active ? 'fill' : 'regular'} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-[#E2E8F0]" data-testid="sidebar-footer">
        <div className="mb-3 px-4 py-3 bg-[#F8F9FA] rounded-md border border-[#E2E8F0]">
          <p className="text-xs uppercase tracking-wider text-[#64748B] font-bold mb-1">Logged In As</p>
          <p className="text-sm font-semibold text-[#0A0A0B]">{user?.name}</p>
          <p className="text-xs text-[#475569] truncate">{user?.email}</p>
          <div className="mt-2">
            <span
              className={`inline-block px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${
                user?.role === 'admin' ? 'bg-[#0047FF] text-white' : 'bg-[#E2E8F0] text-[#475569]'
              }`}
            >
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          data-testid="logout-button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-white border border-[#E2E8F0] text-[#0A0A0B] hover:bg-[#F8F9FA] hover:text-[#0A0A0B] transition-all duration-200 font-semibold text-sm"
        >
          <SignOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;