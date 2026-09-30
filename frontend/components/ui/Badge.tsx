import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'primary'
    | 'accent'
    | 'success'
    | 'warning'
    | 'info'
    | 'neutral'
    | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    // Yellow/Gold Primary
    primary:
      'bg-taruna-yellow-100 dark:bg-taruna-yellow-950/60 text-taruna-yellow-800 dark:text-taruna-yellow-300 border-taruna-yellow-200 dark:border-taruna-yellow-800/60',
    // Red Accent
    accent:
      'bg-taruna-red-100 dark:bg-taruna-red-950/60 text-taruna-red-800 dark:text-taruna-red-300 border-taruna-red-200 dark:border-taruna-red-800/60',
    // Green Success
    success:
      'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    // Amber Warning
    warning:
      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    // Blue Info
    info:
      'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    // Neutral Gray
    neutral:
      'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700',
    // Outline
    outline:
      'bg-transparent text-taruna-dark dark:text-slate-200 border-taruna-border dark:border-slate-700',
  };

  const dotColors = {
    primary: 'bg-taruna-yellow-500',
    accent: 'bg-taruna-red-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-400',
    outline: 'bg-gray-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
};
