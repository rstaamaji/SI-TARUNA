'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarCheck2,
  Megaphone,
  FileText,
  CalendarDays,
  Gift,
  Coins,
  Bell,
  UserCircle,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount?: number;
}

export const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Anggota',
    href: '/dashboard/anggota',
    icon: Users,
    badge: null,
  },
  {
    name: 'Keuangan',
    href: '/dashboard/keuangan',
    icon: Wallet,
    badge: null,
  },
  {
    name: 'Absensi',
    href: '/dashboard/absensi',
    icon: CalendarCheck2,
    badge: null,
  },
  {
    name: 'Pengumuman',
    href: '/dashboard/pengumuman',
    icon: Megaphone,
    badge: 'Baru',
  },
  {
    name: 'Notulensi',
    href: '/dashboard/notulensi',
    icon: FileText,
    badge: null,
  },
  {
    name: 'Kegiatan',
    href: '/dashboard/kegiatan',
    icon: CalendarDays,
    badge: null,
  },
  {
    name: 'Arisan',
    href: '/dashboard/arisan',
    icon: Gift,
    badge: null,
  },
  {
    name: 'Jimpitan',
    href: '/dashboard/jimpitan',
    icon: Coins,
    badge: null,
  },
  {
    name: 'Notifikasi',
    href: '/dashboard/notifikasi',
    icon: Bell,
    badge: '3',
  },
  {
    name: 'Profil',
    href: '/dashboard/profil',
    icon: UserCircle,
    badge: null,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  notificationCount = 3,
}) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-taruna-dark/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-taruna-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header with Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-taruna-border bg-gradient-to-b from-taruna-yellow-50/40 to-white">
          <Logo size={40} href="/dashboard" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-taruna-dark hover:bg-taruna-surface lg:hidden transition"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Menu Utama
          </div>

          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            const badgeValue =
              item.name === 'Notifikasi' && notificationCount > 0
                ? String(notificationCount)
                : item.badge;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  'group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                  isActive
                    ? 'bg-taruna-yellow-50 text-taruna-yellow-800 font-semibold shadow-sm border border-taruna-yellow-200/80'
                    : 'text-gray-600 hover:bg-taruna-surface hover:text-taruna-dark'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-taruna-yellow-500 text-white shadow-sm'
                        : 'text-gray-400 group-hover:text-taruna-yellow-600 group-hover:bg-taruna-yellow-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {badgeValue && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        item.name === 'Pengumuman'
                          ? 'bg-taruna-red-100 text-taruna-red-700'
                          : 'bg-taruna-yellow-100 text-taruna-yellow-800'
                      )}
                    >
                      {badgeValue}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-taruna-yellow-600" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Organization Badge */}
        <div className="p-4 border-t border-taruna-border bg-taruna-surface/80 m-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-taruna-border shadow-xs text-taruna-red-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-taruna-dark truncate">
                Karang Taruna Springin
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                Kecamatan Jumantono
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
