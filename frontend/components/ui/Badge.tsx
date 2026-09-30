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
    primary: 'bg-taruna-yellow-100 text-taruna-yellow-800 border-taruna-yellow-200',
    // Red Accent
    accent: 'bg-taruna-red-100 text-taruna-red-800 border-taruna-red-200',
    // Green Success
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    // Amber Warning
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    // Blue Info
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    // Neutral Gray
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    // Outline
    outline: 'bg-transparent text-taruna-dark border-taruna-border',
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
