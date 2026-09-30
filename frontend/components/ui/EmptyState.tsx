import React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-taruna-border bg-taruna-surface/50',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-taruna-border flex items-center justify-center text-taruna-yellow-600 mb-4 ring-4 ring-taruna-yellow-50">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-taruna-dark">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
