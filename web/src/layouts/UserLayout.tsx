import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderLock,
  UploadCloud,
  Share2,
  Users,
  Bell,
  ShieldCheck,
  User,
  LogOut,
  Lock,
  Menu,
  X,
  Search,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from '../components/common/NotificationBell';
import { KeyModal } from '../components/common/KeyModal';

export const UserLayout: React.FC = () => {
  const { user, logout, privateKey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/files', label: 'My Files', icon: FolderLock },
    { to: '/app/upload', label: 'Upload File', icon: UploadCloud },
    { to: '/app/shared-with-me', label: 'Shared With Me', icon: Users },
    { to: '/app/my-shares', label: 'My Shares', icon: Share2 },
    { to: '/app/notifications', label: 'Notifications', icon: Bell },
    { to: '/app/security', label: 'Security', icon: ShieldCheck },
    { to: '/app/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans selection:bg-[#10b981]/30 selection:text-[#34d399]">
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#0a1120] border-b border-[#141f36]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center text-[#10b981]">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm tracking-wider">SecureShare</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sidebar matching User Portal */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-60 bg-[#070e1c] border-r border-[#141f36] flex flex-col shrink-0 z-20`}
        >
          {/* Brand */}
          <div className="hidden md:flex items-center gap-2.5 px-6 py-5 border-b border-[#141f36]">
            <div className="w-7 h-7 rounded-lg bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide">SecureShare</h1>
              <p className="text-[10px] text-slate-400 font-mono">User Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-xs font-medium">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c162b]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Keyring Quick Indicator in Sidebar */}
          <div className="px-3 py-2.5 mx-3 mb-3 bg-[#0c162b] border border-[#1a2744] rounded-xl text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#10b981]" />
                ECC Key:
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  privateKey
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {privateKey ? 'Active' : 'Missing'}
              </span>
            </div>
            <button
              onClick={() => setKeyModalOpen(true)}
              className="w-full mt-2 text-center text-[11px] font-medium text-[#10b981] hover:underline"
            >
              Keyring Settings &rarr;
            </button>
          </div>

          {/* Logout in Sidebar */}
          <div className="p-3 border-t border-[#141f36]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Topbar with Search, Bell & Avatar matching Board */}
          <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-[#070e1c]/80 backdrop-blur-md border-b border-[#141f36] sticky top-0 z-10">
            {/* Search Input matching Screen 9/10 */}
            <div className="w-72 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search files..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/app/files?q=${encodeURIComponent(globalSearch)}`);
                  }
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0b1325] border border-[#1a2744] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] font-sans"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setKeyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0e172e] hover:bg-[#152344] text-slate-300 border border-[#1b2b4e] transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-[#10b981]" />
                <span>P-256 Key</span>
              </button>

              <NotificationBell />

              <div className="h-4 w-px bg-[#1a2744]" />

              {/* Profile Avatar Initials Circle matching Screen 16 */}
              <NavLink to="/app/profile" className="flex items-center gap-2.5 hover:opacity-90">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-md">
                  {user?.firstName ? user.firstName.charAt(0) : user?.email?.charAt(0) || 'U'}
                  {user?.lastName ? user.lastName.charAt(0) : ''}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-white leading-tight">{user?.displayName || user?.email}</p>
                  <p className="text-[10px] text-slate-400 font-mono">User</p>
                </div>
              </NavLink>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <KeyModal isOpen={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
    </div>
  );
};
