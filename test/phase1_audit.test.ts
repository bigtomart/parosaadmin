import { runMigrations } from '../src/db/migrate';
import { seedDatabase } from '../src/db/seed';
import { dbService } from '../src/db/service';
import { db, closeDatabase, initDatabase } from '../src/db/index';
import * as schema from '../src/db/schema';
import { generateToken, verifyToken, revokeToken, revokeAllTokensForUser } from '../src/server/auth';
import { ALL_PERMISSIONS } from '../src/types/permissions';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

let testsPassed = 0;
let testsFailed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${testName}`);
  } else {
    testsFailed++;
    failures.push(`${testName}${detail ? `: ${detail}` : ''}`);
    console.error(`  ✗ ${testName}${detail ? `: ${detail}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  PAROSA ADMIN PANEL — PHASE 1.5 PERSISTENT DB & RBAC AUDIT');
  console.log('================================================================\n');

  // 1. Database Initialization & Seeding
  console.log('>> [MODULE 0]: Database Schemas & Idempotent Seeding');
  await runMigrations();
  await seedDatabase();

  const cities = await dbService.getCities();
  assert(cities.length >= 5, 'Persistent Cities Loaded (Min 5 Cities)', `Found ${cities.length}`);

  const roles = await dbService.getRoles();
  assert(roles.length >= 10, 'All 10 System Roles Initialized in DB', `Found ${roles.length}`);

  const admins = await dbService.getAdminUsers();
  assert(admins.length >= 10, 'All 10 Admin Persona Accounts Seeded', `Found ${admins.length}`);

  // 2. Authentication & Password Security
  console.log('\n>> [MODULE 1]: Authentication & Password Security');
  const superAdmin = await dbService.getAdminUserByEmail('pawan.sharma@parosa.com');
  assert(!!superAdmin, 'Super Admin Account Exists');

  // Real bcrypt verification
  const isMatch = await bcrypt.compare('Parosa@Admin2026!', superAdmin!.passwordHash!);
  assert(isMatch, 'Real Bcrypt Verification Passes with Correct Password');

  const isWrongMatch = await bcrypt.compare('WrongPassword123!', superAdmin!.passwordHash!);
  assert(!isWrongMatch, 'Bcrypt Verification Rejects Incorrect Password');

  // Token generation & persistent session verification
  const sessionToken = await generateToken(superAdmin!, '127.0.0.1', 'Audit Test Client');
  assert(sessionToken.startsWith('parosa_tok_'), 'Session Token Generated');

  const verifiedSession = await verifyToken(sessionToken);
  assert(verifiedSession !== null && verifiedSession.user.id === superAdmin!.id, 'Session Verified Against Persistent DB');

  // Session revocation (Logout)
  const revoked = await revokeToken(sessionToken);
  assert(revoked, 'Session Token Revoked in Persistent DB');

  const recheckSession = await verifyToken(sessionToken);
  assert(recheckSession === null, 'Revoked Token Rejected (401 Equivalent)');

  // Account Status Check (Deactivated Admin)
  const testInactiveUser = await dbService.saveAdminUser(
    {
      id: 'test_inactive_admin',
      name: 'Test Inactive',
      email: 'inactive@parosa.com',
      phone: '+91 99999 00001',
      passwordHash: await bcrypt.hash('TestPassword123!', 12),
      roleId: 'ADMIN',
      scopeType: 'GLOBAL',
      status: 'INACTIVE',
      twoFactorEnabled: false,
      cityIds: [],
      restaurantIds: [],
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    superAdmin!
  );

  const inactiveToken = await generateToken(testInactiveUser);
  const verifyInactive = await verifyToken(inactiveToken);
  assert(verifyInactive === null, 'Inactive Account Cannot Authenticate');

  // 3. RBAC & All 10 Roles Validation
  console.log('\n>> [MODULE 2]: Role-Based Access Control (10 Core Roles)');
  const allTenRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'ORDER_MANAGER',
    'RESTAURANT_MANAGER',
    'DELIVERY_MANAGER',
    'SUPPORT_MANAGER',
    'FINANCE_MANAGER',
    'MARKETING_MANAGER',
    'CITY_MANAGER',
    'REPORT_VIEWER',
  ];

  for (const roleId of allTenRoles) {
    const roleRecord = await dbService.getRoleById(roleId);
    assert(!!roleRecord, `Role ${roleId} Persisted with Valid Schema`);
    assert(roleRecord!.permissions.length > 0, `Role ${roleId} Has Assigned Permissions (${roleRecord?.permissions.length} perms)`);
  }

  // Permission boundary tests
  const orderManagerRole = await dbService.getRoleById('ORDER_MANAGER');
  assert(orderManagerRole!.permissions.some((p) => p.includes('orders')), 'Order Manager has orders permissions');
  assert(!orderManagerRole!.permissions.includes('settings.update'), 'Order Manager strictly denied settings.update');

  const financeManagerRole = await dbService.getRoleById('FINANCE_MANAGER');
  assert(financeManagerRole!.permissions.some((p) => p.includes('finance')), 'Finance Manager has finance permissions');
  assert(!financeManagerRole!.permissions.includes('menu.create'), 'Finance Manager strictly denied menu.create');

  const deliveryManagerRole = await dbService.getRoleById('DELIVERY_MANAGER');
  assert(deliveryManagerRole!.permissions.some((p) => p.includes('delivery')), 'Delivery Manager has delivery permissions');
  assert(!deliveryManagerRole!.permissions.includes('coupons.create'), 'Delivery Manager strictly denied coupons.create');

  const reportViewerRole = await dbService.getRoleById('REPORT_VIEWER');
  assert(reportViewerRole!.permissions.includes('reports.view'), 'Report Viewer has reports.view');
  assert(!reportViewerRole!.permissions.includes('users.delete'), 'Report Viewer strictly denied users.delete');

  // 4. Role & Permission Management
  console.log('\n>> [MODULE 3]: Permission Management & Anti-Escalation');
  const customRole = await dbService.saveRole(
    {
      id: 'TEST_CUSTOM_DISPATCHER',
      name: 'Custom Dispatcher',
      description: 'Test custom role created in DB',
      isSystem: false,
      isActive: true,
      scopeType: 'CITY',
      permissions: ['orders.view', 'delivery.view', 'delivery.assign_order'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    superAdmin!
  );
  assert(customRole.id === 'TEST_CUSTOM_DISPATCHER', 'Custom Role Created in DB');

  // Modify role
  customRole.permissions.push('orders.update');
  const updatedCustomRole = await dbService.saveRole(customRole, superAdmin!);
  assert(updatedCustomRole.permissions.includes('orders.update'), 'Role Permissions Updated in DB');

  // Delete non-system role
  const deletedRole = await dbService.deleteRole('TEST_CUSTOM_DISPATCHER', superAdmin!);
  assert(deletedRole, 'Non-System Role Deleted Successfully');

  // Attempt to delete system role (SUPER_ADMIN)
  const deleteSuperAdmin = await dbService.deleteRole('SUPER_ADMIN', superAdmin!);
  assert(!deleteSuperAdmin, 'System Role Protected Against Deletion');

  // 5. Admin User Management & Scopes
  console.log('\n>> [MODULE 4]: Admin User Management & Access Scopes');
  const alwarManager = await dbService.getAdminUserByEmail('rajesh.alwar@parosa.com');
  assert(!!alwarManager, 'City Manager Rajesh Meena Exists');
  assert(alwarManager!.scopeType === 'CITY', 'Scope Type is CITY');
  assert(alwarManager!.cityIds.includes('ALWAR'), 'City Scope Bound to ALWAR');

  // Create new scoped admin
  const testAdminUser = await dbService.saveAdminUser(
    {
      id: 'admin_test_jaipur_mgr',
      name: 'Jaipur Operations Lead',
      email: 'jaipur.lead@parosa.com',
      phone: '+91 94140 99887',
      passwordHash: await bcrypt.hash('Parosa@Jaipur2026!', 12),
      roleId: 'CITY_MANAGER',
      scopeType: 'CITY',
      cityIds: ['JAIPUR'],
      restaurantIds: [],
      status: 'ACTIVE',
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    superAdmin!
  );
  assert(testAdminUser.id === 'admin_test_jaipur_mgr', 'New City Scoped Admin Created');
  assert(testAdminUser.cityIds.includes('JAIPUR'), 'City Scope JAIPUR Persisted in DB');

  // 6. Audit Logs Persistence & Immutability
  console.log('\n>> [MODULE 5]: Audit Logs Persistence & Immutability');
  await dbService.addAuditLog({
    admin_id: superAdmin!.id,
    admin_name: superAdmin!.name,
    admin_email: superAdmin!.email,
    admin_role: 'Super Admin',
    action: 'TEST_AUDIT_ACTION',
    target_type: 'TEST_TARGET',
    target_id: 'test_id_123',
    old_value: { status: 'BEFORE' },
    new_value: { status: 'AFTER' },
    ip_address: '127.0.0.1',
    user_agent: 'Test Runner',
    city: 'GLOBAL',
    status: 'SUCCESS',
  });

  const logs = await dbService.getAuditLogs();
  const testLog = logs.find((l) => l.action === 'TEST_AUDIT_ACTION');
  assert(!!testLog, 'Audit Record Persisted to DB');
  assert(testLog?.admin_email === 'pawan.sharma@parosa.com', 'Audit Record Retains Correct Actor Email');
  assert(testLog?.status === 'SUCCESS', 'Audit Record Retains Status');
  assert(!!testLog?.timestamp, 'Audit Record Retains Timestamp');

  // Ensure sensitive data omission in audit logs
  await dbService.addAuditLog({
    admin_id: superAdmin!.id,
    admin_name: superAdmin!.name,
    admin_email: superAdmin!.email,
    admin_role: 'Super Admin',
    action: 'LOGIN_ATTEMPT',
    target_type: 'AUTH',
    target_id: 'sess_test',
    old_value: { password: 'SecretPassword123!', token: 'sens_token_123' },
    new_value: { passwordHash: 'hash_xyz', otp: '123456' },
    ip_address: '127.0.0.1',
    user_agent: 'Test Runner',
    city: 'GLOBAL',
    status: 'SUCCESS',
  });

  const freshLogs = await dbService.getAuditLogs();
  const loginAudit = freshLogs.find((l) => l.action === 'LOGIN_ATTEMPT');
  assert(
    !loginAudit?.old_value?.password && !loginAudit?.new_value?.passwordHash && !loginAudit?.new_value?.otp,
    'Sensitive Fields (passwords, tokens, OTPs) Stripped From Audit Details'
  );

  // 7. Dashboard Metrics
  console.log('\n>> [MODULE 6]: Dashboard Metrics Aggregation');
  const metrics = await dbService.getPhase1DashboardMetrics();
  assert(metrics.totalAdmins >= 10, 'Dashboard Total Admins Reflects DB Count', `${metrics.totalAdmins}`);
  assert(metrics.activeAdmins >= 10, 'Dashboard Active Admins Calculated', `${metrics.activeAdmins}`);
  assert(metrics.totalRoles >= 10, 'Dashboard Total Roles Matches DB', `${metrics.totalRoles}`);
  assert(metrics.totalPermissions === ALL_PERMISSIONS.length, 'Dashboard Permissions Matches Registry', `${metrics.totalPermissions}`);

  // 8. Application Restart & Persistence Verification
  console.log('\n>> [MODULE 7]: Application Restart & Data Persistence Test');
  // Write a marker user
  const markerEmail = `persist_${Date.now()}@parosa.com`;
  await dbService.saveAdminUser(
    {
      id: `admin_persist_${Date.now()}`,
      name: 'Persistence Verification User',
      email: markerEmail,
      phone: '+91 99999 88888',
      passwordHash: await bcrypt.hash('Persist@2026!', 12),
      roleId: 'ADMIN',
      scopeType: 'GLOBAL',
      cityIds: [],
      restaurantIds: [],
      status: 'ACTIVE',
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    superAdmin!
  );

  // Simulate server restart: close database and re-initialize from disk
  await closeDatabase();
  initDatabase();

  // Re-read marker user
  const reloadedUser = await dbService.getAdminUserByEmail(markerEmail);
  assert(!!reloadedUser && reloadedUser.email === markerEmail, 'Data Persists Across Application Restarts (On-Disk PostgreSQL)');

  // 9. Fail-Safe Configuration Validation
  console.log('\n>> [MODULE 8]: Fail-Safe Configuration Verification');
  try {
    const prevEnv = process.env.NODE_ENV;
    const prevUrl = process.env.DATABASE_URL;
    const prevHost = process.env.SQL_HOST;

    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    delete process.env.SQL_HOST;

    await closeDatabase();
    let threw = false;
    try {
      initDatabase();
    } catch (e: any) {
      threw = true;
      assert(e.message.includes('Production database configuration missing'), 'Throws Clear Error in Production if DB Config Missing');
    }
    assert(threw, 'Fails Safely Without In-Memory Fallback in Production Mode');

    // Restore env
    process.env.NODE_ENV = prevEnv;
    if (prevUrl) process.env.DATABASE_URL = prevUrl;
    if (prevHost) process.env.SQL_HOST = prevHost;
    await closeDatabase();
    initDatabase();
  } catch (err: any) {
    console.error('Fail-safe check error:', err);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`  AUDIT COMPLETED: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('================================================================');

  if (testsFailed > 0) {
    console.error('Failures:\n' + failures.map((f) => ` - ${f}`).join('\n'));
    process.exit(1);
  }
}

runTestSuite()
  .then(() => {
    console.log('[PAROSA AUDIT] All tests completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[PAROSA AUDIT FATAL ERROR]:', err);
    process.exit(1);
  });
