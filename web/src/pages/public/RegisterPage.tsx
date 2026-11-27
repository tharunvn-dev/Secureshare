import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateEccKeyPair, downloadFile } from '../../utils/crypto';
import { api, getErrorMessage } from '../../api/client';
import { signInWithGoogleOAuth } from '../../lib/supabase';

export const RegisterPage: React.FC = () => {
  const { register, setPrivateKey } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // 2. Call backend register API
      const registeredUser = await register(trimmedEmail, password, firstName, lastName, keyPair.publicKeyBase64);

      // 3. Navigate to OTP verification page (Screen 4)
      navigate(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`, {
        state: { devOtp: (registeredUser as any)?.devOtp },
      });
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
        <span className="font-bold text-xl text-slate-900 tracking-tight">SecureStorage</span>
      </div>

      {/* Main Card (matching Screen 3 from Design System) */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 sm:p-10 relative">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Your Account</h2>
          <p className="text-xs text-slate-500 mt-1">Join SecureStorage and keep your files safe</p>
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
      </div>
    </div>
  );
};
