import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, ShieldAlert } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'security';
  title: string;
  message?: string;
  details?: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showError: (title: string, message?: string, details?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showForbidden: (requiredPermission: string, roleName: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, details?: string) => {
    showToast({ type: 'error', title, message, details });
  }, [showToast]);

  const showForbidden = useCallback((requiredPermission: string, roleName: string) => {
    showToast({
      type: 'security',
      title: '403 Forbidden - Access Denied',
      message: `Your current role (${roleName}) does not have permission '${requiredPermission}'.`,
      details: 'This violation was recorded in the immutable audit log.',
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, showError, showSuccess, showForbidden, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-200 flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-white border-emerald-300 text-slate-800 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-white border-rose-300 text-slate-800 shadow-rose-500/10'
                : toast.type === 'security'
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-amber-500/15'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {toast.type === 'security' && <ShieldAlert className="w-5 h-5 text-amber-600" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 leading-tight">{toast.title}</h4>
              {toast.message && <p className="text-xs mt-1 text-slate-600 leading-relaxed">{toast.message}</p>}
              {toast.details && (
                <p className="text-[11px] font-mono mt-1.5 text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300/80 inline-block">
                  {toast.details}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
