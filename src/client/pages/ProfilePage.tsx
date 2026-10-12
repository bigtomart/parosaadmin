import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, ApiError } from '../services/api';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  LogOut,
  Clock,
  MapPin,
  Check,
  Save,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, role, logoutAll, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({ name, phone, avatarUrl });
      await refreshProfile();
      showSuccess('Profile Saved', 'Your administrative contact details have been updated.');
    } catch (err: any) {
      showError('Failed to update profile', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      showError('Password Policy', 'Password must be at least 8 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      showSuccess('Password Updated', 'Your administrative credentials were changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showError('Password Change Failed', err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin Profile & Session Security</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Identity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personal administrative credentials, assigned privileges, territory boundary, and authentication audit history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200 shadow-xs"
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{user?.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {role?.name || 'Administrator'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500">
                <span>Account ID:</span>
                <span className="text-slate-900 font-bold">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Operational Scope:</span>
                <span className="text-blue-700 font-bold">{user?.scopeType || 'GLOBAL'}</span>
              </div>
              {user?.scopeType === 'CITY' && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Territory Boundary:</span>
                  <span className="text-amber-800 font-bold">{user.cityIds?.join(', ') || 'Alwar'}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-500">
                <span>Last Login:</span>
                <span className="text-slate-800">{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Active Session'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Last IP Address:</span>
                <span className="text-slate-800">{user?.lastLoginIp || '127.0.0.1'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={logoutAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Revoke All Other Device Sessions</span>
            </button>
          </div>
        </div>

        {/* Right Column: Edit Profile & Change Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-rose-600" />
              Edit Personal Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <strong>Privilege Escalation Notice:</strong> Administrator roles are governed by centralized policy. You cannot change your own operational role or granted permissions from this profile screen.
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Change Administrative Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Password (Min 8 characters)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Assigned Permissions Inspector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Active Granted Permissions for Role: {role?.name}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          All capabilities authorized for your account session (evaluated server-side)
        </p>

        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {role?.permissions.map((perm, idx) => (
            <span
              key={idx}
              className="text-xs font-mono font-medium px-2 py-1 rounded-lg bg-slate-50 text-slate-800 border border-slate-200"
            >
              {perm}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
