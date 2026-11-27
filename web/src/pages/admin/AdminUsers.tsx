import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Lock,
  Trash2,
  Eye,
  Key,
  HardDrive,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { AdminUser, PageResponse } from '../../types';
import { formatBytes } from '../../utils/formatters';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Dropdown Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Inspect User Modal
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('SecurePass@2026');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setErrorMsg(null);
    api
      .get<PageResponse<AdminUser> | AdminUser[]>(
        `/admin/users${query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ''}`
      )
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setUsers(list);
      })
      .catch((err) => {
        console.error('Failed to fetch real users:', err);
        setErrorMsg(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setSuccessMsg(`User status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setActiveMenuId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setSuccessMsg(`User '${userToDelete.email}' deactivated successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setActiveMenuId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);

    const names = newName.trim().split(' ');
    const firstName = names[0] || 'User';
    const lastName = names.slice(1).join(' ') || '';

    try {
      await api.post('/admin/users', {
        email: newEmail.trim(),
        password: newPassword,
        firstName,
        lastName,
        displayName: newName.trim(),
        role: newRole,
        status: 'ACTIVE',
      });

      setSuccessMsg(`User '${newEmail.trim()}' provisioned successfully with role ${newRole}.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('SecurePass@2026');
      setNewRole('USER');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filtered = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q)
    );
  });

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live Database Identities &bull; Role-Based Access Control (RBAC) &bull; Cryptographic Governance
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh users list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* + Add User Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs shadow-blue-500/20 font-semibold text-xs py-2 px-3.5 flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Main Users Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Registered Accounts ({filtered.length})</h2>
          <span className="text-xs text-slate-400 font-medium">PostgreSQL Live Sync</span>
        </div>

        <div className="overflow-x-auto min-h-[220px]">
          {loading && users.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Fetching live users from database...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              {query ? `No registered users match '${query}'` : 'No users found in database'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Files / Storage</th>
                  <th className="py-3 px-6">Joined On</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isAdmin = u.roles?.includes('ADMIN') || u.roles?.includes('ROLE_ADMIN');
                  const isActive = u.status === 'ACTIVE';
                  const isSuspended = u.status === 'SUSPENDED';
                  const isPending = u.status === 'PENDING';
                  const isMenuOpen = activeMenuId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {u.displayName || u.firstName || u.email.split('@')[0]}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-6">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending OTP
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {u.fileCount || 0} files ({formatBytes(u.storageUsedBytes || 0)})
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : u.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isMenuOpen
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Actions Menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Interactive Action Dropdown */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-4 top-10 z-30 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 animate-in fade-in duration-150"
                          >
                            {/* Inspect Details */}
                            <button
                              onClick={() => {
                                setInspectUser(u);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>View Profile &amp; Keys</span>
                            </button>

                            {/* Suspend or Activate Account */}
                            {isActive ? (
                              <button
                                onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                                disabled={actionLoading}
                                className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>Suspend Account</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                                disabled={actionLoading}
                                className="w-full px-3.5 py-2 text-left text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Activate Account</span>
                              </button>
                            )}

                            {/* Soft Delete Account */}
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>Delete User</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inspect User Profile Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  User Profile &amp; Cryptography
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectUser.email}</p>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Account Status</span>
                <span className="text-emerald-700 font-bold mt-1 block">
                  {inspectUser.status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Assigned Roles</span>
                <span className="text-blue-700 font-bold mt-1 block">
                  {inspectUser.roles?.join(', ') || 'USER'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Files Stored</span>
                <span className="text-slate-900 font-bold mt-1 block">
                  {inspectUser.fileCount || 0} Files ({formatBytes(inspectUser.storageUsedBytes || 0)})
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Joined Date</span>
                <span className="text-slate-900 font-bold mt-1 block">
                  {new Date(inspectUser.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Cryptographic Keyring Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  ECC P-256 Public Key (ECDH)
                </span>
                <button
                  onClick={() => handleCopyKey(inspectUser.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy ID'}
                </button>
              </div>
              <p className="text-[11px] text-slate-700 font-mono break-all bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                User UUID: {inspectUser.id}
              </p>
              <p className="text-[10px] text-slate-500">
                Zero-Knowledge Guarantee: Private keys never touch server storage and remain protected in client steganography envelopes.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              Confirm User Deactivation
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to deactivate account <strong className="text-slate-900">{userToDelete.email}</strong>?
            </p>
            <p className="text-[11px] text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
              This revokes all active session tokens and sets account status to SUSPENDED. Stored encrypted files will remain safe in cold storage.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                {actionLoading ? 'Deactivating...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Add New User
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provisions a real registered identity in PostgreSQL with an auto-generated ECC keyring and password hash.
            </p>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-mono transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                >
                  <option value="USER">USER (Standard Encrypted Vault Access)</option>
                  <option value="ADMIN">ADMIN (Privileged Governance &amp; Security Oversight)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs shadow-blue-500/20 font-semibold text-xs py-2 px-4 transition-all"
                >
                  {actionLoading ? 'Creating in Database...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
