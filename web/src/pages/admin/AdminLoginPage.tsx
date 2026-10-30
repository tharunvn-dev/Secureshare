import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(email.trim(), password);
      if (response?.user?.roles?.includes('ADMIN')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      // If backend login requires special admin flow or password mismatch
      setError(err?.response?.data?.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      <TopFeatureBar />

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column matching Screen 17 */}
          <div className="space-y-6 lg:pr-8 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/60">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-mono">SecureShare</span>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Administrator Portal
              </h1>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-md">
                Monitor, manage and secure the entire system.
              </p>
            </div>

            {/* Glowing 3D Shield Graphic on Pedestal */}
            <div className="relative py-8 flex justify-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20 animate-pulse" />

                {/* 3D SVG Shield Pedestal */}
                <svg viewBox="0 0 200 200" className="w-48 h-48 relative z-10 drop-shadow-[0_0_35px_rgba(6,182,212,0.5)]">
                  <defs>
                    <linearGradient id="adminShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <radialGradient id="adminPedestalGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Base Pedestal Platform */}
                  <ellipse cx="100" cy="170" rx="70" ry="18" fill="url(#adminPedestalGlow)" opacity="0.6" />
                  <ellipse cx="100" cy="165" rx="55" ry="12" fill="#0b172a" stroke="#06b6d4" strokeWidth="1.5" />
                  <ellipse cx="100" cy="160" rx="42" ry="8" fill="#0369a1" opacity="0.4" />

                  {/* Shield Silhouette */}
                  <path
                    d="M 100 25 L 145 42 C 145 95 130 135 100 152 C 70 135 55 95 55 42 Z"
                    fill="url(#adminShieldGrad)"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />

                  {/* Inner Shield Accent */}
                  <path
                    d="M 100 36 L 135 50 C 135 90 123 123 100 138 C 77 123 65 90 65 50 Z"
                    fill="#041830"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                    opacity="0.9"
                  />

                  {/* Center Keyhole Lock */}
                  <circle cx="100" cy="80" r="10" fill="#38bdf8" />
                  <path d="M 96 85 L 94 105 L 106 105 L 104 85 Z" fill="#38bdf8" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Column: Screen 17 Admin Login Card */}
          <div className="sec-card p-8 md:p-10 max-w-md w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-wide">Admin Login</h2>
              <p className="text-xs text-slate-400 mt-1">Sign in to access the administrator portal</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-emerald-950/60 text-emerald-500 focus:ring-0 bg-black/50"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sec-btn-emerald w-full py-2.5 text-xs font-semibold uppercase tracking-wider"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-emerald-950/40 text-center">
              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to main site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
