import React, { useState, useEffect } from 'react';
import { Users, HardDrive, Share2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { AdminStats, AdminUser, PageResponse } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<'USERS' | 'FILES' | 'AUDITS'>('USERS');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get<AdminStats>('/admin/dashboard'),
      api.get<PageResponse<AdminUser>>('/admin/users?size=10'),
    ]).then(([statsRes, usersRes]) => {
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (usersRes.status === 'fulfilled') {
        const rawUsers: AdminUser[] = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : usersRes.value.data?.content || [];
        setUsers(rawUsers);
      }
      setLoading(false);
    });
  }, []);

  const displayUsers = users.map((u) => ({
    id: u.id,
    displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
    email: u.email,
    role: u.roles?.[0]?.replace('ROLE_', '') || 'User',
    status: u.status === 'ACTIVE' ? 'Active' : u.status,
    joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
  }));

  return (
    <div className="space-y-6">
      {/* Header matching Screen 13 from Design System */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage users, files, and system settings</p>
      </div>

      {/* 4 Stat Cards matching Screen 13 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Users</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.totalUsers ?? users.length}</p>
        </div>

        {/* Total Files */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Files</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.totalFiles ?? 0}</p>
        </div>

        {/* Active Shares */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Active Shares</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.totalShares ?? 0}</p>
        </div>

        {/* System Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">System Status</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active &bull; Healthy
            </span>
          </div>
        </div>
      </div>

      {/* Tabs matching Screen 13 (Users, Files, Audits) */}
      <div className="flex items-center justify-between">
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'USERS', label: 'Users' },
            { id: 'FILES', label: 'Files' },
            { id: 'AUDITS', label: 'Audits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg transition-all ${
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

      {/* Recent Users Table (matching Screen 13) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Recent Users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No registered users found</p>
                    <p className="text-xs text-slate-400 mt-1">Users will appear here as they register.</p>
                  </td>
                </tr>
              ) : (
                displayUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{u.displayName}</td>
                    <td className="py-3.5 px-6 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-6 text-slate-500">{u.role}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-400">{u.joined}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
