import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateEccKeyPair, downloadFile } from '../../utils/crypto';
import { api, getErrorMessage } from '../../api/client';
import { isSupabaseConfigured, signInWithGoogleOAuth, signUpWithSupabaseEmail, supabase } from '../../lib/supabase';

export const RegisterPage: React.FC = () => {
  const { register, setPrivateKey, loginWithSupabase } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogleOAuth();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-Up failed');
      setGoogleLoading(false);
    }
  };

  // Warm up backend
  useEffect(() => {
    api.get('/actuator/health').catch(() => {});
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setLoading(true);

    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';

      // 1. Generate client-side ECC P-256 Keypair
      const keyPair = await generateEccKeyPair();
      setPrivateKey(keyPair.privateKeyBase64);

      // Download backup key
      const backupText = `-----BEGIN EC PRIVATE KEY (NIST P-256)-----\n${keyPair.privateKeyBase64}\n-----END EC PRIVATE KEY-----`;
      downloadFile(backupText, `${trimmedEmail}_ecc_private.key`);

      // 2. Register via Supabase (real transactional email delivery to any inbox)
      if (isSupabaseConfigured && supabase) {
        try {
          const supaRes = await signUpWithSupabaseEmail(trimmedEmail, password, fullName.trim());

          // If Supabase returned an immediate active session (email confirmation off)
          if (supaRes.session?.access_token) {
            await loginWithSupabase(supaRes.session.access_token, keyPair.publicKeyBase64);
            navigate('/app/dashboard');
            return;
          }

          // Supabase dispatched real verification email
          if (supaRes.user) {
            setConfirmationSent(true);
            return;
          }
        } catch (supaErr: any) {
          setError(supaErr?.message || 'Registration failed');
          return;
        }
      } else {
        // Fallback only if Supabase is unconfigured
        const registeredUser = await register(trimmedEmail, password, firstName, lastName, keyPair.publicKeyBase64);
        navigate(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`, {
          state: { devOtp: (registeredUser as any)?.devOtp },
        });
      }
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

      {/* Main Card (matching Screen 3 from Design System) */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 sm:p-10 relative">
        {confirmationSent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Check Your Inbox</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We've dispatched an official verification email to <br />
              <strong className="text-slate-900 font-semibold">{email.trim().toLowerCase()}</strong>.
            </p>
            <p className="text-[11px] text-slate-500 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-normal">
              Click the confirmation link inside the email to instantly activate your account. You will be redirected straight to your dashboard!
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition-all text-center"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Your Account</h2>
              <p className="text-xs text-slate-500 mt-1">Join Secure Vault and keep your files safe</p>
            </div>

        {/* Google OAuth Button (Top Primary Option) */}
        <button
          onClick={handleGoogleSignUp}
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
          <span className="relative bg-white px-3 text-[11px] text-slate-400 uppercase font-medium">or register with email</span>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Full name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
            />
          </div>

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
            <label className="block text-slate-700 font-semibold mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Create a strong password"
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

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
            />
          </div>

          <div className="flex items-start pt-1">
            <input
              id="terms"
              type="checkbox"
              required
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
            />
            <label htmlFor="terms" className="ml-2 text-xs text-slate-600 leading-tight select-none">
              I agree to the <span className="text-blue-600 font-medium">Terms of Service</span> and{' '}
              <span className="text-blue-600 font-medium">Privacy Policy</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-sm shadow-blue-500/25 transition-all text-xs disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </>
    )}
      </div>
    </div>
  );
};
