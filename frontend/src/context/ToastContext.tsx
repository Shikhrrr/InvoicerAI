import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => addToast('success', message, title), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast('error', message, title, 6000), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast('warning', message, title, 5000), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast('info', message, title), [addToast]);

  const contextValue = useMemo(
    () => ({
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [addToast, removeToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast rendering container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 font-hand">
        {toasts.map((toast) => {
          const cardStyles = {
            success: 'bg-white border-2 border-slate-900 text-slate-900 shadow-doodle',
            error: 'bg-red-50 border-2 border-red-600 text-slate-900 shadow-[3px_3px_0px_#dc2626]',
            warning: 'bg-yellow-50 border-2 border-slate-900 text-slate-900 shadow-doodle',
            info: 'bg-blue-50 border-2 border-blue-600 text-slate-900 shadow-[3px_3px_0px_#2563eb]',
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-doodle ${cardStyles[toast.type]} transition-all animate-in slide-in-from-bottom-2 duration-200 relative`}
            >
              {/* Tape on top */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-yellow-200/90 border border-slate-900 -rotate-1 shadow-xs pointer-events-none" />
              {icons[toast.type]}
              <div className="flex-1 text-sm">
                {toast.title && <p className="font-heading font-bold text-base mb-0.5">{toast.title}</p>}
                <p className="font-hand text-slate-800 leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-500 hover:text-red-600 p-1 rounded-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
