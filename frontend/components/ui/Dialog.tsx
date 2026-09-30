'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-taruna-red-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-taruna-yellow-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  };

  const iconBgs = {
    danger: 'bg-red-50 dark:bg-red-950/50 ring-red-100 dark:ring-red-900/40',
    warning: 'bg-amber-50 dark:bg-amber-950/50 ring-amber-100 dark:ring-amber-900/40',
    info: 'bg-blue-50 dark:bg-blue-950/50 ring-blue-100 dark:ring-blue-900/40',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 ring-emerald-100 dark:ring-emerald-900/40',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'accent' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 pt-1 text-left">
        <div
          className={cn(
            'p-3 rounded-2xl ring-4 shrink-0 flex items-center justify-center',
            iconBgs[variant]
          )}
        >
          {icons[variant]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base text-taruna-dark dark:text-white">{title}</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};
