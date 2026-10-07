'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, LogOut, User, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
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
    <header className="sticky top-0 z-30 h-20 bg-[#304040] text-white border-b border-[#04202C] px-4 sm:px-8 flex items-center justify-between transition-colors shadow-sm">
      {/* Left: Mobile hamburger & Logo on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-white hover:bg-[#04202C]/40 lg:hidden transition"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="lg:hidden">
          {/* Logo Karang Taruna asli tidak dirubah */}
          <Logo size={36} showText={false} href="/" />
        </div>

        {/* Search input desktop */}
        <div className="hidden sm:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 text-[#C9D1C8]/70 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari data anggota, kas, kegiatan..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-[#04202C]/60 border border-[#5B7065] text-white placeholder:text-[#C9D1C8]/60 focus:bg-[#04202C] focus:border-[#C9D1C8] outline-none transition"
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
            className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-2xl hover:bg-[#04202C]/40 border border-transparent hover:border-[#5B7065]/40 transition text-white"
          >
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="sm"
              status="online"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">
                {user.name}
              </span>
              <span className="text-[10px] font-semibold text-[#C9D1C8] mt-1">
                {user.role}
              </span>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#304040] text-white border border-[#04202C] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-[#04202C]">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#04202C] text-[#C9D1C8] border border-[#5B7065]">
                    {user.role}
                  </span>
                </div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/dashboard/profil');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#C9D1C8] rounded-xl hover:bg-[#5B7065] hover:text-white transition text-left"
                >
                  <User className="w-4 h-4 text-[#C9D1C8]" />
                  Profil Saya
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push(user.role === 'ADMIN' ? '/admin/settings' : '/dashboard/profil');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#C9D1C8] rounded-xl hover:bg-[#5B7065] hover:text-white transition text-left"
                >
                  <Settings className="w-4 h-4 text-[#C9D1C8]" />
                  {user.role === 'ADMIN' ? 'Pengaturan Organisasi' : 'Pengaturan Akun'}
                </button>
              </div>
              <div className="pt-1 border-t border-[#04202C]">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-300 hover:text-red-100 rounded-xl hover:bg-red-950/50 transition text-left"
                >
                  <LogOut className="w-4 h-4 text-red-300" />
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
