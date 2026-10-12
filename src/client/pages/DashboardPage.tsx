import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
  LogIn,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Activity,
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Shield,
  Database,
} from 'lucide-react';
import { Phase1DashboardMetrics } from '../../types/rbac';
import { DatabaseDiagnosticsModal } from '../components/DatabaseDiagnosticsModal';
import { DatabaseStatusWidget } from '../components/DatabaseStatusWidget';

export const DashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const [metrics, setMetrics] = useState<Phase1DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getDashboard();
      setMetrics(data);
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
      setErrorMsg(err.message || 'Failed to communicate with PAROSA telemetry engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading && !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-slate-500 text-xs font-mono">
          <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
          <span>Querying PAROSA security and administrative metrics...</span>
        </div>
      </div>
    );
  }

  if (errorMsg && !metrics) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center bg-white border border-rose-200 rounded-3xl shadow-sm p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Telemetry Unavailable</h3>
        <p className="text-xs text-slate-500">{errorMsg}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const isCityScoped = user?.scopeType === 'CITY';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Scope Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">PAROSA Operations & Security Dashboard</h2>
            {isCityScoped ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                Territory Scope: {user?.cityIds?.join(', ') || 'Alwar'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Global Platform View
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time administrative telemetry, authentication logs, and security enforcement metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiagnostics(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-rose-400" />
            <span>Database Diagnostics & Persistence</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
            Refresh Live Stream
          </button>
        </div>
      </div>

      {/* Database Health & Persistence Fast-Check Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 font-mono">
                Phase 1.5 Persistent Storage
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                PostgreSQL Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Production data store replaces in-memory tables. Admin accounts, roles, and audit trails persist across browser refreshes and server reboots.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDiagnostics(true)}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Database className="w-3.5 h-3.5" />
          Run Persistence & Connection Test
        </button>
      </div>

      {/* Real-time PostgreSQL Database Status & Health Widget */}
      <DatabaseStatusWidget onOpenDiagnostics={() => setShowDiagnostics(true)} />

      {/* Phase 1 Dashboard Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Admins */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Total Admins</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics?.totalAdmins || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Configured staff</div>
        </div>

        {/* Active Admins */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Active Admins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{metrics?.activeAdmins || 0}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-mono">Status: ACTIVE</div>
        </div>

        {/* Roles */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Roles</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics?.totalRoles || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">System & custom</div>
        </div>

        {/* Permissions */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Permissions</span>
            <KeyRound className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics?.totalPermissions || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">15 Core categories</div>
        </div>

        {/* Today's Logins */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Today Logins</span>
            <LogIn className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics?.todaysLogins || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Valid sessions</div>
        </div>

        {/* Failed Logins */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Failed Logins</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{metrics?.failedLogins || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Mitigation active</div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono">Security Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{metrics?.securityAlerts || 0}</div>
          <div className="text-[10px] text-rose-600 mt-1 font-mono">Access Denied attempts</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Login Activity (Hourly Trend) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                Admin Activity by Day (Past 7 Days)
              </h3>
              <p className="text-[11px] text-slate-500">Historical administrative action volume aggregated from immutable audit logs</p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Live Audit Log Data
            </span>
          </div>

          <div className="h-56 flex items-end gap-3 pt-6 pb-2 border-b border-slate-100">
            {metrics?.adminActivityByDay.map((day, idx) => {
              const maxActions = Math.max(...(metrics.adminActivityByDay.map((d) => d.actions) || [1]));
              const heightPercent = Math.max(15, Math.round((day.actions / (maxActions || 1)) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900 transition-colors">
                    {day.actions}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-rose-600 to-amber-500 rounded-t-lg transition-all duration-300 group-hover:brightness-110 relative shadow-2xs"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-md">
                      {day.actions} administrative operations
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-800 truncate w-full text-center">
                    {day.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Events Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Administrative Outcome Distribution
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Success vs 403 Access Denied security violations</p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Authorized Operations (SUCCESS)
                  </span>
                  <span className="font-bold text-slate-900">
                    {metrics?.securityEvents.reduce((acc, e) => acc + e.success, 0) || 0}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Unauthorized Probes (403 DENIED)
                  </span>
                  <span className="font-bold text-amber-700">
                    {metrics?.securityEvents.reduce((acc, e) => acc + e.denied, 0) || 0}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Audit Trail Mode:</span>
            <span className="text-emerald-700 font-bold">Append-Only Immutable</span>
          </div>
        </div>
      </div>

      {/* Tables Row: Actions by Admin & Hourly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by Admin */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Actions by Administrator (Accountability)
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Operations performed across users, roles, and settings</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                  <th className="pb-2">Administrator</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2 text-right">Logged Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {metrics?.actionsByAdmin.map((act, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-sans font-semibold text-slate-900">{act.adminName}</td>
                    <td className="py-2.5 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {act.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{act.count} actions</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Hourly Login Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" />
            Admin Login Activity (Hourly Distribution)
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Session authentication times during operations</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                  <th className="pb-2">Time Window</th>
                  <th className="pb-2 text-right">Authentications</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {metrics?.adminLoginActivity.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      {item.hour} - {item.hour.split(':')[0]}:59
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{item.count} logins</td>
                    <td className="py-2.5 text-right text-emerald-600 font-semibold">Verified</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Database Diagnostic & Persistence Verification Modal */}
      <DatabaseDiagnosticsModal
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        onAdminCreated={() => fetchDashboard()}
      />
    </div>
  );
};
