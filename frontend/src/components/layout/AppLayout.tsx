import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  MessageSquare,
  Receipt,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DoodleCrown } from '../doodle/DoodleAssets';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      to: '/app',
      icon: <LayoutDashboard className="w-4 h-4 text-blue-600" />,
      end: true,
    },
    {
      label: 'Upload Bill',
      to: '/app/upload',
      icon: <UploadCloud className="w-4 h-4 text-red-600" />,
      badge: 'New',
    },
    {
      label: 'AI Chat',
      to: '/app/chat',
      icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
    },
    {
      label: 'Previous Bills',
      to: '/app/invoices',
      icon: <Receipt className="w-4 h-4 text-red-600" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-notebook-grid text-slate-900">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 border-b-2 border-slate-900 shadow-sm">
        <NavLink to="/app" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
            <DoodleCrown className="absolute -top-3.5 -right-2 w-4 h-3.5 text-red-600 rotate-12" />
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-slate-900">InvoicerAI</span>
        </NavLink>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md border-2 border-slate-900 text-slate-900 hover:bg-slate-100 shadow-[2px_2px_0px_#0f172a]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar & Mobile Drawer */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r-2 border-slate-900 flex-shrink-0 flex flex-col justify-between z-30 shadow-sm`}
      >
        <div>
          {/* Brand header */}
          <div className="hidden md:flex items-center gap-2.5 px-6 py-5 border-b-2 border-slate-900 border-dashed">
            <div className="relative w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <DoodleCrown className="absolute -top-3.5 -right-2 w-5 h-4 text-red-600 rotate-12" />
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl tracking-tight block leading-tight text-slate-900">
                InvoicerAI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Dukaan Ka Hisaab
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="p-4 border-b-2 border-slate-900 border-dashed">
            <NavLink
              to="/app/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-heading font-bold rounded-md border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New Bill</span>
            </NavLink>
          </div>

          {/* Primary Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-heading font-bold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-slate-900">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile and Logout */}
        <div className="p-4 border-t-2 border-slate-900 border-dashed bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-md bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-blue-800 shrink-0 font-bold">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-sm font-heading font-bold truncate text-slate-900">
                  {user?.username || 'Shopkeeper'}
                </p>
                <p className="text-xs text-slate-500 font-mono truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-heading font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-slate-900"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-notebook-grid">
        <Outlet />
      </main>
    </div>
  );
};
