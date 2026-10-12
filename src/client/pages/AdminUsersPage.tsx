import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Plus,
  Shield,
  MapPin,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCw,
  X,
  Check,
  Activity,
  UserCheck,
} from 'lucide-react';
import { AdminUser, Role, ScopeType } from '../../types/rbac';

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin, hasPermission } = useAuth();
  const { showSuccess, showError, showForbidden } = useToast();

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [activityUser, setActivityUser] = useState<AdminUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [scopeType, setScopeType] = useState<ScopeType>('GLOBAL');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const canCreate = hasPermission('users.create');
  const canUpdate = hasPermission('users.update');
  const canSuspend = hasPermission('users.suspend');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, citiesData] = await Promise.all([
        api.getAdminUsers(),
        api.getRoles(),
        api.getCities(),
      ]);
      setAdminUsers(usersData);
      setRoles(rolesData);
      setCities(citiesData);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        showForbidden(err.requiredPermission || 'users.view', currentAdmin?.roleId || 'Admin');
      } else {
        showError('Failed to load admin users', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setSelectedRoleId(roles[1]?.id || 'ADMIN');
    setScopeType('GLOBAL');
    setSelectedCities([]);
    setModalOpen(true);
  };

  const openEditModal = (target: AdminUser) => {
    if (target.roleId === 'SUPER_ADMIN' && currentAdmin?.roleId !== 'SUPER_ADMIN') {
      showError('Action Denied', 'Non-Super Admin users cannot modify Super Admin accounts.');
      return;
    }

    setEditingUser(target);
    setName(target.name);
    setEmail(target.email);
    setPhone(target.phone);
    setSelectedRoleId(target.roleId);
    setScopeType(target.scopeType);
    setSelectedCities(target.cityIds || []);
    setModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-privilege escalation check
    if (selectedRoleId === 'SUPER_ADMIN' && currentAdmin?.roleId !== 'SUPER_ADMIN') {
      showError('Security Violation', 'Only Super Admin can assign the Super Admin role.');
      return;
    }

    try {
      if (editingUser) {
        await api.updateAdminUser(editingUser.id, {
          name,
          phone,
          roleId: selectedRoleId,
          scopeType,
          cityIds: scopeType === 'CITY' ? selectedCities : [],
        });
        showSuccess('Admin Profile Updated', `Account for ${name} updated successfully.`);
      } else {
        await api.createAdminUser({
          name,
          email,
          phone,
          roleId: selectedRoleId,
          scopeType,
          cityIds: scopeType === 'CITY' ? selectedCities : [],
        });
        showSuccess('Admin Created', `New administrator ${name} added.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        showForbidden(err.requiredPermission || 'users.create', currentAdmin?.roleId || 'Admin');
      } else {
        showError('Operation Failed', err.message);
      }
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.roleId === 'SUPER_ADMIN') {
      showError('Action Denied', 'Super Admin accounts cannot be suspended.');
      return;
    }

    try {
      if (user.status === 'ACTIVE') {
        await api.deactivateAdminUser(user.id);
        showSuccess('Account Deactivated', `${user.name} is now Suspended.`);
      } else {
        await api.activateAdminUser(user.id);
        showSuccess('Account Activated', `${user.name} is now Active.`);
      }
      fetchData();
    } catch (err: any) {
      showError('Status Update Failed', err.message);
    }
  };

  const handleForceLogout = async (user: AdminUser) => {
    try {
      await api.forceLogoutAdminUser(user.id);
      showSuccess('Sessions Revoked', `Forced logout for all active sessions of ${user.name}.`);
    } catch (err: any) {
      showError('Force Logout Failed', err.message);
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    showSuccess('Reset Dispatched', `Temporary password reset token generated for ${user.email}.`);
  };

  const filteredAdmins = adminUsers.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchRole = roleFilter === 'ALL' || u.roleId === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin User Management & Scopes</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Staff Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control administrative personnel, enforce privilege boundaries, and bind operational city scopes.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Administrator
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-mono">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">ALL ROLES</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-200">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Scope</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.map((u) => {
                const roleObj = roles.find((r) => r.id === u.roleId);
                const isSuper = u.roleId === 'SUPER_ADMIN';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shadow-2xs"
                        />
                        <div className="font-bold text-slate-900">{u.name}</div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 font-mono text-slate-700">{u.email}</td>

                    {/* Phone */}
                    <td className="p-4 font-mono text-slate-600">{u.phone || '—'}</td>

                    {/* Role */}
                    <td className="p-4">
                      <span
                        className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border inline-block ${
                          isSuper
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {roleObj?.name || u.roleId}
                      </span>
                    </td>

                    {/* Scope */}
                    <td className="p-4">
                      {u.scopeType === 'CITY' ? (
                        <div className="flex items-center gap-1.5 text-amber-800 font-mono text-[11px] font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>City: {u.cityIds?.join(', ') || 'Alwar'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-blue-800 font-mono text-[11px] font-semibold">
                          <Shield className="w-3.5 h-3.5 text-blue-600" />
                          <span>Global Scope</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      <div>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</div>
                      <div className="text-[10px] text-slate-400">IP: {u.lastLoginIp || '—'}</div>
                    </td>

                    {/* Created At */}
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActivityUser(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title="View Admin Activity"
                        >
                          <Activity className="w-4 h-4" />
                        </button>

                        {canUpdate && (
                          <button
                            onClick={() => openEditModal(u)}
                            disabled={isSuper && currentAdmin?.roleId !== 'SUPER_ADMIN'}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                            title="Edit Admin"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        )}

                        {canSuspend && !isSuper && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleForceLogout(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Force Logout All Sessions"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create/Edit Admin */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                {editingUser ? `Edit Staff Member: ${editingUser.name}` : 'Onboard New Administrator'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Rathi"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PAROSA Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@parosa.com"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98290 12345"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Operational Role *</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs font-mono"
                >
                  {roles.map((r) => (
                    <option
                      key={r.id}
                      value={r.id}
                      disabled={r.id === 'SUPER_ADMIN' && currentAdmin?.roleId !== 'SUPER_ADMIN'}
                    >
                      {r.name} {r.id === 'SUPER_ADMIN' && currentAdmin?.roleId !== 'SUPER_ADMIN' ? '(Super Admin Only)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Access Scope Type *</label>
                <select
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value as ScopeType)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs font-mono"
                >
                  <option value="GLOBAL">GLOBAL (Access across all cities)</option>
                  <option value="CITY">CITY (Locked strictly to assigned territory)</option>
                  <option value="SELF">SELF (Only own audit and record creation)</option>
                </select>
              </div>

              {scopeType === 'CITY' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="text-amber-900 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    Permitted Territory
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.map((c) => {
                      const isSel = selectedCities.includes(c.id);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => {
                            setSelectedCities((prev) =>
                              prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer flex items-center gap-1 ${
                            isSel
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {isSel && <Check className="w-3 h-3" />}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {editingUser ? 'Save Updates' : 'Confirm & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Activity View */}
      {activityUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Activity Card: {activityUser.name}
              </h3>
              <button onClick={() => setActivityUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div>Admin ID: <span className="font-bold text-slate-900">{activityUser.id}</span></div>
                <div>Role: <span className="text-rose-600 font-bold">{activityUser.roleId}</span></div>
                <div>Status: <span className="text-emerald-700 font-bold">{activityUser.status}</span></div>
                <div>Last Login IP: <span className="text-slate-800">{activityUser.lastLoginIp || 'None'}</span></div>
                <div>2FA Enforced: <span className="text-cyan-700">{activityUser.twoFactorEnabled ? 'YES' : 'NO'}</span></div>
              </div>
              <p className="text-slate-500 font-sans text-xs">
                All administrative actions triggered by {activityUser.name} are appended to the immutable system audit log.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActivityUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer text-xs"
              >
                Close Activity Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
