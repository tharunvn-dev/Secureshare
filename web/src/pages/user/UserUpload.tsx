import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Key,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { calculateFileSha256 } from '../../utils/crypto';
import { StoredFile } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const UserUpload: React.FC = () => {
  const navigate = useNavigate();
  const { user, privateKey } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<File | null>(null);
  const [useSteganography, setUseSteganography] = useState<boolean>(true);
  const [clientSha256, setClientSha256] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadedResult, setUploadedResult] = useState<StoredFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      setUploadedResult(null);

      try {
        const hash = await calculateFileSha256(file);
        setClientSha256(hash);
      } catch (err) {
        console.error('Failed to calculate client SHA-256:', err);
      }
    }
  };

  const handleCarrierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const carrier = e.target.files[0];
      if (!carrier.name.toLowerCase().endsWith('.png')) {
        setError('Carrier image must be a lossless PNG image');
        return;
      }
      setSelectedCarrier(carrier);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedCarrier && useSteganography) {
        formData.append('carrierImage', selectedCarrier);
      }

      const response = await api.post<StoredFile>('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-3xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-[#141f36]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            Upload and Encrypt File
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Apply 5-layer hybrid cryptography &amp; optional steganographic key concealment
          </p>
        </div>
      </div>

      {!privateKey && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-center gap-2.5">
          <Key className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Note:</strong> No NIST P-256 ECC Private Key detected in current session. Please open <strong>Keyring Settings</strong> (or click <strong>P-256 Key</strong> above) to generate or import your key before uploading, so you can decrypt your files later.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadedResult ? (
        <div className="p-8 rounded-2xl bg-[#0b1325] border border-[#10b981]/40 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white">Encryption &amp; Storage Succeeded!</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Your file has been secured with AES-256-GCM + Blowfish and sealed with ECC P-256 steganography.
          </p>

          <div className="p-4 bg-[#070e1c] border border-[#141f36] rounded-xl text-left text-xs font-mono space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">File Name:</span>
              <span className="text-white font-sans">{uploadedResult.originalFilename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Encrypted Size:</span>
              <span className="text-[#34d399]">{(uploadedResult.encryptedSize / 1024).toFixed(1)} KB</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">SHA-256 Digest:</span>
              <span className="text-cyan-300 break-all select-all text-[11px]">{uploadedResult.sha256Checksum}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setUploadedResult(null);
                setSelectedFile(null);
                setSelectedCarrier(null);
                setClientSha256(null);
              }}
              className="sec-btn-glass text-xs"
            >
              Upload Another
            </button>
            <button
              onClick={() => navigate('/app/files')}
              className="sec-btn-emerald text-xs"
            >
              Go to My Files &rarr;
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="p-8 rounded-2xl bg-[#0b1325] border border-[#1a2744] shadow-2xl space-y-6">
          {/* Big Drag and Drop Cloud Area matching Screen 9 */}
          <div className="border-2 border-dashed border-[#1e3052] hover:border-[#10b981]/60 rounded-2xl p-10 text-center transition-all bg-[#070e1c]/60 relative cursor-pointer">
            <input
              type="file"
              required
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-14 h-14 mx-auto rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {selectedFile.type || 'binary/stream'}
                </p>
                {clientSha256 && (
                  <p className="text-[11px] font-mono text-[#34d399] mt-2 truncate max-w-md mx-auto select-all">
                    SHA-256: {clientSha256}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop your file here <br />
                  <span className="text-xs text-[#10b981] font-semibold">or Click to browse</span>
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-2">(Maximum size: 1 GB)</p>
              </div>
            )}
          </div>

          {/* Steganography Toggle Switch matching Screen 9 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#070e1c] border border-[#141f36]">
            <div>
              <span className="text-xs font-semibold text-white">Use Steganography for Key Storage</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Conceals sealed cryptographic key envelope inside lossless PNG image carrier
              </p>
            </div>

            <button
              type="button"
              onClick={() => setUseSteganography(!useSteganography)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                useSteganography ? 'bg-[#10b981]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  useSteganography ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Select Carrier Image (PNG) matching Screen 9 */}
          {useSteganography && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Select Carrier Image (PNG)
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#070e1c] border border-[#141f36]">
                <label className="sec-btn-glass py-1.5 px-3 text-xs cursor-pointer shrink-0">
                  Choose Image
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleCarrierChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs font-mono text-slate-400 truncate">
                  {selectedCarrier ? selectedCarrier.name : 'No file chosen (Server will generate dynamic carrier)'}
                </span>
              </div>
            </div>
          )}

          {/* Green Encrypt & Upload Button matching Screen 9 */}
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="w-full sec-btn-emerald py-3.5 text-slate-950 font-bold text-sm tracking-wide disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Encrypting &amp; Uploading...</span>
              </div>
            ) : (
              'Encrypt & Upload'
            )}
          </button>
        </form>
      )}
    </div>
  );
};
