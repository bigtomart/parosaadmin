import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  X,
  Check,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, switchPersona } = useAuth();
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState('pawan.sharma@parosa.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password, otp, rememberMe);
      if (res.requires2FA) {
        setRequires2FA(true);
        showSuccess('2FA Verification Required', 'Enter the 6-digit verification code.');
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      showError('Authentication Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      showSuccess('Reset Link Dispatched', res.message);
      setForgotModalOpen(false);
      setForgotEmail('');
    } catch (err: any) {
      showError('Password Reset Failed', err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const quickRoles = [
    { id: 'admin_pawan_super', name: 'Pawan Sharma', role: 'Super Admin', email: 'pawan.sharma@parosa.com', badge: 'Global Root Access' },
    { id: 'admin_vikram_ops', name: 'Vikram Singh', role: 'Admin', email: 'vikram.singh@parosa.com', badge: 'Operations Manager' },
    { id: 'admin_rajesh_alwar', name: 'Rajesh Meena', role: 'City Manager', email: 'rajesh.alwar@parosa.com', badge: 'Scope: Alwar Only' },
    { id: 'admin_rahul_orders', name: 'Rahul Verma', role: 'Order Manager', email: 'rahul.verma@parosa.com', badge: 'Orders & Dispatch' },
    { id: 'admin_priya_rest', name: 'Priya Sharma', role: 'Restaurant Manager', email: 'priya.sharma@parosa.com', badge: 'Merchants & Menu' },
    { id: 'admin_aman_deliv', name: 'Aman Khan', role: 'Delivery Manager', email: 'aman.khan@parosa.com', badge: 'Rider Fleet' },
    { id: 'admin_neha_support', name: 'Neha Kapoor', role: 'Support Manager', email: 'neha.support@parosa.com', badge: 'Disputes & Tickets' },
    { id: 'admin_amit_finance', name: 'Amit Gupta', role: 'Finance Manager', email: 'amit.gupta@parosa.com', badge: 'Refunds & Settlements' },
    { id: 'admin_karan_marketing', name: 'Karan Malhotra', role: 'Marketing Manager', email: 'karan.marketing@parosa.com', badge: 'Coupons & Promos' },
    { id: 'admin_rohit_reports', name: 'Rohit Joshi', role: 'Report Viewer', email: 'rohit.joshi@parosa.com', badge: 'Read-Only (No Edits)' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative z-10">
        {/* PAROSA Brand Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-rose-500/20">
            P
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">PAROSA</h1>
            <p className="text-xs text-slate-500">Food Delivery Operations Control Plane</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Administrative Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@parosa.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 font-bold">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotModalOpen(true);
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Remember this browser session</span>
            </label>
          </div>

          {requires2FA && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <label className="block text-amber-900 font-bold">2FA Security Token (OTP) *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP (e.g. 123456)"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-amber-300 text-slate-900 font-mono focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to PAROSA Operations'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Sign-In Presets */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-mono font-bold text-slate-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            Quick Sign-In Presets (Instant RBAC Evaluation)
          </div>

          <div className="space-y-1.5">
            {quickRoles.map((qr) => (
              <button
                key={qr.id}
                type="button"
                onClick={() => {
                  switchPersona(qr.id);
                  if (onSuccess) onSuccess();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs group-hover:text-rose-600 transition-colors">
                    {qr.name} ({qr.role})
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{qr.email}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-semibold shadow-2xs">
                  {qr.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Administrative Password Reset</h3>
              <button onClick={() => setForgotModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Enter your verified PAROSA email address. If registered, a time-limited cryptographic reset token will be logged.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Corporate Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@parosa.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {forgotLoading ? 'Processing...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
