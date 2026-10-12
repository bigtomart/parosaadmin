import { db } from './index';
import * as schema from './schema';
import { ALL_PERMISSIONS, DEFAULT_SYSTEM_ROLES } from '../types/permissions';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('[PAROSA DB] Seeding database idempotently...');

  // 1. Seed Cities
  const citiesData = [
    { id: 'ALWAR', name: 'Alwar', state: 'Rajasthan' },
    { id: 'JAIPUR', name: 'Jaipur', state: 'Rajasthan' },
    { id: 'DELHI', name: 'Delhi NCR', state: 'Delhi' },
    { id: 'MUMBAI', name: 'Mumbai', state: 'Maharashtra' },
    { id: 'BENGALURU', name: 'Bengaluru', state: 'Karnataka' },
  ];

  for (const c of citiesData) {
    const existing = await db.select().from(schema.cities).where(eq(schema.cities.id, c.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.cities).values({
        id: c.id,
        name: c.name,
        state: c.state,
        isActive: true,
      });
    }
  }

  // 2. Seed Permissions
  for (const p of ALL_PERMISSIONS) {
    const existing = await db.select().from(schema.permissions).where(eq(schema.permissions.id, p.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.permissions).values({
        id: p.id,
        resource: p.resource,
        action: p.action,
        category: p.category,
        description: p.description,
      });
    }
  }

  // 3. Seed Roles
  for (const r of DEFAULT_SYSTEM_ROLES) {
    const existing = await db.select().from(schema.roles).where(eq(schema.roles.id, r.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.roles).values({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        isActive: r.isActive,
        scopeType: r.scopeType,
      });
    }

    // Role-Permission mappings
    for (const permId of r.permissions) {
      // If wildcard * or specific permission
      const id = `${r.id}_${permId}`;
      const existingRp = await db
        .select()
        .from(schema.rolePermissions)
        .where(eq(schema.rolePermissions.id, id))
        .limit(1);

      if (existingRp.length === 0) {
        // Ensure permission exists in catalogue or insert wildcard marker
        if (permId === '*' || permId.endsWith('.*')) {
          const permExists = await db
            .select()
            .from(schema.permissions)
            .where(eq(schema.permissions.id, permId))
            .limit(1);
          if (permExists.length === 0) {
            await db.insert(schema.permissions).values({
              id: permId,
              resource: 'all',
              action: '*',
              category: 'Roles',
              description: `Wildcard permission grant (${permId})`,
            });
          }
        }

        try {
          await db.insert(schema.rolePermissions).values({
            id,
            roleId: r.id,
            permissionId: permId,
          });
        } catch {
          // ignore duplicate in case of race
        }
      }
    }
  }

  // 4. Seed Security Policy
  const existingPolicy = await db
    .select()
    .from(schema.securityPolicies)
    .where(eq(schema.securityPolicies.id, 'sec_policy_core'))
    .limit(1);

  if (existingPolicy.length === 0) {
    await db.insert(schema.securityPolicies).values({
      id: 'sec_policy_core',
      sessionTimeoutMinutes: 30,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15,
      enforce2FAForPrivileged: true,
      passwordExpiryDays: 90,
      rateLimitPerMinute: 60,
      updatedBy: 'System Bootstrap',
    });
  }

  // 5. Seed Admin Users (Using real bcrypt hash with 12 salt rounds)
  // Default password across test personas: Parosa@Admin2026!
  const defaultPasswordHash = bcrypt.hashSync('Parosa@Admin2026!', 12);

  const initialAdmins = [
    {
      id: 'admin_pawan_super',
      name: 'Pawan Sharma',
      email: 'pawan.sharma@parosa.com',
      phone: '+91 98290 11223',
      roleId: 'SUPER_ADMIN',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_vikram_ops',
      name: 'Vikram Singh',
      email: 'vikram.singh@parosa.com',
      phone: '+91 98291 44556',
      roleId: 'ADMIN',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_rajesh_alwar',
      name: 'Rajesh Meena',
      email: 'rajesh.alwar@parosa.com',
      phone: '+91 94140 22334',
      roleId: 'CITY_MANAGER',
      scopeType: 'CITY',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      cityIds: ['ALWAR'],
    },
    {
      id: 'admin_amit_finance',
      name: 'Amit Gupta',
      email: 'amit.gupta@parosa.com',
      phone: '+91 98295 99001',
      roleId: 'FINANCE_MANAGER',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: true,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_rahul_orders',
      name: 'Rahul Verma',
      email: 'rahul.verma@parosa.com',
      phone: '+91 98292 77889',
      roleId: 'ORDER_MANAGER',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_priya_rest',
      name: 'Priya Sharma',
      email: 'priya.sharma@parosa.com',
      phone: '+91 98293 33445',
      roleId: 'RESTAURANT_MANAGER',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_aman_deliv',
      name: 'Aman Khan',
      email: 'aman.khan@parosa.com',
      phone: '+91 98294 55667',
      roleId: 'DELIVERY_MANAGER',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_rohit_reports',
      name: 'Rohit Joshi',
      email: 'rohit.joshi@parosa.com',
      phone: '+91 98296 12345',
      roleId: 'REPORT_VIEWER',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_neha_support',
      name: 'Neha Kapoor',
      email: 'neha.support@parosa.com',
      phone: '+91 98297 33441',
      roleId: 'SUPPORT_MANAGER',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
    {
      id: 'admin_karan_marketing',
      name: 'Karan Malhotra',
      email: 'karan.marketing@parosa.com',
      phone: '+91 98298 55662',
      roleId: 'MARKETING_MANAGER',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      cityIds: [],
    },
  ];

  for (const adm of initialAdmins) {
    const existing = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, adm.email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.adminUsers).values({
        id: adm.id,
        name: adm.name,
        email: adm.email,
        phone: adm.phone,
        passwordHash: defaultPasswordHash,
        roleId: adm.roleId,
        scopeType: adm.scopeType,
        status: adm.status,
        twoFactorEnabled: adm.twoFactorEnabled,
        avatarUrl: adm.avatarUrl,
        failedLoginAttempts: 0,
      });

      // City Scopes
      for (const cityId of adm.cityIds) {
        await db.insert(schema.adminScopes).values({
          id: `${adm.id}_CITY_${cityId}`,
          adminId: adm.id,
          scopeType: 'CITY',
          scopeValue: cityId,
        });
      }
    }
  }

  // 6. Seed Initial Bootstrap Audit Logs if empty
  const logCount = await db.select({ count: sql<number>`count(*)` }).from(schema.auditLogs);
  if (Number(logCount[0]?.count || 0) === 0) {
    await db.insert(schema.auditLogs).values([
      {
        id: 'audit_01_sys_init',
        adminId: 'admin_pawan_super',
        adminName: 'Pawan Sharma',
        adminEmail: 'pawan.sharma@parosa.com',
        adminRole: 'Super Admin',
        action: 'SYSTEM_BOOTSTRAP',
        targetType: 'DATABASE_MIGRATION',
        targetId: 'parosa_postgres_db',
        oldValue: null,
        newValue: { engine: 'PostgreSQL', status: 'PERSISTENT_MODELS_READY' },
        ipAddress: '103.24.18.92',
        userAgent: 'PAROSA DB Migration Engine',
        city: 'GLOBAL',
        status: 'SUCCESS',
      },
    ]);
  }

  console.log('[PAROSA DB] Database seeding completed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('[PAROSA DB] Seed script completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[PAROSA DB] Seed failed:', err);
      process.exit(1);
    });
}
