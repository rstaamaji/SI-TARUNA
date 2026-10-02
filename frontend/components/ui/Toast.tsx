'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => {
        // Prevent duplicate toasts with the same message from stacking
        if (prev.some((t) => t.message === message && t.type === type)) {
          return prev;
        }
        // Limit max 3 visible toasts to prevent cascade flooding
        const next = [...prev, { id, type, title, message }];
        return next.length > 3 ? next.slice(-3) : next;
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title = 'Berhasil') => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((message: string, title = 'Terjadi Kesalahan') => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((message: string, title = 'Peringatan') => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((message: string, title = 'Informasi') => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const contextValue = React.useMemo(
    () => ({ toast: addToast, success, error, warning, info }),
    [addToast, success, error, warning, info]
  );

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-taruna-red-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-taruna-yellow-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
    error: 'border-taruna-red-200 bg-red-50/90 text-red-950',
    warning: 'border-amber-200 bg-amber-50/90 text-amber-950',
    info: 'border-blue-200 bg-blue-50/90 text-blue-950',
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur transition-all duration-300 transform translate-y-0',
              borders[t.type]
            )}
          >
            <div className="pt-0.5">{icons[t.type]}</div>
            <div className="flex-1 text-left">
              {t.title && <p className="font-bold text-xs uppercase tracking-wider">{t.title}</p>}
              <p className="text-sm font-medium mt-0.5 leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg hover:bg-black/5 text-gray-500 transition"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
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
