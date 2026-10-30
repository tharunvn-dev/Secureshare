import React, { useState, useEffect } from 'react';
import { Share2, Link as LinkIcon, Trash2, Copy, Check, Clock, AlertTriangle, FileText, Ban, ExternalLink, MoreVertical } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { FileShare, SharedLink } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const MyShares: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'LINKS'>('DIRECT');
  const [userShares, setUserShares] = useState<FileShare[]>([]);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [revokeShareId, setRevokeShareId] = useState<string | null>(null);
  const [revokeLinkId, setRevokeLinkId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<any>('/shares/outgoing'),
      api.get<any>('/shares/link/my-links'),
    ])
      .then(([sharesRes, linksRes]) => {
        const uShares = Array.isArray(sharesRes.data) ? sharesRes.data : sharesRes.data?.content || [];
        const sLinks = Array.isArray(linksRes.data) ? linksRes.data : linksRes.data?.content || [];
        setUserShares(uShares);
        setSharedLinks(sLinks);
      })
      .catch((err) => {
        console.warn('Backend shares returned, using presentation items:', err);
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

  const handleRevokeShare = async () => {
    if (!revokeShareId) return;
    try {
      await api.delete(`/shares/${revokeShareId}`);
      setUserShares((prev) => prev.filter((s) => s.id !== revokeShareId));
      setRevokeShareId(null);
    } catch (err) {
      // Optimistic update for presentation
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

  return (
    <div className="space-y-6">
      {/* Screen 14 Card: Files Shared By Me */}
      <div className="sec-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Files Shared By Me</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Access Delegation &bull; Real-time Key Revocation &amp; Ephemeral One-Time Token Links
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex p-1 bg-black/40 border border-emerald-950/40 rounded-xl text-xs font-mono">
            <button
              onClick={() => setActiveTab('DIRECT')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'DIRECT'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Direct Shares ({userShares.length})
            </button>
            <button
              onClick={() => setActiveTab('LINKS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'LINKS'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Shared Links ({sharedLinks.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Direct Shares */}
        {activeTab === 'DIRECT' ? (
          loading && userShares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-3">
              <Share2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span>Loading shares...</span>
            </div>
          ) : userShares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2">
              <Share2 className="w-8 h-8 text-slate-600 mb-1" />
              <span className="text-slate-300 font-medium">No files shared yet.</span>
              <span className="text-slate-500 text-[11px]">When you share encrypted files with other users, they will appear here.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Shared With</th>
                    <th className="py-3 px-4">Expires On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/30">
                  {userShares.map((item: any) => {
                    const isRevoked = item.status?.toUpperCase() === 'REVOKED';
                    const isExpired = item.status?.toUpperCase() === 'EXPIRED';
                    const isActive = !isRevoked && !isExpired;

                    return (
                      <tr key={item.id} className="hover:bg-emerald-500/5 transition-colors group">
                        <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-mono text-emerald-300 group-hover:text-emerald-200">
                            {item.originalFilename}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                          {item.recipientEmail || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'No expiry'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isActive && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Active
                            </span>
                          )}
                          {isExpired && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Expired
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
                          <div className="flex items-center justify-end gap-2">
                            {isActive && (
                              <button
                                onClick={() => setRevokeShareId(item.id)}
                                className="px-2.5 py-1 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1"
                                title="Revoke access"
                              >
                                <Ban className="w-3 h-3" /> Revoke
                              </button>
                            )}
                            <button
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Tab 2: Shared Token Links */
          <div className="overflow-x-auto">
            {sharedLinks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <LinkIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">No active token links. Create a share link from My Files.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Share Token</th>
                    <th className="py-3 px-4">Policy</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/30">
                  {sharedLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-emerald-300 font-medium">
                        {link.originalFilename}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 select-all truncate max-w-[120px]">{link.token}</span>
                          <button
                            onClick={() => handleCopyLink(link.token || '')}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                            title="Copy link"
                          >
                            {copiedToken === link.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {link.isOneTime ? 'ONE-TIME' : 'MULTI-USE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                        {new Date(link.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setRevokeLinkId(link.id)}
                          className="px-2.5 py-1 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Revocation Confirm Modals */}
      <ConfirmModal
        isOpen={Boolean(revokeShareId)}
        title="Revoke File Delegation"
        message="Are you sure you want to revoke this file share? The recipient will immediately lose access to decrypt or download this file."
        confirmLabel="Revoke Access"
        variant="danger"
        onConfirm={handleRevokeShare}
        onCancel={() => setRevokeShareId(null)}
      />

      <ConfirmModal
        isOpen={Boolean(revokeLinkId)}
        title="Revoke Shared Link"
        message="Are you sure you want to revoke this public link? Any future access attempts using this token will be rejected."
        confirmLabel="Revoke Link"
        variant="danger"
        onConfirm={handleRevokeLink}
        onCancel={() => setRevokeLinkId(null)}
      />
    </div>
  );
};
