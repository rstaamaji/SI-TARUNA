'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Apply theme to html document
  const applyTheme = (targetTheme: Theme) => {
    const root = document.documentElement;
    let effective: 'light' | 'dark' = 'light';

    if (targetTheme === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effective = targetTheme;
    }

    if (effective === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    setResolvedTheme(effective);
  };

  useEffect(() => {
    // Read persisted theme from localStorage
    const saved = (localStorage.getItem('si_taruna_theme') as Theme) || 'light';
    setThemeState(saved);
    applyTheme(saved);
    setMounted(true);

    // Listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const current = localStorage.getItem('si_taruna_theme') as Theme;
      if (current === 'system' || !current) {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('si_taruna_theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme: mounted ? resolvedTheme : 'light',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        resolvedTheme === 'dark'
          ? 'Beralih ke Mode Terang (Light Mode)'
          : 'Beralih ke Mode Gelap (Dark Mode)'
      }
      title={
        resolvedTheme === 'dark'
          ? 'Beralih ke Mode Terang'
          : 'Beralih ke Mode Gelap'
      }
      className={cn(
        'group relative inline-flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-taruna-yellow-500/40',
        'border-taruna-border bg-white hover:bg-taruna-surface text-taruna-dark',
        'dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100',
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-taruna-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold">
          {resolvedTheme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        </span>
      )}
    </button>
  );
};
