import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  User as UserIcon,
  ShieldAlert,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Bike,
  Lock,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'orders'
  | 'restaurants'
  | 'menu'
  | 'customers'
  | 'admin-users'
  | 'roles'
  | 'audit-logs'
  | 'profile'
  | 'security';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { hasPermission } = useAuth();

  const operationsItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Live Orders', icon: ShoppingBag, badge: 'LIVE' },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
    { id: 'menu', label: 'Menu & Dishes', icon: UtensilsCrossed },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  const adminItems: { id: NavTab; label: string; icon: React.ElementType; permission: string }[] = [
    { id: 'admin-users', label: 'Admin Users', icon: Users, permission: 'users.view' },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, permission: 'roles.view' },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText, permission: 'audit_logs.view' },
  ];

  const accountItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Admin Profile', icon: UserIcon },
    { id: 'security', label: 'Security Policy', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none overflow-y-auto">
      <div className="p-4 space-y-6 flex-1">
        {/* Core Operations Section */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 font-mono">
            Platform Operations
          </div>
          {operationsItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      isActive ? 'bg-white text-rose-600' : 'bg-emerald-100 text-emerald-700 animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Administration Section */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 font-mono">
            Administration & RBAC
          </div>
          {adminItems.map((item) => {
            const Icon = item.icon;
            const allowed = hasPermission(item.permission);
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => allowed && onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : allowed
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {!allowed && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            );
          })}
        </div>

        {/* Account & Security Section */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 font-mono">
            Governance & Account
          </div>
          {accountItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Supabase Status Footer Card */}
      <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono shadow-2xs">
        <div className="flex items-center justify-between text-slate-900 font-bold mb-1">
          <span>PAROSA CLOUD</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Connected to Live Supabase (PostgreSQL)
        </p>
      </div>
    </aside>
  );
};
