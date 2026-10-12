import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  X,
  RefreshCw,
  Terminal,
  Shield,
} from 'lucide-react';
import { AuditLogEntry } from '../../types/rbac';

export const AuditLogsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { showForbidden, showError } = useToast();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [adminFilter, setAdminFilter] = useState('');

  // Detail Modal / Diff Viewer
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (targetFilter !== 'ALL') filters.target = targetFilter;
      if (adminFilter) filters.admin = adminFilter;
      if (searchTerm) filters.search = searchTerm;

      const data = await api.getAuditLogs(filters);
      setLogs(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        showForbidden(err.requiredPermission || 'audit_logs.view', user?.roleId || 'Admin');
      } else {
        showError('Audit Stream Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, targetFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const targets = ['ALL', 'ADMIN_USER', 'ROLE', 'SECURITY_POLICY', 'SESSION', 'PERMISSION_GATE'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">PAROSA Append-Only Audit Trail</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Immutable Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail recording all administrative mutations, old/new states, IP telemetry, and access probes. Normal admins cannot delete records.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shrink-0 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : 'text-slate-400'}`} />
          Refresh Audit Stream
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, target ID, IP, or admin..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* Target Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-mono">Target:</span>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs focus:outline-none focus:border-rose-500"
            >
              {targets.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-mono">Outcome:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">ALL OUTCOMES</option>
              <option value="SUCCESS">SUCCESS ONLY</option>
              <option value="DENIED">DENIED (BLOCKED)</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-200">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Administrator</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Type & ID</th>
                <th className="p-4">IP Address & Network</th>
                <th className="p-4">Outcome</th>
                <th className="p-4 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => {
                const isDenied = log.status === 'DENIED';

                return (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isDenied ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                    </td>

                    {/* Admin */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-sans font-bold text-slate-900">{log.admin_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {log.admin_role} ({log.admin_email})
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded border font-bold ${
                          isDenied
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Target Type & ID */}
                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-slate-800">{log.target_type}</div>
                      <div className="text-[10px] text-slate-400 truncate">ID: {log.target_id}</div>
                    </td>

                    {/* IP Address */}
                    <td className="p-4 whitespace-nowrap text-slate-600">
                      <div>{log.ip_address}</div>
                      <div className="text-[10px] text-cyan-700">{log.city || 'GLOBAL'}</div>
                    </td>

                    {/* Outcome */}
                    <td className="p-4 whitespace-nowrap">
                      {isDenied ? (
                        <span className="flex items-center gap-1 text-amber-700 font-bold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          ACCESS DENIED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SUCCESS
                        </span>
                      )}
                    </td>

                    {/* Details / Diff */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="View Full State Mutation Snapshot"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Diff & Audit Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Audit Record: {selectedLog.id}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-400 text-[10px]">Actor:</div>
                  <div className="text-slate-900 font-bold">{selectedLog.admin_name}</div>
                  <div className="text-[10px] text-slate-500">{selectedLog.admin_role}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Action:</div>
                  <div className="text-rose-600 font-bold">{selectedLog.action}</div>
                  <div className="text-[10px] text-slate-500">{selectedLog.target_type}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Network:</div>
                  <div className="text-slate-900">{selectedLog.ip_address}</div>
                  <div className="text-[10px] text-cyan-700">{selectedLog.city || 'GLOBAL'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Status:</div>
                  <div className={selectedLog.status === 'DENIED' ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {selectedLog.status}
                  </div>
                </div>
              </div>

              {/* Before State (old_value) vs After State (new_value) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-600 font-bold mb-1 flex items-center justify-between">
                    <span>old_value (State Before):</span>
                    <span className="text-[10px] text-slate-400">Previous</span>
                  </div>
                  <pre className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-[11px] overflow-x-auto max-h-56">
                    {selectedLog.old_value ? JSON.stringify(selectedLog.old_value, null, 2) : '// None (New Entity Created)'}
                  </pre>
                </div>

                <div>
                  <div className="text-emerald-700 font-bold mb-1 flex items-center justify-between">
                    <span>new_value (State After):</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Committed</span>
                  </div>
                  <pre className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] overflow-x-auto max-h-56">
                    {selectedLog.new_value ? JSON.stringify(selectedLog.new_value, null, 2) : '// No Change / Action Blocked'}
                  </pre>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 font-sans">
                  <div className="font-bold text-xs mb-0.5">Authorization Error:</div>
                  <div>{selectedLog.error_message}</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer text-xs"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
