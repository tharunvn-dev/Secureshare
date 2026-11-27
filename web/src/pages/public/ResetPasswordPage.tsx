import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Key, ArrowLeft, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
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

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 sm:p-10 relative text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
          <Key className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Enter your new password to secure your account
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleReset} className="mt-6 space-y-4 text-left text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sec-input"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">6-Digit OTP from Email</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="sec-input text-center font-mono tracking-widest text-lg"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="sec-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="sec-input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full sec-btn-blue py-3 font-semibold tracking-wide disabled:opacity-50 mt-2 text-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>Password successfully reset!</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full sec-btn-blue py-2.5 text-xs font-semibold"
            >
              Proceed to Login &rarr;
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
