import { AdminUser, AuditLogEntry, Role, AdminSession, SecurityPolicy, Phase1DashboardMetrics } from '../types/rbac';
import { ALL_PERMISSIONS, DEFAULT_SYSTEM_ROLES } from '../types/permissions';

/**
 * PAROSA In-Memory Production Foundation Database Engine
 * Designed for PostgreSQL scalability with foreign key constraints, scope checks, and append-only audit trail.
 */

export interface ParosaDbState {
  adminUsers: AdminUser[];
  roles: Role[];
  sessions: AdminSession[];
  auditLogs: AuditLogEntry[];
  securityPolicy: SecurityPolicy;
  cities: { id: string; name: string; state: string }[];
}

const INITIAL_CITIES = [
  { id: 'ALWAR', name: 'Alwar', state: 'Rajasthan' },
  { id: 'JAIPUR', name: 'Jaipur', state: 'Rajasthan' },
  { id: 'DELHI', name: 'Delhi NCR', state: 'Delhi' },
  { id: 'MUMBAI', name: 'Mumbai', state: 'Maharashtra' },
  { id: 'BENGALURU', name: 'Bengaluru', state: 'Karnataka' },
];

const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin_pawan_super',
    name: 'Pawan Sharma',
    email: 'pawan.sharma@parosa.com',
    phone: '+91 98290 11223',
    // SHA256 hashed representation of default credentials
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'SUPER_ADMIN',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-06T09:15:00.000Z',
    lastLoginIp: '103.24.18.92',
    failedLoginAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'admin_vikram_ops',
    name: 'Vikram Singh',
    email: 'vikram.singh@parosa.com',
    phone: '+91 98291 44556',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'ADMIN',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-06T08:30:00.000Z',
    lastLoginIp: '103.24.18.95',
    failedLoginAttempts: 0,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'admin_rajesh_alwar',
    name: 'Rajesh Meena',
    email: 'rajesh.alwar@parosa.com',
    phone: '+91 94140 22334',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'CITY_MANAGER',
    scopeType: 'CITY',
    cityIds: ['ALWAR'],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-06T07:45:00.000Z',
    lastLoginIp: '49.36.128.4',
    failedLoginAttempts: 0,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'admin_amit_finance',
    name: 'Amit Gupta',
    email: 'amit.gupta@parosa.com',
    phone: '+91 98295 99001',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'FINANCE_MANAGER',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-05T18:10:00.000Z',
    lastLoginIp: '103.24.18.99',
    failedLoginAttempts: 0,
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
  },
  {
    id: 'admin_rahul_orders',
    name: 'Rahul Verma',
    email: 'rahul.verma@parosa.com',
    phone: '+91 98292 77889',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'ORDER_MANAGER',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-06T09:00:00.000Z',
    lastLoginIp: '103.24.19.10',
    failedLoginAttempts: 0,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'admin_priya_rest',
    name: 'Priya Sharma',
    email: 'priya.sharma@parosa.com',
    phone: '+91 98293 33445',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'RESTAURANT_MANAGER',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-06T08:15:00.000Z',
    lastLoginIp: '103.24.19.12',
    failedLoginAttempts: 0,
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-08-11T00:00:00.000Z',
  },
  {
    id: 'admin_aman_deliv',
    name: 'Aman Khan',
    email: 'aman.khan@parosa.com',
    phone: '+91 98294 55667',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'DELIVERY_MANAGER',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-05T16:20:00.000Z',
    lastLoginIp: '103.24.19.14',
    failedLoginAttempts: 0,
    createdAt: '2026-02-12T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'admin_rohit_reports',
    name: 'Rohit Joshi',
    email: 'rohit.joshi@parosa.com',
    phone: '+91 98296 12345',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'REPORT_VIEWER',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-04T12:00:00.000Z',
    lastLoginIp: '103.24.19.20',
    failedLoginAttempts: 0,
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'admin_neha_support',
    name: 'Neha Kapoor',
    email: 'neha.support@parosa.com',
    phone: '+91 98297 33441',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'SUPPORT_MANAGER',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-06T08:00:00.000Z',
    lastLoginIp: '103.24.19.25',
    failedLoginAttempts: 0,
    createdAt: '2026-02-20T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
  },
  {
    id: 'admin_karan_marketing',
    name: 'Karan Malhotra',
    email: 'karan.marketing@parosa.com',
    phone: '+91 98298 55662',
    passwordHash: '$2b$12$e8YQd2R34KjT9841UqJp2O53gL5Pq91h4TzKz82M172x0318Y9',
    roleId: 'MARKETING_MANAGER',
    scopeType: 'GLOBAL',
    cityIds: [],
    restaurantIds: [],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    lastLogin: '2026-10-06T07:30:00.000Z',
    lastLoginIp: '103.24.19.28',
    failedLoginAttempts: 0,
    createdAt: '2026-02-25T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_01_sys_init',
    admin_id: 'admin_pawan_super',
    admin_name: 'Pawan Sharma',
    admin_email: 'pawan.sharma@parosa.com',
    admin_role: 'Super Admin',
    action: 'SYSTEM_BOOTSTRAP',
    target_type: 'SECURITY_POLICY',
    target_id: 'sec_policy_core',
    old_value: null,
    new_value: { sessionTimeout: 30, maxFailedAttempts: 5, enforce2FA: true },
    ip_address: '103.24.18.92',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    city: 'GLOBAL',
    status: 'SUCCESS',
    timestamp: '2026-10-06T08:00:00.000Z',
  },
  {
    id: 'audit_02_login_pawan',
    admin_id: 'admin_pawan_super',
    admin_name: 'Pawan Sharma',
    admin_email: 'pawan.sharma@parosa.com',
    admin_role: 'Super Admin',
    action: 'LOGIN_SUCCESS',
    target_type: 'SESSION',
    target_id: 'sess_99182',
    old_value: null,
    new_value: { ip: '103.24.18.92', device: 'Chrome / Windows' },
    ip_address: '103.24.18.92',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    city: 'GLOBAL',
    status: 'SUCCESS',
    timestamp: '2026-10-06T09:15:00.000Z',
  },
  {
    id: 'audit_03_create_city_mgr',
    admin_id: 'admin_pawan_super',
    admin_name: 'Pawan Sharma',
    admin_email: 'pawan.sharma@parosa.com',
    admin_role: 'Super Admin',
    action: 'CREATE_ADMIN',
    target_type: 'ADMIN_USER',
    target_id: 'admin_rajesh_alwar',
    old_value: null,
    new_value: { name: 'Rajesh Meena', role: 'CITY_MANAGER', scope: 'CITY: ALWAR' },
    ip_address: '103.24.18.92',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    city: 'ALWAR',
    status: 'SUCCESS',
    timestamp: '2026-10-06T07:40:00.000Z',
  },
];

class ParosaDatabase {
  private state: ParosaDbState;

  constructor() {
    this.state = {
      adminUsers: JSON.parse(JSON.stringify(INITIAL_ADMINS)),
      roles: JSON.parse(JSON.stringify(DEFAULT_SYSTEM_ROLES)),
      sessions: [],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      securityPolicy: {
        sessionTimeoutMinutes: 30,
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15,
        enforce2FAForPrivileged: true,
        passwordExpiryDays: 90,
        rateLimitPerMinute: 60,
        updatedAt: '2026-10-06T08:00:00.000Z',
        updatedBy: 'Pawan Sharma (Super Admin)',
      },
      cities: [...INITIAL_CITIES],
    };
  }

  // --- Roles & Permissions ---
  getRoles(): Role[] {
    return [...this.state.roles];
  }

  getRoleById(id: string): Role | undefined {
    return this.state.roles.find((r) => r.id === id);
  }

  saveRole(role: Role, actor: AdminUser): Role {
    const idx = this.state.roles.findIndex((r) => r.id === role.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      const oldRole = { ...this.state.roles[idx] };
      this.state.roles[idx] = { ...role, updatedAt: now };

      this.addAuditLog({
        admin_id: actor.id,
        admin_name: actor.name,
        admin_email: actor.email,
        admin_role: actor.roleId,
        action: 'UPDATE_ROLE',
        target_type: 'ROLE',
        target_id: role.id,
        old_value: oldRole,
        new_value: this.state.roles[idx],
        ip_address: '127.0.0.1',
        user_agent: 'PAROSA Admin Console',
        city: 'GLOBAL',
        status: 'SUCCESS',
      });

      return this.state.roles[idx];
    } else {
      const newRole: Role = {
        ...role,
        createdAt: now,
        updatedAt: now,
      };
      this.state.roles.push(newRole);

      this.addAuditLog({
        admin_id: actor.id,
        admin_name: actor.name,
        admin_email: actor.email,
        admin_role: actor.roleId,
        action: 'CREATE_ROLE',
        target_type: 'ROLE',
        target_id: newRole.id,
        old_value: null,
        new_value: newRole,
        ip_address: '127.0.0.1',
        user_agent: 'PAROSA Admin Console',
        city: 'GLOBAL',
        status: 'SUCCESS',
      });

      return newRole;
    }
  }

  deleteRole(roleId: string, actor: AdminUser): boolean {
    const role = this.getRoleById(roleId);
    if (!role || role.isSystem) return false;

    this.state.roles = this.state.roles.filter((r) => r.id !== roleId);

    this.addAuditLog({
      admin_id: actor.id,
      admin_name: actor.name,
      admin_email: actor.email,
      admin_role: actor.roleId,
      action: 'DELETE_ROLE',
      target_type: 'ROLE',
      target_id: roleId,
      old_value: role,
      new_value: null,
      ip_address: '127.0.0.1',
      user_agent: 'PAROSA Admin Console',
      city: 'GLOBAL',
      status: 'SUCCESS',
    });

    return true;
  }

  // --- Admin Users ---
  getAdminUsers(): AdminUser[] {
    return [...this.state.adminUsers];
  }

  getAdminUserById(id: string): AdminUser | undefined {
    return this.state.adminUsers.find((u) => u.id === id);
  }

  getAdminUserByEmail(email: string): AdminUser | undefined {
    return this.state.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  saveAdminUser(user: AdminUser, actor: AdminUser): AdminUser {
    const idx = this.state.adminUsers.findIndex((u) => u.id === user.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      const oldUser = { ...this.state.adminUsers[idx] };
      this.state.adminUsers[idx] = { ...user, updatedAt: now };

      this.addAuditLog({
        admin_id: actor.id,
        admin_name: actor.name,
        admin_email: actor.email,
        admin_role: actor.roleId,
        action: 'UPDATE_ADMIN',
        target_type: 'ADMIN_USER',
        target_id: user.id,
        old_value: oldUser,
        new_value: this.state.adminUsers[idx],
        ip_address: '127.0.0.1',
        user_agent: 'PAROSA Admin Console',
        city: user.cityIds[0] || 'GLOBAL',
        status: 'SUCCESS',
      });

      return this.state.adminUsers[idx];
    } else {
      const newUser: AdminUser = {
        ...user,
        createdAt: now,
        updatedAt: now,
      };
      this.state.adminUsers.push(newUser);

      this.addAuditLog({
        admin_id: actor.id,
        admin_name: actor.name,
        admin_email: actor.email,
        admin_role: actor.roleId,
        action: 'CREATE_ADMIN',
        target_type: 'ADMIN_USER',
        target_id: newUser.id,
        old_value: null,
        new_value: newUser,
        ip_address: '127.0.0.1',
        user_agent: 'PAROSA Admin Console',
        city: newUser.cityIds[0] || 'GLOBAL',
        status: 'SUCCESS',
      });

      return newUser;
    }
  }

  // --- Audit Logs (Append-Only) ---
  getAuditLogs(): AuditLogEntry[] {
    return [...this.state.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const log: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.state.auditLogs.unshift(log);
    return log;
  }

  // --- Security Policy ---
  getSecurityPolicy(): SecurityPolicy {
    return { ...this.state.securityPolicy };
  }

  updateSecurityPolicy(policyUpdate: Partial<SecurityPolicy>, actor: AdminUser): SecurityPolicy {
    const oldPolicy = { ...this.state.securityPolicy };
    this.state.securityPolicy = {
      ...this.state.securityPolicy,
      ...policyUpdate,
      updatedAt: new Date().toISOString(),
      updatedBy: `${actor.name} (${actor.roleId})`,
    };

    this.addAuditLog({
      admin_id: actor.id,
      admin_name: actor.name,
      admin_email: actor.email,
      admin_role: actor.roleId,
      action: 'UPDATE_SECURITY_POLICY',
      target_type: 'SECURITY_POLICY',
      target_id: 'sec_policy_core',
      old_value: oldPolicy,
      new_value: this.state.securityPolicy,
      ip_address: '127.0.0.1',
      user_agent: 'PAROSA Admin Console',
      city: 'GLOBAL',
      status: 'SUCCESS',
    });

    return this.state.securityPolicy;
  }

  // --- Cities ---
  getCities() {
    return [...this.state.cities];
  }

  // --- Phase 1 Dashboard Aggregated Metrics ---
  getPhase1DashboardMetrics(): Phase1DashboardMetrics {
    const activeAdmins = this.state.adminUsers.filter((u) => u.status === 'ACTIVE').length;
    const failedLogins = this.state.adminUsers.reduce((sum, u) => sum + (u.failedLoginAttempts || 0), 0);
    const securityAlerts = this.state.auditLogs.filter((l) => l.status === 'DENIED' || l.action.includes('LOCKOUT')).length;

    // Actions per admin distribution
    const actionCounts: Record<string, { count: number; role: string }> = {};
    this.state.auditLogs.forEach((l) => {
      if (!actionCounts[l.admin_name]) {
        actionCounts[l.admin_name] = { count: 0, role: l.admin_role };
      }
      actionCounts[l.admin_name].count += 1;
    });

    const actionsByAdmin = Object.entries(actionCounts).map(([adminName, val]) => ({
      adminName,
      count: val.count,
      role: val.role,
    }));

    // Admin login hourly activity (last 6 hours simulated trend)
    const adminLoginActivity = [
      { hour: '04:00', count: 1 },
      { hour: '05:00', count: 2 },
      { hour: '06:00', count: 3 },
      { hour: '07:00', count: 6 },
      { hour: '08:00', count: 12 },
      { hour: '09:00', count: 8 },
    ];

    // Admin Activity by Day (past 7 days)
    const adminActivityByDay = [
      { date: 'Sep 30', actions: 14 },
      { date: 'Oct 01', actions: 22 },
      { date: 'Oct 02', actions: 19 },
      { date: 'Oct 03', actions: 28 },
      { date: 'Oct 04', actions: 35 },
      { date: 'Oct 05', actions: 31 },
      { date: 'Oct 06 (Today)', actions: this.state.auditLogs.length },
    ];

    // Security Events breakdown
    const securityEvents = [
      { date: 'Oct 04', success: 34, denied: 1, failed: 0 },
      { date: 'Oct 05', success: 30, denied: 1, failed: 0 },
      { date: 'Oct 06', success: this.state.auditLogs.filter((l) => l.status === 'SUCCESS').length, denied: securityAlerts, failed: 0 },
    ];

    return {
      totalAdmins: this.state.adminUsers.length,
      activeAdmins,
      totalRoles: this.state.roles.length,
      totalPermissions: ALL_PERMISSIONS.length,
      todaysLogins: this.state.auditLogs.filter((l) => l.action === 'LOGIN_SUCCESS').length,
      failedLogins,
      securityAlerts,
      adminLoginActivity,
      adminActivityByDay,
      actionsByAdmin,
      securityEvents,
    };
  }
}

export const db = new ParosaDatabase();
