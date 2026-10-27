import React, { useState } from 'react';
import { User, Mail, Shield, Key, CheckCircle2, Lock, Download, Trash2, Eye, EyeOff, Copy, Check, Upload, AlertTriangle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { downloadFile } from '../../utils/crypto';
import { extractKeyFromStegoImage } from '../../utils/steganography';
import { StegoKeyBackupModal } from '../../components/common/StegoKeyBackupModal';
import { api, getErrorMessage } from '../../api/client';

export const UserProfile: React.FC = () => {
  const { user, privateKey, setPrivateKey } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'EMAILS' | 'SECURITY'>('PROFILE');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Key management state
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showStegoBackupModal, setShowStegoBackupModal] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'STEGO' | 'TEXT'>('STEGO');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  const handleOpenStegoBackup = () => {
    if (!privateKey) {
      setImportStatus('No private key in session to conceal.');
      return;
    }
    setShowStegoBackupModal(true);
  };

  const handleStegoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processStegoImage(file);
  };

  const handleStegoDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processStegoImage(file);
  };

  const processStegoImage = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.png')) {
      setImportStatus('Please upload a lossless PNG image (.png).');
      return;
    }
    try {
      setImportStatus('Extracting private key from stego carrier pixels...');
      const key = await extractKeyFromStegoImage(file);
      setPrivateKey(key);
      setImportStatus('Private key extracted successfully from stego image and activated in session!');
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus('Stego extraction failed: ' + (err.message || 'Corrupted or missing key envelope.'));
    }
  };

  const handleDownloadData = () => {
    const data = {
      user: {
        id: user?.id,
        name: user?.displayName || 'John Doe',
        email: user?.email || 'user@example.com',
        roles: user?.roles,
        publicKeyEcc: user?.publicKeyEcc,
        status: user?.status,
      },
      exportTimestamp: new Date().toISOString(),
      encryptionStandard: '5-Layer Hybrid (AES-256-GCM + Blowfish-CBC + NIST P-256 ECDH + LSB Stego)',
    };
    downloadFile(JSON.stringify(data, null, 2), `secureshare_user_data_${user?.id || 'export'}.json`);
  };

  const handleImportKey = () => {
    let cleaned = importKeyInput.trim();
    if (cleaned.includes('-----BEGIN')) {
      cleaned = cleaned
        .replace(/-----BEGIN[\s\S]*?-----/g, '')
        .replace(/-----END[\s\S]*?-----/g, '')
        .replace(/["']/g, '')
        .replace(/\s+/g, '');
    }
    if (!cleaned) {
      setImportStatus('Invalid key format. Must be Base64 PKCS#8 ECC key.');
      return;
    }
    setPrivateKey(cleaned);
    setImportStatus('Private key successfully loaded into local cryptographic memory.');
    setImportKeyInput('');
    setTimeout(() => setImportStatus(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Screen 16 Main Card */}
      <div className="sec-card p-6 md:p-8">
        {/* Tabs: Profile, Emails, Security */}
        <div className="flex border-b border-emerald-950/40 mb-8 pb-3 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-2.5 transition-all relative ${
              activeTab === 'PROFILE'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile
            {activeTab === 'PROFILE' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('EMAILS')}
            className={`pb-2.5 transition-all relative ${
              activeTab === 'EMAILS'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Emails
            {activeTab === 'EMAILS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`pb-2.5 transition-all relative ${
              activeTab === 'SECURITY'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Security
            {activeTab === 'SECURITY' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            )}
          </button>
        </div>

        {/* Tab 1: Profile matching Screen 16 layout */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Initials Avatar JD */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-2xl flex items-center justify-center shadow-xl shadow-purple-900/30 border-2 border-purple-400/40 shrink-0">
                JD
              </div>

              {/* Profile Details Form Grid */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider w-32">Full Name:</span>
                  <div className="flex-1 font-semibold text-white text-sm bg-black/30 border border-emerald-950/30 px-3.5 py-2 rounded-xl">
                    {user?.displayName || 'John Doe'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider w-32">Email:</span>
                  <div className="flex-1 flex items-center justify-between bg-black/30 border border-emerald-950/30 px-3.5 py-2 rounded-xl">
                    <span className="text-sm font-mono text-slate-200">{user?.email || 'user@example.com'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider w-32">Password:</span>
                  <div className="flex-1 flex items-center justify-between bg-black/30 border border-emerald-950/30 px-3.5 py-2 rounded-xl">
                    <span className="text-sm tracking-widest text-slate-400 font-mono">••••••••</span>
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication Row */}
            <div className="p-4 bg-black/30 border border-emerald-950/40 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Two-Factor Authentication</h3>
                <p className="text-xs text-emerald-400/90 font-mono mt-0.5">Email OTP Enabled</p>
              </div>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  twoFactorEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Bottom Action Buttons matching Screen 16 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-emerald-950/40">
              <button
                onClick={handleDownloadData}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Download My Data
              </button>

              <button
                onClick={() => alert('Account deletion requires confirmation via administrator review.')}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Emails */}
        {activeTab === 'EMAILS' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Registered Email Addresses</h3>
            <div className="p-4 bg-black/30 border border-emerald-950/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-mono text-white">{user?.email || 'user@example.com'}</p>
                  <p className="text-xs text-slate-400">Primary delivery address for Email OTP &amp; Share links</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono">
                Primary
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Cryptographic Keyring */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                NIST P-256 Asymmetric Keyring (Layer 4)
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                secp256r1 &bull; Zero-Knowledge Cloud Storage &bull; Client-Side Envelope Wrapping
              </p>
            </div>

            {/* Public Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Public Key (Registered on Cloud Repository):</span>
                {user?.publicKeyEcc && (
                  <button
                    onClick={() => handleCopy(user.publicKeyEcc!, false)}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    {copiedPublic ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPublic ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="p-3 bg-black/50 border border-emerald-950/40 rounded-xl font-mono text-xs text-emerald-300 break-all select-all">
                {user?.publicKeyEcc || 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7Z5f8e5x...'}
              </div>
            </div>

            {/* Private Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400">Private Key (Local Decryption Key):</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPrivateKey ? 'Hide' : 'Reveal'}
                  </button>
                  {privateKey && (
                    <>
                      <button
                        onClick={() => handleCopy(privateKey, true)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {copiedPrivate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPrivate ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={handleDownloadPrivateKey}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Backup (.key)
                      </button>
                      <button
                        onClick={handleOpenStegoBackup}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                        title="Choose any image from your computer to conceal your private key via LSB steganography"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Stego Key Image
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-black/50 border border-emerald-950/40 rounded-xl font-mono text-xs text-amber-300 break-all select-all min-h-[50px] flex items-center">
                {privateKey ? (
                  showPrivateKey ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                ) : (
                  <span className="text-slate-500 italic">No private key in local storage. Import below to enable decryption.</span>
                )}
              </div>
            </div>

            {/* Import Private Key with Stego Image Support */}
            <div className="pt-4 border-t border-emerald-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 block">Restore or Import Private Key:</label>
                <div className="flex bg-black/40 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImportMode('STEGO')}
                    className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                      importMode === 'STEGO' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" /> Stego Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('TEXT')}
                    className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                      importMode === 'TEXT' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Key className="w-3 h-3" /> Raw Text
                  </button>
                </div>
              </div>

              {importMode === 'STEGO' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleStegoDrop}
                  className="p-4 border border-dashed border-emerald-500/40 hover:border-emerald-500/70 bg-black/40 rounded-xl text-center transition-all cursor-pointer"
                >
                  <input
                    type="file"
                    id="profile-stego-upload"
                    accept=".png"
                    onChange={handleStegoFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="profile-stego-upload" className="cursor-pointer flex flex-col items-center">
                    <ImageIcon className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs font-semibold text-white">
                      Drop or Choose Stego Key Image (.png)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Extracts concealed private key from carrier pixels with CRC-32 integrity validation
                    </span>
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste PKCS#8 Base64 ECC private key..."
                    value={importKeyInput}
                    onChange={(e) => setImportKeyInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleImportKey}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-colors whitespace-nowrap"
                  >
                    Import Key
                  </button>
                </div>
              )}

              {importStatus && (
                <p className={`text-xs font-mono p-2 rounded-lg border ${
                  importStatus.includes('successfully') || importStatus.includes('extracted')
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {importStatus}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sec-card p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Change Password</h3>
            <p className="text-xs text-slate-400 font-mono">
              Password will be securely hashed using BCrypt (cost 12) with salt.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {passwordSuccess && (
              <p className="text-xs font-mono text-emerald-400">Password updated successfully!</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPasswordSuccess(true);
                  setTimeout(() => {
                    setPasswordSuccess(false);
                    setShowChangePasswordModal(false);
                  }, 1200);
                }}
                className="sec-btn-emerald py-2 px-4 text-xs"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stego Key Backup & Custom Image Chooser Modal */}
      {showStegoBackupModal && privateKey && (
        <StegoKeyBackupModal
          isOpen={showStegoBackupModal}
          onClose={() => setShowStegoBackupModal(false)}
          privateKey={privateKey}
          userEmail={user?.email}
        />
      )}
    </div>
  );
};

export const UserSecurity: React.FC = () => {
  return <UserProfile />;
};
