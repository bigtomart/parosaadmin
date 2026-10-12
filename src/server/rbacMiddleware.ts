import { Request, Response, NextFunction } from 'express';
import { AdminUser, Role } from '../types/rbac';
import { verifyToken } from './auth';
import { checkPermission } from '../types/permissions';
import { dbService } from '../db/service';

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
  adminRole?: Role;
  authToken?: string;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token is missing. Please sign in.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const authData = await verifyToken(token);

    if (!authData) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Administrative session has expired, been revoked, or account is inactive.',
      });
    }

    req.adminUser = authData.user;
    req.adminRole = authData.role;
    req.authToken = token;
    next();
  } catch (error) {
    console.error('[PAROSA AUTH ERROR]:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Authentication verification failure.' });
  }
}

/**
 * Validates that the authenticated admin user's role has the required permission.
 * If unauthorized, records an immutable audit log entry in PostgreSQL with status DENIED and returns 403 Forbidden.
 */
export function requirePermission(permissionId: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.adminUser;
    const role = req.adminRole;

    if (!user || !role) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required to evaluate authorization.',
      });
    }

    // Super Admin has root access
    if (role.id === 'SUPER_ADMIN' || role.permissions.includes('*') || role.permissions.includes('*.*')) {
      return next();
    }

    const hasAccess = checkPermission(role.permissions, permissionId);

    if (!hasAccess) {
      // Record failed access attempt in persistent immutable audit trail
      try {
        await dbService.addAuditLog({
          admin_id: user.id,
          admin_name: user.name,
          admin_email: user.email,
          admin_role: role.name,
          action: 'ACCESS_DENIED_ATTEMPT',
          target_type: 'PERMISSION_GATE',
          target_id: permissionId,
          old_value: { path: req.path, method: req.method },
          new_value: { deniedPermission: permissionId, userRole: role.id },
          ip_address: req.ip || '127.0.0.1',
          user_agent: (req.headers['user-agent'] as string) || 'Unknown',
          city: user.cityIds?.[0] || 'GLOBAL',
          status: 'DENIED',
          error_message: `Missing required permission: ${permissionId}`,
        });
      } catch (err) {
        console.error('[PAROSA AUDIT LOG ERROR]:', err);
      }

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access Denied: Your role (${role.name}) does not hold permission '${permissionId}'.`,
        requiredPermission: permissionId,
        userRole: role.name,
      });
    }

    next();
  };
}
