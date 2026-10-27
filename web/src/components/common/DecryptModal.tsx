import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Image as ImageIcon,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  FileText,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, getErrorMessage } from '../../api/client';
import { extractKeyFromStegoImage } from '../../utils/steganography';

interface DecryptModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  filename: string;
  fileSize?: number;
  sha256Checksum?: string;
  onSuccess?: () => void;
}

export const DecryptModal: React.FC<DecryptModalProps> = ({
  isOpen,
  onClose,
  fileId,
  filename,
  fileSize,
  sha256Checksum,
  onSuccess,
}) => {
  const { privateKey, setPrivateKey } = useAuth();

  const [activeTab, setActiveTab] = useState<'STEGO' | 'SESSION'>('STEGO');
  const [stegoFile, setStegoFile] = useState<File | null>(null);
  const [extractedKey, setExtractedKey] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string>(privateKey || '');
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saveToSession, setSaveToSession] = useState<boolean>(true);
  const [decrypting, setDecrypting] = useState<boolean>(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStegoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.png')) {
      setExtractError('Stego carrier must be a lossless PNG image (.png).');
      return;
    }

    setStegoFile(file);
    setExtractError(null);
    setExtracting(true);

    try {
      const key = await extractKeyFromStegoImage(file);
      setExtractedKey(key);
      if (saveToSession) {
        setPrivateKey(key);
      }
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract key from stego carrier image.');
      setExtractedKey(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.png')) {
      setExtractError('Stego carrier must be a lossless PNG image (.png).');
      return;
    }

    setStegoFile(file);
    setExtractError(null);
    setExtracting(true);

    try {
      const key = await extractKeyFromStegoImage(file);
      setExtractedKey(key);
      if (saveToSession) {
        setPrivateKey(key);
      }
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract key from stego carrier image.');
      setExtractedKey(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleExecuteDecrypt = async () => {
    const effectiveKey = activeTab === 'STEGO' ? extractedKey : manualKey;

    if (!effectiveKey || !effectiveKey.trim()) {
      setDecryptError('An ECC Private Key is required. Please extract from a Stego Image or enter your key.');
      return;
    }

    let cleanKey = effectiveKey.trim();
    if (cleanKey.includes('-----BEGIN')) {
      cleanKey = cleanKey
        .replace(/-----BEGIN[\s\S]*?-----/g, '')
        .replace(/-----END[\s\S]*?-----/g, '')
        .replace(/["']/g, '')
        .replace(/\s+/g, '');
    }

    setDecrypting(true);
    setDecryptError(null);

    try {
      if (saveToSession) {
        setPrivateKey(cleanKey);
      }

      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob',
        headers: { 'X-Private-Key': cleanKey },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      let msg = 'Failed to decrypt file. Verify your ECC private key matches this file.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.message || json.error || msg;
        } catch {}
      } else {
        msg = getErrorMessage(err);
      }
      setDecryptError(msg);
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0b1325] border border-[#1a2744] rounded-2xl shadow-2xl p-6 relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#141f36]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Steganographic Decryption &amp; Download
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Extract Layer 4 Private Key from PNG Carrier to reverse 5-Layer Hybrid Encryption
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target File Info */}
        <div className="mt-4 p-3 bg-[#070e1c] border border-[#141f36] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-white truncate block">{filename}</span>
              {fileSize && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {(fileSize / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            5-Layer Shielded
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#141f36] mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('STEGO')}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'STEGO'
                ? 'border-[#10b981] text-[#34d399]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Extract from Stego Image (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SESSION')}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'SESSION'
                ? 'border-[#10b981] text-[#34d399]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Session / Manual Key
          </button>
        </div>

        {/* Tab 1: Stego Image Drag & Drop */}
        {activeTab === 'STEGO' && (
          <div className="mt-4 space-y-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
                extractedKey
                  ? 'border-emerald-500/60 bg-emerald-500/5'
                  : 'border-[#1b2b4e] hover:border-emerald-500/40 bg-[#070e1c]'
              }`}
            >
              <input
                type="file"
                id="stego-input"
                accept=".png"
                onChange={handleStegoFileChange}
                className="hidden"
              />
              <label htmlFor="stego-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  {extracting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : extractedKey ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-semibold text-white">
                  {stegoFile ? stegoFile.name : 'Choose or Drag & Drop Stego Key Image (.png)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Extracts NIST P-256 ECC Private Key from Least Significant Bits (LSB)
                </span>
              </label>
            </div>

            {/* Extracted Key Status Box */}
            {extractedKey && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Key Successfully Extracted &amp; Verified (CRC-32 Valid)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    NIST P-256
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 break-all select-all pt-1">
                  {extractedKey.substring(0, 36)}••••••••••••••••••••••••••••••••••••
                </div>
              </div>
            )}

            {/* Quick Session Key Option */}
            {privateKey && !extractedKey && (
              <div className="flex items-center justify-between p-2.5 bg-black/40 border border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Keyring session key available:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('SESSION')}
                  className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Switch to Session Key
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Session Key / Manual Input */}
        {activeTab === 'SESSION' && (
          <div className="mt-4 space-y-3">
            {privateKey ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium">Active Session Key Found</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  Ready to Decrypt
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No private key found in current session. Paste your key below or use a Stego Image.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Base64 PKCS#8 ECC Private Key:
              </label>
              <textarea
                rows={3}
                placeholder="Paste your Base64 PKCS#8 ECC private key here..."
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Remember in Session Checkbox */}
        <div className="mt-4 pt-2 border-t border-[#141f36] flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={saveToSession}
              onChange={(e) => setSaveToSession(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#070e1c] border-[#1a2744] text-[#10b981] focus:ring-0"
            />
            <span>Remember this key in browser session for future downloads</span>
          </label>
        </div>

        {decryptError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{decryptError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-[#141f36]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteDecrypt}
            disabled={decrypting || (activeTab === 'STEGO' ? !extractedKey : !manualKey.trim())}
            className="px-5 py-2 sec-btn-emerald text-slate-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {decrypting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {decrypting ? 'Decrypting 5 Layers...' : 'Decrypt & Download'}
          </button>
        </div>
      </div>
    </div>
  );
};
