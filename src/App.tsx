/**
 * PAROSA — Admin Panel
 * Complete Food Delivery Operations & Security Control Plane
 */

import React, { useState } from 'react';
import { ToastProvider } from './client/context/ToastContext';
import { AuthProvider, useAuth } from './client/context/AuthContext';
import { Header } from './client/components/Header';
import { Sidebar, NavTab } from './client/components/Sidebar';
import { RoleSwitcherBar } from './client/components/RoleSwitcherBar';
import { AccessDenied } from './client/components/AccessDenied';
import { ArchitectureDocsModal } from './client/components/ArchitectureDocsModal';

import { DashboardPage } from './client/pages/DashboardPage';
import { OrdersPage } from './client/pages/OrdersPage';
import { RestaurantsPage } from './client/pages/RestaurantsPage';
import { MenuPage } from './client/pages/MenuPage';
import { CustomersPage } from './client/pages/CustomersPage';
import { RolesPermissionsPage } from './client/pages/RolesPermissionsPage';
import { AdminUsersPage } from './client/pages/AdminUsersPage';
import { AuditLogsPage } from './client/pages/AuditLogsPage';
import { ProfilePage } from './client/pages/ProfilePage';
import { SecuritySettingsPage } from './client/pages/SecuritySettingsPage';
import { LoginPage } from './client/pages/LoginPage';

function AppContent() {
  const { user, loading, hasPermission } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-rose-600 border-t-transparent animate-spin"></div>
          <span>Loading PAROSA Administration Control Plane...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSuccess={() => setCurrentTab('dashboard')} />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;

      case 'orders':
        return <OrdersPage />;

      case 'restaurants':
        return <RestaurantsPage />;

      case 'menu':
        return <MenuPage />;

      case 'customers':
        return <CustomersPage />;

      case 'admin-users':
        if (!hasPermission('users.view')) {
          return (
            <AccessDenied
              requiredPermission="users.view"
              moduleName="Admin Staff & Scopes Directory"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AdminUsersPage />;

      case 'roles':
        if (!hasPermission('roles.view')) {
          return (
            <AccessDenied
              requiredPermission="roles.view"
              moduleName="Dynamic Roles & Permissions Matrix"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <RolesPermissionsPage />;

      case 'audit-logs':
        if (!hasPermission('audit_logs.view')) {
          return (
            <AccessDenied
              requiredPermission="audit_logs.view"
              moduleName="Mandatory Append-Only Audit Logs"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <AuditLogsPage />;

      case 'profile':
        return <ProfilePage />;

      case 'security':
        if (!hasPermission('settings.view')) {
          return (
            <AccessDenied
              requiredPermission="settings.view"
              moduleName="Security Policy & Hardening"
              onGoBack={() => setCurrentTab('dashboard')}
            />
          );
        }
        return <SecuritySettingsPage />;

      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <RoleSwitcherBar />
      <Header
        onOpenDocs={() => setDocsModalOpen(true)}
        onNavigate={(tab) => setCurrentTab(tab as NavTab)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {renderTabContent()}
        </main>
      </div>

      <ArchitectureDocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
