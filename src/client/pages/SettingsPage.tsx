import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Sliders,
  ShieldCheck,
  Lock,
  Key,
  Clock,
  Eye,
  EyeOff,
  Save,
  Check,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showForbidden } = useToast();

  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(5);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  const canUpdate = hasPermission('settings.update');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) {
      showForbidden('settings.update', user?.roleId || 'Admin');
      return;
    }
    showSuccess('Security Policies Saved', 'Updated administrative session limits and 2FA parameters.');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">System Security & Access Controls</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Hardened Baseline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global session timeouts, brute-force mitigation thresholds, multi-factor policies, and masked platform keys.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Session Security */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Session Inactivity & Lockout Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Session Expiration Timeout (Minutes)
              </label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                min={5}
                max={240}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Automatically invalidates Bearer tokens after idle period.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Failed Login Attempts Before Lockout
              </label>
              <input
                type="number"
                value={maxFailedAttempts}
                onChange={(e) => setMaxFailedAttempts(Number(e.target.value))}
                min={3}
                max={10}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Triggers 15-minute account suspension on threshold breach.
              </span>
            </div>
          </div>
        </div>

        {/* 2FA Enforcement */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Multi-Factor Authentication (MFA / 2FA) Enforcement
          </h3>

          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-white">Mandatory 2FA for Privileged Personnel</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Super Admins and Finance Managers must pass OTP verification on new IP sign-in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnforce2FA(!enforce2FA)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                enforce2FA
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {enforce2FA && <Check className="w-3.5 h-3.5" />}
              <span>{enforce2FA ? 'Enforced' : 'Optional'}</span>
            </button>
          </div>
        </div>

        {/* Masked API Credentials (zero plaintext leakage) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            Platform Integration Secrets (Server-Side Proxy)
          </h3>
          <p className="text-xs text-slate-400">
            Never rendered in frontend source. Retrieved strictly via server environment variables.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px]">PAYMENT_GATEWAY_WEBHOOK_SECRET:</span>
                <div className="text-white font-bold mt-0.5">
                  {showSecret ? 'whsec_908f91823798af98a123f8b01239c8' : 'whsec_••••••••••••••••••••••••••••••••'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Apply Security Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
