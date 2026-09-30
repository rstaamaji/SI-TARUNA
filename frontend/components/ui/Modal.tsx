'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOutsideClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOutsideClick = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => closeOnOutsideClick && onClose()}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-taruna-border dark:border-slate-800 z-10 transition-all transform scale-100 overflow-hidden flex flex-col max-h-[90vh]',
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-taruna-border dark:border-slate-800">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-taruna-dark dark:text-white leading-snug">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-taruna-dark dark:hover:text-white hover:bg-taruna-surface dark:hover:bg-slate-800 transition"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto text-sm text-gray-600 dark:text-slate-300 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 bg-taruna-surface dark:bg-slate-800/80 border-t border-taruna-border dark:border-slate-800 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
