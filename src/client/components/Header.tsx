import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  BookOpen,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronDown,
  Lock,
  ExternalLink,
  MapPin,
  Settings,
  KeyRound,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  onOpenDocs: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDocs, onNavigate }) => {
  const { user, role, logout, logoutAll } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadgeStyle = (roleId?: string) => {
    switch (roleId) {
      case 'SUPER_ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ADMIN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CITY_MANAGER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FINANCE_MANAGER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ORDER_MANAGER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Branding Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-500/20 text-white font-extrabold text-base tracking-wider">
          P
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-base tracking-tight">PAROSA</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 uppercase">
              Phase 1 Core
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">Central Operations & Security Control Plane</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Architecture Spec Button */}
        <button
          onClick={onOpenDocs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden md:inline">Phase 1 Blueprint & Spec</span>
          <span className="md:hidden">Spec</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs transition-colors relative cursor-pointer"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>
        </div>

        {/* Profile Card & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer shadow-xs"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Administrator'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                    role?.id
                  )}`}
                >
                  {role?.name || 'Super Admin'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs animate-fadeIn"
              onClick={() => setDropdownOpen(false)}
            >
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-slate-500 text-[11px] truncate font-mono">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    Role: {role?.name}
                  </span>
                  {user?.scopeType === 'CITY' ? (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      City: {user.cityIds?.join(', ') || 'Alwar'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Scope: Global
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => onNavigate('profile')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  My Admin Profile
                </button>
                <button
                  onClick={() => onNavigate('security')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  Security Policy & Settings
                </button>
                <button
                  onClick={onOpenDocs}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                  View Architecture Blueprint
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={logoutAll}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer text-left"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Logout All Devices
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
