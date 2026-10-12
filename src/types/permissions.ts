import { PermissionDefinition, Role, PermissionCategory } from './rbac';

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  'Dashboard',
  'Users',
  'Restaurants',
  'Menu',
  'Orders',
  'Delivery',
  'Payments',
  'Finance',
  'Marketing',
  'Notifications',
  'Support',
  'Reports',
  'Roles',
  'Settings',
  'Audit Logs',
];

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // 1. Dashboard
  { id: 'dashboard.view', resource: 'dashboard', action: 'view', description: 'View PAROSA operations & security dashboard', category: 'Dashboard' },

  // 2. Users (Admin Users)
  { id: 'users.view', resource: 'users', action: 'view', description: 'View administrative users directory and profile cards', category: 'Users' },
  { id: 'users.create', resource: 'users', action: 'create', description: 'Create new administrator accounts & assign credentials', category: 'Users' },
  { id: 'users.update', resource: 'users', action: 'update', description: 'Edit administrative details, roles, and access scopes', category: 'Users' },
  { id: 'users.delete', resource: 'users', action: 'delete', description: 'Delete admin accounts (Super Admin protected)', category: 'Users' },
  { id: 'users.suspend', resource: 'users', action: 'suspend', description: 'Deactivate or suspend administrative staff accounts', category: 'Users' },

  // 3. Restaurants (Prepared for Phase 2)
  { id: 'restaurants.view', resource: 'restaurants', action: 'view', description: 'View restaurant merchant profiles and catalogs', category: 'Restaurants' },
  { id: 'restaurants.create', resource: 'restaurants', action: 'create', description: 'Onboard new partner merchant restaurants', category: 'Restaurants' },
  { id: 'restaurants.update', resource: 'restaurants', action: 'update', description: 'Update restaurant details, hours & delivery radius', category: 'Restaurants' },
  { id: 'restaurants.approve', resource: 'restaurants', action: 'approve', description: 'Approve pending restaurant onboarding applications', category: 'Restaurants' },
  { id: 'restaurants.reject', resource: 'restaurants', action: 'reject', description: 'Reject restaurant onboarding applications', category: 'Restaurants' },
  { id: 'restaurants.suspend', resource: 'restaurants', action: 'suspend', description: 'Suspend or blacklist merchant partner', category: 'Restaurants' },

  // 4. Menu (Prepared for Phase 2)
  { id: 'menu.view', resource: 'menu', action: 'view', description: 'View restaurant menus, items & category hierarchies', category: 'Menu' },
  { id: 'menu.create', resource: 'menu', action: 'create', description: 'Add new food items, variants and add-ons', category: 'Menu' },
  { id: 'menu.update', resource: 'menu', action: 'update', description: 'Edit food pricing, taxes and stock availability', category: 'Menu' },
  { id: 'menu.delete', resource: 'menu', action: 'delete', description: 'Delete food items from restaurant catalogs', category: 'Menu' },

  // 5. Orders (Prepared for Phase 2)
  { id: 'orders.view', resource: 'orders', action: 'view', description: 'View live order feeds, details and timelines', category: 'Orders' },
  { id: 'orders.update', resource: 'orders', action: 'update', description: 'Update order progress & preparation status', category: 'Orders' },
  { id: 'orders.cancel', resource: 'orders', action: 'cancel', description: 'Cancel order and record cancellation reason', category: 'Orders' },
  { id: 'orders.assign_delivery', resource: 'orders', action: 'assign_delivery', description: 'Assign or reassign delivery riders to orders', category: 'Orders' },

  // 6. Delivery (Prepared for Phase 2)
  { id: 'delivery.view', resource: 'delivery', action: 'view', description: 'View delivery fleet riders and live locations', category: 'Delivery' },
  { id: 'delivery.create', resource: 'delivery', action: 'create', description: 'Onboard new delivery partner riders', category: 'Delivery' },
  { id: 'delivery.update', resource: 'delivery', action: 'update', description: 'Update rider profile and vehicle details', category: 'Delivery' },
  { id: 'delivery.approve', resource: 'delivery', action: 'approve', description: 'Verify KYC and approve delivery riders', category: 'Delivery' },
  { id: 'delivery.assign_order', resource: 'delivery', action: 'assign_order', description: 'Dispatch orders directly to delivery riders', category: 'Delivery' },
  { id: 'delivery.suspend', resource: 'delivery', action: 'suspend', description: 'Suspend delivery partner from rider fleet', category: 'Delivery' },

  // 7. Payments (Prepared for Phase 2)
  { id: 'payments.view', resource: 'payments', action: 'view', description: 'View payment transactions, gateways and statuses', category: 'Payments' },
  { id: 'refunds.view', resource: 'refunds', action: 'view', description: 'View customer refund requests and claims', category: 'Payments' },
  { id: 'refunds.approve', resource: 'refunds', action: 'approve', description: 'Authorize and execute monetary refunds', category: 'Payments' },

  // 8. Finance (Prepared for Phase 2)
  { id: 'finance.view', resource: 'finance', action: 'view', description: 'View platform balances and financial accounts', category: 'Finance' },
  { id: 'settlements.view', resource: 'settlements', action: 'view', description: 'View merchant weekly payout settlements', category: 'Finance' },
  { id: 'commission.view', resource: 'commission', action: 'view', description: 'Inspect platform commission earnings', category: 'Finance' },

  // 9. Marketing (Prepared for Phase 2)
  { id: 'coupons.view', resource: 'coupons', action: 'view', description: 'View promo discount codes and campaigns', category: 'Marketing' },
  { id: 'coupons.create', resource: 'coupons', action: 'create', description: 'Create new promo discount codes', category: 'Marketing' },
  { id: 'coupons.update', resource: 'coupons', action: 'update', description: 'Modify coupon discounts, thresholds & caps', category: 'Marketing' },
  { id: 'coupons.delete', resource: 'coupons', action: 'delete', description: 'Deactivate or delete promo coupons', category: 'Marketing' },

  // 10. Notifications (Prepared for Phase 2)
  { id: 'notifications.view', resource: 'notifications', action: 'view', description: 'View broadcast and targeted notification history', category: 'Notifications' },
  { id: 'notifications.create', resource: 'notifications', action: 'create', description: 'Compose broadcast notifications (Push, SMS, Email)', category: 'Notifications' },
  { id: 'notifications.send', resource: 'notifications', action: 'send', description: 'Dispatch notifications to selected audience', category: 'Notifications' },

  // 11. Support (Prepared for Phase 2)
  { id: 'support.view', resource: 'support', action: 'view', description: 'View customer grievance tickets and complaints', category: 'Support' },
  { id: 'support.manage', resource: 'support', action: 'manage', description: 'Assign, reply and resolve support tickets', category: 'Support' },

  // 12. Reports (Prepared for Phase 2)
  { id: 'reports.view', resource: 'reports', action: 'view', description: 'View sales, merchant and rider analytics', category: 'Reports' },
  { id: 'reports.export', resource: 'reports', action: 'export', description: 'Export business intelligence datasets (CSV/PDF)', category: 'Reports' },

  // 13. Roles & RBAC (Phase 1 Core)
  { id: 'roles.view', resource: 'roles', action: 'view', description: 'View roles and permission matrices', category: 'Roles' },
  { id: 'roles.create', resource: 'roles', action: 'create', description: 'Create dynamic roles and configure scopes', category: 'Roles' },
  { id: 'roles.update', resource: 'roles', action: 'update', description: 'Edit permissions and scopes assigned to roles', category: 'Roles' },
  { id: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete non-system custom roles', category: 'Roles' },

  // 14. Settings (Phase 1 Core)
  { id: 'settings.view', resource: 'settings', action: 'view', description: 'View system security policy and parameters', category: 'Settings' },
  { id: 'settings.update', resource: 'settings', action: 'update', description: 'Modify security policies, session limits & 2FA', category: 'Settings' },

  // 15. Audit Logs (Phase 1 Core)
  { id: 'audit_logs.view', resource: 'audit_logs', action: 'view', description: 'Inspect immutable append-only admin audit trail', category: 'Audit Logs' },
];

/**
 * Checks if a user's granted permissions allow a required permission.
 * Supports exact matches and wildcards (e.g. "users.*", "*.*").
 */
export function checkPermission(grantedPermissions: string[], requiredPermission: string): boolean {
  if (!grantedPermissions || grantedPermissions.length === 0) return false;
  if (grantedPermissions.includes('*')) return true;

  const [reqResource] = requiredPermission.split('.');

  for (const perm of grantedPermissions) {
    if (perm === requiredPermission) return true;
    if (perm === `${reqResource}.*`) return true;
    if (perm === '*.*') return true;
  }

  return false;
}

/**
 * Default System Roles for PAROSA as mandated by the prompt specification.
 */
export const DEFAULT_SYSTEM_ROLES: Role[] = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full root access to all system functions, administration, roles, and audit trail.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.*',
      'users.*',
      'restaurants.*',
      'menu.*',
      'orders.*',
      'delivery.*',
      'payments.*',
      'refunds.*',
      'finance.*',
      'settlements.*',
      'commission.*',
      'coupons.*',
      'notifications.*',
      'support.*',
      'reports.*',
      'roles.*',
      'settings.*',
      'audit_logs.*',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ADMIN',
    name: 'Admin',
    description: 'Operational management across merchant onboarding, delivery, support, and reports.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'users.view',
      'users.create',
      'users.update',
      'users.suspend',
      'restaurants.view',
      'restaurants.create',
      'restaurants.update',
      'restaurants.approve',
      'restaurants.reject',
      'restaurants.suspend',
      'menu.view',
      'menu.create',
      'menu.update',
      'orders.view',
      'orders.update',
      'orders.cancel',
      'orders.assign_delivery',
      'delivery.view',
      'delivery.create',
      'delivery.update',
      'delivery.approve',
      'delivery.assign_order',
      'coupons.view',
      'coupons.create',
      'coupons.update',
      'notifications.view',
      'notifications.create',
      'notifications.send',
      'support.view',
      'support.manage',
      'reports.view',
      'reports.export',
      'audit_logs.view',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ORDER_MANAGER',
    name: 'Order Manager',
    description: 'Specialized role for tracking live order streams, cancellations, and rider dispatching.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'orders.view',
      'orders.update',
      'orders.cancel',
      'orders.assign_delivery',
      'refunds.view',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'RESTAURANT_MANAGER',
    name: 'Restaurant Manager',
    description: 'Oversees merchant partner onboarding, verifications, suspensions, and food menus.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'restaurants.view',
      'restaurants.create',
      'restaurants.update',
      'restaurants.approve',
      'restaurants.reject',
      'restaurants.suspend',
      'menu.view',
      'menu.create',
      'menu.update',
      'menu.delete',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'DELIVERY_MANAGER',
    name: 'Delivery Manager',
    description: 'Controls rider onboarding, KYC approvals, fleet availability, and manual order dispatch.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'delivery.view',
      'delivery.create',
      'delivery.update',
      'delivery.approve',
      'delivery.assign_order',
      'delivery.suspend',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'SUPPORT_MANAGER',
    name: 'Support Manager',
    description: 'Manages customer disputes, complaints, order issues, and resolution workflows.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'orders.view',
      'support.view',
      'support.manage',
      'refunds.view',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'FINANCE_MANAGER',
    name: 'Finance Manager',
    description: 'Oversees transactions, settlements, commission revenue, and refund authorizations.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'payments.view',
      'refunds.view',
      'refunds.approve',
      'finance.view',
      'settlements.view',
      'commission.view',
      'reports.view',
      'reports.export',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'MARKETING_MANAGER',
    name: 'Marketing Manager',
    description: 'Authorizes promo coupons, campaign parameters, and push broadcast communications.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'coupons.view',
      'coupons.create',
      'coupons.update',
      'coupons.delete',
      'notifications.view',
      'notifications.create',
      'notifications.send',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'CITY_MANAGER',
    name: 'City Manager',
    description: 'Territory operational lead. Must not access data belonging to other cities.',
    isSystem: true,
    isActive: true,
    scopeType: 'CITY',
    allowedCities: ['Alwar'],
    permissions: [
      'dashboard.view',
      'restaurants.view',
      'restaurants.update',
      'orders.view',
      'orders.update',
      'orders.assign_delivery',
      'delivery.view',
      'delivery.assign_order',
      'reports.view',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'REPORT_VIEWER',
    name: 'Report Viewer',
    description: 'Read-only analyst access to operational dashboard and performance metrics.',
    isSystem: true,
    isActive: true,
    scopeType: 'GLOBAL',
    permissions: [
      'dashboard.view',
      'reports.view',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
