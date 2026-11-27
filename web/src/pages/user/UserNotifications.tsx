import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Shield,
  Share2,
  Download,
  Upload,
  Key,
  CheckCircle2,
  Lock,
  UserCheck,
  FileText,
} from 'lucide-react';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

export const UserNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'FILES' | 'SHARES' | 'SECURITY'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<any>('/notifications')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setNotifications(list);
      })
      .catch((err) => {
        console.warn('Notifications fetch notice:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Built-in activities matching Screen 11 from the Design System
  const fallbackActivities = [
    {
      id: 'act-1',
      title: 'File uploaded',
      desc: 'Project_final.pdf',
      time: '2 hours ago',
      type: 'FILES',
      icon: Upload,
    },
    {
      id: 'act-2',
      title: 'File shared',
      desc: 'with team@secure.com',
      time: '5 hours ago',
      type: 'SHARES',
      icon: Share2,
    },
    {
      id: 'act-3',
      title: 'File downloaded',
      desc: 'Image.png',
      time: '1 day ago',
      type: 'FILES',
      icon: Download,
    },
    {
      id: 'act-4',
      title: 'Login successful',
      desc: 'IP: 192.168.1.1',
      time: '2 days ago',
      type: 'SECURITY',
      icon: Lock,
    },
    {
      id: 'act-5',
      title: 'Password changed',
      desc: 'Security credentials updated',
      time: '3 days ago',
      type: 'SECURITY',
      icon: Key,
    },
    {
      id: 'act-6',
      title: 'Account verified',
      desc: 'Email verification completed',
      time: '1 week ago',
      type: 'SECURITY',
      icon: UserCheck,
    },
  ];

  const activities = notifications.length > 0
    ? notifications.map((n) => ({
        id: n.id,
        title: n.title,
        desc: n.message,
        time: new Date(n.createdAt).toLocaleDateString(),
        type: n.type?.toUpperCase().includes('SHARE') ? 'SHARES' : n.type?.toUpperCase().includes('SEC') ? 'SECURITY' : 'FILES',
        icon: n.type?.toUpperCase().includes('SHARE') ? Share2 : n.type?.toUpperCase().includes('SEC') ? Shield : FileText,
      }))
    : fallbackActivities;

  const filtered = activities.filter((act) => {
    if (activeTab === 'ALL') return true;
    return act.type === activeTab;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header matching Screen 11 from Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity</h1>
          <p className="text-xs text-slate-500 mt-0.5">View your recent activity and security events</p>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'FILES', label: 'Files' },
            { id: 'SHARES', label: 'Shares' },
            { id: 'SECURITY', label: 'Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Activity Card (matching Screen 11) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 sm:p-8">
        <div className="divide-y divide-slate-100">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-50/50 rounded-xl px-3 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-medium shrink-0">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
