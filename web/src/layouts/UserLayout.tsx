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
  Shield,
  MoreVertical,
  Activity,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from '../components/common/NotificationBell';
import { KeyModal } from '../components/common/KeyModal';

export const UserLayout: React.FC = () => {
  const { user, logout, privateKey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const isExpanded = isHovered || mobileOpen;

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
    { to: '/app/notifications', label: 'Activity', icon: Activity },
    { to: '/app/profile', label: 'Profile', icon: User },
    { to: '/app/security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 transition-opacity"
        />
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            <MoreVertical className="w-5 h-5 text-blue-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-wide">Secure Vault</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* Hover-Based Collapsible Sidebar (Clean Blue & White Theme) */}
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-slate-200 shadow-md flex flex-col transition-all duration-300 ease-in-out ${
            isExpanded ? 'w-60 shadow-xl' : 'w-[60px]'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          {/* Header Area: 3-dots icon when collapsed; Logo + App Name when hovered */}
          <div className="h-16 flex items-center border-b border-slate-100 relative px-4 overflow-hidden shrink-0">
            {/* Collapsed State: Vertical Three-Dot (⋮) Icon */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 cursor-pointer ${
                isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              title="Expand Menu"
            >
              <MoreVertical className="w-5 h-5 text-slate-400 hover:text-blue-600 transition-colors" />
            </div>

            {/* Hovered State: Secure Vault Logo & Application Name */}
            <div
              className={`flex items-center gap-3 transition-opacity duration-300 whitespace-nowrap overflow-hidden ${
                isExpanded ? 'opacity-100 delay-75' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/30">
                <Shield className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm text-slate-900 tracking-wide">Secure Vault</h1>
                <p className="text-[10px] text-blue-600 font-medium">Cloud Vault</p>
              </div>
            </div>
          </div>

          {/* Navigation Links: Visible only on hover / expanded state */}
          <div
            className={`flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden transition-opacity duration-300 ${
              isExpanded ? 'opacity-100 delay-75' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="p-3 space-y-1">
              {/* User Mini Card in Expanded Sidebar */}
              <div className="px-3 py-2.5 mb-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                  {user?.firstName ? user.firstName.charAt(0) : user?.email?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user?.displayName || user?.email}</p>
                  <p className="text-[10px] text-slate-500 font-medium">User</p>
                </div>
              </div>

              <nav className="space-y-0.5 text-xs font-medium">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 whitespace-nowrap ${
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
              </nav>
            </div>

            {/* Bottom Actions: Keyring & Logout */}
            <div className="p-3 border-t border-slate-100 space-y-2">
              <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    P-256 Key
                  </span>
                  <span
                    className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold ${
                      privateKey
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    {privateKey ? 'Active' : 'Missing'}
                  </span>
                </div>
                <button
                  onClick={() => setKeyModalOpen(true)}
                  className="w-full mt-1.5 text-left text-[10px] font-semibold text-blue-600 hover:underline"
                >
                  Keyring Settings &rarr;
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all whitespace-nowrap"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area - Gutter 60px on desktop so dashboard content never shifts */}
        <div className="flex-1 flex flex-col min-w-0 md:ml-[60px] transition-[margin] duration-300">
          {/* Topbar with Brand Logo, Search, Bell & Avatar */}
          <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
            {/* Topbar Brand & Search */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-sm tracking-wide">Secure Vault</span>
              </div>

              <div className="w-72 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
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
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setKeyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
              >
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>Keyring</span>
              </button>

              <NotificationBell />

              <div className="h-4 w-px bg-slate-200" />

              {/* Profile Avatar */}
              <NavLink to="/app/profile" className="flex items-center gap-2.5 hover:opacity-90">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                  {user?.firstName ? user.firstName.charAt(0) : user?.email?.charAt(0) || 'U'}
                  {user?.lastName ? user.lastName.charAt(0) : ''}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-900 leading-tight">{user?.displayName || user?.email}</p>
                  <p className="text-[10px] text-slate-500">User</p>
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
