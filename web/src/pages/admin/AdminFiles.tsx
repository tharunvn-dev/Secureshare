import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Share2,
  MoreVertical,
  ShieldCheck,
  Trash2,
  Lock,
  Eye,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  HardDrive,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { StoredFile, FileShare, PageResponse } from '../../types';
import { formatBytes } from '../../utils/formatters';

export const AdminFiles: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL_FILES' | 'SHARED_FILES'>('ALL_FILES');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [shares, setShares] = useState<FileShare[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Inspect Modal
  const [inspectFile, setInspectFile] = useState<StoredFile | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Delete Confirmation Modal
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);

  const fetchFiles = () => {
    setLoading(true);
    setErrorMsg(null);
    Promise.allSettled([
      api.get<PageResponse<StoredFile> | StoredFile[]>('/admin/files?size=50'),
      api.get<PageResponse<FileShare> | FileShare[]>('/admin/shares?size=50'),
    ])
      .then(([filesRes, sharesRes]) => {
        if (filesRes.status === 'fulfilled') {
          const list = Array.isArray(filesRes.value.data)
            ? filesRes.value.data
            : filesRes.value.data?.content || [];
          setFiles(list);
        }
        if (sharesRes.status === 'fulfilled') {
          const list = Array.isArray(sharesRes.value.data)
            ? sharesRes.value.data
            : sharesRes.value.data?.content || [];
          setShares(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load admin files:', err);
        setErrorMsg(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.delete(`/admin/files/${fileToDelete.id}`);
      setSuccessMsg(`File '${fileToDelete.originalFilename}' purged successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setFileToDelete(null);
      fetchFiles();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setActiveMenuId(null);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.delete(`/admin/shares/${shareId}`);
      setSuccessMsg('Share delegation revoked successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchFiles();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setActiveMenuId(null);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const filteredFiles = files.filter(
    (f) =>
      !query.trim() ||
      f.originalFilename.toLowerCase().includes(query.toLowerCase()) ||
      f.ownerEmail.toLowerCase().includes(query.toLowerCase())
  );

  const filteredShares = shares.filter(
    (s) =>
      !query.trim() ||
      s.originalFilename.toLowerCase().includes(query.toLowerCase()) ||
      s.ownerEmail.toLowerCase().includes(query.toLowerCase()) ||
      s.recipientEmail.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Files Oversight Card */}
      <div className="sec-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">File &amp; Share Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-Trust Encrypted Storage Oversight &bull; Plaintext Remains Isolated at Client
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            {/* Tabs: All Files & Shared Files */}
            <div className="flex p-1 bg-black/40 border border-emerald-950/40 rounded-xl text-xs font-mono">
              <button
                onClick={() => setActiveTab('ALL_FILES')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'ALL_FILES'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Files ({files.length})
              </button>
              <button
                onClick={() => setActiveTab('SHARED_FILES')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'SHARED_FILES'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Shared Files ({shares.length})
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="p-2 rounded-xl bg-black/40 border border-emerald-950/50 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-colors"
              title="Refresh Files"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Search Bar */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files or owners..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: All Files Table */}
        {activeTab === 'ALL_FILES' && (
          <div className="overflow-x-auto min-h-[220px]">
            {loading && files.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Reading physical and metadata records...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-emerald-950/40 rounded-xl">
                {query ? `No files match '${query}'` : 'No files uploaded yet in the system'}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Size (Encrypted)</th>
                    <th className="py-3 px-4">Uploaded On</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/30">
                  {filteredFiles.map((file) => {
                    const isMenuOpen = activeMenuId === file.id;

                    return (
                      <tr key={file.id} className="hover:bg-emerald-500/5 transition-colors group">
                        <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-mono text-emerald-300 group-hover:text-emerald-200">
                            {file.originalFilename}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {formatBytes(file.encryptedSize || file.originalSize || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {file.createdAt
                            ? new Date(file.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {file.ownerEmail}
                        </td>
                        <td className="py-3.5 px-4 text-right relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : file.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isMenuOpen
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-4 top-10 z-30 w-52 rounded-xl bg-[#081018] border border-emerald-950/80 shadow-2xl shadow-black/80 py-1.5 backdrop-blur-md"
                            >
                              <button
                                onClick={() => {
                                  setInspectFile(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 flex items-center gap-2.5 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span>Inspect Crypto Metadata</span>
                              </button>

                              <div className="border-t border-emerald-950/50 my-1" />

                              <button
                                onClick={() => {
                                  setFileToDelete(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/15 flex items-center gap-2.5 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>Purge Storage File</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Shared Files Table */}
        {activeTab === 'SHARED_FILES' && (
          <div className="overflow-x-auto min-h-[220px]">
            {loading && shares.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Reading active sharing delegations...</span>
              </div>
            ) : filteredShares.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-emerald-950/40 rounded-xl">
                No active sharing grants found
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Shared File</th>
                    <th className="py-3 px-4">Owner (Granter)</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Shared On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/30">
                  {filteredShares.map((share) => (
                    <tr key={share.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="py-3.5 px-4 font-mono text-emerald-300 font-medium flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        {share.originalFilename}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{share.ownerName || share.ownerEmail}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{share.ownerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{share.recipientName || share.recipientEmail}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{share.recipientEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            share.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {share.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                        {share.createdAt ? new Date(share.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {share.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeShare(share.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg hover:bg-rose-500/25 transition-colors font-mono text-[10px]"
                          >
                            Revoke Share
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Inspect File Crypto Metadata Modal */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sec-card p-6 max-w-lg w-full space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/40 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  File Cryptographic Metadata
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{inspectFile.originalFilename}</p>
              </div>
              <button
                onClick={() => setInspectFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">Plaintext Size</span>
                <span className="text-white font-semibold mt-1 block">
                  {formatBytes(inspectFile.originalSize || 0)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">Encrypted Storage Size</span>
                <span className="text-cyan-300 font-semibold mt-1 block">
                  {formatBytes(inspectFile.encryptedSize || 0)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">Owner Identity</span>
                <span className="text-emerald-300 font-semibold mt-1 block truncate">
                  {inspectFile.ownerEmail}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">MIME Content Type</span>
                <span className="text-white font-semibold mt-1 block">
                  {inspectFile.mimeType || 'application/octet-stream'}
                </span>
              </div>
            </div>

            {/* Cryptographic Proof Details */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-950/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  SHA-256 Plaintext Checksum
                </span>
                <button
                  onClick={() => handleCopyHash(inspectFile.sha256Checksum)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedHash ? 'Copied' : 'Copy SHA-256'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-mono break-all bg-black/60 p-2.5 rounded-lg border border-emerald-950/40 select-all">
                {inspectFile.sha256Checksum || 'Unavailable'}
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                Crypto Suite: AES-256-GCM + Blowfish Layering &bull; ECDH P-256 Envelope &bull; Version: {inspectFile.cryptoProfileVersion || 'v1'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectFile(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sec-card p-6 max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Confirm Storage File Purge
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently purge file <strong className="text-white">{fileToDelete.originalFilename}</strong> owned by <span className="text-emerald-400">{fileToDelete.ownerEmail}</span>?
            </p>
            <p className="text-[11px] text-slate-400 font-mono bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              This action securely shreds the encrypted payload on disk and invalidates all active sharing envelopes in the database.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteFile}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                {actionLoading ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
