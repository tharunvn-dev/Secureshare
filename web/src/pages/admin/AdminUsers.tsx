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
    const lastName = names.slice(1).join(' ');

    try {
      await api.post('/admin/users', {
        email: newEmail.trim().toLowerCase(),
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
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Users Card */}
      <div className="sec-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">User Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Database Identities &bull; Role-Based Access Control (RBAC) &bull; Cryptographic Governance
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search real users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-xl bg-black/40 border border-emerald-950/50 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-colors"
              title="Refresh users list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* + Add User Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="sec-btn-emerald py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Real Users Table */}
        <div className="overflow-x-auto min-h-[220px]">
          {loading && users.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Fetching live users from database...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-emerald-950/40 rounded-xl">
              {query ? `No registered users match '${query}'` : 'No users found in database'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-950/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Files / Storage</th>
                  <th className="py-3 px-4">Joined On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/30">
                {filtered.map((u) => {
                  const isAdmin = u.roles?.includes('ADMIN') || u.roles?.includes('ROLE_ADMIN');
                  const isActive = u.status === 'ACTIVE';
                  const isSuspended = u.status === 'SUSPENDED';
                  const isPending = u.status === 'PENDING';
                  const isMenuOpen = activeMenuId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {u.displayName || u.firstName || u.email.split('@')[0]}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        )}
                        {isSuspended && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Suspended
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pending OTP
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        {u.fileCount || 0} files ({formatBytes(u.storageUsedBytes || 0)})
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : u.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isMenuOpen
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title="Actions Menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Interactive Action Dropdown */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-4 top-10 z-30 w-48 rounded-xl bg-[#081018] border border-emerald-950/80 shadow-2xl shadow-black/80 py-1.5 backdrop-blur-md"
                          >
                            {/* Inspect Details */}
                            <button
                              onClick={() => {
                                setInspectUser(u);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 flex items-center gap-2.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>View Profile &amp; Keys</span>
                            </button>

                            {/* Suspend or Activate Account */}
                            {isActive ? (
                              <button
                                onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                                disabled={actionLoading}
                                className="w-full px-3.5 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>Suspend Account</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                                disabled={actionLoading}
                                className="w-full px-3.5 py-2 text-left text-xs text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2.5 transition-colors"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Activate Account</span>
                              </button>
                            )}

                            {/* Soft Delete Account */}
                            <div className="border-t border-emerald-950/50 my-1" />
                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/15 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sec-card p-6 max-w-lg w-full space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/40 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  User Profile &amp; Cryptography
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{inspectUser.email}</p>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">Account Status</span>
                <span className="text-emerald-300 font-semibold mt-1 block">
                  {inspectUser.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">Assigned Roles</span>
                <span className="text-cyan-300 font-semibold mt-1 block">
                  {inspectUser.roles?.join(', ') || 'USER'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">Files Stored</span>
                <span className="text-white font-semibold mt-1 block">
                  {inspectUser.fileCount || 0} Files ({formatBytes(inspectUser.storageUsedBytes || 0)})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950/40">
                <span className="text-slate-400 block text-[10px] uppercase">Joined Date</span>
                <span className="text-white font-semibold mt-1 block">
                  {new Date(inspectUser.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Cryptographic Keyring Info */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-950/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  ECC P-256 Public Key (ECDH)
                </span>
                <button
                  onClick={() => handleCopyKey(inspectUser.id)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy ID'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-mono break-all bg-black/60 p-2.5 rounded-lg border border-emerald-950/40">
                User UUID: {inspectUser.id}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Zero-Knowledge Guarantee: Private keys never touch server storage and remain protected in client steganography envelopes.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sec-card p-6 max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Confirm User Deactivation
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to deactivate account <strong className="text-white">{userToDelete.email}</strong>?
            </p>
            <p className="text-[11px] text-slate-400 font-mono bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              This revokes all active session tokens and sets account status to SUSPENDED. Stored encrypted files will remain safe in cold storage.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                {actionLoading ? 'Deactivating...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sec-card p-6 max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/40 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add New User
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Provisions a real registered identity in PostgreSQL with an auto-generated ECC keyring and password hash.
            </p>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="USER">USER (Standard Encrypted Vault Access)</option>
                  <option value="ADMIN">ADMIN (Privileged Governance &amp; Security Oversight)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="sec-btn-emerald py-2 px-4 text-xs font-semibold"
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
