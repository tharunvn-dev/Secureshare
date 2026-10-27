import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Shield, ArrowRight, AlertCircle, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateEccKeyPair, downloadFile } from '../../utils/crypto';
import { getErrorMessage } from '../../api/client';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const RegisterPage: React.FC = () => {
  const { register, setPrivateKey } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedTerms) {
      setError('Please agree to the Terms and Privacy Policy');
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

    setLoading(true);

    try {
      // Split full name
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';

      // 1. Generate client-side ECC P-256 Keypair
      const keyPair = await generateEccKeyPair();

      // Save private key locally in browser session
      setPrivateKey(keyPair.privateKeyBase64);

      // Automatically trigger offline backup download
      const backupText = `-----BEGIN EC PRIVATE KEY (NIST P-256)-----\n${keyPair.privateKeyBase64}\n-----END EC PRIVATE KEY-----`;
      downloadFile(backupText, `${email.trim()}_ecc_private.key`);

      // 2. Call backend register API with public key
      await register(email.trim(), password, firstName, lastName, keyPair.publicKeyBase64);

      // 3. Navigate to dedicated 6-digit OTP verification page (/verify-email)
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
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
        <div className="w-full max-w-4xl bg-[#0b1325] border border-[#1a2744] rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative">
          {/* Left Form Column */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center text-[#10b981]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-sm text-white tracking-wider">SecureShare</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Your Account</h2>
              <p className="text-xs text-slate-400 mt-1">Join securely with email verification</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="sec-input pl-9"
                  />
                </div>
              </div>

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

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="termsCheck"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#070e1c] border-[#1a2744] text-[#10b981] focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="termsCheck" className="text-slate-400 text-[11px] cursor-pointer">
                  I agree to the <span className="text-[#10b981] hover:underline">Terms</span> and{' '}
                  <span className="text-[#10b981] hover:underline">Privacy Policy</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 sec-btn-emerald py-3 text-slate-950 font-bold tracking-wide disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Register'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-[#10b981] font-semibold hover:underline">
                Login
              </Link>
            </div>
          </div>

          {/* Right Visual Art Column matching Screen 2 */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0c162b] to-[#070d18] border-l border-[#1a2744] relative overflow-hidden text-center">
            <div className="w-48 h-48 rounded-full bg-[#10b981]/10 blur-2xl absolute" />
            
            {/* 3D Server Stack / Glowing Art */}
            <div className="relative z-10 space-y-4">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-[#0e1c36] border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                <Server className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">Client-Side ECC Generation</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-sans">
                A 256-bit NIST P-256 keypair is generated directly in your browser. Your private key stays on your device.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#34d399] text-[11px] font-mono border border-[#10b981]/30">
                <Shield className="w-3.5 h-3.5" /> Zero-Knowledge Setup
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
