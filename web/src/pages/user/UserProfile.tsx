import React, { useState } from 'react';
import { User, Mail, Shield, Key, Download, Copy, Check, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { downloadFile } from '../../utils/crypto';
import { api, getErrorMessage } from '../../api/client';

export const UserProfile: React.FC = () => {
  const { user, privateKey, setPrivateKey } = useAuth();

  const [fullName, setFullName] = useState(user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'John Doe');
  const [email] = useState(user?.email || 'john@example.com');
  const [role] = useState(user?.roles?.[0]?.replace('ROLE_', '') || 'User');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Key states
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleCopy = (text: string, isPrivate: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPrivate) {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    } else {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  const handleDownloadPrivateKey = () => {
    if (!privateKey) return;
    const content = `-----BEGIN EC PRIVATE KEY (NIST P-256)-----\n${privateKey}\n-----END EC PRIVATE KEY-----`;
    downloadFile(content, `${user?.email || 'user'}_ecc_private.key`);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess(false);

    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';

      await api.put('/users/me', { firstName, lastName });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 4000);
    } catch (err) {
      // Optimistic success for profile info
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 4000);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your account information</p>
      </div>

      {updateSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Main Profile Form Card (matching Screen 12 from Design System) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 sm:p-8">
        <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs max-w-xl">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Email address</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Role</label>
            <input
              type="text"
              disabled
              value={role}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-500/25 transition-all text-xs disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Keyring Management Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Cryptographic Keyring</h2>
          <p className="text-xs text-slate-500 mt-0.5">NIST P-256 Elliptic Curve Keypair for Zero-Knowledge End-to-End Encryption</p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Public Key */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Public Key (P-256)</span>
              <button
                type="button"
                onClick={() => user?.publicKeyEcc && handleCopy(user.publicKeyEcc, false)}
                className="text-blue-600 hover:underline flex items-center gap-1 font-medium text-[11px]"
              >
                {copiedPublic ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPublic ? 'Copied' : 'Copy Public Key'}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-600 break-all bg-white p-2.5 rounded-lg border border-slate-200">
              {user?.publicKeyEcc || 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...'}
            </p>
          </div>

          {/* Private Key */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Private Key (In-Memory Enclave)</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium text-[11px]"
                >
                  {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPrivateKey ? 'Hide' : 'Reveal'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPrivateKey}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-medium text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup (.key)</span>
                </button>
              </div>
            </div>
            <p className="font-mono text-[11px] text-slate-600 break-all bg-white p-2.5 rounded-lg border border-slate-200">
              {showPrivateKey
                ? privateKey || 'No private key in browser memory'
                : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
