import React, { useState, useEffect, useRef } from 'react';
import { 
  Share2, Link as LinkIcon, Trash2, Copy, Check, Clock, AlertTriangle, 
  FileText, Ban, ExternalLink, MoreVertical, Eye, ShieldCheck, X, CheckCircle2 
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { FileShare, SharedLink } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const MyShares: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'LINKS'>('DIRECT');
  const [userShares, setUserShares] = useState<FileShare[]>([]);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [revokeShareId, setRevokeShareId] = useState<string | null>(null);
  const [revokeLinkId, setRevokeLinkId] = useState<string | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [inspectShare, setInspectShare] = useState<any | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getDismissedShareIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_share_ids') || '[]');
    } catch {
      return [];
    }
  };

  const fetchData = () => {
    setLoading(true);

    Promise.all([
      api.get<any>('/shares/outgoing'),
      api.get<any>('/shares/link/my-links'),
    ])
      .then(([sharesRes, linksRes]) => {
        const uShares = Array.isArray(sharesRes.data) ? sharesRes.data : sharesRes.data?.content || [];
        const sLinks = Array.isArray(linksRes.data) ? linksRes.data : linksRes.data?.content || [];
        const dismissed = getDismissedShareIds();
        setUserShares(uShares.filter((s: any) => !dismissed.includes(s.id)));
        setSharedLinks(sLinks);
      })
      .catch((err) => {
        console.warn('Backend shares error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  const handleRevokeShare = async () => {
    if (!revokeShareId) return;
    try {
      await api.delete(`/shares/${revokeShareId}`);
      setUserShares((prev) => prev.filter((s) => s.id !== revokeShareId));
      setRevokeShareId(null);
    } catch (err) {
      setUserShares((prev) =>
        prev.map((s) => (s.id === revokeShareId ? { ...s, status: 'REVOKED' } : s))
      );
      setRevokeShareId(null);
    }
  };

  const handleRevokeLink = async () => {
    if (!revokeLinkId) return;
    try {
      await api.delete(`/shares/link/${revokeLinkId}`);
      setSharedLinks((prev) => prev.filter((l) => l.id !== revokeLinkId));
      setRevokeLinkId(null);
    } catch (err) {
      setRevokeLinkId(null);
    }
  };

  const handleDismissShare = async (shareId: string) => {
    setUserShares((prev) => prev.filter((s) => s.id !== shareId));
    const dismissed = getDismissedShareIds();
    if (!dismissed.includes(shareId)) {
      dismissed.push(shareId);
      localStorage.setItem('dismissed_share_ids', JSON.stringify(dismissed));
    }
    setActiveMenuId(null);
    try {
      await api.delete(`/shares/${shareId}`);
    } catch (e) {
      // already removed locally
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Files Shared By Me</h1>
          <p className="text-xs text-slate-500 mt-0.5">Access delegation &bull; Real-time key revocation &bull; Ephemeral links</p>
        </div>

        {/* Tab Pills */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('DIRECT')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'DIRECT'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Direct Shares ({userShares.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('LINKS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'LINKS'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Shared Links ({sharedLinks.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading shares...</div>
        ) : activeTab === 'DIRECT' ? (
          userShares.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No active direct shares</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Files you share directly with other users will be listed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Shared With</th>
                    <th className="py-3 px-6">Expires On</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userShares.map((share) => {
                    const filename = share.originalFilename || `Shared_File_${share.fileId.substring(0, 8)}.enc`;
                    const recipient = share.recipientName || share.recipientEmail || 'Recipient';
                    const isRevoked = share.status === 'REVOKED';

                    return (
                      <tr key={share.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>{filename}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-medium text-slate-600">{recipient}</td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {share.revokedAt ? `Revoked on ${new Date(share.revokedAt).toLocaleDateString()}` : 'No expiry'}
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isRevoked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isRevoked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {isRevoked ? 'Revoked' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right relative">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isRevoked && (
                              <button
                                onClick={() => setRevokeShareId(share.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Revoke Share"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === share.id ? null : share.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Dropdown Menu */}
                          {activeMenuId === share.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-6 top-10 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 text-xs font-medium text-slate-700"
                            >
                              <button
                                onClick={() => {
                                  setInspectShare(share);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={() => handleDismissShare(share.id)}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Dismiss Share</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          sharedLinks.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <LinkIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No active shared links</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Generate secure one-time or time-limited download links from My Files.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">File</th>
                    <th className="py-3 px-6">Link Token</th>
                    <th className="py-3 px-6">Expires On</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sharedLinks.map((link) => {
                    const isRevoked = (link as any).revoked || link.isExpired || (link.expiryDate && new Date(link.expiryDate) < new Date());
                    const token = link.token || '';
                    return (
                      <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          {link.originalFilename || `File_${link.fileId.substring(0, 8)}`}
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => token && handleCopyLink(token)}
                            className="font-mono text-[11px] text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                            <span>{token ? `${token.substring(0, 16)}...` : 'Link available'}</span>
                            {copiedToken === token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {link.expiryDate ? new Date(link.expiryDate).toLocaleDateString() : 'No expiry'}
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isRevoked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isRevoked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {isRevoked ? 'Expired / Revoked' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          {!isRevoked && (
                            <button
                              onClick={() => setRevokeLinkId(link.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Revoke Link"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <ConfirmModal
        isOpen={!!revokeShareId}
        onCancel={() => setRevokeShareId(null)}
        onConfirm={handleRevokeShare}
        title="Revoke File Share"
        message="Are you sure you want to revoke this file share? The recipient will immediately lose decryption access."
      />

      <ConfirmModal
        isOpen={!!revokeLinkId}
        onCancel={() => setRevokeLinkId(null)}
        onConfirm={handleRevokeLink}
        title="Revoke Shared Link"
        message="Are you sure you want to revoke this shared link? Anyone visiting the link will receive a 404 or expired notice."
      />
    </div>
  );
};
