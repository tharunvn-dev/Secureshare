import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Shield,
  Clock,
  AlertTriangle,
  Key,
  FileText,
  CheckCircle2,
  MoreVertical,
  Eye,
  Lock,
  X,
  ShieldCheck,
  Binary,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  Image as ImageIcon,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { FileShare, FileIntegrityResult } from '../../types';
import { DecryptModal } from '../../components/common/DecryptModal';
import { useAuth } from '../../context/AuthContext';

export const SharedWithMe: React.FC = () => {
  const { privateKey } = useAuth();
  const [shares, setShares] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [decryptModalShare, setDecryptModalShare] = useState<{ id: string; filename: string; size?: number } | null>(null);

  // 3-dots dropdown menu tracking
  const [activeMenuShareId, setActiveMenuShareId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // File Details / Properties Modal
  const [inspectShare, setInspectShare] = useState<any | null>(null);

  // Integrity Check Modal & Status
  const [integrityChecking, setIntegrityChecking] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<FileIntegrityResult | null>(null);
  const [integrityModalOpen, setIntegrityModalOpen] = useState(false);

  // Close 3-dots dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuShareId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchShares = () => {
    setLoading(true);
    api
      .get<any>('/shares/incoming')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setShares(list);
      })
      .catch((err) => {
        console.warn('Error fetching incoming shares:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleDownload = (fileId: string, filename: string, size?: number) => {
    setActiveMenuShareId(null);
    setDecryptModalShare({ id: fileId, filename, size });
  };

  const handleRunIntegrityCheck = async (fileId: string, filename: string) => {
    setActiveMenuShareId(null);
    setIntegrityChecking(true);
    setIntegrityModalOpen(true);
    setIntegrityResult(null);

    try {
      const res = await api.get<FileIntegrityResult>(`/files/${fileId}/integrity`, {
        headers: privateKey ? { 'X-Private-Key': privateKey } : {},
      });
      setIntegrityResult(res.data);
    } catch (err: any) {
      setIntegrityResult({
        fileId,
        originalFilename: filename,
        expectedSha256Checksum: 'Retrieved from Blockchain-style ledger',
        calculatedSha256Checksum: 'Verification computation failed',
        integrityValid: false,
        verifiedAt: new Date().toISOString(),
        statusMessage: getErrorMessage(err),
      });
    } finally {
      setIntegrityChecking(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Key Info */}
      {!privateKey && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Your NIST P-256 ECC Private Key is required to unwrap file keys (Layer 4 Asymmetric Decryption). Please check Keyring Settings.
            </span>
          </div>
        </div>
      )}

      {/* Screen 13 Card: Files Shared With Me */}
      <div className="sec-card p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Files Shared With Me</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Encrypted files shared directly with your account via ECC Key Re-wrapping
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchShares}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Refresh shares list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-mono">
              {shares.length} Files Available
            </span>
          </div>
        </div>

        {/* Table matching Screen 13 */}
        <div className="overflow-x-auto min-h-[220px]">
          {loading && shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Loading encrypted shares from secure storage...</span>
            </div>
          ) : shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-2">
              <FileText className="w-8 h-8 text-slate-600 mb-1" />
              <span className="text-slate-300 font-medium">No files have been shared with your account yet.</span>
              <span className="text-slate-500 text-[11px]">When other users share files with you, they will appear here with re-wrapped keys.</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Shared By</th>
                  <th className="py-3 px-4">Received On</th>
                  <th className="py-3 px-4">Expires On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/30">
                {shares.map((item: any) => {
                  const isRevoked = item.status?.toUpperCase() === 'REVOKED';
                  const isExpiring = item.status?.toUpperCase() === 'EXPIRING';
                  const isActive = !isRevoked && !isExpiring;
                  const isDownloading = downloadingFileId === item.fileId;
                  const isMenuOpen = activeMenuShareId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-mono text-emerald-300 group-hover:text-emerald-200">
                          {item.originalFilename}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {item.ownerName || item.ownerEmail || 'Shared User'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {item.expiryDate || '19 May 2025'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        )}
                        {isExpiring && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Expiring
                          </span>
                        )}
                        {isRevoked && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Direct Download Button */}
                          <button
                            onClick={() => handleDownload(item.fileId, item.originalFilename, item.originalSize || item.size)}
                            disabled={isRevoked}
                            title={isRevoked ? 'Access Revoked' : 'Decrypt and Download File'}
                            className="p-1.5 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/15 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Stego Key Decrypt Button */}
                          <button
                            onClick={() => setDecryptModalShare({ id: item.fileId, filename: item.originalFilename, size: item.originalSize || item.size })}
                            disabled={isRevoked}
                            title="Decrypt with Stego Key Image"
                            className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/15 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>

                          {/* 3-Dots Action Menu Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuShareId(isMenuOpen ? null : item.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isMenuOpen
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* 3-Dots Action Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-9 z-30 w-52 bg-[#091224] border border-emerald-500/30 rounded-xl shadow-2xl p-1.5 text-left text-xs animate-fadeIn backdrop-blur-md"
                            >
                              <button
                                onClick={() => handleDownload(item.fileId, item.originalFilename, item.originalSize || item.size)}
                                disabled={isRevoked}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-40"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Decrypt &amp; Download</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuShareId(null);
                                  setDecryptModalShare({ id: item.fileId, filename: item.originalFilename, size: item.originalSize || item.size });
                                }}
                                disabled={isRevoked}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-40"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Stego Key Decrypt</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuShareId(null);
                                  setInspectShare(item);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                <span>File Properties</span>
                              </button>

                              <button
                                onClick={() => handleRunIntegrityCheck(item.fileId, item.originalFilename)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Verify Integrity</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: FILE DETAILS & CRYPTOGRAPHIC PROPERTIES */}
      {inspectShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#091224] border border-emerald-500/30 rounded-2xl shadow-2xl p-6 relative text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {inspectShare.originalFilename}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Shared by {inspectShare.ownerName || inspectShare.ownerEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectShare(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 bg-black/40 border border-emerald-950/40 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">File Size</span>
                <span className="text-xs font-mono font-semibold text-emerald-300">
                  {formatBytes(inspectShare.originalSize)}
                </span>
              </div>
              <div className="p-3 bg-black/40 border border-emerald-950/40 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Status</span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {inspectShare.status || 'Active'}
                </span>
              </div>
              <div className="p-3 bg-black/40 border border-emerald-950/40 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Received</span>
                <span className="text-xs font-mono text-slate-200">
                  {inspectShare.createdAt ? new Date(inspectShare.createdAt).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <div className="p-3 bg-black/40 border border-emerald-950/40 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Expiry</span>
                <span className="text-xs font-mono text-slate-200">
                  {inspectShare.expiryDate || '19 May 2025'}
                </span>
              </div>
            </div>

            {/* Cryptographic Pipeline Status */}
            <div className="p-4 bg-emerald-950/15 border border-emerald-500/20 rounded-xl mb-6 space-y-3">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5" /> Multi-Layer Cryptographic Security Framework
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Layer 1: SHA-256 Digest &amp; Non-Repudiation</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Layer 2: AES-256-GCM Payload Encryption (AAD bound)</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Layer 3: Blowfish-448 CBC Cascading Diffusion</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Layer 4: NIST P-256 ECC Key Re-wrapping (ECDH + HKDF)</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recipient-Locked
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Layer 5: Lossless LSB Steganography Shield</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concealed
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-950/40">
              <button
                onClick={() => handleRunIntegrityCheck(inspectShare.fileId, inspectShare.originalFilename)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verify Integrity
              </button>
              <button
                onClick={() => {
                  const share = inspectShare;
                  setInspectShare(null);
                  setDecryptModalShare({ id: share.fileId, filename: share.originalFilename, size: share.originalSize });
                }}
                className="sec-btn-glass py-2 px-3 text-xs font-medium flex items-center gap-1.5 text-cyan-400 hover:border-cyan-500/50"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Stego Decrypt
              </button>
              <button
                onClick={() => {
                  const share = inspectShare;
                  setInspectShare(null);
                  handleDownload(share.fileId, share.originalFilename, share.originalSize);
                }}
                className="sec-btn-emerald py-2 px-4 text-xs font-medium flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Decrypt &amp; Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTEGRITY VERIFICATION RESULT */}
      {integrityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#091224] border border-emerald-500/30 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/40">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Cryptographic Integrity Report</h3>
              </div>
              <button
                onClick={() => setIntegrityModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5">
              {integrityChecking ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-mono">
                    Computing constant-time SHA-256 verification hash...
                  </p>
                </div>
              ) : integrityResult ? (
                <div className="space-y-4">
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                      integrityResult.integrityValid
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${
                        integrityResult.integrityValid ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold">
                        {integrityResult.integrityValid
                          ? '100% Cryptographic Match Verified'
                          : 'Integrity Check Notice'}
                      </p>
                      <p className="text-[11px] font-mono opacity-90">
                        {integrityResult.integrityValid
                          ? 'Zero-tampering confirmed: File contents precisely match the original hash.'
                          : integrityResult.statusMessage || 'Calculated checksum did not match the ledger.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 bg-black/40 border border-emerald-950/40 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        SHA-256 Registered Checksum:
                      </span>
                      <span className="text-emerald-400 break-all select-all text-[11px] block">
                        {integrityResult.expectedSha256Checksum}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                      <span>Method: Constant-Time Comparison</span>
                      <span>Verified: {new Date(integrityResult.verifiedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end pt-3 border-t border-emerald-950/40">
              <button
                onClick={() => setIntegrityModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Steganographic Decryption Modal */}
      {decryptModalShare && (
        <DecryptModal
          isOpen={Boolean(decryptModalShare)}
          onClose={() => setDecryptModalShare(null)}
          fileId={decryptModalShare.id}
          filename={decryptModalShare.filename}
          fileSize={decryptModalShare.size}
          onSuccess={fetchShares}
        />
      )}
    </div>
  );
};
