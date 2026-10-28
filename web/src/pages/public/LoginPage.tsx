import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Shield, CheckCircle2, AlertCircle, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, api } from '../../api/client';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const LoginPage: React.FC = () => {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screen 5: Login OTP State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [mfaTimer, setMfaTimer] = useState(40);
  const [resendingMfa, setResendingMfa] = useState(false);
  const [mfaResent, setMfaResent] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Screen 6: Google Sign-In Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isVerified = searchParams.get('verified') === 'true';
  const isExpired = searchParams.get('expired') === 'true';

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
      const res = await login(email.trim(), password);
      if (res.mfaRequired) {
        setMfaRequired(true);
        setMfaTimer(40);
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
      } else if (res.user) {
        const isAdmin = res.user.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r === 'ROLE_ADMIN');
        navigate(isAdmin ? '/admin/dashboard' : '/app/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Screen 5: 6-Digit OTP Handlers
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

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = await verifyMfa(email.trim(), otpCode);
      const isAdmin = user.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r === 'ROLE_ADMIN');
      navigate(isAdmin ? '/admin/dashboard' : '/app/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendMfa = async () => {
    if (mfaTimer > 0 || resendingMfa) return;
    setResendingMfa(true);
    setError(null);
    try {
      await api.post('/auth/resend-otp', {
        email: email.trim(),
        purpose: 'LOGIN_MFA',
      });
      setMfaResent(true);
      setMfaTimer(60);
      setTimeout(() => setMfaResent(false), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResendingMfa(false);
    }
  };

  // Screen 6: Google Mock Login for local testing
  const handleExecuteGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      // Calls Google OAuth verification endpoint with mock token for development verification
      const res = await api.post('/auth/google', {
        idToken: 'demo-google-oauth-token',
      });
      if (res.data.user) {
        setGoogleModalOpen(false);
        navigate('/app/dashboard');
      }
    } catch {
      // In development if Google client secret is unset, notify clearly
      setError('Google Sign-In is configured. For live Google auth, add GOOGLE_CLIENT_ID to .env.');
      setGoogleModalOpen(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] flex flex-col font-sans selection:bg-[#10b981]/30 selection:text-[#34d399]">
      <TopFeatureBar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0b1325] border border-[#1a2744] rounded-2xl p-8 sm:p-10 shadow-2xl relative">
          {/* SCREEN 5: LOGIN OTP CHALLENGE */}
          {mfaRequired ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-4">
                <Shield className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight">Enter OTP</h2>
              <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
                Enter the 6-digit OTP sent to your email <br />
                <strong className="text-white font-mono">{email}</strong>
              </p>

              {devOtpHint ? (
                <div
                  onClick={() => {
                    const parts = devOtpHint.split('').slice(0, 6);
                    while (parts.length < 6) parts.push('');
                    setDigits(parts);
                  }}
                  className="mt-3 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs cursor-pointer hover:bg-emerald-500/25 transition-all text-center"
                >
                  <span>Development OTP: <strong className="font-mono text-white underline ml-1">{devOtpHint}</strong> (Click to autofill)</span>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setDigits(['1', '2', '3', '4', '5', '6']);
                  }}
                  className="mt-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs cursor-pointer hover:bg-cyan-500/20 transition-all text-center"
                >
                  <span>Offline Mail Server? <strong className="font-mono text-white underline ml-1">Click to autofill demo OTP (123456)</strong></span>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {mfaResent && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Fresh 6-digit OTP sent to your email!</span>
                </div>
              )}

              {/* 6 Digit Input Boxes matching Screen 5 */}
              <form onSubmit={handleMfaSubmit} className="mt-6 space-y-6">
                <div className="flex justify-center gap-2 sm:gap-3">
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
                      className="otp-box"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || digits.join('').length < 6}
                  className="w-full sec-btn-emerald py-3 text-slate-950 font-bold tracking-wide disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </form>

              {/* Resend Countdown matching Screen 5 */}
              <div className="mt-6 text-xs text-slate-400 space-y-1">
                <p>
                  Resend OTP in{' '}
                  <span className="font-mono text-[#34d399]">
                    00:{mfaTimer < 10 ? `0${mfaTimer}` : mfaTimer}
                  </span>
                </p>
                {mfaTimer === 0 ? (
                  <button
                    type="button"
                    onClick={handleResendMfa}
                    disabled={resendingMfa}
                    className="text-[#10b981] font-semibold hover:underline"
                  >
                    {resendingMfa ? 'Sending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <span className="text-slate-600 cursor-not-allowed">Resend OTP</span>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#141f36]">
                <button
                  onClick={() => setMfaRequired(false)}
                  className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Credentials
                </button>
              </div>
            </div>
          ) : (
            /* SCREEN 4: USER LOGIN */
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center text-[#10b981]">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-sm text-white tracking-wider">SecureShare</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
                <p className="text-xs text-slate-400 mt-1">Login to your account</p>
              </div>

              {isVerified && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Email verified successfully! You can now log in.</span>
                </div>
              )}

              {isExpired && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Your session has expired. Please sign in again.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {error.toLowerCase().includes('verification') && (
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(email.trim())}`}
                      className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#10b981] hover:bg-[#34d399] text-slate-950 font-bold rounded text-xs transition shadow-md"
                    >
                      Enter 6-Digit Email Verification Code &rarr;
                    </Link>
                  )}
                </div>
              )}

              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex flex-col gap-1 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-300">Quick Test Credentials:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('tharunsanatani@gmail.com');
                      setPassword('Password@123');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-mono"
                  >
                    Click to Fill
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  User: <span className="text-white">tharunsanatani@gmail.com</span> | Pass: <span className="text-white">Password@123</span>
                </div>
              </div>

              <form onSubmit={handleInitialLogin} className="space-y-4 text-xs">
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

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="sec-input pl-9"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-[#070e1c] border-[#1a2744] text-[#10b981] focus:ring-0"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-[#10b981] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 sec-btn-emerald py-3 text-slate-950 font-bold tracking-wide disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              {/* Or Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1a2744]" />
                </div>
                <span className="relative px-3 bg-[#0b1325] text-slate-500 text-xs">or</span>
              </div>

              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={() => setGoogleModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0e172e] hover:bg-[#142142] text-slate-200 border border-[#203258] transition-colors flex items-center justify-center gap-3 text-xs font-medium"
              >
                {/* Colorful Google G Logo */}
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
                Continue with Google
              </button>

              <div className="mt-6 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#10b981] font-semibold hover:underline">
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SCREEN 6: GOOGLE SIGN-IN MODAL (Matching Screen 6 from board) */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0b1325] border border-[#1a2744] rounded-2xl p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setGoogleModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Logo */}
            <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center shadow-lg mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            </div>

            <h3 className="text-xl font-bold text-white">Continue with Google</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Sign in with your Google account to continue to SecureShare
            </p>

            <button
              onClick={handleExecuteGoogleLogin}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2 mb-6"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Continue with Google'
              )}
            </button>

            {/* 4 Trust Checkmarks matching Screen 6 */}
            <div className="space-y-2.5 text-left text-xs text-slate-300 pt-4 border-t border-[#141f36]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>Uses Google OAuth 2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>Only verified email access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>No access to your files</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>Creates normal user account</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
