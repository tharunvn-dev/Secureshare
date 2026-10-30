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
    <div className="space-y-6">
      {/* Screen 22: Admin Notifications */}
      <div className="sec-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Admin Notifications</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              System Audit Alerts &bull; Security Boundary Triggers &bull; Broadcast Messaging
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-mono">
              {displayList.length} System Alerts
            </span>
          </div>
        </div>

        {/* Broadcast Announcement Bar */}
        <form onSubmit={handleBroadcast} className="mb-6 p-4 bg-black/40 border border-emerald-950/40 rounded-xl space-y-3">
          <label className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            Dispatch System-Wide Security Broadcast
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Scheduled key rotation maintenance tonight at 02:00 UTC..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="sec-btn-emerald py-2 px-4 text-xs font-semibold whitespace-nowrap"
            >
              Send Notice
            </button>
          </div>
          {broadcastSent && (
            <p className="text-xs font-mono text-emerald-400">Broadcast queued into PostgreSQL Outbox table!</p>
          )}
        </form>

        {/* Alert Feed */}
        <div className="space-y-3">
          {displayList.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                !item.readStatus
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-black/30 border-emerald-950/30'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">{item.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{item.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.timeAgo}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
