import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Data',
  message,
  onRetry,
  retryText = 'Coba Lagi',
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-red-200 bg-red-50/40',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-red-100 flex items-center justify-center text-taruna-red-600 mb-4 ring-4 ring-red-100">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h4 className="text-base sm:text-lg font-bold text-taruna-dark">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-gray-600 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="accent"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
};
