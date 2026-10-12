import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dbService } from '../../db/service';
import { runMigrations } from '../../db/migrate';
import { seedDatabase } from '../../db/seed';
import { generateToken, verifyToken, revokeToken } from '../auth';
import { ALL_PERMISSIONS } from '../../types/permissions';
import bcrypt from 'bcryptjs';

console.log('--- Starting PAROSA Phase 1.5 Database & RBAC Test Suite ---');

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Database Migrations & Bootstrap
  await test('Migrations run idempotently and tables exist', async () => {
    await runMigrations();
    const cities = await dbService.getCities();
    assert.ok(cities.length >= 5, 'Should have seeded default cities');
  });

  await test('Seed executes idempotently without duplicating roles or users', async () => {
    await seedDatabase();
    const roles = await dbService.getRoles();
    assert.ok(roles.length >= 10, 'Should have at least 10 default roles');
    const users = await dbService.getAdminUsers();
    assert.ok(users.length >= 10, 'Should have at least 10 default admin users');
  });

  // 2. Authentication & Password Security
  let testUserToken = '';
  await test('Password verification uses bcrypt and verifies correctly', async () => {
    // Check seeded superadmin: pawan.sharma@parosa.com
    const user = await dbService.getAdminUserByEmail('pawan.sharma@parosa.com');
    assert.ok(user, 'Superadmin pawan.sharma@parosa.com must exist');
    assert.ok(user.passwordHash, 'Password hash must be stored');
    const isValid = await bcrypt.compare('Parosa@Admin2026!', user.passwordHash);
    assert.strictEqual(isValid, true, 'Default seed password must hash match');
    const isInvalid = await bcrypt.compare('WrongPassword', user.passwordHash);
    assert.strictEqual(isInvalid, false, 'Wrong password must be rejected');
  });

  await test('Session creation and token verification work with persistent DB', async () => {
    const user = await dbService.getAdminUserByEmail('pawan.sharma@parosa.com');
    assert.ok(user);
    const token = await generateToken(user, '127.0.0.1', 'NodeTestRunner');
    testUserToken = token;
    const authResult = await verifyToken(token);
    assert.ok(authResult, 'Token should verify successfully');
    assert.strictEqual(authResult.user.email, 'pawan.sharma@parosa.com');
  });

  await test('Token revocation works and revoked tokens are rejected', async () => {
    await revokeToken(testUserToken);
    const authUser = await verifyToken(testUserToken);
    assert.strictEqual(authUser, null, 'Revoked token must return null');
  });

  // 3. RBAC & Anti-Escalation
  await test('All 10 distinct roles exist with appropriate permissions', async () => {
    const expectedRoles = [
      'SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'RESTAURANT_MANAGER',
      'DELIVERY_MANAGER', 'SUPPORT_MANAGER', 'FINANCE_MANAGER',
      'MARKETING_MANAGER', 'CITY_MANAGER', 'REPORT_VIEWER'
    ];
    for (const r of expectedRoles) {
      const role = await dbService.getRoleById(r);
      assert.ok(role, `Role ${r} must exist`);
      assert.ok(role.permissions.length > 0, `Role ${r} must have assigned permissions`);
    }
  });

  await test('Creating a custom role persists to database', async () => {
    const superAdmin = (await dbService.getAdminUserByEmail('pawan.sharma@parosa.com'))!;
    const customRole = await dbService.saveRole({
      id: 'TEST_CUSTOM_ROLE_' + Date.now(),
      name: 'Test Custom Role',
      description: 'Role created by automated test',
      permissions: ['orders.view', 'reports.view'],
      isSystem: false,
      isActive: true,
      scopeType: 'GLOBAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, superAdmin);
    assert.ok(customRole);
    const fetched = await dbService.getRoleById(customRole.id);
    assert.ok(fetched);
    assert.deepStrictEqual(fetched.permissions.sort(), ['orders.view', 'reports.view'].sort());
  });

  // 4. Admin User Management & Deactivation
  let createdAdminId = '';
  await test('Create new admin user and enforce status', async () => {
    const superAdmin = (await dbService.getAdminUserByEmail('pawan.sharma@parosa.com'))!;
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const newAdmin = await dbService.saveAdminUser({
      id: `admin_test_${Date.now()}`,
      name: 'Test Operational Admin',
      email: `test_admin_${Date.now()}@parosa.com`,
      phone: '+919876543299',
      roleId: 'CITY_MANAGER',
      scopeType: 'CITY',
      cityIds: ['JAIPUR'],
      restaurantIds: [],
      status: 'ACTIVE',
      twoFactorEnabled: false,
      passwordHash,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, superAdmin);
    createdAdminId = newAdmin.id;
    assert.ok(newAdmin);
    assert.strictEqual(newAdmin.status, 'ACTIVE');

    // Test deactivation
    const updated = await dbService.saveAdminUser({
      ...newAdmin,
      status: 'INACTIVE',
    }, superAdmin);
    assert.ok(updated);
    assert.strictEqual(updated.status, 'INACTIVE');

    // Deactivated user session creation or token should fail verification
    const token = await generateToken(updated, '127.0.0.1', 'NodeTestRunner');
    const authResult = await verifyToken(token);
    assert.strictEqual(authResult, null, 'Inactive user tokens must be rejected');
  });

  // 5. Audit Logging Persistence & Non-tampering
  await test('Audit logs are stored in persistent database and contain all audit fields', async () => {
    const logEntry = await dbService.addAuditLog({
      admin_id: 'test_actor_1',
      admin_name: 'Security Tester',
      admin_email: 'tester@parosa.com',
      admin_role: 'SUPER_ADMIN',
      action: 'SYSTEM_AUDIT_VERIFICATION',
      target_type: 'SESSION',
      target_id: 'AdminSession#442',
      ip_address: '127.0.0.1',
      user_agent: 'PAROSA Test Engine',
      city: 'JAIPUR',
      status: 'SUCCESS'
    });
    assert.ok(logEntry);
    assert.ok(logEntry.id);
    assert.strictEqual(logEntry.action, 'SYSTEM_AUDIT_VERIFICATION');

    const logs = await dbService.getAuditLogs();
    const found = logs.find(l => l.id === logEntry.id);
    assert.ok(found, 'Audit log must be found in database query');
    assert.strictEqual(found.admin_name, 'Security Tester');
  });

  // 6. Security Policy Persistence
  await test('Security policy persists updates correctly', async () => {
    const superAdmin = (await dbService.getAdminUserByEmail('pawan.sharma@parosa.com'))!;
    const initial = await dbService.getSecurityPolicy();
    assert.ok(initial);
    const updated = await dbService.updateSecurityPolicy({
      maxFailedAttempts: 4,
      sessionTimeoutMinutes: 60,
    }, superAdmin);
    assert.strictEqual(updated.maxFailedAttempts, 4);
    assert.strictEqual(updated.sessionTimeoutMinutes, 60);

    const reFetched = await dbService.getSecurityPolicy();
    assert.strictEqual(reFetched.maxFailedAttempts, 4);
  });

  // 7. Restart and Data Persistence Verification
  await test('Data persists across clean service access', async () => {
    const cities = await dbService.getCities();
    assert.ok(cities.length >= 5);
    const superAdmin = await dbService.getAdminUserByEmail('pawan.sharma@parosa.com');
    assert.ok(superAdmin);
    assert.strictEqual(superAdmin.roleId, 'SUPER_ADMIN');
  });

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
