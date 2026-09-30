'use client';

import React, { useState } from 'react';
import { Menu, Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';

export interface NavbarProps {
  onMenuToggle: () => void;
  user?: {
    name: string;
    role: 'ADMIN' | 'MEMBER';
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
  notificationCount = 3,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur border-b border-taruna-border px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Logo on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-gray-500 hover:text-taruna-dark hover:bg-taruna-surface lg:hidden transition"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="lg:hidden">
          <Logo size={36} showText={false} href="/dashboard" />
        </div>

        {/* Search input desktop */}
        <div className="hidden sm:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari data anggota, kas, kegiatan..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-taruna-surface border border-taruna-border focus:bg-white focus:border-taruna-yellow-500 focus:ring-2 focus:ring-taruna-yellow-100 outline-none transition"
          />
        </div>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
            className="p-2.5 rounded-xl border border-taruna-border hover:bg-taruna-surface text-gray-600 hover:text-taruna-dark transition relative"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-taruna-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-taruna-border shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-taruna-border">
                <p className="font-bold text-sm text-taruna-dark">Notifikasi Terbaru</p>
                <span className="text-xs text-taruna-red-600 font-semibold cursor-pointer hover:underline">
                  Tandai Dibaca
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-taruna-yellow-50/60 border border-taruna-yellow-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-taruna-yellow-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-taruna-dark leading-snug">
                      Pertemuan Rutin Karang Taruna
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Minggu ini pukul 19:30 WIB di Balai Dusun</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-taruna-surface border border-taruna-border flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-taruna-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-taruna-dark leading-snug">
                      Pencatatan Jimpitan RT 02
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Iuran telah terekap Rp 145.000</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-2xl hover:bg-taruna-surface border border-transparent hover:border-taruna-border transition"
          >
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="sm"
              status="online"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-taruna-dark leading-none">
                {user.name}
              </span>
              <span className="text-[10px] font-semibold text-taruna-red-600 mt-1">
                {user.role}
              </span>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-taruna-border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-taruna-border">
                <p className="text-sm font-bold text-taruna-dark truncate">{user.name}</p>
                <div className="mt-1">
                  <Badge variant={user.role === 'ADMIN' ? 'accent' : 'primary'} size="sm">
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div className="py-1">
                <a
                  href="/dashboard/profil"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 rounded-xl hover:bg-taruna-surface hover:text-taruna-dark transition"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Profil Saya
                </a>
                <a
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 rounded-xl hover:bg-taruna-surface hover:text-taruna-dark transition"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Pengaturan
                </a>
              </div>
              <div className="pt-1 border-t border-taruna-border">
                <a
                  href="/login"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-taruna-red-600 rounded-xl hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4 text-taruna-red-600" />
                  Keluar Akun
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
