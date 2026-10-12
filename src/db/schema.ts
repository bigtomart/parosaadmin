import { pgTable, text, varchar, boolean, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * PAROSA Relational Database Schema (PostgreSQL via Drizzle ORM)
 * Supports all Phase 1 Modules and sets foundations for Phase 2 (Restaurants & Menus)
 */

// 1. Cities
export const cities = pgTable('cities', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  state: text('state').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Permissions (Centralized catalogue)
export const permissions = pgTable('permissions', {
  id: varchar('id', { length: 128 }).primaryKey(), // e.g. "orders.view"
  resource: varchar('resource', { length: 64 }).notNull(),
  action: varchar('action', { length: 64 }).notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Roles
export const roles = pgTable('roles', {
  id: varchar('id', { length: 64 }).primaryKey(), // e.g. "SUPER_ADMIN", "CITY_MANAGER"
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  scopeType: varchar('scope_type', { length: 32 }).notNull().default('GLOBAL'), // GLOBAL, CITY, RESTAURANT, SELF
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Role Permissions (Many-to-Many junction table)
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: varchar('id', { length: 128 }).primaryKey(), // `${roleId}_${permissionId}`
    roleId: varchar('role_id', { length: 64 })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: varchar('permission_id', { length: 128 })
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('role_perm_idx').on(table.roleId, table.permissionId),
    index('role_perm_role_idx').on(table.roleId),
  ]
);

// 5. Admin Users
export const adminUsers = pgTable(
  'admin_users',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    name: varchar('name', { length: 128 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 32 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    roleId: varchar('role_id', { length: 64 })
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    scopeType: varchar('scope_type', { length: 32 }).notNull().default('GLOBAL'), // GLOBAL, CITY, RESTAURANT, SELF
    status: varchar('status', { length: 32 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, SUSPENDED
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    avatarUrl: text('avatar_url'),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    lastLoginIp: varchar('last_login_ip', { length: 64 }),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockoutUntil: timestamp('lockout_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('admin_users_email_idx').on(table.email),
    index('admin_users_role_idx').on(table.roleId),
    index('admin_users_status_idx').on(table.status),
  ]
);

// 6. Admin Scopes (Links admin to specific cities or restaurants)
export const adminScopes = pgTable(
  'admin_scopes',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    adminId: varchar('admin_id', { length: 64 })
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    scopeType: varchar('scope_type', { length: 32 }).notNull(), // CITY, RESTAURANT
    scopeValue: varchar('scope_value', { length: 64 }).notNull(), // City ID (e.g. "ALWAR") or Restaurant ID
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('admin_scopes_admin_idx').on(table.adminId),
    uniqueIndex('admin_scope_unique_idx').on(table.adminId, table.scopeType, table.scopeValue),
  ]
);

// 7. Admin Sessions (Token revocation & active session management)
export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    adminId: varchar('admin_id', { length: 64 })
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    ipAddress: varchar('ip_address', { length: 64 }).notNull(),
    userAgent: text('user_agent').notNull(),
    device: text('device'),
    isRevoked: boolean('is_revoked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('admin_sessions_token_idx').on(table.token),
    index('admin_sessions_admin_idx').on(table.adminId),
  ]
);

// 8. Audit Logs (Immutable, append-only history)
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    adminId: varchar('admin_id', { length: 64 }).notNull(),
    adminName: varchar('admin_name', { length: 128 }).notNull(),
    adminEmail: varchar('admin_email', { length: 255 }).notNull(),
    adminRole: varchar('admin_role', { length: 64 }).notNull(),
    action: varchar('action', { length: 128 }).notNull(),
    targetType: varchar('target_type', { length: 64 }).notNull(),
    targetId: varchar('target_id', { length: 128 }).notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    ipAddress: varchar('ip_address', { length: 64 }).notNull(),
    userAgent: text('user_agent').notNull(),
    city: varchar('city', { length: 64 }).default('GLOBAL'),
    status: varchar('status', { length: 32 }).notNull().default('SUCCESS'), // SUCCESS, DENIED, FAILED
    errorMessage: text('error_message'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_timestamp_idx').on(table.timestamp),
    index('audit_logs_admin_idx').on(table.adminId),
    index('audit_logs_action_idx').on(table.action),
  ]
);

// 9. Security Policy
export const securityPolicies = pgTable('security_policies', {
  id: varchar('id', { length: 64 }).primaryKey().default('sec_policy_core'),
  sessionTimeoutMinutes: integer('session_timeout_minutes').notNull().default(30),
  maxFailedAttempts: integer('max_failed_attempts').notNull().default(5),
  lockoutDurationMinutes: integer('lockout_duration_minutes').notNull().default(15),
  enforce2FAForPrivileged: boolean('enforce_2fa_for_privileged').notNull().default(true),
  passwordExpiryDays: integer('password_expiry_days').notNull().default(90),
  rateLimitPerMinute: integer('rate_limit_per_minute').notNull().default(60),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: text('updated_by').notNull().default('System'),
});

// Relationships
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  adminUsers: many(adminUsers),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  role: one(roles, {
    fields: [adminUsers.roleId],
    references: [roles.id],
  }),
  scopes: many(adminScopes),
  sessions: many(adminSessions),
}));

export const adminScopesRelations = relations(adminScopes, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminScopes.adminId],
    references: [adminUsers.id],
  }),
}));
