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
  ShieldCheck,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount?: number;
  userRole?: 'ADMIN' | 'MEMBER';
}

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
  adminOnly?: boolean;
}

export const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Anggota',
    href: '/admin/members',
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
    name: 'Kelola Pengurus',
    href: '/dashboard/pengurus',
    icon: ShieldCheck,
    badge: 'Admin',
    adminOnly: true, // Khusus ADMIN, disembunyikan dari MEMBER
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
  userRole = 'MEMBER',
}) => {
  const pathname = usePathname();

  // Filter menu: sembunyikan menu adminOnly jika bukan ADMIN
  const visibleItems = navigationItems.filter((item) => {
    if (item.adminOnly && userRole !== 'ADMIN') {
      return false;
    }
    return true;
  });

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
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-taruna-border dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header with Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-taruna-border dark:border-slate-800 bg-gradient-to-b from-taruna-yellow-50/40 dark:from-slate-900 to-white dark:to-slate-900">
          <Logo size={42} href="/" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-taruna-dark dark:hover:text-white hover:bg-taruna-surface dark:hover:bg-slate-800 lg:hidden transition"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Menu Utama
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                userRole === 'ADMIN'
                  ? 'bg-taruna-red-100 dark:bg-taruna-red-950/60 text-taruna-red-700 dark:text-red-400'
                  : 'bg-taruna-yellow-100 dark:bg-taruna-yellow-950/60 text-taruna-yellow-800 dark:text-taruna-yellow-300'
              )}
            >
              {userRole}
            </span>
          </div>

          {visibleItems.map((item) => {
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
                    ? 'bg-taruna-yellow-50 dark:bg-taruna-yellow-500/15 text-taruna-yellow-800 dark:text-taruna-yellow-400 font-semibold shadow-xs border border-taruna-yellow-200/80 dark:border-taruna-yellow-500/30'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-taruna-surface dark:hover:bg-slate-800 hover:text-taruna-dark dark:hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-taruna-yellow-500 text-white shadow-xs'
                        : 'text-gray-400 dark:text-slate-500 group-hover:text-taruna-yellow-600 dark:group-hover:text-taruna-yellow-400 group-hover:bg-taruna-yellow-50 dark:group-hover:bg-slate-800'
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
                        item.adminOnly
                          ? 'bg-taruna-red-600 text-white'
                          : item.name === 'Pengumuman'
                          ? 'bg-taruna-red-100 dark:bg-taruna-red-950/60 text-taruna-red-700 dark:text-red-400'
                          : 'bg-taruna-yellow-100 dark:bg-taruna-yellow-950/60 text-taruna-yellow-800 dark:text-taruna-yellow-300'
                      )}
                    >
                      {badgeValue}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-taruna-yellow-600 dark:text-taruna-yellow-400" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Organization Badge */}
        <div className="p-3.5 border-t border-taruna-border dark:border-slate-800 bg-taruna-surface/80 dark:bg-slate-800/40 m-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <Logo size={36} showText={false} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-taruna-dark dark:text-white truncate">
                Karang Taruna Setya Bakti
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                Tuk Uluh, Sringin, Jumantono
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
