import React, { useState, useEffect } from 'react';
import { Share2, AlertCircle, FileText, RefreshCw, X, Check, ShieldAlert } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { FileShare, PageResponse } from '../../types';
import { formatBytes } from '../../utils/formatters';

export const AdminShares: React.FC = () => {
  const [shares, setShares] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchShares = () => {
    setLoading(true);
    setErrorMsg(null);
    api
      .get<PageResponse<FileShare> | FileShare[]>('/admin/shares?size=50')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setShares(list);
      })
      .catch((err) => {
        console.error('Failed to load admin shares:', err);
        setErrorMsg(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleRevokeShare = async (shareId: string, filename: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.delete(`/admin/shares/${shareId}`);
      setSuccessMsg(`Access to '${filename}' revoked successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchShares();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

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

      <div className="sec-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Global Share Activity</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              System-Wide Delegations &bull; ECC Envelope Re-wrapping Tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchShares}
              disabled={loading}
              className="p-2 rounded-xl bg-black/40 border border-emerald-950/50 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-colors"
              title="Refresh Shares"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-mono">
              {shares.filter((s) => s.status === 'ACTIVE').length} Active Grants
            </span>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[220px]">
          {loading && shares.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Fetching live sharing grants...</span>
            </div>
          ) : shares.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-emerald-950/40 rounded-xl">
              No file sharing delegations recorded in database
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Owner (Granter)</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Granted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/30">
                {shares.map((share) => (
                  <tr key={share.id} className="hover:bg-emerald-500/5 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-emerald-300 font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{share.originalFilename}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{share.ownerName || share.ownerEmail}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{share.ownerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{share.recipientName || share.recipientEmail}</div>
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
                      {share.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleRevokeShare(share.id, share.originalFilename)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg hover:bg-rose-500/25 transition-colors font-mono text-[10px]"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">
                          Revoked {share.revokedAt ? new Date(share.revokedAt).toLocaleDateString() : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
