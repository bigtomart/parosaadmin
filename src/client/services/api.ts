/**
 * PAROSA Admin Panel Centralized API Service
 * Handles Bearer token authentication, error formatting, and 401/403 interceptors.
 */

const API_BASE = '/api/admin';

export class ApiError extends Error {
  status: number;
  code?: string;
  requiredPermission?: string;
  userRole?: string;

  constructor(message: string, status: number, code?: string, requiredPermission?: string, userRole?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requiredPermission = requiredPermission;
    this.userRole = userRole;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('parosa_admin_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    throw new ApiError(
      errorData.message || 'An unexpected server error occurred',
      response.status,
      errorData.error,
      errorData.requiredPermission,
      errorData.userRole
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Authentication
  login: (credentials: { email: string; password?: string; otp?: string; rememberMe?: boolean }) =>
    request<{ token: string; user: any; role: any; requires2FA?: boolean; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  switchRole: (userId: string) =>
    request<{ token: string; user: any; role: any }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  getMe: () => request<{ user: any; role: any }>('/auth/me'),

  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  logoutAll: () => request<{ success: boolean; message: string }>('/auth/logout-all', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Dashboard (Phase 1)
  getDashboard: () => request<any>('/dashboard'),

  // Roles & Permissions
  getRoles: () => request<any[]>('/roles'),
  getRole: (id: string) => request<any>(`/roles/${id}`),
  createRole: (data: any) => request<any>('/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, data: any) => request<any>(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRole: (id: string) => request<any>(`/roles/${id}`, { method: 'DELETE' }),
  getPermissions: () => request<any[]>('/permissions'),

  // Admin Users
  getAdminUsers: () => request<any[]>('/admin-users'),
  getAdminUser: (id: string) => request<any>(`/admin-users/${id}`),
  createAdminUser: (data: any) => request<any>('/admin-users', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminUser: (id: string, data: any) => request<any>(`/admin-users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  activateAdminUser: (id: string) => request<any>(`/admin-users/${id}/activate`, { method: 'POST' }),
  deactivateAdminUser: (id: string) => request<any>(`/admin-users/${id}/deactivate`, { method: 'POST' }),
  forceLogoutAdminUser: (id: string) => request<any>(`/admin-users/${id}/force-logout`, { method: 'POST' }),

  // Audit Logs (Mandatory Append-Only)
  getAuditLogs: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters);
    return request<any[]>(`/audit-logs?${params.toString()}`);
  },

  // Admin Profile
  getProfile: () => request<{ user: any; role: any }>('/profile'),
  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) =>
    request<any>('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Security Policy
  getSecurityPolicy: () => request<any>('/security'),
  updateSecurityPolicy: (data: any) => request<any>('/security', { method: 'PATCH', body: JSON.stringify(data) }),

  // Cities
  getCities: () => request<any[]>('/cities'),

  // Diagnostics & Database Status
  getDatabaseStatus: () =>
    request<{
      status: 'CONNECTED' | 'DISCONNECTED';
      engine: 'POSTGRES_REMOTE' | 'POSTGRES_EMBEDDED';
      engineLabel: string;
      healthy: boolean;
      uptimeSeconds: number;
      uptimeFormatted: string;
      uptimePercentage: string;
      startTime: string;
      latencyMs: number;
      latencyRating: 'OPTIMAL' | 'GOOD' | 'HIGH';
      activeConnections: number;
      activeSessions: number;
      totalRecords: {
        adminUsers: number;
        roles: number;
        auditLogs: number;
        cities: number;
      };
      version: string;
      storagePath: string;
      checkedAt: string;
    }>('/database/status'),

  getDatabaseDiagnostics: () =>
    request<{
      status: 'CONNECTED' | 'DISCONNECTED';
      engine: 'POSTGRES_REMOTE' | 'POSTGRES_EMBEDDED';
      engineLabel: string;
      uptimeSeconds: number;
      uptimeFormatted: string;
      latencyMs: number;
      persistenceVerified: boolean;
      storagePath: string;
      counts: {
        adminUsers: number;
        roles: number;
        permissions: number;
        cities: number;
        auditLogs: number;
        activeSessions: number;
      };
      recentAdmins: { id: string; name: string; email: string; roleId: string; createdAt: string }[];
      checkedAt: string;
    }>('/diagnostics/database'),

  restoreDatabase: () =>
    request<{
      success: boolean;
      message: string;
      counts: {
        adminUsers: number;
        roles: number;
        permissions: number;
        cities: number;
        auditLogs: number;
      };
    }>('/database/restore', { method: 'POST' }),

  backupDatabase: () =>
    request<{
      success: boolean;
      backupPath: string;
      timestamp: string;
      counts: Record<string, number>;
    }>('/database/backup', { method: 'POST' }),
};
