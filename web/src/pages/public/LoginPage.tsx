import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Shield, AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, api } from '../../api/client';
import { isSupabaseConfigured, signInWithGoogleOAuth, signInWithSupabaseEmail, supabase } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, isAdmin, login, verifyMfa, loginWithSupabase } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification State (Screen 4 style)
  const [mfaRequired, setMfaRequired] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [mfaTimer, setMfaTimer] = useState(45);
  const [resendingMfa, setResendingMfa] = useState(false);
  const [mfaResent, setMfaResent] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Google OAuth Loading
  const [googleLoading, setGoogleLoading] = useState(false);

  const isVerified = searchParams.get('verified') === 'true';

  // Automatically navigate to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(isAdmin ? '/admin/dashboard' : '/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, isAdmin, navigate]);

  // Handle Supabase OAuth return
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      setGoogleLoading(true);
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        loginWithSupabase(accessToken)
          .then((u) => {
            window.history.replaceState(null, '', window.location.pathname);
            const admin = u.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r === 'ROLE_ADMIN');
            navigate(admin ? '/admin/dashboard' : '/app/dashboard', { replace: true });
          })
          .catch((err) => {
            setError(getErrorMessage(err));
          })
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [loginWithSupabase, navigate]);

  // Warm up backend
  useEffect(() => {
    api.get('/actuator/health').catch(() => {});
  }, []);

  // Timer for MFA
  useEffect(() => {
    if (!mfaRequired || mfaTimer <= 0) return;
    const interval = setInterval(() => {
      setMfaTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mfaRequired, mfaTimer]);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Authenticate via Supabase first if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const supaRes = await signInWithSupabaseEmail(cleanEmail, password);
          if (supaRes.session?.access_token) {
            const authenticatedUser = await loginWithSupabase(supaRes.session.access_token);
            const admin = authenticatedUser.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r === 'ROLE_ADMIN');
            navigate(admin ? '/admin/dashboard' : '/app/dashboard', { replace: true });
            return;
          }
        } catch (supaErr: any) {
          const msg = supaErr?.message || '';
          if (msg.toLowerCase().includes('email not confirmed')) {
            setError('Please confirm your email address before logging in. Check your inbox for the Supabase confirmation email.');
            setLoading(false);
            return;
          }
          // If invalid credentials in Supabase, fall through to Spring Boot login for admin or existing backend accounts
        }
      }

      // 2. Fall back to Spring Boot authentication (e.g. admin@example.com)
      const res = await login(cleanEmail, password);
      if (res.mfaRequired) {
        setMfaRequired(true);
        setMfaTimer(45);
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
      } else if (res.user) {
        const admin = res.user.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r === 'ROLE_ADMIN');
        navigate(admin ? '/admin/dashboard' : '/app/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = val ? val[val.length - 1] : '';
    setDigits(newDigits);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!paste) return;
    const newDigits = [...digits];
    for (let i = 0; i < paste.length; i++) {
      newDigits[i] = paste[i];
    }
    setDigits(newDigits);
    otpInputRefs.current[Math.min(paste.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authenticatedUser = await verifyMfa(email.trim(), otpCode);
      const admin = authenticatedUser.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r === 'ROLE_ADMIN');
      navigate(admin ? '/admin/dashboard' : '/app/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (mfaTimer > 0 || resendingMfa) return;
    setResendingMfa(true);
    setError(null);
    try {
      await api.post('/auth/resend-otp', {
        email: email.trim(),
        purpose: 'LOGIN_MFA',
      });
      setMfaResent(true);
      setMfaTimer(45);
      setTimeout(() => setMfaResent(false), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResendingMfa(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogleOAuth();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed');
      setGoogleLoading(false);
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

      {/* Main Card (matching Screen 2 from Design System) */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 sm:p-10 relative">
        {isVerified && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
            Email verified successfully! Please log in to continue.
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Normal Login View (Screen 2) */}
        {!mfaRequired ? (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-500 mt-1">Sign in to your Secure Vault account</p>
            </div>

            {/* Google OAuth Button (Top Primary Option) */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Social Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] text-slate-400 uppercase font-medium">or continue with email</span>
            </div>

            <form onSubmit={handleInitialLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-semibold">Password</label>
                  <Link to="/forgot-password" className="text-blue-600 hover:underline text-[11px] font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
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
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 select-none">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-sm shadow-blue-500/25 transition-all text-xs disabled:opacity-50 mt-2"
              >
                {loading ? 'Signing In...' : 'Login with Email'}
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Register
              </Link>
            </div>
          </div>
        ) : (
          /* OTP Verification View (matching Screen 4 from Design System) */
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h2>
              <p className="text-xs text-slate-500 mt-1">
                We've sent a 6-digit verification code to <br />
                <span className="font-semibold text-slate-800">{email}</span>
              </p>
            </div>

            {mfaResent && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center">
                New verification code sent!
              </div>
            )}

            {/* 1-Click Auto-fill Hint */}
            <div className="mb-6 p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Verification code: <strong className="font-mono font-bold tracking-wider">{devOtpHint || '123456'}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const code = (devOtpHint || '123456').slice(0, 6);
                  setDigits(code.split(''));
                  setError(null);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-[11px] inline-flex items-center gap-1 shadow-sm transition-all"
              >
                <Sparkles className="w-3 h-3" /> Auto-fill
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
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
                {mfaTimer > 0 ? (
                  <span className="text-slate-400 font-medium">Resend ({mfaTimer}s)</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendingMfa}
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

              <button
                type="button"
                onClick={() => setMfaRequired(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
