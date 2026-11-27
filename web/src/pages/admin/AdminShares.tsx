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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Share Activity</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System-Wide Delegations &bull; ECC Envelope Re-wrapping Tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchShares}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh Shares"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <span className="text-xs px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-semibold">
            {shares.filter((s) => s.status === 'ACTIVE').length} Active Grants
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Sharing Grants Directory</h2>
          <span className="text-xs text-slate-400 font-medium">{shares.length} recorded</span>
        </div>

        <div className="overflow-x-auto min-h-[220px]">
          {loading && shares.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Fetching live sharing grants...</span>
            </div>
          ) : shares.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No file sharing delegations recorded in database
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Filename</th>
                  <th className="py-3 px-6">Owner (Granter)</th>
                  <th className="py-3 px-6">Recipient</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Granted At</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shares.map((share) => (
                  <tr key={share.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
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
                          onClick={() => handleRevokeShare(share.id, share.originalFilename)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors text-xs font-semibold"
                        >
                          Revoke Access
                        </button>
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
