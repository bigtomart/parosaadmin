import { AdminUser, Role } from '../types/rbac';
import { dbService } from '../db/service';

export interface AuthPayload {
  userId: string;
  email: string;
  roleId: string;
  issuedAt: number;
}

export async function generateToken(
  user: AdminUser,
  ip: string = '127.0.0.1',
  userAgent: string = 'PAROSA Web Client',
  rememberMe: boolean = false
): Promise<string> {
  const policy = await dbService.getSecurityPolicy();
  const timeoutMins = rememberMe ? 1440 * 7 : policy.sessionTimeoutMinutes || 30; // 7 days if rememberMe, else policy
  const expiresAt = new Date(Date.now() + timeoutMins * 60 * 1000);

  const token = `parosa_tok_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await dbService.createSession(user.id, token, ip, userAgent, expiresAt);
  return token;
}

export async function verifyToken(token: string): Promise<{ user: AdminUser; role: Role } | null> {
  if (!token) return null;

  // Query persistent database session store
  const session = await dbService.getSession(token);
  if (!session) return null;

  if (session.isRevoked) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await dbService.revokeSession(token);
    return null;
  }

  const user = await dbService.getAdminUserById(session.adminId);
  if (!user || user.status !== 'ACTIVE') return null;

  const role = await dbService.getRoleById(user.roleId);
  if (!role || !role.isActive) return null;

  return { user, role };
}

export async function revokeToken(token: string): Promise<boolean> {
  return await dbService.revokeSession(token);
}

export async function revokeAllTokensForUser(userId: string): Promise<number> {
  return await dbService.revokeAllSessionsForUser(userId);
}
