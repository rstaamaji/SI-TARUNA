import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm';

    const variants = {
      // Yellow/Gold Primary
      primary:
        'bg-taruna-yellow-500 hover:bg-taruna-yellow-600 active:bg-taruna-yellow-700 text-white shadow-taruna-yellow-500/25 focus:ring-taruna-yellow-400',
      // Clean secondary (surface gray with border)
      secondary:
        'bg-taruna-surface dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 text-taruna-dark dark:text-slate-100 border border-taruna-border dark:border-slate-700 focus:ring-gray-300 dark:focus:ring-slate-600',
      // Red Accent
      accent:
        'bg-taruna-red-600 hover:bg-taruna-red-700 active:bg-taruna-red-800 text-white shadow-taruna-red-600/25 focus:ring-taruna-red-500',
      // Outline Yellow/Dark
      outline:
        'bg-transparent hover:bg-taruna-yellow-50 dark:hover:bg-taruna-yellow-950/40 active:bg-taruna-yellow-100 text-taruna-yellow-700 dark:text-taruna-yellow-400 border-2 border-taruna-yellow-500 focus:ring-taruna-yellow-400',
      // Ghost
      ghost:
        'bg-transparent hover:bg-taruna-surface dark:hover:bg-slate-800 text-taruna-dark dark:text-slate-200 shadow-none focus:ring-gray-300 dark:focus:ring-slate-700',
      // Danger
      danger:
        'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-taruna-red-700 dark:text-red-300 border border-taruna-red-200 dark:border-red-800/60 focus:ring-taruna-red-400',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
      md: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
      lg: 'text-base px-6 py-3 gap-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
