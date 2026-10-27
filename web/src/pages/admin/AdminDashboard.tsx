import React, { useState, useEffect } from 'react';
import { Users, HardDrive, UserCheck, Activity, Share2, AlertCircle, Download, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../../api/client';
import { AdminStats, AuditLogItem, AdminUser, PageResponse } from '../../types';
import { formatBytes, formatRelativeTime } from '../../utils/formatters';

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  icon: any;
  color: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<{ date: string; users: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);

    Promise.allSettled([
      api.get<AdminStats>('/admin/dashboard'),
      api.get<PageResponse<AuditLogItem>>('/admin/audit-logs?size=6'),
      api.get<PageResponse<AdminUser>>('/admin/users?size=100'),
    ])
      .then(([statsRes, logsRes, usersRes]) => {
        // 1. Process System Stats
        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          setStats(statsRes.value.data);
        }

        // 2. Process Real Audit Activity
        if (logsRes.status === 'fulfilled') {
          const rawLogs: AuditLogItem[] = Array.isArray(logsRes.value.data)
            ? logsRes.value.data
            : logsRes.value.data?.content || [];

          const mapped: ActivityItem[] = rawLogs.map((log) => {
            const act = log.action || '';
            let icon = Activity;
            let color = 'text-slate-400 bg-slate-500/10 border-slate-500/30';
            let title = log.details || act.replace(/_/g, ' ');

            if (act.includes('LOGIN_SUCCESS')) {
              icon = UserCheck;
              color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
              title = 'User Login';
            } else if (act.includes('LOGIN_FAIL') || act.includes('BLOCKED')) {
              icon = AlertCircle;
              color = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
              title = 'Authentication Failed';
            } else if (act.includes('FILE_UPLOAD')) {
              icon = HardDrive;
              color = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
              title = 'File Encrypted & Uploaded';
            } else if (act.includes('FILE_DOWNLOAD')) {
              icon = Download;
              color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
              title = 'File Decrypted & Downloaded';
            } else if (act.includes('SHARE_CREATE')) {
              icon = Share2;
              color = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
              title = 'Key Envelope Shared';
            } else if (act.includes('SHARE_REVOKE')) {
              icon = AlertCircle;
              color = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
              title = 'Share Revoked';
            } else if (act.includes('REGISTER') || act.includes('USER_CREATE')) {
              icon = Users;
              color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
              title = 'New User Registered';
            } else if (act.includes('STATUS')) {
              icon = ShieldCheck;
              color = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
              title = 'Account Status Changed';
            }

            return {
              id: log.id,
              title,
              subtitle: `${log.userEmail ? log.userEmail.split('@')[0] : 'System'} • ${log.details || log.action}`,
              timeAgo: formatRelativeTime(log.createdAt),
              icon,
              color,
            };
          });

          setRecentActivity(mapped);
        }

        // 3. Process Real User Registration Trend (30 Days)
        if (usersRes.status === 'fulfilled') {
          const rawUsers: AdminUser[] = Array.isArray(usersRes.value.data)
            ? usersRes.value.data
            : usersRes.value.data?.content || [];

          // Sort users chronologically by createdAt
          const sorted = [...rawUsers].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          // Generate dynamic curve over the 30-day window
          const today = new Date();
          const points: { date: string; users: number }[] = [];
          const daysToDisplay = 7; // Display 7 sampled intervals over past month

          for (let i = daysToDisplay; i >= 0; i--) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i * 4);
            const dateLabel = targetDate.toLocaleDateString('en-GB', { month: 'short', day: '2-digit' });

            // Count users registered on or before targetDate
            const count = sorted.filter((u) => new Date(u.createdAt) <= targetDate).length;
            points.push({ date: dateLabel, users: count });
          }

          // Ensure final point matches current total count
          if (points.length > 0) {
            points[points.length - 1].users = sorted.length;
          }

          setRegistrationTrend(points);
        }
      })
      .catch((err) => {
        console.error('Failed to load admin dashboard telemetry:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Real Database Metrics
  const totalUsersDisplay = stats?.totalUsers ?? 0;
  const activeUsersDisplay = stats?.activeUsers ?? 0;
  const totalFilesDisplay = stats?.totalFiles ?? 0;
  const storageUsedDisplay = formatBytes(stats?.totalEncryptedStorageBytes || 0);
  const activeRate =
    totalUsersDisplay > 0 ? Math.round((activeUsersDisplay / totalUsersDisplay) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards Bound to Real Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="sec-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {loading ? <span className="text-slate-600 animate-pulse">...</span> : totalUsersDisplay}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            {stats?.pendingUsers ? `${stats.pendingUsers} pending verification` : 'Verified cryptographic identities'}
          </div>
        </div>

        {/* Active Users */}
        <div className="sec-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Active Users</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {loading ? <span className="text-slate-600 animate-pulse">...</span> : activeUsersDisplay}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            {activeRate}% active rate
          </div>
        </div>

        {/* Total Files */}
        <div className="sec-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Files</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {loading ? <span className="text-slate-600 animate-pulse">...</span> : totalFilesDisplay}
          </div>
          <div className="text-[11px] text-cyan-400 font-mono mt-1">
            5-Layer Hybrid Encrypted
          </div>
        </div>

        {/* Storage Used */}
        <div className="sec-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Storage Used</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {loading ? <span className="text-slate-600 animate-pulse">...</span> : storageUsedDisplay}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Capacity: 1.0 TB allocated
          </div>
        </div>
      </div>

      {/* Main Grid: Real User Registrations Trend + Real Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real User Registrations Chart */}
        <div className="sec-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                User Registrations (Last 30 Days)
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                New identity registrations verified via Email OTP &amp; ECC Keys
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono font-bold">
              +{totalUsersDisplay} Total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userRegGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#10b98115" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#060b14',
                    borderColor: '#10b98140',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: any) => [`${value} registered users`, 'Cumulative Users']}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#userRegGrad)"
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5, fill: '#34d399' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Live Recent Activity */}
        <div className="sec-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-white tracking-wide">Recent Activity</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-400 font-mono">Live</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-emerald-950/40 rounded-xl">
                No security audit events recorded yet
              </div>
            ) : (
              recentActivity.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-emerald-950/30 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${act.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{act.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{act.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                      {act.timeAgo}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
