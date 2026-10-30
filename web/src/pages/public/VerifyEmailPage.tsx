import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, getErrorMessage } from '../../api/client';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  const emailParam = searchParams.get('email') || 'yourname@example.com';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(45);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 45-second countdown timer
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

    // Auto-advance to next input
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
      setError('Please enter all 6 digits of the OTP');
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
      setResendTimer(60);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] flex flex-col font-sans selection:bg-[#10b981]/30 selection:text-[#34d399]">
      <TopFeatureBar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0b1325] border border-[#1a2744] rounded-2xl p-8 shadow-2xl relative text-center">
          {/* Glowing Green Mail Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-4">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
            We have sent a 6-digit OTP to <br />
            <strong className="text-white font-mono">{emailParam}</strong>
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>New 6-digit OTP dispatched to your inbox!</span>
            </div>
          )}

          {/* 6 Digit Input Boxes matching Screen 3 */}
          <form onSubmit={handleVerify} className="mt-6 space-y-6">
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
                  className="otp-box"
                />
              ))}
            </div>

            {/* Verify OTP Button */}
            <button
              type="submit"
              disabled={loading || digits.join('').length < 6}
              className="w-full sec-btn-emerald py-3 text-slate-950 font-bold tracking-wide disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Resend Countdown & Link */}
          <div className="mt-6 text-xs text-slate-400 space-y-1">
            <p>
              Resend OTP in{' '}
              <span className="font-mono text-[#34d399]">
                00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
              </span>
            </p>
            {resendTimer === 0 ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-[#10b981] font-semibold hover:underline"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            ) : (
              <span className="text-slate-600 cursor-not-allowed">Resend OTP</span>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#141f36]">
            <Link to="/register" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
