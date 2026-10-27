import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldAlert, Eye, RefreshCw, X, Shield, Clock, HardDrive, Share2, UserCheck, Key } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { AuditLogItem, PageResponse } from '../../types';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    api
      .get<PageResponse<AuditLogItem> | AuditLogItem[]>('/admin/audit-logs?size=60')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setLogs(list);
      })
      .catch((err) => {
        console.error('Failed to load admin audit logs:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      (l.resourceType && l.resourceType.toLowerCase().includes(q)) ||
      (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Audit Logs Oversight Card */}
      <div className="sec-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Audit Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographic Integrity Tracking &bull; Immutable Security Events in PostgreSQL
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 rounded-xl bg-black/40 border border-emerald-950/50 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto min-h-[220px]">
          {loading && logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Querying immutable security audit logs...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-emerald-950/40 rounded-xl">
              {query ? `No events match search '${query}'` : 'No audit log events recorded yet'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Details / Resource</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/30">
                {filtered.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{' '}
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-300 font-medium">
                        {log.userEmail || 'System'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        <span className="font-mono text-xs bg-slate-800/80 px-2 py-0.5 rounded text-slate-200 border border-slate-700/50">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs max-w-xs truncate">
                        {log.details || `${log.resourceType}: ${log.resourceId || 'N/A'}`}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuccess ? (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Success
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Inspect Event"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inspect Audit Event Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sec-card p-6 max-w-lg w-full space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/40 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Security Audit Event Details
              </h3>
              <button onClick={() => setSelectedLog(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/40 rounded-xl border border-emerald-950/40">
                  <span className="text-slate-400 block text-[10px]">Action Type</span>
                  <span className="text-emerald-300 font-semibold">{selectedLog.action}</span>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-emerald-950/40">
                  <span className="text-slate-400 block text-[10px]">Execution Status</span>
                  <span className={selectedLog.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-emerald-950/40 space-y-1">
                <span className="text-slate-400 block text-[10px]">User &amp; Origin</span>
                <p className="text-white">{selectedLog.userEmail || 'System / Anonymous'}</p>
                <p className="text-[11px] text-slate-400">IP Address: {selectedLog.ipAddress || 'Internal'}</p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-emerald-950/40 space-y-1">
                <span className="text-slate-400 block text-[10px]">Event Description</span>
                <p className="text-slate-200">{selectedLog.details || 'No additional message recorded.'}</p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-emerald-950/40 space-y-1">
                <span className="text-slate-400 block text-[10px]">Timestamp &amp; Unique ID</span>
                <p className="text-slate-300">{selectedLog.createdAt}</p>
                <p className="text-[10px] text-slate-500">ID: {selectedLog.id}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
