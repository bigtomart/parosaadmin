import React from 'react';
import { ShieldAlert, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccessDeniedProps {
  requiredPermission: string;
  moduleName?: string;
  onGoBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission,
  moduleName,
  onGoBack,
}) => {
  const { role, user, switchPersona } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white border border-rose-200 rounded-3xl p-8 shadow-xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>

        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 mb-2">403 Forbidden: Access Denied</h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Your current administrative account (<span className="text-slate-900 font-bold">{user?.name}</span>) with role{' '}
          <span className="text-rose-700 font-mono font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            [{role?.name}]
          </span>{' '}
          lacks the necessary permission to access{' '}
          <span className="text-slate-900 font-bold">{moduleName || 'this module'}</span>.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left mb-6 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span>Required Permission:</span>
            <span className="text-rose-700 font-bold px-2 py-0.5 rounded bg-rose-100/70 border border-rose-200">
              {requiredPermission}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Enforcement Engine:</span>
            <span className="text-emerald-700 font-bold">Backend Express RBAC Middleware</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Audit Trail Entry:</span>
            <span className="text-amber-800 font-bold">RECORDED (Status: DENIED)</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => switchPersona('admin_pawan_super')}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Switch to Super Admin (Pawan Sharma)
          </button>

          {onGoBack && (
            <button
              onClick={onGoBack}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Previous Section
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
