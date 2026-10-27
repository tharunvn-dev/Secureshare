import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Key, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

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
    <div className="min-h-screen bg-[#060b14] flex flex-col font-sans selection:bg-[#10b981]/30 selection:text-[#34d399]">
      <TopFeatureBar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0b1325] border border-[#1a2744] rounded-2xl p-8 sm:p-10 shadow-2xl relative text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] mb-4">
            <Key className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            Enter your new password to secure your account
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleReset} className="mt-6 space-y-4 text-left text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sec-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">6-Digit OTP from Email</label>
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
                <label className="block text-slate-300 font-medium mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="sec-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="sec-input pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full sec-btn-emerald py-3 text-slate-950 font-bold tracking-wide disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-4 text-center">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Password successfully reset!</span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full sec-btn-emerald py-2.5 text-xs text-slate-950 font-semibold"
              >
                Proceed to Login &rarr;
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#141f36]">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
