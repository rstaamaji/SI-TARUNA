import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin text-taruna-yellow-500',
        sizes[size],
        className
      )}
    />
  );
};

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gray-200/80',
        className
      )}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl border border-taruna-border bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full rounded-2xl border border-taruna-border overflow-hidden bg-white shadow-sm">
      <div className="p-4 bg-taruna-surface border-b border-taruna-border">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const LoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Memuat data...', className }) => {
  return (
    <div
      className={cn(
        'w-full py-16 flex flex-col items-center justify-center gap-3 text-center',
        className
      )}
    >
      <div className="p-3 rounded-2xl bg-taruna-yellow-50 text-taruna-yellow-600 ring-4 ring-taruna-yellow-100/50">
        <Spinner size="lg" />
      </div>
      <p className="text-sm font-semibold text-gray-600">{message}</p>
    </div>
  );
};
