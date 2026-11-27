import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, getErrorMessage } from '../../api/client';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  const emailParam = searchParams.get('email') || 'john@example.com';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(45);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleDigitChange = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = val ? val[val.length - 1] : '';
    setDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;
    const newDigits = [...digits];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);
    inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await verifyEmail(emailParam, otpCode);
      navigate('/login?verified=true');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await api.post('/auth/resend-otp', {
        email: emailParam,
        purpose: 'REGISTRATION_VERIFICATION',
      });
      setResendSuccess(true);
      setResendTimer(45);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center p-6 font-sans relative selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
          <Shield className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">SecureStorage</span>
      </div>

      {/* Main Card (matching Screen 4 from Design System) */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 sm:p-10 relative">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-slate-500 mt-1">
            We've sent a 6-digit verification code to <br />
            <span className="font-semibold text-slate-800">{emailParam}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center">
            New 6-digit verification code dispatched to your inbox!
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center font-bold text-xl rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            ))}
          </div>

          <div className="text-center text-xs text-slate-500">
            Didn't receive the code?{' '}
            {resendTimer > 0 ? (
              <span className="text-slate-400 font-medium">Resend (00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer})</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-blue-600 font-semibold hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-sm shadow-blue-500/25 transition-all text-xs disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
