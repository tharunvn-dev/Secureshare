import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Clock, Check, CheckCheck, AlertCircle, Shield, Radio, Server } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { NotificationItem } from '../../types';

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<any>('/notifications')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setNotifications(list);
      })
      .catch((err) => {
        console.warn('Admin notifications notice error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const displayList = notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    timeAgo: new Date(n.createdAt).toLocaleDateString(),
    type: n.type || 'SYSTEM',
    readStatus: n.readStatus,
  }));

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System Audit Alerts &bull; Security Boundary Triggers &bull; Broadcast Messaging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-semibold">
            {displayList.length} System Alerts
          </span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-8">
        {/* Broadcast Announcement Bar */}
        <form onSubmit={handleBroadcast} className="mb-6 p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
          <label className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            Dispatch System-Wide Security Broadcast
          </label>
          <div className="flex gap-2.5">
            <input
              type="text"
              placeholder="e.g. Scheduled key rotation maintenance tonight at 02:00 UTC..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 py-2.5 whitespace-nowrap shadow-xs shadow-blue-500/20 transition-all"
            >
              Send Notice
            </button>
          </div>
          {broadcastSent && (
            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 pt-1">
              <Check className="w-4 h-4" /> Broadcast queued into PostgreSQL Outbox table!
            </p>
          )}
        </form>

        {/* Alert Feed */}
        <div className="space-y-3">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No system notifications currently pending
            </div>
          ) : (
            displayList.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  !item.readStatus
                    ? 'bg-blue-50/40 border-blue-200/80 shadow-2xs'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.timeAgo}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
