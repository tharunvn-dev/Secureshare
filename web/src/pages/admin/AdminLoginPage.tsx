import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center p-6 font-sans relative selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
          <Shield className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">Secure Vault</span>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 sm:p-10 relative">
        <div className="text-center mb-6">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 text-[10px] font-semibold tracking-wider uppercase mb-2">
            Administrator Portal
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">Manage system security, users, and audit vaults</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Admin Email</label>
            <input
              type="email"
              required
              placeholder="admin@securevault.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 text-xs text-slate-600 select-none">
              Keep admin session active
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-sm shadow-blue-500/25 transition-all text-xs disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs">
          <Link to="/login" className="text-slate-500 hover:text-blue-600 font-medium">
            &larr; Return to User Login
          </Link>
        </div>
      </div>
    </div>
  );
};
