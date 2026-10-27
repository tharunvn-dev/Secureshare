import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { NotificationItem, PageResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const { isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const fetchUnread = async () => {
    try {
      const res = await api.get<{ unreadCount: number }>('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount);
    } catch {
      // Ignore
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get<PageResponse<NotificationItem>>('/notifications?size=5');
      setNotifications(res.data.content);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchRecent();
    }
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readStatus: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const targetNotificationPage = isAdmin ? '/admin/notifications' : '/app/notifications';

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-200">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-mono">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <Link
              to={targetNotificationPage}
              onClick={() => setIsOpen(false)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors hover:bg-slate-800/40 ${
                    !n.readStatus ? 'bg-cyan-950/10 border-l-2 border-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-200">{n.title}</p>
                    {!n.readStatus && (
                      <button
                        onClick={(e) => markAsRead(n.id, e)}
                        className="text-slate-400 hover:text-cyan-400 p-1"
                        title="Mark read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
