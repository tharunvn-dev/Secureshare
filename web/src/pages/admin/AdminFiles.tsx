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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">File &amp; Share Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zero-Trust Encrypted Storage Oversight &bull; Plaintext Remains Isolated at Client
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* Tabs: All Files & Shared Files */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL_FILES')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'ALL_FILES'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Files ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('SHARED_FILES')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'SHARED_FILES'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shared Files ({shares.length})
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh Files"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Search Bar */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files or owners..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Files Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {activeTab === 'ALL_FILES' ? 'Encrypted Physical Vault Files' : 'Active Sharing Grants'}
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {activeTab === 'ALL_FILES' ? `${filteredFiles.length} records` : `${filteredShares.length} grants`}
          </span>
        </div>

        {/* Tab 1: All Files Table */}
        {activeTab === 'ALL_FILES' && (
          <div className="overflow-x-auto min-h-[220px]">
            {loading && files.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span>Reading physical and metadata records...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                {query ? `No files match '${query}'` : 'No files uploaded yet in the system'}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">File Name</th>
                    <th className="py-3 px-6">Size (Encrypted)</th>
                    <th className="py-3 px-6">Uploaded On</th>
                    <th className="py-3 px-6">Owner</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFiles.map((file) => {
                    const isMenuOpen = activeMenuId === file.id;

                    return (
                      <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="hover:text-blue-600 transition-colors">
                            {file.originalFilename}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">
                          {formatBytes(file.encryptedSize || file.originalSize || 0)}
                        </td>
                        <td className="py-3.5 px-6 text-slate-400">
                          {file.createdAt
                            ? new Date(file.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-6 text-slate-700 font-medium">
                          {file.ownerEmail}
                        </td>
                        <td className="py-3.5 px-6 text-right relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : file.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isMenuOpen
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-4 top-10 z-30 w-52 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 animate-in fade-in duration-150"
                            >
                              <button
                                onClick={() => {
                                  setInspectFile(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Inspect Crypto Metadata</span>
                              </button>

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                onClick={() => {
                                  setFileToDelete(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
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
              <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span>Reading active sharing delegations...</span>
              </div>
            ) : filteredShares.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No active sharing grants found
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Shared File</th>
                    <th className="py-3 px-6">Owner (Granter)</th>
                    <th className="py-3 px-6">Recipient</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Shared On</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShares.map((share) => (
                    <tr key={share.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{share.originalFilename}</span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-900">{share.ownerName || share.ownerEmail}</div>
                        <div className="text-[11px] text-slate-500">{share.ownerEmail}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-900">{share.recipientName || share.recipientEmail}</div>
                        <div className="text-[11px] text-slate-500">{share.recipientEmail}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            share.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              share.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {share.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">
                        {share.createdAt ? new Date(share.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {share.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeShare(share.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors text-xs font-semibold"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  File Cryptographic Metadata
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectFile.originalFilename}</p>
              </div>
              <button
                onClick={() => setInspectFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Plaintext Size</span>
                <span className="text-slate-900 font-bold mt-1 block">
                  {formatBytes(inspectFile.originalSize || 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Encrypted Storage Size</span>
                <span className="text-blue-700 font-bold mt-1 block">
                  {formatBytes(inspectFile.encryptedSize || 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Owner Identity</span>
                <span className="text-slate-900 font-bold mt-1 block truncate">
                  {inspectFile.ownerEmail}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">MIME Content Type</span>
                <span className="text-slate-900 font-bold mt-1 block">
                  {inspectFile.mimeType || 'application/octet-stream'}
                </span>
              </div>
            </div>

            {/* Cryptographic Proof Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  SHA-256 Plaintext Checksum
                </span>
                <button
                  onClick={() => handleCopyHash(inspectFile.sha256Checksum)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedHash ? 'Copied' : 'Copy SHA-256'}
                </button>
              </div>
              <p className="text-[11px] text-slate-700 font-mono break-all bg-white p-2.5 rounded-lg border border-slate-200 select-all shadow-2xs">
                {inspectFile.sha256Checksum || 'Unavailable'}
              </p>
              <div className="text-[10px] text-slate-500 pt-1">
                Crypto Suite: AES-256-GCM + Blowfish Layering &bull; ECDH P-256 Envelope &bull; Version: {inspectFile.cryptoProfileVersion || 'v1'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectFile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              Confirm Storage File Purge
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently purge file <strong className="text-slate-900">{fileToDelete.originalFilename}</strong> owned by <span className="font-semibold text-slate-800">{fileToDelete.ownerEmail}</span>?
            </p>
            <p className="text-[11px] text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
              This action securely shreds the encrypted payload on disk and invalidates all active sharing envelopes in the database.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteFile}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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
