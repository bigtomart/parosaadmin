import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  HardDrive,
  Users,
  Shield,
  Activity,
  ArrowRight,
  UserPlus,
  RotateCw,
  ExternalLink,
  Lock,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DiagnosticData {
  status: 'CONNECTED' | 'DISCONNECTED';
  engine: 'POSTGRES_REMOTE' | 'POSTGRES_EMBEDDED';
  engineLabel: string;
  uptimeSeconds?: number;
  uptimeFormatted?: string;
  latencyMs: number;
  persistenceVerified: boolean;
  storagePath: string;
  counts: {
    adminUsers: number;
    roles: number;
    permissions: number;
    cities: number;
    auditLogs: number;
    activeSessions: number;
  };
  recentAdmins: { id: string; name: string; email: string; roleId: string; createdAt: string }[];
  checkedAt: string;
}

export const DatabaseDiagnosticsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdminCreated?: () => void;
}> = ({ isOpen, onClose, onAdminCreated }) => {
  const { user: currentAdmin, hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick verification test admin creation form
  const [testName, setTestName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('9876543210');
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState<{
    id: string;
    email: string;
    name: string;
    timestamp: string;
  } | null>(null);

  const canCreateAdmins = hasPermission('users.create');

  const handleRestoreDatabase = async () => {
    setIsRestoring(true);
    try {
      const res = await api.restoreDatabase();
      showSuccess(res.message || 'Database standard configuration restored successfully.');
      await runCheck();
      onAdminCreated?.();
    } catch (err: any) {
      showError(err.message || 'Failed to restore database');
    } finally {
      setIsRestoring(false);
    }
  };

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDatabaseDiagnostics();
      setDiagnostic(data);
    } catch (err: any) {
      setError(err.message || 'Failed to ping persistent database engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runCheck();
      // Auto-populate random test admin details
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setTestName(`Persistence Tester ${randomSuffix}`);
      setTestEmail(`test.persist_${randomSuffix}@parosa.com`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateVerificationAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testName) return;

    setIsCreating(true);
    try {
      const newAdmin = await api.createAdminUser({
        name: testName,
        email: testEmail.toLowerCase().trim(),
        phone: testPhone,
        roleId: 'OPERATIONS_MANAGER',
        scopeType: 'GLOBAL',
      });

      setVerificationSuccess({
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        timestamp: new Date().toLocaleTimeString(),
      });

      showSuccess(
        'Admin Persisted to Database',
        `Account for ${newAdmin.name} (${newAdmin.email}) stored in PostgreSQL.`
      );

      // Refresh diagnostics state immediately
      await runCheck();
      if (onAdminCreated) {
        onAdminCreated();
      }
    } catch (err: any) {
      showError('Persistence Test Failed', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSimulateRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Database Diagnostic & Persistence Verification</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Phase 1.5 Live
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Inspect real-time PostgreSQL connection health, query latency, and verify cross-refresh persistence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-slate-50 border-slate-200">
            <div className="flex items-center gap-3">
              {loading ? (
                <RefreshCw className="w-6 h-6 text-rose-600 animate-spin" />
              ) : diagnostic?.status === 'CONNECTED' ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {loading ? 'Pinging PostgreSQL engine...' : diagnostic?.status === 'CONNECTED' ? 'Database Connected & Active' : 'Database Offline'}
                  </span>
                  {diagnostic && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {diagnostic.latencyMs} ms
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {diagnostic?.engineLabel || 'Querying database configuration...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRestoreDatabase}
                disabled={loading || isRestoring}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Restore system roles, permissions, and standard accounts"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin text-emerald-400' : 'text-slate-300'}`} />
                <span>{isRestoring ? 'Restoring...' : 'Restore Seed State'}</span>
              </button>

              <button
                onClick={runCheck}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
                Test Connection
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Database Metrics Grid */}
          {diagnostic && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-mono font-semibold uppercase text-slate-400">Database Engine</div>
                <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5 truncate">
                  <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{diagnostic.engine}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{diagnostic.storagePath}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-mono font-semibold uppercase text-slate-400">Persistent Records</div>
                <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{diagnostic.counts.adminUsers} Admin Users</span>
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5 font-mono">100% Relational DB</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-mono font-semibold uppercase text-slate-400">Configured Roles</div>
                <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{diagnostic.counts.roles} Roles / {diagnostic.counts.permissions} Perms</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">FK Constraints Enforced</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-mono font-semibold uppercase text-slate-400">Audit Logs (Immutable)</div>
                <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{diagnostic.counts.auditLogs} Log Entries</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Append-only table</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-mono font-semibold uppercase text-slate-400">Operational Cities</div>
                <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>{diagnostic.counts.cities} Seeded Cities</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Rajasthan Region</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-mono font-semibold uppercase text-slate-400">Session & Revocation</div>
                <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>{diagnostic.counts.activeSessions} Active Sessions</span>
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5 font-mono">Persistent Auth Tokens</div>
              </div>
            </div>
          )}

          {/* Cross-Refresh Persistence Verification Tool */}
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Live Persistence Test: Create Admin & Verify Across Browser Refresh
                  </h4>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Create a new administrator into PostgreSQL. Then click <strong>Refresh Browser</strong> or press F5 — the newly created admin remains permanently in the database table and reloads immediately.
                </p>
              </div>
            </div>

            {verificationSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Step 1 Complete: Administrator written to PostgreSQL!</span>
                </div>
                <div className="font-mono text-[11px] text-emerald-900 bg-emerald-100/60 p-2 rounded-lg">
                  User ID: <span className="font-bold">{verificationSuccess.id}</span> | Name: <span className="font-bold">{verificationSuccess.name}</span> | Email: <span className="font-bold">{verificationSuccess.email}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-emerald-700 text-[11px]">
                    Step 2: Reload the page to confirm persistent data survives browser refresh:
                  </span>
                  <button
                    onClick={handleSimulateRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Refresh Browser Now
                  </button>
                </div>
              </div>
            )}

            {canCreateAdmins ? (
              <form onSubmit={handleCreateVerificationAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    required
                    placeholder="e.g. Test Admin"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:border-rose-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    required
                    placeholder="test@parosa.com"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Write to PostgreSQL
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Your currently logged in role ({currentAdmin?.roleId}) does not have the <code className="font-mono font-bold">users.create</code> permission. Switch to Super Admin to create test records.
              </div>
            )}
          </div>

          {/* Recent Admins in Database */}
          {diagnostic && diagnostic.recentAdmins.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  Most Recently Created Admins in Database:
                </span>
                <span className="text-[10px] font-mono text-slate-500">Live PostgreSQL Table</span>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                {diagnostic.recentAdmins.map((adm) => (
                  <div key={adm.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {adm.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{adm.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{adm.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {adm.roleId}
                      </span>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {new Date(adm.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            Last checked: {diagnostic ? new Date(diagnostic.checkedAt).toLocaleTimeString() : 'Pending'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateRefresh}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Refresh Browser
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
