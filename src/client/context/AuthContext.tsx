import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser, Role } from '../../types/rbac';
import { checkPermission } from '../../types/permissions';
import { api, ApiError } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: AdminUser | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string, otp?: string, rememberMe?: boolean) => Promise<{ requires2FA?: boolean }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchPersona: (userId: string) => Promise<void>;
  hasPermission: (permissionStr: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('parosa_admin_token')
  );
  const [loading, setLoading] = useState<boolean>(true);
  const { showSuccess, showError } = useToast();

  const loadProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('parosa_admin_token');
    if (!storedToken) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setRole(data.role);
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        localStorage.removeItem('parosa_admin_token');
        setToken(null);
        setUser(null);
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = async (email: string, password?: string, otp?: string, rememberMe?: boolean) => {
    try {
      const res = await api.login({ email, password, otp, rememberMe });
      if (res.requires2FA) {
        return { requires2FA: true };
      }
      localStorage.setItem('parosa_admin_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setRole(res.role);
      showSuccess(`Welcome to PAROSA`, `Signed in as ${res.user.name} (${res.role.name})`);
      return {};
    } catch (err: any) {
      showError('Authentication Failed', err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on teardown
    } finally {
      localStorage.removeItem('parosa_admin_token');
      setToken(null);
      setUser(null);
      setRole(null);
      showSuccess('Session Terminated', 'You have been logged out of PAROSA Admin.');
    }
  };

  const logoutAll = async () => {
    try {
      const res = await api.logoutAll();
      showSuccess('All Sessions Closed', res.message);
    } catch (err: any) {
      showError('Logout All Failed', err.message);
    } finally {
      localStorage.removeItem('parosa_admin_token');
      setToken(null);
      setUser(null);
      setRole(null);
    }
  };

  const switchPersona = async (userId: string) => {
    try {
      const res = await api.switchRole(userId);
      localStorage.setItem('parosa_admin_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setRole(res.role);
      showSuccess(
        `Switched to ${res.user.name}`,
        `Role: ${res.role.name} (${res.user.scopeType === 'GLOBAL' ? 'Global Scope' : `Scope: ${res.user.cityIds?.join(', ') || 'Territory'}`})`
      );
    } catch (err: any) {
      showError('Role Switch Failed', err.message);
    }
  };

  const hasPermission = useCallback(
    (permissionStr: string): boolean => {
      if (!role) return false;
      return checkPermission(role.permissions, permissionStr);
    },
    [role]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        login,
        logout,
        logoutAll,
        switchPersona,
        hasPermission,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
