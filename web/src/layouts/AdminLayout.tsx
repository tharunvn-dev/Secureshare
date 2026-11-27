import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  HardDrive,
  Share2,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/files', label: 'Files', icon: HardDrive },
    { to: '/admin/shares', label: 'Shares', icon: Share2 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm">SecureStorage Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-500 hover:text-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Admin Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-64 bg-white border-r border-slate-200 flex flex-col shrink-0`}
        >
          {/* Header Brand */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900">SecureStorage</h1>
              <p className="text-[10px] text-blue-600 font-medium">Admin Terminal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Logout */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
