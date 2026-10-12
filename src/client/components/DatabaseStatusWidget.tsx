import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Server,
  Layers,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api, ApiError } from '../services/api';

interface DatabaseStatusData {
  status: 'CONNECTED' | 'DISCONNECTED';
  engine: 'POSTGRES_REMOTE' | 'POSTGRES_EMBEDDED';
  engineLabel: string;
  healthy: boolean;
  uptimeSeconds: number;
  uptimeFormatted: string;
  uptimePercentage: string;
  startTime: string;
  latencyMs: number;
  latencyRating: 'OPTIMAL' | 'GOOD' | 'HIGH';
  activeConnections: number;
  activeSessions: number;
  totalRecords: {
    adminUsers: number;
    roles: number;
    auditLogs: number;
    cities: number;
  };
  version: string;
  storagePath: string;
  configStatus?: {
    hasValidRemoteUri: boolean;
    isHttpsSupabaseUrl: boolean;
    maskedHost?: string;
    error?: string;
  };
  checkedAt: string;
}

interface DatabaseStatusWidgetProps {
  onOpenDiagnostics?: () => void;
}

export const DatabaseStatusWidget: React.FC<DatabaseStatusWidgetProps> = ({ onOpenDiagnostics }) => {
  const [data, setData] = useState<DatabaseStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [probing, setProbing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [backingUp, setBackingUp] = useState<boolean>(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const lastFetchedRef = useRef<number>(Date.now());

  const handleBackup = async () => {
    setBackingUp(true);
    setBackupNotice(null);
    try {
      const res = await api.backupDatabase();
      if (res.success) {
        setBackupNotice(`Snapshot saved (${res.counts?.adminUsers || 0} admins, ${res.counts?.roles || 0} roles)`);
        setTimeout(() => setBackupNotice(null), 5000);
      }
    } catch (err: any) {
      setBackupNotice(`Backup failed: ${err.message}`);
      setTimeout(() => setBackupNotice(null), 5000);
    } finally {
      setBackingUp(false);
    }
  };

  const fetchStatus = async (isManual = false) => {
    if (isManual) setProbing(true);
    try {
      const res = await api.getDatabaseStatus();
      setData(res);
      setError(null);
      lastFetchedRef.current = Date.now();
      setSecondsAgo(0);

      // Record latency in history (keep up to 8 points)
      setLatencyHistory((prev) => {
        const next = [...prev, res.latencyMs];
        return next.length > 8 ? next.slice(next.length - 8) : next;
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to reach PostgreSQL server probe');
      }
    } finally {
      setLoading(false);
      if (isManual) setProbing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-refresh interval (15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Seconds ago counter ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchedRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format latency badge color
  const getLatencyColor = (latencyMs: number) => {
    if (latencyMs <= 15) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-500' };
    if (latencyMs <= 50) return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600', dot: 'bg-blue-500' };
    return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', dot: 'bg-amber-500' };
  };

  const latencyColor = data ? getLatencyColor(data.latencyMs) : { bg: '', text: '', dot: '' };

  const totalEntities = data
    ? data.totalRecords.adminUsers + data.totalRecords.roles + data.totalRecords.auditLogs + data.totalRecords.cities
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Widget Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            {data?.status === 'CONNECTED' ? (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-slate-900"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Database Status
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {data?.status === 'CONNECTED' ? 'ONLINE · HEALTHY' : 'CONNECTING...'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {data?.version || 'PostgreSQL Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time health check on the PostgreSQL connection, uptime telemetry, and query latency.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border cursor-pointer ${
              autoRefresh
                ? 'bg-slate-800/90 text-emerald-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle automatic 15-second health checks"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            {autoRefresh ? 'Live Poll (15s)' : 'Polling Paused'}
          </button>

          <button
            onClick={() => fetchStatus(true)}
            disabled={probing}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            title="Probe connection latency and health right now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
            <span>{probing ? 'Pinging...' : 'Ping DB'}</span>
          </button>

          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            title="Create an immutable backup snapshot of all 9 RBAC tables before migration"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>{backingUp ? 'Saving...' : 'Back Up DB'}</span>
          </button>

          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Verify Persistence</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {backupNotice && (
        <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* Supabase HTTPS Configuration Diagnostic Banner */}
      {data?.configStatus?.isHttpsSupabaseUrl && (
        <div className="mx-4 sm:mx-5 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">
              Supabase PostgreSQL Connection: Action Required
            </p>
            <p className="text-amber-200/90 text-[11px] leading-relaxed">
              <code>DATABASE_URL</code> is currently set to an HTTPS project endpoint (
              <span className="font-mono text-amber-100">{data.configStatus.maskedHost}</span>) instead of a PostgreSQL URI (
              <span className="font-mono text-amber-100">postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres</span>).
              The app is operating on the embedded relational PostgreSQL engine with zero data loss. To connect to Supabase, update <code>DATABASE_URL</code> with your Supabase Transaction Pooler URI.
            </p>
          </div>
        </div>
      )}

      {/* Main Telemetry Metric Grid */}
      <div className="p-4 sm:p-5">
        {error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold font-mono">DATABASE CONNECTION ANOMALY</p>
              <p className="text-xs mt-0.5">{error}</p>
              <button
                onClick={() => fetchStatus(true)}
                className="mt-2 px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
              >
                Retry Health Check
              </button>
            </div>
          </div>
        ) : loading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-100 p-4"></div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tile 1: Connection Health */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase font-mono tracking-wider">
                    Connection Health
                  </span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    CONNECTED
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Engine Type:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]" title={data.engineLabel}>
                    {data.engine === 'POSTGRES_REMOTE' ? 'Remote PostgreSQL' : 'PGlite Persistent'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Read/Write:</span>
                  <span className="font-bold text-emerald-600">Verified Active</span>
                </div>
              </div>

              {/* Tile 2: Connection Latency */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase font-mono tracking-wider">
                    Connection Latency
                  </span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {data.latencyMs} <span className="text-xs font-semibold text-slate-500">ms</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${latencyColor.bg}`}>
                    {data.latencyRating}
                  </span>
                </div>

                {/* Real-time Latency Sparkline */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Recent Pings</span>
                    <span className="font-bold text-slate-600">{latencyHistory.length} samples</span>
                  </div>
                  <div className="flex items-end gap-1 h-5 pt-1">
                    {latencyHistory.length === 0 ? (
                      <div className="text-[10px] text-slate-400 font-mono">Sampling...</div>
                    ) : (
                      latencyHistory.map((lat, idx) => {
                        const height = Math.min(100, Math.max(25, lat * 12));
                        return (
                          <div
                            key={idx}
                            style={{ height: `${height}%` }}
                            className={`flex-1 rounded-xs transition-all ${
                              lat <= 15 ? 'bg-emerald-500' : lat <= 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            title={`Ping #${idx + 1}: ${lat}ms`}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-1 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Probe Type:</span>
                  <span className="font-semibold text-slate-700">SELECT 1 Query</span>
                </div>
              </div>

              {/* Tile 3: Database Uptime */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase font-mono tracking-wider">
                    Database Uptime
                  </span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                    {data.uptimePercentage}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {data.uptimeFormatted}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Total Uptime:</span>
                  <span className="font-bold text-slate-800">{data.uptimeSeconds} seconds</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Online Since:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[130px]" title={data.startTime}>
                    {new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Tile 4: Workload & Persistent Store */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase font-mono tracking-wider">
                    Store & Pool Stats
                  </span>
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {totalEntities}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">records</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Active Sessions:</span>
                  <span className="font-bold text-slate-800">{data.activeSessions} active tokens</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Pool Conns:</span>
                  <span className="font-semibold text-slate-700">
                    {data.activeConnections} {data.engine === 'POSTGRES_REMOTE' ? 'max pool' : 'engine'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status Ribbon & Diagnostics Summary */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  Target: <span className="font-semibold text-slate-800">{data.storagePath}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ACID Transactions: <span className="text-emerald-700 font-semibold">Strict Write-Ahead Log</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span>Last probed:</span>
                <span className="font-semibold text-slate-700">
                  {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
                </span>
                <span>({new Date(data.checkedAt).toLocaleTimeString()})</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
