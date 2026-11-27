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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 relative text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Steganographic Decryption &amp; Download
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Extract Layer 4 Private Key from PNG Carrier to reverse 5-Layer Hybrid Encryption
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target File Info */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-900 truncate block">{filename}</span>
              {fileSize && (
                <span className="text-[11px] text-slate-500">
                  {(fileSize / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            5-Layer Shielded
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('STEGO')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'STEGO'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Extract from Stego Image (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SESSION')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SESSION'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-blue-500 bg-slate-50'
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
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                  {extracting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : extractedKey ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-900">
                  {stegoFile ? stegoFile.name : 'Choose or Drag & Drop Stego Key Image (.png)'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Extracts NIST P-256 ECC Private Key from Least Significant Bits (LSB)
                </span>
              </label>
            </div>

            {/* Extracted Key Status Box */}
            {extractedKey && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Key Successfully Extracted &amp; Verified (CRC-32 Valid)
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    NIST P-256
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 break-all select-all pt-1">
                  {extractedKey.substring(0, 36)}••••••••••••••••••••••••••••••••••••
                </div>
              </div>
            )}

            {/* Quick Session Key Option */}
            {privateKey && !extractedKey && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Key className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Keyring session key available:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('SESSION')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
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
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-900 font-semibold">Active Session Key Found</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Ready to Decrypt
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No private key found in current session. Paste your key below or use a Stego Image.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base64 PKCS#8 ECC Private Key:
              </label>
              <textarea
                rows={3}
                placeholder="Paste your Base64 PKCS#8 ECC private key here..."
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Remember in Session Checkbox */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={saveToSession}
              onChange={(e) => setSaveToSession(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0"
            />
            <span>Remember this key in browser session for future downloads</span>
          </label>
        </div>

        {decryptError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{decryptError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteDecrypt}
            disabled={decrypting || (activeTab === 'STEGO' ? !extractedKey : !manualKey.trim())}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
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
