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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic Integrity Tracking &bull; Immutable Security Events in PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Audit Logs Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Immutable Security Log Stream</h2>
          <span className="text-xs text-slate-400 font-medium">{filtered.length} events logged</span>
        </div>

        <div className="overflow-x-auto min-h-[220px]">
          {loading && logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Querying immutable security audit logs...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              {query ? `No events match search '${query}'` : 'No audit log events recorded yet'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Time</th>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Event Action</th>
                  <th className="py-3 px-6">Details / Resource</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-6 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{' '}
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {log.userEmail || 'System'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 text-xs max-w-xs truncate">
                        {log.details || `${log.resourceType}: ${log.resourceId || 'N/A'}`}
                      </td>
                      <td className="py-3.5 px-6">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Security Audit Event Details
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Action Type</span>
                  <span className="text-slate-900 font-semibold font-mono">{selectedLog.action}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Execution Status</span>
                  <span className={selectedLog.status === 'SUCCESS' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">User &amp; Origin</span>
                <p className="text-slate-900 font-medium">{selectedLog.userEmail || 'System / Anonymous'}</p>
                <p className="text-[11px] text-slate-500">IP Address: {selectedLog.ipAddress || 'Internal'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Event Description</span>
                <p className="text-slate-700">{selectedLog.details || 'No additional message recorded.'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Timestamp &amp; Unique ID</span>
                <p className="text-slate-700 font-mono text-[11px]">{selectedLog.createdAt}</p>
                <p className="text-[10px] text-slate-400 font-mono">ID: {selectedLog.id}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
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
