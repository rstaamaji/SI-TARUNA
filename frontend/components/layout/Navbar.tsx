'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, LogOut, User, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/theme/ThemeProvider';

export interface NavbarProps {
  onMenuToggle: () => void;
  user?: {
    name: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
    avatarUrl?: string;
  };
  notificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuToggle,
  user = {
    name: 'Pengurus Taruna',
    role: 'ADMIN',
  },
}) => {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-taruna-border dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Logo on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-gray-500 hover:text-taruna-dark dark:text-slate-400 dark:hover:text-white hover:bg-taruna-surface dark:hover:bg-slate-800 lg:hidden transition"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="lg:hidden">
          <Logo size={36} showText={false} href="/" />
        </div>

        {/* Search input desktop */}
        <div className="hidden sm:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari data anggota, kas, kegiatan..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-taruna-surface dark:bg-slate-800/80 border border-taruna-border dark:border-slate-700 text-taruna-dark dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-taruna-yellow-500 focus:ring-2 focus:ring-taruna-yellow-500/20 outline-none transition"
          />
        </div>
      </div>

      {/* Right: Theme Toggle & User profile (Tanpa modul/tampilan notifikasi internal) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button (Light / Dark) */}
        <ThemeToggle />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-2xl hover:bg-taruna-surface dark:hover:bg-slate-800 border border-transparent hover:border-taruna-border dark:hover:border-slate-800 transition"
          >
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="sm"
              status="online"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-taruna-dark dark:text-white leading-none">
                {user.name}
              </span>
              <span className="text-[10px] font-semibold text-taruna-red-600 dark:text-red-400 mt-1">
                {user.role}
              </span>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-taruna-border dark:border-slate-800">
                <p className="text-sm font-bold text-taruna-dark dark:text-white truncate">{user.name}</p>
                <div className="mt-1">
                  <Badge variant={user.role === 'SUPERADMIN' ? 'warning' : user.role === 'ADMIN' ? 'accent' : 'primary'} size="sm">
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/dashboard/profil');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 rounded-xl hover:bg-taruna-surface dark:hover:bg-slate-800 hover:text-taruna-dark dark:hover:text-white transition text-left"
                >
                  <User className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  Profil Saya
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push(user.role === 'ADMIN' ? '/admin/settings' : '/dashboard/profil');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 rounded-xl hover:bg-taruna-surface dark:hover:bg-slate-800 hover:text-taruna-dark dark:hover:text-white transition text-left"
                >
                  <Settings className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  {user.role === 'ADMIN' ? 'Pengaturan Organisasi' : 'Pengaturan Akun'}
                </button>
              </div>
              <div className="pt-1 border-t border-taruna-border dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('si_taruna_token');
                      localStorage.removeItem('si_taruna_user');
                    }
                    setShowProfileMenu(false);
                    router.push('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-taruna-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left"
                >
                  <LogOut className="w-4 h-4 text-taruna-red-600 dark:text-red-400" />
                  Keluar Akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
