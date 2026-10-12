/**
 * PAROSA RBAC and Authentication Types
 * Phase 1 Architecture Foundation
 */

export type ScopeType = 'GLOBAL' | 'CITY' | 'RESTAURANT' | 'SELF';

export type RoleId =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ORDER_MANAGER'
  | 'RESTAURANT_MANAGER'
  | 'DELIVERY_MANAGER'
  | 'SUPPORT_MANAGER'
  | 'FINANCE_MANAGER'
  | 'MARKETING_MANAGER'
  | 'CITY_MANAGER'
  | 'REPORT_VIEWER'
  | string;

export type PermissionCategory =
  | 'Dashboard'
  | 'Users'
  | 'Restaurants'
  | 'Menu'
  | 'Orders'
  | 'Delivery'
  | 'Payments'
  | 'Finance'
  | 'Marketing'
  | 'Notifications'
  | 'Support'
  | 'Reports'
  | 'Roles'
  | 'Settings'
  | 'Audit Logs';

export interface PermissionDefinition {
  id: string; // e.g. "orders.view"
  resource: string; // e.g. "orders"
  action: string; // e.g. "view", "create", "update", "delete", "approve"
  description: string;
  category: PermissionCategory;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // System roles cannot be deleted
  isActive: boolean;
  permissions: string[]; // List of permission strings, supports wildcards e.g. "orders.*"
  scopeType: ScopeType;
  allowedCities?: string[];
  allowedRestaurantIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  roleId: string;
  scopeType: ScopeType;
  cityIds: string[];
  restaurantIds: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  twoFactorEnabled: boolean;
  avatarUrl?: string;
  lastLogin?: string;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockoutUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSession {
  id: string;
  adminId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  admin_role: string;
  action: string; // e.g. "CREATE_ADMIN", "UPDATE_ROLE", "LOGIN_SUCCESS", "ACCESS_DENIED"
  target_type: string; // e.g. "ADMIN_USER", "ROLE", "SECURITY_POLICY", "SESSION"
  target_id: string;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  ip_address: string;
  user_agent: string;
  city?: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  error_message?: string;
  timestamp: string;
}

export interface SecurityPolicy {
  sessionTimeoutMinutes: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  enforce2FAForPrivileged: boolean;
  passwordExpiryDays: number;
  rateLimitPerMinute: number;
  updatedAt: string;
  updatedBy: string;
}

export interface Phase1DashboardMetrics {
  totalAdmins: number;
  activeAdmins: number;
  totalRoles: number;
  totalPermissions: number;
  todaysLogins: number;
  failedLogins: number;
  securityAlerts: number;
  adminLoginActivity: { hour: string; count: number }[];
  adminActivityByDay: { date: string; actions: number }[];
  actionsByAdmin: { adminName: string; count: number; role: string }[];
  securityEvents: { date: string; success: number; denied: number; failed: number }[];
}
