import React, { useState } from 'react';
import { Key, Copy, Check, Download, Upload, Eye, EyeOff, X, Shield, Sparkles, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { downloadFile, generateEccKeyPair } from '../../utils/crypto';
import { extractKeyFromStegoImage } from '../../utils/steganography';
import { StegoKeyBackupModal } from './StegoKeyBackupModal';
import { api, getErrorMessage } from '../../api/client';

interface KeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyModal: React.FC<KeyModalProps> = ({ isOpen, onClose }) => {
  const { user, privateKey, setPrivateKey, refreshUser } = useAuth();
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [copiedPublic, setCopiedPublic] = useState<boolean>(false);
  const [copiedPrivate, setCopiedPrivate] = useState<boolean>(false);
  const [importKeyInput, setImportKeyInput] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showStegoBackupModal, setShowStegoBackupModal] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'STEGO' | 'TEXT'>('STEGO');

  if (!isOpen) return null;

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

  const handleGenerateKeypair = async () => {
    try {
      setIsGenerating(true);
      setImportStatus('Generating NIST P-256 keypair via Web Crypto API...');
      const keypair = await generateEccKeyPair();
      
      // Update local storage and AuthContext state
      setPrivateKey(keypair.privateKeyBase64);

      // Register / sync public key with backend server
      await api.put('/auth/public-key', { publicKeyEcc: keypair.publicKeyBase64 });
      await refreshUser();

      // Download backup key
      const content = `-----BEGIN EC PRIVATE KEY (NIST P-256)-----\n${keypair.privateKeyBase64}\n-----END EC PRIVATE KEY-----`;
      downloadFile(content, `${user?.email || 'user'}_ecc_private.key`);

      setImportStatus('New NIST P-256 ECC Keypair generated, synchronized with server, and downloaded to disk!');
    } catch (err) {
      setImportStatus('Generation error: ' + getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
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
    setImportStatus('Private key successfully imported to local session!');
    setImportKeyInput('');
    setTimeout(() => setImportStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0d1527] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-wide">
                ECC Cryptographic Keyring (Layer 4)
              </h2>
              <p className="text-xs text-slate-400 font-mono">Curve: NIST P-256 (secp256r1) | HKDF-SHA-256</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Public Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Public Key (Registered on Server)
              </label>
              {user?.publicKeyEcc && (
                <button
                  onClick={() => handleCopy(user.publicKeyEcc!, false)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                >
                  {copiedPublic ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPublic ? 'Copied' : 'Copy Public Key'}
                </button>
              )}
            </div>
            <div className="p-3 bg-black/50 border border-slate-800 rounded-lg font-mono text-xs text-cyan-300/80 break-all select-all">
              {user?.publicKeyEcc || 'No public key registered.'}
            </div>
          </div>

          {/* Private Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Private Key (Client Decryption Key)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPrivateKey ? 'Hide' : 'Reveal'}
                </button>
                {privateKey && (
                  <>
                    <button
                      onClick={() => handleCopy(privateKey, true)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedPrivate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPrivate ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownloadPrivateKey}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Backup (.key)
                    </button>
                    <button
                      onClick={handleOpenStegoBackup}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                      title="Choose any image from your computer to conceal your private key via LSB steganography"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Stego Key Image
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-3 bg-black/50 border border-slate-800 rounded-lg font-mono text-xs text-amber-300/90 break-all select-all min-h-[56px] flex items-center">
              {privateKey ? (
                showPrivateKey ? (
                  privateKey
                ) : (
                  '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                )
              ) : (
                <span className="text-slate-500 italic">
                  No private key found in current browser storage. Please import your backed-up key or Stego Image below to decrypt files.
                </span>
              )}
            </div>
          </div>

          {/* Generate or Sync Key Section */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Key Generation &amp; Hardware Sync
              </h4>
              <button
                onClick={handleGenerateKeypair}
                disabled={isGenerating}
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-medium rounded-lg transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Generate New Keypair'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mb-3">
              Generates a fresh NIST P-256 (secp256r1) keypair via Web Crypto API, uploads public key to server, and downloads private key backup (.key).
            </p>
          </div>

          {/* Import Key Section with Stego and Text Tabs */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Restore Private Key
              </h4>
              <div className="flex bg-black/40 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImportMode('STEGO')}
                  className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    importMode === 'STEGO' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  Stego Image
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('TEXT')}
                  className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    importMode === 'TEXT' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Key className="w-3 h-3" />
                  Raw Text
                </button>
              </div>
            </div>

            {importMode === 'STEGO' ? (
              <div className="space-y-2">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleStegoDrop}
                  className="p-4 border border-dashed border-emerald-500/40 hover:border-emerald-500/70 bg-black/40 rounded-xl text-center transition-all cursor-pointer"
                >
                  <input
                    type="file"
                    id="keymodal-stego-upload"
                    accept=".png"
                    onChange={handleStegoFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="keymodal-stego-upload" className="cursor-pointer flex flex-col items-center">
                    <ImageIcon className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs font-semibold text-white">
                      Drop or Choose Stego Key Image (.png)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Extracts concealed private key from carrier pixels with CRC-32 integrity validation
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste your Base64 PKCS#8 ECC private key here..."
                  value={importKeyInput}
                  onChange={(e) => setImportKeyInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/60 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleImportKey}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-cyan-900/30 whitespace-nowrap"
                >
                  Import Key
                </button>
              </div>
            )}

            {importStatus && (
              <p
                className={`mt-2 text-xs font-mono p-2.5 rounded-lg border ${
                  importStatus.includes('successfully') || importStatus.includes('generated') || importStatus.includes('extracted')
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {importStatus}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            Close Keyring
          </button>
        </div>
      </div>

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
