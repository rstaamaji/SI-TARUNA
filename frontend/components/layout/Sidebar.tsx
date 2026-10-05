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
  ChevronDown,
  ShieldCheck,
  Banknote,
  BarChart3,
  ClipboardList,
  BarChart2,
  Settings,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount?: number;
  userRole?: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
}

export interface NavSubItem {
  name: string;
  href: string;
  icon?: any;
  badge?: string | null;
  adminOnly?: boolean;
}

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  subItems?: NavSubItem[];
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
    href: '/finance',
    icon: Wallet,
    badge: null,
    subItems: [
      {
        name: 'Buku Kas Umum',
        href: '/finance',
        icon: Wallet,
      },
      {
        name: 'Pengambilan Kas',
        href: '/finance/withdrawal',
        icon: Banknote,
      },
      {
        name: 'Laporan Keuangan',
        href: '/finance/reports',
        icon: BarChart3,
      },
    ],
  },
  {
    name: 'Absensi',
    href: '/dashboard/absensi',
    icon: CalendarCheck2,
    badge: null,
  },
  {
    name: 'Kelola Absensi',
    href: '/admin/attendance',
    icon: ClipboardList,
    badge: null,
    adminOnly: true,
  },
  {
    name: 'Statistik Keaktifan',
    href: '/admin/statistics',
    icon: BarChart2,
    badge: null,
    adminOnly: true,
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
    badge: 'Superadmin',
    superAdminOnly: true, // Khusus SUPERADMIN, disembunyikan dari ADMIN & MEMBER
  },
  {
    name: 'Pengaturan',
    href: '/admin/settings',
    icon: Settings,
    badge: 'Admin',
    adminOnly: true, // Khusus ADMIN
  },
  {
    name: 'Notifikasi',
    href: '/dashboard/notifikasi',
    icon: Bell,
    badge: null,
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

  // State untuk menu yang memiliki sub-item / sub-bab
  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({
    Keuangan: true,
  });

  // Otomatis buka sub-menu jika rute aktif berada di dalamnya
  React.useEffect(() => {
    if (pathname.startsWith('/finance')) {
      setExpandedMenus((prev) => ({ ...prev, Keuangan: true }));
    }
  }, [pathname]);

  // Filter menu: sembunyikan menu superAdminOnly/adminOnly jika role tidak berhak
  const visibleItems = navigationItems.filter((item) => {
    if (item.superAdminOnly && userRole !== 'SUPERADMIN') {
      return false;
    }
    if (item.adminOnly && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
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
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-taruna-border dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 overflow-hidden',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header with Logo */}
        <div className="h-20 shrink-0 px-6 flex items-center justify-between border-b border-taruna-border dark:border-slate-800 bg-gradient-to-b from-taruna-yellow-50/40 dark:from-slate-900 to-white dark:to-slate-900">
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
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Menu Utama
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide',
                userRole === 'SUPERADMIN'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : userRole === 'ADMIN'
                  ? 'bg-taruna-red-100 dark:bg-taruna-red-950/60 text-taruna-red-700 dark:text-red-400'
                  : 'bg-taruna-yellow-100 dark:bg-taruna-yellow-950/60 text-taruna-yellow-800 dark:text-taruna-yellow-300'
              )}
            >
              {userRole === 'SUPERADMIN' ? '👑 SUPERADMIN' : userRole}
            </span>
          </div>

          {visibleItems.map((item) => {
            const hasSub = Boolean(item.subItems && item.subItems.length > 0);
            const isSubExpanded = Boolean(expandedMenus[item.name]);
            const isChildActive = hasSub && item.subItems!.some((sub) => pathname === sub.href);
            const isSelfActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isActive = isSelfActive || isChildActive;
            const Icon = item.icon;

            const badgeValue =
              item.name === 'Notifikasi' && notificationCount > 0
                ? String(notificationCount)
                : item.badge;

            // Render Accordion Item jika memiliki sub-bab / subItems
            if (hasSub) {
              return (
                <div key={item.name} className="space-y-1">
                  <div
                    onClick={() => {
                      setExpandedMenus((prev) => ({
                        ...prev,
                        [item.name]: !prev[item.name],
                      }));
                    }}
                    className={cn(
                      'group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer select-none',
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
                            item.superAdminOnly
                              ? 'bg-amber-500 text-white'
                              : item.adminOnly
                              ? 'bg-taruna-red-600 text-white'
                              : 'bg-taruna-yellow-100 dark:bg-taruna-yellow-950/60 text-taruna-yellow-800 dark:text-taruna-yellow-300'
                          )}
                        >
                          {badgeValue}
                        </span>
                      )}
                      {isSubExpanded ? (
                        <ChevronDown className="w-4 h-4 text-taruna-yellow-600 dark:text-taruna-yellow-400 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-taruna-dark dark:group-hover:text-white transition-transform duration-200" />
                      )}
                    </div>
                  </div>

                  {/* Sub-item / Sub-bab Accordion List */}
                  {isSubExpanded && (
                    <div className="pl-4 pr-1 py-1 space-y-1 ml-4 border-l-2 border-taruna-yellow-300/80 dark:border-slate-800 transition-all duration-200">
                      {item.subItems!.map((sub) => {
                        const isCurrentSubActive = pathname === sub.href;
                        const SubIcon = sub.icon;

                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            prefetch={true}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={cn(
                              'group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                              isCurrentSubActive
                                ? 'bg-taruna-yellow-500 text-white shadow-xs font-bold'
                                : 'text-gray-600 dark:text-slate-400 hover:text-taruna-dark dark:hover:text-white hover:bg-taruna-surface dark:hover:bg-slate-800'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              {SubIcon && (
                                <SubIcon
                                  className={cn(
                                    'w-3.5 h-3.5 transition-colors',
                                    isCurrentSubActive
                                      ? 'text-white'
                                      : 'text-gray-400 dark:text-slate-500 group-hover:text-taruna-yellow-600 dark:group-hover:text-taruna-yellow-400'
                                  )}
                                />
                              )}
                              <span>{sub.name}</span>
                            </div>
                            {isCurrentSubActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
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
                        item.superAdminOnly
                          ? 'bg-amber-500 text-white'
                          : item.adminOnly
                          ? 'bg-taruna-red-600 text-white'
                          : item.name === 'Pengumuman'
                          ? 'bg-taruna-red-100 dark:bg-taruna-red-950/60 text-taruna-red-700 dark:text-red-400'
                          : 'bg-taruna-yellow-100 dark:bg-taruna-yellow-950/60 text-taruna-yellow-800 dark:text-taruna-yellow-300'
                      )}
                    >
                      {badgeValue}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Organization Badge */}
        <div className="shrink-0 mt-auto p-3.5 border-t border-taruna-border dark:border-slate-800 bg-taruna-surface/80 dark:bg-slate-800/40 m-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <Logo size={36} showText={false} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-taruna-dark dark:text-white truncate">
                SI-TARUNA
              </p>
              <p className="text-[11px] font-medium text-taruna-red-600 dark:text-red-400 truncate">
                Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
