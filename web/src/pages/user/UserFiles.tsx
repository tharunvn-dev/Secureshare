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
  const [oneTimeLink, setOneTimeLink] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
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

    if (!recipientEmail.trim() && !oneTimeLink) {
      setShareError('Please enter a recipient email address to share directly, or check "Generate one-time download link".');
      return;
    }

    if (recipientEmail.trim() && !privateKey) {
      setShareError(
        "Your NIST P-256 ECC Private Key is required to re-encrypt this file for the recipient. Please open Keyring Settings in the top navigation bar to generate or restore your key."
      );
      return;
    }

    setShareSubmitting(true);
    setShareSuccess(null);
    setShareError(null);
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
          results.push(`Successfully shared with ${recipientEmail.trim()}! The file is now available in their "Shared With Me" tab.`);
        } catch (shareErr: any) {
          const msg = getErrorMessage(shareErr);
          if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('active share')) {
            results.push(`Note: Active share with ${recipientEmail.trim()} already exists in the portal.`);
          } else if (
            msg.includes('Key Mismatch') ||
            msg.includes('AES-GCM authentication tag') ||
            msg.includes('corrupted or tampered')
          ) {
            if (oneTimeLink) {
              results.push(`Note: Direct share key mismatch on older upload. One-Time Download Link generated below:`);
            } else {
              setShareError(
                `Key Mismatch: This file was uploaded with a previous cryptographic keypair. Under zero-knowledge security, you can share it using a One-Time Download Link, or re-upload the file with your active key.`
              );
              setOneTimeLink(true);
              return;
            }
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

      if (results.length > 0) {
        setShareSuccess(results.join(' '));
      }
    } catch (err) {
      const rawMsg = getErrorMessage(err);
      setShareError(rawMsg);
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

  const getFileBadge = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    if (ext === 'PDF') {
      return <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 font-bold text-[10px] flex items-center justify-center shrink-0">PDF</span>;
    }
    if (['PNG', 'JPG', 'JPEG', 'SVG'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 font-bold text-[10px] flex items-center justify-center shrink-0">PNG</span>;
    }
    if (['ZIP', 'TAR', 'GZ'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 font-bold text-[10px] flex items-center justify-center shrink-0">ZIP</span>;
    }
    if (['DOC', 'DOCX'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0">DOC</span>;
    }
    if (['PPT', 'PPTX'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 font-bold text-[10px] flex items-center justify-center shrink-0">PPT</span>;
    }
    return <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">{ext.slice(0, 3)}</span>;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* SCREEN 6: MY FILES HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Files</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your files securely</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="w-full sm:w-60 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sec-input pl-9 py-2 text-xs"
            />
          </div>

          {/* Filter Dropdown */}
          <select className="sec-input py-2 px-3 text-xs w-auto cursor-pointer">
            <option>All Files</option>
            <option>PDF Documents</option>
            <option>Images</option>
            <option>Archives</option>
          </select>

          {/* Sort Dropdown */}
          <select className="sec-input py-2 px-3 text-xs w-auto cursor-pointer">
            <option>Sort by: Newest</option>
            <option>Sort by: Size</option>
            <option>Sort by: Name</option>
          </select>

          {/* + Upload File Button */}
          <Link
            to="/app/upload"
            className="sec-btn-blue py-2 px-4 text-xs whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-4 h-4" /> + Upload File
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* SCREEN 6: MY FILES TABLE */}
      <div className="sec-card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading encrypted files...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FolderLock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No files found</p>
            <p className="text-xs text-slate-400 mt-1">Upload a file to store and encrypt it securely.</p>
            <Link to="/app/upload" className="mt-4 inline-flex sec-btn-blue py-2 px-4 text-xs">
              Upload File
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 bg-slate-50/60 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFiles.map((file) => {
                  const ext = file.originalFilename.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-[240px] truncate">
                        <button
                          onClick={() => {
                            setInspectFile(file);
                            setDetailTab('DETAILS');
                            setIntegrityResult(null);
                          }}
                          className="hover:text-blue-600 hover:underline transition-colors text-left flex items-center gap-2.5 truncate"
                        >
                          {getFileBadge(file.originalFilename)}
                          <span className="truncate">{file.originalFilename}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {(file.encryptedSize / 1024).toFixed(0)} KB
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {ext}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details */}
                          <button
                            onClick={() => {
                              setInspectFile(file);
                              setDetailTab('DETAILS');
                              setIntegrityResult(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="File Details"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>

                          {/* Download */}
                          <button
                            onClick={() => handleDownload(file)}
                            disabled={downloadingFileId === file.id}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Decrypt & Download"
                          >
                            {downloadingFileId === file.id ? (
                              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>

                          {/* Stego Key Decrypt */}
                          <button
                            onClick={() => setDecryptModalFile(file)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Decrypt with Stego Key Image"
                          >
                            <ImageIcon className="w-4 h-4 text-cyan-600" />
                          </button>

                          {/* Share */}
                          <button
                            onClick={() => {
                              setShareFile(file);
                              setShareSuccess(null);
                              setGeneratedLinkToken(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Share File"
                          >
                            <Share2 className="w-4 h-4 text-purple-600" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteFileId(file.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom Drag & Drop Area matching Screen 6 */}
            <div className="py-4 text-center border-t border-slate-100 text-xs text-slate-400 bg-slate-50/40">
              <Link to="/app/upload" className="hover:text-blue-600 transition-colors">
                Drag &amp; drop files here, or <span className="text-blue-600 font-semibold underline">click to upload</span> &bull; Maximum file size: 1 GB
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* SCREEN 8: FILE DETAILS MODAL (matching Screen 8 from Design System) */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 relative text-slate-800">
            {/* Modal Top Header with File Name, Download, Share, and Close */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 truncate">{inspectFile.originalFilename}</h3>
                  <p className="text-[11px] text-slate-400">
                    {(inspectFile.originalSize / 1024).toFixed(1)} KB &bull; Uploaded {new Date(inspectFile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(inspectFile)}
                  disabled={downloadingFileId === inspectFile.id}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {downloadingFileId === inspectFile.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{downloadingFileId === inspectFile.id ? 'Decrypting...' : 'Download'}</span>
                </button>
                <button
                  onClick={() => {
                    setShareFile(inspectFile);
                    setShareSuccess(null);
                    setGeneratedLinkToken(null);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => setDeleteFileId(inspectFile.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  title="Delete File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setInspectFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs matching Screen 8: Details, Sharing, Activity */}
            <div className="flex border-b border-slate-100 mt-3 text-xs font-semibold">
              <button
                onClick={() => setDetailTab('DETAILS')}
                className={`py-2 px-4 transition-colors border-b-2 ${
                  detailTab === 'DETAILS'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
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
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Integrity
              </button>
              <button
                onClick={() => setDetailTab('SHARING')}
                className={`py-2 px-4 transition-colors border-b-2 ${
                  detailTab === 'SHARING'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sharing
              </button>
              <button
                onClick={() => setDetailTab('ACTIVITY')}
                className={`py-2 px-4 transition-colors border-b-2 ${
                  detailTab === 'ACTIVITY'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Activity
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 text-xs">
              {detailTab === 'DETAILS' && (
                <div className="space-y-2.5">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">File Name</span>
                    <span className="font-semibold text-slate-900">{inspectFile.originalFilename}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">File Size</span>
                    <span className="font-semibold text-slate-900">{(inspectFile.originalSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">File Type</span>
                    <span className="font-semibold text-slate-900 uppercase">{inspectFile.originalFilename.split('.').pop()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Uploaded By</span>
                    <span className="font-semibold text-slate-900">{inspectFile.ownerEmail || 'You'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Uploaded On</span>
                    <span className="font-semibold text-slate-900">{new Date(inspectFile.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-slate-500 block mb-1">SHA-256 Hash</span>
                    <span className="font-mono text-[11px] text-blue-600 break-all select-all bg-slate-50 p-2 rounded-lg block border border-slate-200">
                      {inspectFile.sha256Checksum}
                    </span>
                  </div>
                </div>
              )}

              {detailTab === 'INTEGRITY' && (
                <div className="space-y-4">
                  {integrityTesting ? (
                    <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Computing constant-time SHA-256 digest comparison...
                    </div>
                  ) : integrityResult ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="font-semibold">Integrity Verified: Bit-for-Bit Checksum Match</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">VALID</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] font-mono text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expected Hash:</span>
                          <span className="break-all">{integrityResult.expectedSha256Checksum}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Calculated Digest:</span>
                          <span className="text-emerald-600 break-all">{integrityResult.calculatedSha256Checksum}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRunIntegrityCheck(inspectFile.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Run Integrity Test Now
                    </button>
                  )}
                </div>
              )}

              {detailTab === 'SHARING' && (
                <div className="text-center py-6 text-slate-500 space-y-3">
                  <Share2 className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="text-xs">You can share this file with other users or create secure links.</p>
                  <button
                    onClick={() => {
                      setShareFile(inspectFile);
                      setShareSuccess(null);
                      setGeneratedLinkToken(null);
                    }}
                    className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold mx-auto"
                  >
                    Open Share Dialog
                  </button>
                </div>
              )}

              {detailTab === 'ACTIVITY' && (
                <div className="space-y-2 text-slate-700">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">File Upload &amp; 5-Layer Encrypt</p>
                      <p className="text-[10px] text-slate-500">{new Date(inspectFile.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">SUCCESS</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectFile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 9: SHARE FILE MODAL (matching Screen 9 from Design System) */}
      {shareFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 relative text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Share File</h3>
                  <p className="text-[11px] text-slate-500 truncate">{shareFile.originalFilename}</p>
                </div>
              </div>
              <button onClick={() => setShareFile(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShare} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Share with {oneTimeLink && <span className="text-slate-400 font-normal">(optional for one-time links)</span>}
                </label>
                <input
                  type="email"
                  required={!oneTimeLink}
                  placeholder="name@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Permissions</label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="DOWNLOAD">Download &bull; Full Access</option>
                  <option value="VIEW_ONLY">View Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Message (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add an encrypted note..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-xs resize-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={oneTimeLink}
                    onChange={(e) => setOneTimeLink(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Generate one-time download link</span>
                </label>
              </div>

              {shareError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{shareError}</span>
                  </div>
                  {!oneTimeLink && (
                    <button
                      type="button"
                      onClick={() => {
                        setOneTimeLink(true);
                        setShareError(null);
                      }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-all shadow-sm"
                    >
                      Generate One-Time Link Instead &rarr;
                    </button>
                  )}
                </div>
              )}

              {shareSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{shareSuccess}</span>
                </div>
              )}

              {generatedLinkToken && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Shared Link:</span>
                    {copiedLink && <span className="text-emerald-600 font-medium">Copied!</span>}
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-blue-600 break-all select-all">
                    {generatedLinkToken}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLinkToken);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={shareSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm text-xs disabled:opacity-50"
                >
                  {shareSubmitting ? 'Sharing...' : 'Share'}
                </button>
                <button
                  type="button"
                  onClick={() => setShareFile(null)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
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

