import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, MapPin, Check, Sparkles } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { user, switchPersona } = useAuth();

  const personas = [
    {
      id: 'admin_pawan_super',
      name: 'Pawan (Super Admin)',
      roleTag: 'SUPER_ADMIN',
      badge: 'Root Access',
    },
    {
      id: 'admin_vikram_ops',
      name: 'Vikram (Admin)',
      roleTag: 'ADMIN',
      badge: 'Operations',
    },
    {
      id: 'admin_rajesh_alwar',
      name: 'Rajesh (Alwar City Mgr)',
      roleTag: 'CITY_MANAGER',
      badge: 'Alwar Scope',
    },
    {
      id: 'admin_rahul_orders',
      name: 'Rahul (Order Mgr)',
      roleTag: 'ORDER_MANAGER',
      badge: 'Orders only',
    },
    {
      id: 'admin_amit_finance',
      name: 'Amit (Finance Mgr)',
      roleTag: 'FINANCE_MANAGER',
      badge: 'Settlements & Refunds',
    },
    {
      id: 'admin_priya_rest',
      name: 'Priya (Restaurant Mgr)',
      roleTag: 'RESTAURANT_MANAGER',
      badge: 'Merchants & Menu',
    },
    {
      id: 'admin_aman_deliv',
      name: 'Aman (Delivery Mgr)',
      roleTag: 'DELIVERY_MANAGER',
      badge: 'Rider Fleet',
    },
    {
      id: 'admin_neha_support',
      name: 'Neha (Support Mgr)',
      roleTag: 'SUPPORT_MANAGER',
      badge: 'Disputes & Tickets',
    },
    {
      id: 'admin_karan_marketing',
      name: 'Karan (Marketing Mgr)',
      roleTag: 'MARKETING_MANAGER',
      badge: 'Coupons & Broadcasts',
    },
    {
      id: 'admin_rohit_reports',
      name: 'Rohit (Report Viewer)',
      roleTag: 'REPORT_VIEWER',
      badge: 'Read-Only Analyst',
    },
  ];

  return (
    <div className="bg-slate-100 border-b border-slate-200 text-xs text-slate-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          PAROSA RBAC Switcher
        </span>
        <span className="hidden xl:inline text-slate-500 text-[11px]">
          Instantly simulate live permission boundaries:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
        {personas.map((p) => {
          const isSelected = user?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => switchPersona(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-semibold ring-2 ring-rose-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title={`${p.name} - ${p.badge}`}
            >
              {isSelected ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <Shield className="w-3 h-3 text-slate-400" />
              )}
              <span>{p.name.split(' (')[0]}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.roleTag === 'SUPER_ADMIN'
                  ? 'Root'
                  : p.roleTag === 'CITY_MANAGER'
                  ? 'Alwar'
                  : p.roleTag.replace('_MANAGER', '').toLowerCase()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {user?.scopeType === 'CITY' ? (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
            <MapPin className="w-3 h-3 text-amber-600" />
            TERRITORY: {user.cityIds?.join(', ') || 'ALWAR'}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
            <Shield className="w-3 h-3 text-blue-600" />
            GLOBAL SCOPE
          </span>
        )}
      </div>
    </div>
  );
};
