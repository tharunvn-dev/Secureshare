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
      setImportStatus('Stego carrier must be a lossless PNG image (.png).');
      return;
    }

    setImportStatus('Extracting private key from carrier pixels...');
    try {
      const extractedKey = await extractKeyFromStegoImage(file);
      setPrivateKey(extractedKey);
      setImportStatus('Private key successfully extracted and loaded into session!');
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus(err.message || 'Failed to extract key from stego carrier image.');
    }
  };

  const handleImportKey = () => {
    if (!importKeyInput.trim()) {
      setImportStatus('Please provide an ECC private key string.');
      return;
    }

    try {
      let cleanKey = importKeyInput.trim();
      if (cleanKey.includes('-----BEGIN')) {
        cleanKey = cleanKey
          .replace(/-----BEGIN[\s\S]*?-----/g, '')
          .replace(/-----END[\s\S]*?-----/g, '')
          .replace(/["']/g, '')
          .replace(/\s+/g, '');
      }

      setPrivateKey(cleanKey);
      setImportStatus('Key loaded into local session successfully.');
      setImportKeyInput('');
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus(`Failed to import key: ${err.message}`);
    }
  };

  const handleGenerateKeypair = async () => {
    setIsGenerating(true);
    setImportStatus(null);
    try {
      const keypair = await generateEccKeyPair();
      setPrivateKey(keypair.privateKeyBase64);

      await api.put('/users/keys', {
        publicKeyEcc: keypair.publicKeyBase64,
      });

      if (refreshUser) {
        await refreshUser();
      }

      const content = `-----BEGIN EC PRIVATE KEY (NIST P-256)-----\n${keypair.privateKeyBase64}\n-----END EC PRIVATE KEY-----`;
      downloadFile(content, `${user?.email || 'user'}_ecc_private.key`);

      setImportStatus('New keypair generated! Public key registered and private key downloaded.');
    } catch (err: any) {
      setImportStatus(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 text-slate-800 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                ECC Cryptographic Keyring (Layer 4)
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Curve: NIST P-256 (secp256r1) | HKDF-SHA-256</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Public Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Public Key (Registered on Server)
              </label>
              {user?.publicKeyEcc && (
                <button
                  onClick={() => handleCopy(user.publicKeyEcc!, false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  {copiedPublic ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPublic ? 'Copied' : 'Copy Public Key'}
                </button>
              )}
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-blue-700 break-all select-all">
              {user?.publicKeyEcc || 'No public key registered.'}
            </div>
          </div>

          {/* Private Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                Private Key (Client Decryption Key)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPrivateKey ? 'Hide' : 'Reveal'}
                </button>
                {privateKey && (
                  <>
                    <button
                      onClick={() => handleCopy(privateKey, true)}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                    >
                      {copiedPrivate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPrivate ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownloadPrivateKey}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Backup (.key)
                    </button>
                    <button
                      onClick={handleOpenStegoBackup}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                      title="Choose any image from your computer to conceal your private key via LSB steganography"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Stego Key Image
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 break-all select-all min-h-[56px] flex items-center">
              {privateKey ? (
                showPrivateKey ? (
                  privateKey
                ) : (
                  '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                )
              ) : (
                <span className="text-slate-400 italic">
                  No private key found in current browser storage. Please import your backed-up key or Stego Image below to decrypt files.
                </span>
              )}
            </div>
          </div>

          {/* Generate or Sync Key Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Key Generation &amp; Hardware Sync
              </h4>
              <button
                onClick={handleGenerateKeypair}
                disabled={isGenerating}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Generate New Keypair'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Generates a fresh NIST P-256 (secp256r1) keypair via Web Crypto API, uploads public key to server, and downloads private key backup (.key).
            </p>
          </div>

          {/* Import Key Section with Stego and Text Tabs */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Restore Private Key
              </h4>
              <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportMode('STEGO')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                    importMode === 'STEGO' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  Stego Image
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('TEXT')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                    importMode === 'TEXT' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                  className="p-5 border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 rounded-xl text-center transition-all cursor-pointer"
                >
                  <input
                    type="file"
                    id="keymodal-stego-upload"
                    accept=".png"
                    onChange={handleStegoFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="keymodal-stego-upload" className="cursor-pointer flex flex-col items-center">
                    <ImageIcon className="w-6 h-6 text-blue-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-900">
                      Drop or Choose Stego Key Image (.png)
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
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
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
                <button
                  onClick={handleImportKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shadow-blue-500/20 whitespace-nowrap"
                >
                  Import Key
                </button>
              </div>
            )}

            {importStatus && (
              <p
                className={`mt-2 text-xs p-3 rounded-xl border ${
                  importStatus.includes('successfully') || importStatus.includes('generated') || importStatus.includes('extracted')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
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
            className="px-5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
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
