import React, { useState, useEffect } from 'react';
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
  Search,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#0a101f] border-b border-emerald-950/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-sm font-mono tracking-wider">SecureShare Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Admin Sidebar matching Screens 18-23 */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-60 bg-[#080e1a] border-r border-emerald-950/40 flex flex-col shrink-0 z-20`}
        >
          {/* Brand */}
          <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-emerald-950/40">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-wide font-mono">SecureShare</span>
              <p className="text-[10px] text-emerald-400 font-mono">ADMIN PORTAL</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-md shadow-emerald-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-500/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-emerald-950/40">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-[#080e1a]/80 backdrop-blur-md border-b border-emerald-950/40 sticky top-0 z-10">
            {/* Search Bar */}
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Profile Avatar / Notification */}
            <div className="flex items-center gap-4">
              <NavLink
                to="/admin/notifications"
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
              </NavLink>

              <div className="flex items-center gap-3 pl-2 border-l border-emerald-950/40">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  AD
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-white leading-tight">Admin User</p>
                  <p className="text-[10px] text-emerald-400 font-mono">admin@example.com</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Outlet */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
