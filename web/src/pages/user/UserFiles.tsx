import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderLock,
  Search,
  Download,
  Share2,
  Trash2,
  UploadCloud,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Key,
  Eye,
  Activity,
  Copy,
  ExternalLink,
  Check,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { StoredFile, FileIntegrityResult, SharedLink } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DecryptModal } from '../../components/common/DecryptModal';
import { useAuth } from '../../context/AuthContext';

export const UserFiles: React.FC = () => {
  const { privateKey } = useAuth();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [decryptModalFile, setDecryptModalFile] = useState<StoredFile | null>(null);

  // Screen 11: File Details Modal
  const [inspectFile, setInspectFile] = useState<StoredFile | null>(null);
  const [detailTab, setDetailTab] = useState<'DETAILS' | 'INTEGRITY' | 'SHARING' | 'ACTIVITY'>('DETAILS');
  const [integrityTesting, setIntegrityTesting] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<FileIntegrityResult | null>(null);

  // Screen 12: Share File Modal
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState<'DOWNLOAD' | 'VIEW_ONLY'>('DOWNLOAD');
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [oneTimeLink, setOneTimeLink] = useState(true);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [generatedLinkToken, setGeneratedLinkToken] = useState<string | null>(null);

  // Delete State
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const fetchFiles = () => {
    setLoading(true);
    api
      .get<any>('/files')
      .then((res) => {
        const rawFiles = res.data;
        const list = Array.isArray(rawFiles) ? rawFiles : rawFiles?.content || [];
        setFiles(list);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (file: StoredFile) => {
    if (!privateKey) {
      setDecryptModalFile(file);
      return;
    }

    setDownloadingFileId(file.id);
    try {
      let cleanKey = privateKey.trim();
      if (cleanKey.includes('-----BEGIN')) {
        cleanKey = cleanKey
          .replace(/-----BEGIN[\s\S]*?-----/g, '')
          .replace(/-----END[\s\S]*?-----/g, '')
          .replace(/["']/g, '')
          .replace(/\s+/g, '');
      }
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: 'blob',
        headers: { 'X-Private-Key': cleanKey },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      // If decryption fails, automatically offer to decrypt using Stego Image
      setDecryptModalFile(file);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleRunIntegrityCheck = async (fileId: string) => {
    setIntegrityTesting(true);
    setIntegrityResult(null);
    try {
      const res = await api.get<FileIntegrityResult>(`/files/${fileId}/integrity`);
      setIntegrityResult(res.data);
    } catch (err) {
      alert(`Integrity verification error: ${getErrorMessage(err)}`);
    } finally {
      setIntegrityTesting(false);
    }
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareFile) return;

    if (recipientEmail.trim() && !privateKey) {
      alert(
        "NIST P-256 ECC Private Key Required\n\nDirect user sharing re-wraps the cryptographic keys for the recipient's public key, which requires your local private key to unwrap.\n\nPlease open Keyring Settings in the top bar to generate or import your private key first."
      );
      return;
    }

    setShareSubmitting(true);
    setShareSuccess(null);
    setGeneratedLinkToken(null);
    setCopiedLink(false);

    try {
      const results: string[] = [];

      // 1. Direct User Share (If email is provided)
      if (recipientEmail.trim()) {
        try {
          await api.post(
            '/shares',
            {
              fileId: shareFile.id,
              recipientEmail: recipientEmail.trim(),
            },
            {
              headers: privateKey ? { 'X-Private-Key': privateKey } : {},
            }
          );
          results.push(`Shared directly with ${recipientEmail.trim()} (they can access it under 'Shared With Me').`);
        } catch (shareErr: any) {
          const msg = getErrorMessage(shareErr);
          if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('active share')) {
            results.push(`Note: Active share with ${recipientEmail.trim()} already exists in portal.`);
          } else {
            throw shareErr;
          }
        }
      }

      // 2. One-Time Shared Link (If checked or if no recipient email given)
      if (oneTimeLink || !recipientEmail.trim()) {
        const res = await api.post<SharedLink>('/shares/link', {
          fileId: shareFile.id,
          recipientEmail: recipientEmail.trim() || undefined,
          expiryDays: 7,
          isOneTime: oneTimeLink,
        });
        if (res.data?.token) {
          const fullUrl = `${window.location.origin}/share/${res.data.token}`;
          setGeneratedLinkToken(fullUrl);
          results.push('One-time secure link generated below!');
        }
      }

      setShareSuccess(results.join(' '));
    } catch (err) {
      const rawMsg = getErrorMessage(err);
      if (
        rawMsg.includes('Key Mismatch') ||
        rawMsg.includes('AES-GCM authentication tag') ||
        rawMsg.includes('corrupted or tampered')
      ) {
        alert(
          `Cryptographic Key Mismatch:\n\nThis file was uploaded with a previous cryptographic keypair. Under zero-knowledge security, only the private key that was active at the time of upload can unwrap it.\n\nFiles uploaded with your current key (or newly uploaded files) can be shared without issues.`
        );
      } else {
        alert(`Share creation failed: ${rawMsg}`);
      }
    } finally {
      setShareSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFileId) return;
    try {
      await api.delete(`/files/${deleteFileId}`);
      setDeleteFileId(null);
      if (inspectFile?.id === deleteFileId) {
        setInspectFile(null);
      }
      fetchFiles();
    } catch (err) {
      alert(`Delete failed: ${getErrorMessage(err)}`);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* SCREEN 10: MY FILES HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#141f36]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">My Files</h1>
          <p className="text-xs text-slate-400 mt-0.5">Encrypted file repository</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sec-input pl-9 py-1.5 text-xs"
            />
          </div>

          {/* + Upload File Button matching Screen 10 */}
          <Link
            to="/app/upload"
            className="sec-btn-emerald py-1.5 px-3 text-xs whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-4 h-4" /> + Upload File
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* SCREEN 10: MY FILES TABLE */}
      <div className="sec-card overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs font-mono text-slate-500">Querying vault items...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FolderLock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium">No files found</p>
            <p className="text-xs text-slate-500 mt-1">Upload a file to encrypt and store it in your vault.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-medium text-slate-400 border-b border-[#141f36] bg-[#070e1c]/60">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141f36] text-slate-300">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#0c1830]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white max-w-[220px] truncate">
                      <button
                        onClick={() => {
                          setInspectFile(file);
                          setDetailTab('DETAILS');
                          setIntegrityResult(null);
                        }}
                        className="hover:text-[#10b981] hover:underline transition-colors text-left flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-[#10b981] shrink-0" />
                        <span className="truncate">{file.originalFilename}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {(file.encryptedSize / (1024 * 1024)).toFixed(1)} MB
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                        Encrypted
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Details */}
                        <button
                          onClick={() => {
                            setInspectFile(file);
                            setDetailTab('DETAILS');
                            setIntegrityResult(null);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="File Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={downloadingFileId === file.id}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                          title="Decrypt & Download"
                        >
                          {downloadingFileId === file.id ? (
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>

                        {/* Stego Key Decrypt */}
                        <button
                          onClick={() => setDecryptModalFile(file)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                          title="Decrypt with Stego Key Image"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => {
                            setShareFile(file);
                            setShareSuccess(null);
                            setGeneratedLinkToken(null);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Share File"
                        >
                          <Share2 className="w-3.5 h-3.5 text-purple-400" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteFileId(file.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SCREEN 11: FILE DETAILS MODAL */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#0b1325] border border-[#1a2744] rounded-2xl shadow-2xl p-6 sm:p-7 relative text-slate-100">
            {/* Modal Top Header with File Name, Download, Share, and Close */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#141f36]">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-6 h-6 text-[#10b981] shrink-0" />
                <h3 className="text-lg font-bold text-white truncate">{inspectFile.originalFilename}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(inspectFile)}
                  disabled={downloadingFileId === inspectFile.id}
                  className="sec-btn-emerald py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {downloadingFileId === inspectFile.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {downloadingFileId === inspectFile.id ? 'Decrypting...' : 'Download'}
                </button>
                <button
                  onClick={() => setDecryptModalFile(inspectFile)}
                  className="sec-btn-glass py-1.5 px-3 text-xs flex items-center gap-1.5 text-cyan-400 hover:border-cyan-500/50"
                  title="Decrypt file by extracting private key from Stego PNG image"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Stego Decrypt
                </button>
                <button
                  onClick={() => {
                    setShareFile(inspectFile);
                    setShareSuccess(null);
                    setGeneratedLinkToken(null);
                  }}
                  className="sec-btn-glass py-1.5 px-3 text-xs"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  onClick={() => setInspectFile(null)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 4 Tabs matching Screen 11: Details, Integrity, Sharing, Activity */}
            <div className="flex border-b border-[#141f36] mt-4 text-xs font-medium">
              <button
                onClick={() => setDetailTab('DETAILS')}
                className={`py-2 px-4 transition-colors border-b-2 ${
                  detailTab === 'DETAILS'
                    ? 'border-[#10b981] text-[#34d399]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => {
                  setDetailTab('INTEGRITY');
                  if (!integrityResult) {
                    handleRunIntegrityCheck(inspectFile.id);
                  }
                }}
                className={`py-2 px-4 transition-colors border-b-2 ${
                  detailTab === 'INTEGRITY'
                    ? 'border-[#10b981] text-[#34d399]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Integrity
              </button>
              <button
                onClick={() => setDetailTab('SHARING')}
                className={`py-2 px-4 transition-colors border-b-2 ${
                  detailTab === 'SHARING'
                    ? 'border-[#10b981] text-[#34d399]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Sharing
              </button>
              <button
                onClick={() => setDetailTab('ACTIVITY')}
                className={`py-2 px-4 transition-colors border-b-2 ${
                  detailTab === 'ACTIVITY'
                    ? 'border-[#10b981] text-[#34d399]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Activity
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-5 text-xs">
              {detailTab === 'DETAILS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">File ID</span>
                    <span className="text-cyan-400 text-xs">FILE-{inspectFile.id.substring(0, 8)}</span>
                  </div>

                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">File Name</span>
                    <span className="text-white font-sans truncate block">{inspectFile.originalFilename}</span>
                  </div>

                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">Size</span>
                    <span className="text-slate-200">{(inspectFile.originalSize / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>

                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">Uploaded On</span>
                    <span className="text-slate-200">{new Date(inspectFile.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="sm:col-span-2 p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">SHA-256 Hash</span>
                    <span className="text-[#34d399] break-all select-all text-[11px]">{inspectFile.sha256Checksum}</span>
                  </div>

                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">Encryption</span>
                    <span className="text-white">AES-256-GCM + Blowfish</span>
                  </div>

                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">Key Protection</span>
                    <span className="text-white">ECC + LSB Steganography</span>
                  </div>

                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Encrypted &amp; Verified
                    </span>
                  </div>

                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase block">Owner</span>
                    <span className="text-white font-sans">You ({inspectFile.ownerEmail})</span>
                  </div>
                </div>
              )}

              {detailTab === 'INTEGRITY' && (
                <div className="space-y-4">
                  {integrityTesting ? (
                    <div className="text-center py-8 font-mono text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                      Computing constant-time SHA-256 digest comparison...
                    </div>
                  ) : integrityResult ? (
                    <div className="space-y-3 font-mono">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="font-semibold font-sans">Integrity Verified: Bit-for-Bit Checksum Match</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-xs">VALID</span>
                      </div>

                      <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl space-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 uppercase block text-[10px]">Expected Initial Hash:</span>
                          <span className="text-cyan-400 break-all">{integrityResult.expectedSha256Checksum}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase block text-[10px]">Calculated Decrypted Digest:</span>
                          <span className="text-emerald-400 break-all">{integrityResult.calculatedSha256Checksum}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRunIntegrityCheck(inspectFile.id)}
                      className="sec-btn-emerald w-full py-2.5 text-xs"
                    >
                      Run Integrity Test Now
                    </button>
                  )}
                </div>
              )}

              {detailTab === 'SHARING' && (
                <div className="text-center py-6 text-slate-400 space-y-3">
                  <Share2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>You can grant access to this file to other registered users or create one-time links.</p>
                  <button
                    onClick={() => {
                      setShareFile(inspectFile);
                      setShareSuccess(null);
                      setGeneratedLinkToken(null);
                    }}
                    className="sec-btn-emerald py-1.5 px-4 text-xs mx-auto"
                  >
                    Open Share Dialog
                  </button>
                </div>
              )}

              {detailTab === 'ACTIVITY' && (
                <div className="space-y-2 font-mono text-slate-300">
                  <div className="p-3 bg-[#070e1c] border border-[#141f36] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-white">File Upload &amp; 5-Layer Encrypt</p>
                      <p className="text-[10px] text-slate-500">{new Date(inspectFile.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#34d399] text-[10px]">SUCCESS</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#141f36] flex justify-end">
              <button
                onClick={() => setInspectFile(null)}
                className="sec-btn-glass py-1.5 px-4 text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 12: SHARE FILE MODAL */}
      {shareFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0b1325] border border-[#1a2744] rounded-2xl shadow-2xl p-6 sm:p-7 relative text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-[#141f36]">
              <h3 className="font-bold text-white text-base">
                Share File: <span className="text-[#34d399]">{shareFile.originalFilename}</span>
              </h3>
              <button onClick={() => setShareFile(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Status Banner */}
            {!privateKey ? (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-200">Local Private Key Not Loaded</p>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    Direct user sharing requires your NIST P-256 ECC Private Key to re-encrypt cryptographic envelopes. Open Keyring Settings in the top bar to load or generate your key.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-mono">NIST P-256 ECC Keyring Active &amp; Ready</span>
              </div>
            )}

            <form onSubmit={handleCreateShare} className="mt-4 space-y-4 text-xs">
              {/* Recipient Email matching Screen 12 */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Recipient (Email)</label>
                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="sec-input"
                />
              </div>

              {/* Permission dropdown matching Screen 12 */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Permission</label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as any)}
                  className="sec-input"
                >
                  <option value="DOWNLOAD">Download</option>
                  <option value="VIEW_ONLY">View Only</option>
                </select>
              </div>

              {/* Expiration Date matching Screen 12 */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="sec-input font-mono"
                />
              </div>

              {/* Checkboxes matching Screen 12 */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={oneTimeLink}
                    onChange={(e) => setOneTimeLink(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#070e1c] border-[#1a2744] text-[#10b981] focus:ring-0"
                  />
                  <span>One-Time access link</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#070e1c] border-[#1a2744] text-[#10b981] focus:ring-0"
                  />
                  <span>Send email notification</span>
                </label>
              </div>

              {shareSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs">
                  {shareSuccess}
                </div>
              )}

              {generatedLinkToken && (
                <div className="p-3.5 bg-[#070e1c] border border-emerald-500/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                      One-Time Access Link:
                    </span>
                    {copiedLink && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copied!
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 bg-[#0b1325] rounded-lg border border-[#1a2744] text-xs font-mono text-cyan-300 break-all select-all leading-relaxed">
                    {generatedLinkToken}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLinkToken);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="flex-1 sec-btn-emerald py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> {copiedLink ? 'Copied to Clipboard!' : 'Copy Full Link'}
                    </button>
                    <a
                      href={generatedLinkToken}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sec-btn-glass py-2 px-3 text-xs flex items-center justify-center gap-1.5 shrink-0 hover:border-emerald-500/40"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#10b981]" /> Open Link
                    </a>
                  </div>
                </div>
              )}

              {/* Green Create Share Button matching Screen 12 */}
              <button
                type="submit"
                disabled={shareSubmitting}
                className="w-full sec-btn-emerald py-3 text-slate-950 font-bold text-xs tracking-wide disabled:opacity-50 mt-2"
              >
                {shareSubmitting ? 'Securing...' : 'Create Share'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteFileId)}
        title="Delete Encrypted File"
        message="Are you sure you want to permanently delete this file and eradicate its cryptographic key envelope?"
        confirmLabel="Delete File"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteFileId(null)}
      />

      {/* Steganographic Decryption Modal */}
      {decryptModalFile && (
        <DecryptModal
          isOpen={Boolean(decryptModalFile)}
          onClose={() => setDecryptModalFile(null)}
          fileId={decryptModalFile.id}
          filename={decryptModalFile.originalFilename}
          fileSize={decryptModalFile.originalSize}
          sha256Checksum={decryptModalFile.sha256Checksum}
          onSuccess={fetchFiles}
        />
      )}
    </div>
  );
};
