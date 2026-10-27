import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
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
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Your Password</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            Enter your email to receive a reset link
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sec-input pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sec-btn-emerald py-3 text-slate-950 font-bold tracking-wide disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-4 text-center">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password reset OTP dispatched to your email!</span>
              </div>
              <button
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="w-full sec-btn-emerald py-2.5 text-xs text-slate-950 font-semibold"
              >
                Enter Reset Code &rarr;
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#141f36]">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
