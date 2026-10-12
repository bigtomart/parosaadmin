import React, { useState } from 'react';
import { X, BookOpen, Layers, Database, Shield, Lock, FileCode, Network, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'>('A');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">PAROSA Architecture & RBAC Blueprint (Phase 1)</h2>
              <p className="text-xs text-slate-500">Enterprise Food-Delivery Control Plane Specification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 overflow-x-auto shrink-0 bg-slate-50 text-xs font-semibold">
          {[
            { id: 'A', label: '1. Architecture Diagram', icon: Layers },
            { id: 'B', label: '2. Folder Structure', icon: FileCode },
            { id: 'C', label: '3. Database Schema', icon: Database },
            { id: 'D', label: '4. RBAC Permission Matrix', icon: Shield },
            { id: 'E', label: '5. Authentication Flow', icon: Lock },
            { id: 'F', label: '6. API Structure', icon: Network },
            { id: 'G', label: '7. Security Flow', icon: Lock },
            { id: 'H', label: '8. Admin Route Map', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isSel
                    ? 'border-rose-600 text-rose-600 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-700 text-xs leading-relaxed space-y-6">
          {activeTab === 'A' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600" />
                1. SYSTEM ARCHITECTURE & COMPONENT TOPOLOGY
              </h3>
              <p>
                The PAROSA Admin Panel operates as an isolated web application built with a separate frontend and secure backend API.
                The architecture is designed so that future consumer apps (PAROSA Customer App, PAROSA Restaurant Partner App, and PAROSA Delivery Fleet App)
                will connect to the same centralized backend without ever coupling frontends directly to database tables.
              </p>

              <div className="bg-slate-950 p-5 rounded-2xl font-mono text-[11px] text-slate-300 leading-normal space-y-1 overflow-x-auto shadow-inner">
                <div className="text-rose-400 font-bold mb-2">// PAROSA Multi-Application Gateway Topology</div>
                <div>PAROSA Customer App (iOS/Android) ──┐</div>
                <div>PAROSA Restaurant Partner Portal   ──┼──▶ [Cloudflare Edge / WAF] ──▶ [Express Backend Gateway]</div>
                <div>PAROSA Delivery Fleet Rider App   ──┤                                        │</div>
                <div>PAROSA Admin Panel (Phase 1 RBAC)  ──┘                                        ▼</div>
                <div>                                                    [Auth & RBAC Middleware Layer]</div>
                <div>                                                    (Bearer Token + Scope + Permission)</div>
                <div>                                                             │</div>
                <div>                                                             ▼</div>
                <div>                                                 [Domain Services & Controllers]</div>
                <div>                                                 (Users, Roles, Security, Auditing)</div>
                <div>                                                    │                       │</div>
                <div>                                                    ▼                       ▼</div>
                <div>                                         [PostgreSQL Database]    [Append-Only Audit Log]</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold text-xs mb-1">Dual-Layer Protection</h4>
                  <p className="text-slate-500">
                    Menus and buttons dynamically hide if unauthorized, but every request is strictly verified on the backend API.
                    If bypassed, the API returns <code className="text-rose-600 font-bold">403 Forbidden</code> and logs the breach to the audit log.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold text-xs mb-1">Territory Scope Quarantine</h4>
                  <p className="text-slate-500">
                    Supports <code className="text-blue-700 font-bold">GLOBAL</code>, <code className="text-amber-700 font-bold">CITY</code>,
                    <code className="text-purple-700 font-bold">RESTAURANT</code>, and <code className="text-emerald-700 font-bold">SELF</code>.
                    A City Manager (e.g. Alwar) cannot read or manipulate records belonging to Jaipur or Delhi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'B' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-rose-600" />
                2. FOLDER STRUCTURE
              </h3>
              <pre className="bg-slate-950 p-4 rounded-2xl font-mono text-[11px] text-slate-300 overflow-x-auto">
{`/
├── /src
│   ├── /types
│   │   ├── rbac.ts               # Core RBAC contracts, AdminUser, Role, AuditLogEntry, SecurityPolicy
│   │   └── permissions.ts        # Central catalog of 35+ permissions & 10 default system roles
│   ├── /server
│   │   ├── db.ts                 # Relational foundation store with scope engine & audit logs
│   │   ├── auth.ts               # Bearer token generator, lockout counter, session revocation
│   │   ├── rbacMiddleware.ts     # Express authenticate & requirePermission('resource.action')
│   │   └── apiRouter.ts          # REST API router (/auth, /dashboard, /admin-users, /roles, etc.)
│   ├── /client
│   │   ├── /components
│   │   │   ├── Header.tsx        # Top header with profile, notifications, spec modal button
│   │   │   ├── Sidebar.tsx       # Navigation drawer with Phase 1 & disabled Phase 2 modules
│   │   │   ├── RoleSwitcherBar.tsx# Instant persona switcher for live multi-role evaluation
│   │   │   ├── AccessDenied.tsx  # 403 Forbidden screen with audit notice
│   │   │   └── ArchitectureDocsModal.tsx # Interactive in-app specification modal
│   │   ├── /pages
│   │   │   ├── LoginPage.tsx     # Admin authentication portal with forgot password modal
│   │   │   ├── DashboardPage.tsx # Administrative KPI cards, login trends, security alerts
│   │   │   ├── RolesPermissionsPage.tsx # Dynamic role creator, 15-category matrix checklist
│   │   │   ├── AdminUsersPage.tsx# Admin staff directory with privilege escalation barriers
│   │   │   ├── AuditLogsPage.tsx # Append-only audit trail with old_value/new_value diffs
│   │   │   ├── ProfilePage.tsx   # Admin profile, credential updates, session revocation
│   │   │   └── SecuritySettingsPage.tsx # 2FA rules, session timeout, lockout thresholds
│   │   ├── /context
│   │   │   ├── AuthContext.tsx   # User state, token management, hasPermission helper
│   │   │   └── ToastContext.tsx  # Alerts, successes, and 403 Forbidden notifications
│   │   └── /services
│   │       └── api.ts            # Centralized API service with Bearer token injection
│   ├── App.tsx                   # Main routing hub with Phase 1 navigation
│   └── main.tsx                  # React entrypoint
├── server.ts                     # Full-stack production Express server
└── vite.config.ts                # Vite config mounting Connect/Express API middleware`}
              </pre>
            </div>
          )}

          {activeTab === 'C' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-600" />
                3. DATABASE SCHEMA (RELATIONAL POSTGRESQL SPEC)
              </h3>
              <p>Relational entities with foreign keys, index optimization, and scope partitioning:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-rose-600 font-bold mb-1">TABLE: admin_users</div>
                  <div>id: UUID (PK)</div>
                  <div>name: VARCHAR(100) NOT NULL</div>
                  <div>email: VARCHAR(255) UNIQUE NOT NULL</div>
                  <div>phone: VARCHAR(30)</div>
                  <div>password_hash: VARCHAR(255) NOT NULL</div>
                  <div>role_id: VARCHAR(64) REFERENCES roles(id)</div>
                  <div>scope_type: VARCHAR(20) DEFAULT 'GLOBAL'</div>
                  <div>city_ids: VARCHAR(32)[]</div>
                  <div>restaurant_ids: UUID[]</div>
                  <div>status: VARCHAR(20) [ACTIVE, SUSPENDED]</div>
                  <div>failed_login_attempts: INT DEFAULT 0</div>
                  <div>lockout_until: TIMESTAMPTZ</div>
                  <div>created_at, updated_at: TIMESTAMPTZ</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-rose-600 font-bold mb-1">TABLE: roles</div>
                  <div>id: VARCHAR(64) (PK)</div>
                  <div>name: VARCHAR(100) NOT NULL</div>
                  <div>description: TEXT</div>
                  <div>is_system: BOOLEAN DEFAULT FALSE</div>
                  <div>is_active: BOOLEAN DEFAULT TRUE</div>
                  <div>permissions: TEXT[] NOT NULL</div>
                  <div>scope_type: VARCHAR(20) DEFAULT 'GLOBAL'</div>
                  <div>allowed_cities: VARCHAR(32)[]</div>
                  <div>created_at, updated_at: TIMESTAMPTZ</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-rose-600 font-bold mb-1">TABLE: audit_logs (Append-Only)</div>
                  <div>id: UUID (PK)</div>
                  <div>admin_id: UUID REFERENCES admin_users(id)</div>
                  <div>action: VARCHAR(100) NOT NULL</div>
                  <div>target_type: VARCHAR(64) NOT NULL</div>
                  <div>target_id: VARCHAR(128)</div>
                  <div>old_value: JSONB</div>
                  <div>new_value: JSONB</div>
                  <div>ip_address: INET NOT NULL</div>
                  <div>user_agent: TEXT</div>
                  <div>status: VARCHAR(20) [SUCCESS, DENIED, FAILED]</div>
                  <div>timestamp: TIMESTAMPTZ NOT NULL</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-rose-600 font-bold mb-1">TABLE: admin_sessions</div>
                  <div>id: UUID (PK)</div>
                  <div>admin_id: UUID REFERENCES admin_users(id)</div>
                  <div>token: VARCHAR(255) UNIQUE NOT NULL</div>
                  <div>ip_address: INET NOT NULL</div>
                  <div>user_agent: TEXT</div>
                  <div>expires_at: TIMESTAMPTZ NOT NULL</div>
                  <div>created_at: TIMESTAMPTZ NOT NULL</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'D' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                4. RBAC PERMISSION MATRIX
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-mono">
                      <th className="p-2.5 border-r border-slate-200">Default Role</th>
                      <th className="p-2.5 border-r border-slate-200">Default Scope</th>
                      <th className="p-2.5 border-r border-slate-200">Authorized Capabilities</th>
                      <th className="p-2.5">Prohibited Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-2.5 text-rose-700 font-bold">SUPER_ADMIN</td>
                      <td className="p-2.5 text-blue-700">GLOBAL</td>
                      <td className="p-2.5 text-slate-800">All System Grants (*.*)</td>
                      <td className="p-2.5 text-slate-400">None</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-blue-700 font-bold">ADMIN</td>
                      <td className="p-2.5 text-blue-700">GLOBAL</td>
                      <td className="p-2.5 text-slate-800">Operational staff, restaurants, support, reports</td>
                      <td className="p-2.5 text-rose-600">Cannot edit Super Admin or delete system roles</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-emerald-700 font-bold">ORDER_MANAGER</td>
                      <td className="p-2.5 text-blue-700">GLOBAL</td>
                      <td className="p-2.5 text-slate-800">orders.*, refunds.view, orders.assign_delivery</td>
                      <td className="p-2.5 text-rose-600">Cannot approve refunds or edit admin users</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-orange-700 font-bold">RESTAURANT_MANAGER</td>
                      <td className="p-2.5 text-blue-700">GLOBAL</td>
                      <td className="p-2.5 text-slate-800">restaurants.*, menu.*</td>
                      <td className="p-2.5 text-rose-600">Cannot inspect payments or manage staff</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-amber-800 font-bold">CITY_MANAGER</td>
                      <td className="p-2.5 text-amber-700 font-bold">CITY (e.g. Alwar)</td>
                      <td className="p-2.5 text-slate-800">Local orders, restaurants & delivery in city</td>
                      <td className="p-2.5 text-rose-600">Cannot access or modify other cities</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-purple-700 font-bold">FINANCE_MANAGER</td>
                      <td className="p-2.5 text-blue-700">GLOBAL</td>
                      <td className="p-2.5 text-slate-800">payments.view, refunds.approve, settlements.view</td>
                      <td className="p-2.5 text-rose-600">Cannot modify food catalogs or dispatch riders</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-600 font-bold">REPORT_VIEWER</td>
                      <td className="p-2.5 text-blue-700">GLOBAL</td>
                      <td className="p-2.5 text-slate-800">dashboard.view, reports.view</td>
                      <td className="p-2.5 text-rose-600">Zero mutation permissions (Read-only)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'E' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                5. AUTHENTICATION & SESSION LIFECYCLE
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                <li><strong className="text-slate-900">Credentials Submission:</strong> Admin posts email and password to <code className="text-rose-600">/api/admin/auth/login</code>.</li>
                <li><strong className="text-slate-900">Lockout Gate:</strong> Checks if account has &gt;= 5 consecutive failed attempts. If so, locks for 15 minutes.</li>
                <li><strong className="text-slate-900">2FA Challenge:</strong> If privileged role has 2FA enabled and OTP is absent, server returns <code className="text-amber-700 font-bold">requires2FA: true</code>.</li>
                <li><strong className="text-slate-900">Bearer Token Issuance:</strong> Cryptographically generated token issued and registered in active sessions.</li>
                <li><strong className="text-slate-900">Request Interceptor:</strong> Each request carries <code className="text-rose-600">Authorization: Bearer &lt;token&gt;</code>. Status and permissions validated per call.</li>
                <li><strong className="text-slate-900">Multi-Device Revocation:</strong> Admin can revoke all active sessions in one click.</li>
              </ol>
            </div>
          )}

          {activeTab === 'F' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Network className="w-4 h-4 text-rose-600" />
                6. REST API STRUCTURE
              </h3>
              <pre className="bg-slate-950 p-4 rounded-2xl font-mono text-[11px] text-slate-300 overflow-x-auto">
{`POST   /api/admin/auth/login             -> Sign in admin credentials
POST   /api/admin/auth/logout            -> Invalidate session
POST   /api/admin/auth/logout-all        -> Terminate all device sessions
POST   /api/admin/auth/forgot-password   -> Generate secure reset instructions
GET    /api/admin/auth/me                -> Inspect caller identity and active grants
GET    /api/admin/dashboard              -> requirePermission('dashboard.view')
GET    /api/admin/admin-users            -> requirePermission('users.view')
POST   /api/admin/admin-users            -> requirePermission('users.create') [Anti-escalation]
GET    /api/admin/admin-users/:id        -> requirePermission('users.view')
PATCH  /api/admin/admin-users/:id        -> requirePermission('users.update')
POST   /api/admin/admin-users/:id/activate    -> requirePermission('users.suspend')
POST   /api/admin/admin-users/:id/deactivate  -> requirePermission('users.suspend')
POST   /api/admin/admin-users/:id/force-logout -> requirePermission('users.update')
GET    /api/admin/roles                  -> requirePermission('roles.view')
POST   /api/admin/roles                  -> requirePermission('roles.create')
PATCH  /api/admin/roles/:id              -> requirePermission('roles.update')
DELETE /api/admin/roles/:id              -> requirePermission('roles.delete')
GET    /api/admin/permissions            -> Retrieve all 35+ permissions catalog
GET    /api/admin/audit-logs             -> requirePermission('audit_logs.view') [Append-only]
GET    /api/admin/profile                -> Caller profile details
PATCH  /api/admin/profile                -> Update name, mobile, avatar
POST   /api/admin/profile/change-password-> Update password securely
GET    /api/admin/security               -> requirePermission('settings.view')
PATCH  /api/admin/security               -> requirePermission('settings.update')`}
              </pre>
            </div>
          )}

          {activeTab === 'G' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                7. SECURITY FLOW & ANTI-PRIVILEGE ESCALATION
              </h3>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li><strong className="text-slate-900">Anti-Privilege Escalation:</strong> Regular Admins cannot assign themselves or others the Super Admin role. Non-Super Admins are blocked from editing or suspending a Super Admin account.</li>
                <li><strong className="text-slate-900">Immutable Audit Logs:</strong> Audit logs are append-only. Standard administrators cannot delete or purge records. Every state modification records old_value and new_value diffs.</li>
                <li><strong className="text-slate-900">Backend Authority:</strong> Frontend conditional rendering is solely for clean UI. Any direct API call without permission is halted with HTTP 403 Forbidden.</li>
                <li><strong className="text-slate-900">Zero Secret Leakage:</strong> Database passwords and signing secrets are server-side only.</li>
              </ul>
            </div>
          )}

          {activeTab === 'H' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600" />
                8. ADMIN ROUTE MAP (PHASE 1 IMPLEMENTED)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-rose-600 font-bold mb-1">CORE DASHBOARD</div>
                  <div>/admin/dashboard</div>
                  <div>• Total / Active Admins</div>
                  <div>• Hourly Login Activity</div>
                  <div>• Security Events Breakdown</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-blue-600 font-bold mb-1">ADMINISTRATION</div>
                  <div>/admin/admin-users</div>
                  <div>/admin/roles</div>
                  <div>/admin/audit-logs</div>
                  <div>• Staff Scopes (City)</div>
                  <div>• 15-Category Matrix</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-emerald-600 font-bold mb-1">GOVERNANCE & ACCOUNT</div>
                  <div>/admin/profile</div>
                  <div>/admin/security</div>
                  <div>/admin/login</div>
                  <div>• 2FA / Session Inactivity</div>
                  <div>• Revoke All Devices</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 border-t border-slate-200 px-6 flex items-center justify-between shrink-0 bg-slate-50">
          <span className="text-[11px] text-slate-500 font-mono">PAROSA Food Delivery Operations Architecture v1.0</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
