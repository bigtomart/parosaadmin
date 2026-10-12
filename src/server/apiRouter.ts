import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../db/service';
import { generateToken, revokeToken, revokeAllTokensForUser } from './auth';
import { authenticate, AuthenticatedRequest, requirePermission } from './rbacMiddleware';
import { ALL_PERMISSIONS } from '../types/permissions';
import { Role, AdminUser } from '../types/rbac';

export const apiRouter = Router();

export function sanitizeUser(user: AdminUser) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

// ==========================================
// 1. AUTHENTICATION & SESSION MANAGEMENT
// ==========================================

// Login endpoint with failed attempt protection, lockout check, and real bcrypt password validation
apiRouter.post('/auth/login', async (req, res) => {
  const { email, password, otp, rememberMe } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Email address is required.' });
  }

  const user = await dbService.getAdminUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid admin credentials or account not found.' });
  }

  // Account Lockout verification
  if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
    const remainingMins = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
    return res.status(429).json({
      error: 'ACCOUNT_LOCKED',
      message: `Account temporarily locked due to excessive failed attempts. Please retry in ${remainingMins} minutes.`,
    });
  }

  // Status check
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({
      error: 'ACCOUNT_SUSPENDED',
      message: 'This PAROSA administrator account has been deactivated or suspended.',
    });
  }

  // 2FA validation (simulated OTP verification)
  if (user.twoFactorEnabled && !otp) {
    return res.status(200).json({
      requires2FA: true,
      message: '2-Factor Authentication required. Enter the verification code sent to your registered device.',
    });
  }

  // Real bcrypt password check
  let isPasswordValid = false;
  if (user.passwordHash && password) {
    isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  }

  if (isPasswordValid) {
    await dbService.updateAdminLoginAttempts(user.id, 0, null);
  } else {
    const newFailedCount = (user.failedLoginAttempts || 0) + 1;
    let lockoutDate: Date | null = null;

    if (newFailedCount >= 5) {
      lockoutDate = new Date(Date.now() + 15 * 60000);
      await dbService.updateAdminLoginAttempts(user.id, newFailedCount, lockoutDate);

      await dbService.addAuditLog({
        admin_id: user.id,
        admin_name: user.name,
        admin_email: user.email,
        admin_role: user.roleId,
        action: 'ACCOUNT_LOCKED_FAILED_ATTEMPTS',
        target_type: 'ADMIN_USER',
        target_id: user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: (req.headers['user-agent'] as string) || 'Unknown',
        status: 'FAILED',
        error_message: 'Exceeded 5 consecutive failed login attempts.',
      });

      return res.status(429).json({
        error: 'ACCOUNT_LOCKED',
        message: 'Too many failed login attempts. Account locked for 15 minutes.',
      });
    }

    await dbService.updateAdminLoginAttempts(user.id, newFailedCount, null);
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid password.' });
  }

  const token = await generateToken(user, req.ip || '127.0.0.1', (req.headers['user-agent'] as string) || 'PAROSA Web Client', !!rememberMe);
  const role = await dbService.getRoleById(user.roleId);

  await dbService.updateAdminLastLogin(user.id, req.ip || '127.0.0.1');

  await dbService.addAuditLog({
    admin_id: user.id,
    admin_name: user.name,
    admin_email: user.email,
    admin_role: role ? role.name : user.roleId,
    action: 'LOGIN_SUCCESS',
    target_type: 'SESSION',
    target_id: user.id,
    old_value: null,
    new_value: { ip: req.ip || '127.0.0.1', rememberMe: !!rememberMe },
    ip_address: req.ip || '127.0.0.1',
    user_agent: (req.headers['user-agent'] as string) || 'Unknown',
    city: user.cityIds?.[0] || 'GLOBAL',
    status: 'SUCCESS',
  });

  res.json({
    token,
    user: sanitizeUser(user),
    role,
  });
});

// Rapid Persona Switch (For instantaneous RBAC inspection during testing)
apiRouter.post('/auth/switch-role', async (req, res) => {
  const { userId } = req.body;
  const user = await dbService.getAdminUserById(userId);
  if (!user || user.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Admin user not found or inactive.' });
  }

  const token = await generateToken(user, req.ip || '127.0.0.1', (req.headers['user-agent'] as string) || 'PAROSA Web Client');
  const role = await dbService.getRoleById(user.roleId);

  await dbService.addAuditLog({
    admin_id: user.id,
    admin_name: user.name,
    admin_email: user.email,
    admin_role: role ? role.name : user.roleId,
    action: 'PERSONA_SWITCHED',
    target_type: 'SESSION',
    target_id: user.id,
    old_value: null,
    new_value: { switchedTo: user.roleId },
    ip_address: req.ip || '127.0.0.1',
    user_agent: (req.headers['user-agent'] as string) || 'Unknown',
    city: user.cityIds?.[0] || 'GLOBAL',
    status: 'SUCCESS',
  });

  res.json({
    token,
    user: sanitizeUser(user),
    role,
  });
});

// Current user profile and authorization state
apiRouter.get('/auth/me', authenticate, async (req: AuthenticatedRequest, res) => {
  res.json({
    user: sanitizeUser(req.adminUser!),
    role: req.adminRole!,
  });
});

// Logout endpoint (Revokes current persistent session)
apiRouter.post('/auth/logout', authenticate, async (req: AuthenticatedRequest, res) => {
  if (req.authToken) {
    await revokeToken(req.authToken);
  }

  await dbService.addAuditLog({
    admin_id: req.adminUser!.id,
    admin_name: req.adminUser!.name,
    admin_email: req.adminUser!.email,
    admin_role: req.adminRole!.name,
    action: 'LOGOUT',
    target_type: 'SESSION',
    target_id: req.adminUser!.id,
    old_value: null,
    new_value: null,
    ip_address: req.ip || '127.0.0.1',
    user_agent: (req.headers['user-agent'] as string) || 'Unknown',
    city: req.adminUser!.cityIds?.[0] || 'GLOBAL',
    status: 'SUCCESS',
  });

  res.json({ message: 'Successfully logged out.' });
});

// Revoke all sessions (Logout from all devices)
apiRouter.post('/auth/logout-all', authenticate, async (req: AuthenticatedRequest, res) => {
  const count = await revokeAllTokensForUser(req.adminUser!.id);

  await dbService.addAuditLog({
    admin_id: req.adminUser!.id,
    admin_name: req.adminUser!.name,
    admin_email: req.adminUser!.email,
    admin_role: req.adminRole!.name,
    action: 'LOGOUT_ALL_DEVICES',
    target_type: 'SESSION',
    target_id: req.adminUser!.id,
    old_value: null,
    new_value: { revokedSessionsCount: count },
    ip_address: req.ip || '127.0.0.1',
    user_agent: (req.headers['user-agent'] as string) || 'Unknown',
    city: req.adminUser!.cityIds?.[0] || 'GLOBAL',
    status: 'SUCCESS',
  });

  res.json({ message: 'All active sessions revoked across devices.' });
});

// ==========================================
// 2. DASHBOARD METRICS & DIAGNOSTICS
// ==========================================

apiRouter.get('/dashboard', authenticate, requirePermission('dashboard.view'), async (_req, res) => {
  const metrics = await dbService.getPhase1DashboardMetrics();
  res.json(metrics);
});

apiRouter.get('/dashboard/metrics', authenticate, requirePermission('dashboard.view'), async (_req, res) => {
  const metrics = await dbService.getPhase1DashboardMetrics();
  res.json(metrics);
});

// Real-time Database Health Check & Status Endpoint
apiRouter.get('/database/status', authenticate, async (_req, res) => {
  try {
    const status = await dbService.getDatabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      status: 'DISCONNECTED',
      healthy: false,
      error: err.message || 'Database connection probe failed',
      checkedAt: new Date().toISOString(),
    });
  }
});

// Database Backup Endpoint (Saves snapshot of all 9 RBAC tables before migration)
apiRouter.post('/database/backup', authenticate, requirePermission('security.view'), async (_req, res) => {
  try {
    const { createDatabaseBackup } = await import('../db/backupAndMigrate');
    const backupRes = await createDatabaseBackup();
    res.json({
      success: true,
      backupPath: backupRes.backupPath,
      timestamp: backupRes.payload.timestamp,
      counts: backupRes.payload.counts,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create database backup',
    });
  }
});

// Database Restore / Reset Standard Seed State Endpoint
apiRouter.post('/database/restore', authenticate, async (req, res) => {
  try {
    const restoreResult = await dbService.restoreDatabase(req.body?.backupFilePath);
    res.json(restoreResult);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Database restore failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ==========================================
// 3. ROLE & PERMISSION MANAGEMENT
// ==========================================

apiRouter.get('/roles', authenticate, requirePermission('roles.view'), async (_req, res) => {
  const roles = await dbService.getRoles();
  res.json(roles);
});

apiRouter.get('/roles/:id', authenticate, requirePermission('roles.view'), async (req, res) => {
  const role = await dbService.getRoleById(req.params.id);
  if (!role) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Role not found.' });
  }
  res.json(role);
});

apiRouter.post('/roles', authenticate, requirePermission('roles.create'), async (req: AuthenticatedRequest, res) => {
  const { id, name, description, permissions, scopeType, allowedCities, allowedRestaurantIds } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Role ID and Name are required.' });
  }

  const existing = await dbService.getRoleById(id);
  if (existing) {
    return res.status(409).json({ error: 'CONFLICT', message: `Role with ID '${id}' already exists.` });
  }

  // Anti-Privilege Escalation Protection:
  // Non-super-admins cannot assign permissions that they do not possess
  if (req.adminRole!.id !== 'SUPER_ADMIN') {
    const actorPerms = req.adminRole!.permissions;
    const requestedPerms: string[] = permissions || [];
    const hasRoot = actorPerms.includes('*') || actorPerms.includes('*.*');

    if (!hasRoot) {
      const unauthorizedPerms = requestedPerms.filter((p) => !actorPerms.includes(p) && !actorPerms.includes(`${p.split('.')[0]}.*`));
      if (unauthorizedPerms.length > 0) {
        return res.status(403).json({
          error: 'PRIVILEGE_ESCALATION_BLOCKED',
          message: `Cannot grant permissions you do not possess: ${unauthorizedPerms.join(', ')}`,
        });
      }
    }
  }

  const newRole: Role = {
    id: id.toUpperCase().replace(/\s+/g, '_'),
    name,
    description: description || '',
    isSystem: false,
    isActive: true,
    permissions: permissions || [],
    scopeType: scopeType || 'GLOBAL',
    allowedCities: allowedCities || [],
    allowedRestaurantIds: allowedRestaurantIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await dbService.saveRole(newRole, req.adminUser!);
  res.status(201).json(saved);
});

apiRouter.put('/roles/:id', authenticate, requirePermission('roles.update'), async (req: AuthenticatedRequest, res) => {
  const existing = await dbService.getRoleById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Role not found.' });
  }

  // Prevent modifying critical system Super Admin properties if not Super Admin
  if (existing.id === 'SUPER_ADMIN' && req.adminRole!.id !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Only Super Administrators can modify the SUPER_ADMIN role.' });
  }

  // Anti-Privilege Escalation Protection
  if (req.adminRole!.id !== 'SUPER_ADMIN') {
    const actorPerms = req.adminRole!.permissions;
    const requestedPerms: string[] = req.body.permissions || [];
    const hasRoot = actorPerms.includes('*') || actorPerms.includes('*.*');

    if (!hasRoot) {
      const unauthorizedPerms = requestedPerms.filter((p) => !actorPerms.includes(p) && !actorPerms.includes(`${p.split('.')[0]}.*`));
      if (unauthorizedPerms.length > 0) {
        return res.status(403).json({
          error: 'PRIVILEGE_ESCALATION_BLOCKED',
          message: `Cannot assign permissions you do not possess: ${unauthorizedPerms.join(', ')}`,
        });
      }
    }
  }

  const updatedRole: Role = {
    ...existing,
    ...req.body,
    id: existing.id, // Immutable ID
    isSystem: existing.isSystem, // Prevent altering system status
    updatedAt: new Date().toISOString(),
  };

  const saved = await dbService.saveRole(updatedRole, req.adminUser!);
  res.json(saved);
});

apiRouter.delete('/roles/:id', authenticate, requirePermission('roles.delete'), async (req: AuthenticatedRequest, res) => {
  const existing = await dbService.getRoleById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Role not found.' });
  }

  if (existing.isSystem) {
    return res.status(400).json({ error: 'PROTECTED_SYSTEM_ROLE', message: 'Default system roles cannot be deleted.' });
  }

  try {
    const deleted = await dbService.deleteRole(req.params.id, req.adminUser!);
    if (deleted) {
      res.json({ message: `Role ${existing.name} deleted successfully.` });
    } else {
      res.status(400).json({ error: 'DELETE_FAILED', message: 'Failed to delete role.' });
    }
  } catch (err: any) {
    res.status(400).json({ error: 'DELETE_FAILED', message: err.message });
  }
});

apiRouter.get('/permissions', authenticate, requirePermission('roles.view'), (_req, res) => {
  res.json(ALL_PERMISSIONS);
});

// ==========================================
// 4. ADMIN USER MANAGEMENT
// ==========================================

apiRouter.get('/admin-users', authenticate, requirePermission('users.view'), async (_req, res) => {
  const users = await dbService.getAdminUsers();
  res.json(users.map(sanitizeUser));
});

apiRouter.get('/admin-users/:id', authenticate, requirePermission('users.view'), async (req, res) => {
  const user = await dbService.getAdminUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Admin user not found.' });
  }
  res.json(sanitizeUser(user));
});

apiRouter.post('/admin-users', authenticate, requirePermission('users.create'), async (req: AuthenticatedRequest, res) => {
  const { name, email, phone, roleId, scopeType, cityIds, restaurantIds, status, twoFactorEnabled, password } = req.body;

  if (!name || !email || !roleId) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Name, email, and role are required.' });
  }

  const existingEmail = await dbService.getAdminUserByEmail(email);
  if (existingEmail) {
    return res.status(409).json({ error: 'CONFLICT', message: `Admin with email '${email}' already exists.` });
  }

  // Anti-escalation check: Non-Super Admin cannot create Super Admin
  if (roleId === 'SUPER_ADMIN' && req.adminRole!.id !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Only Super Admins can create new Super Admin accounts.' });
  }

  const role = await dbService.getRoleById(roleId);
  if (!role) {
    return res.status(400).json({ error: 'INVALID_ROLE', message: `Specified role '${roleId}' does not exist.` });
  }

  const id = `admin_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).substring(2, 6)}`;
  const passwordHash = await bcrypt.hash(password || 'Parosa@Admin2026!', 12);

  const newUser: AdminUser = {
    id,
    name,
    email: email.toLowerCase().trim(),
    phone: phone || '',
    passwordHash,
    roleId,
    scopeType: scopeType || role.scopeType || 'GLOBAL',
    cityIds: cityIds || [],
    restaurantIds: restaurantIds || [],
    status: status || 'ACTIVE',
    twoFactorEnabled: !!twoFactorEnabled,
    failedLoginAttempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await dbService.saveAdminUser(newUser, req.adminUser!);
  res.status(201).json(sanitizeUser(saved));
});

apiRouter.patch('/admin-users/:id', authenticate, requirePermission('users.update'), async (req: AuthenticatedRequest, res) => {
  const existing = await dbService.getAdminUserById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Admin user not found.' });
  }

  // Anti-Self-Escalation Check: Admins cannot alter their own role
  if (req.params.id === req.adminUser!.id && req.body.roleId && req.body.roleId !== req.adminUser!.roleId) {
    return res.status(403).json({
      error: 'SELF_ROLE_ELEVATION_DENIED',
      message: 'Administrators are strictly prohibited from changing or escalating their own role.',
    });
  }

  // Anti-escalation: Non-Super Admin cannot assign Super Admin role
  if (req.body.roleId === 'SUPER_ADMIN' && req.adminRole!.id !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Only Super Admins can promote users to Super Admin.' });
  }

  // If modifying a Super Admin user, actor must be Super Admin
  if (existing.roleId === 'SUPER_ADMIN' && req.adminRole!.id !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Only Super Admins can modify other Super Admins.' });
  }

  const updatedUser: AdminUser = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  const saved = await dbService.saveAdminUser(updatedUser, req.adminUser!);
  res.json(sanitizeUser(saved));
});

// ==========================================
// 5. AUDIT LOGS (PERSISTENT & IMMUTABLE)
// ==========================================

apiRouter.get('/audit-logs', authenticate, requirePermission('audit_logs.view'), async (_req, res) => {
  const logs = await dbService.getAuditLogs();
  res.json(logs);
});

// ==========================================
// 6. SECURITY SETTINGS
// ==========================================

apiRouter.get('/security-settings', authenticate, requirePermission('settings.view'), async (_req, res) => {
  const policy = await dbService.getSecurityPolicy();
  res.json(policy);
});

apiRouter.patch('/security-settings', authenticate, requirePermission('settings.update'), async (req: AuthenticatedRequest, res) => {
  const updated = await dbService.updateSecurityPolicy(req.body, req.adminUser!);
  res.json(updated);
});

// ==========================================
// 7. CITIES (ACCESS SCOPES)
// ==========================================

apiRouter.get('/cities', async (_req, res) => {
  const cities = await dbService.getCities();
  res.json(cities);
});

// ==========================================
// 8. ADMIN PROFILE
// ==========================================

apiRouter.get('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = await dbService.getAdminUserById(req.adminUser!.id);
  res.json(sanitizeUser(user || req.adminUser!));
});

apiRouter.patch('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = await dbService.getAdminUserById(req.adminUser!.id);
  if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });

  const { name, phone, avatarUrl } = req.body;
  const updated: AdminUser = {
    ...user,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
    updatedAt: new Date().toISOString(),
  };

  const saved = await dbService.saveAdminUser(updated, req.adminUser!);
  res.json(sanitizeUser(saved));
});

apiRouter.post('/profile/password', authenticate, async (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Current and new passwords are required.' });
  }

  const user = await dbService.getAdminUserById(req.adminUser!.id);
  if (!user || !user.passwordHash) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Cannot verify current password.' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await dbService.updateAdminPassword(user.id, newHash, req.adminUser!);

  res.json({ message: 'Password updated successfully.' });
});
