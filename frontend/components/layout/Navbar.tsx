'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, Search, LogOut, User, Settings, ArrowRight, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/theme/ThemeProvider';
import api from '@/services/api';

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
  notificationCount = 0,
}) => {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Dynamic live notifications
  const [liveUnreadCount, setLiveUnreadCount] = useState<number>(notificationCount);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  const fetchNavbarNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      if (res.data?.data) {
        setRecentNotifs(res.data.data.notifications || []);
        setLiveUnreadCount(res.data.data.unreadCount ?? 0);
      }
    } catch {
      // Keep existing count if network unavailable
    }
  }, []);

  useEffect(() => {
    fetchNavbarNotifications();

    const handleRealtimeEvent = (event: any) => {
      const data = event.detail;
      setLiveUnreadCount((prev) => prev + 1);
      if (data) {
        setRecentNotifs((prev) => [
          {
            id: data.id || `notif-${Date.now()}`,
            title: data.title,
            message: data.message,
            type: data.type || 'ANNOUNCEMENT',
            link: data.link || '/dashboard/pengumuman',
            isRead: false,
            createdAt: data.createdAt || new Date().toISOString(),
          },
          ...prev.slice(0, 4),
        ]);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('si_taruna_notification', handleRealtimeEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('si_taruna_notification', handleRealtimeEvent);
      }
    };
  }, [fetchNavbarNotifications]);

  const handleToggleNotifMenu = () => {
    const nextState = !showNotifMenu;
    setShowNotifMenu(nextState);
    setShowProfileMenu(false);
    if (nextState) {
      fetchNavbarNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setLiveUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      setLiveUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleItemClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif.id}/read`);
        setLiveUnreadCount((c) => Math.max(0, c - 1));
        setRecentNotifs((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      // optimistic update
    }
    setShowNotifMenu(false);
    if (notif.link) {
      router.push(notif.link);
    } else {
      router.push('/dashboard/notifikasi');
    }
  };

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

      {/* Right: Theme Toggle, Notifications & User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button (Light / Dark) */}
        <ThemeToggle />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={handleToggleNotifMenu}
            className="p-2.5 rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-taruna-surface dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-taruna-dark dark:hover:text-white transition relative"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {liveUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-taruna-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {liveUnreadCount > 9 ? '9+' : liveUnreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-taruna-border dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-taruna-dark dark:text-white">Notifikasi</p>
                  {liveUnreadCount > 0 && (
                    <Badge variant="accent" size="sm" className="text-[10px] px-1.5 py-0">
                      {liveUnreadCount} Baru
                    </Badge>
                  )}
                </div>
                {liveUnreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-taruna-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tandai Dibaca
                  </button>
                )}
              </div>

              {/* Notification Items */}
              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                {recentNotifs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500 dark:text-slate-400">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-1 opacity-50" />
                    Tidak ada notifikasi baru
                  </div>
                ) : (
                  recentNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-2.5 border ${
                        notif.isRead
                          ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 border-transparent'
                          : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-50/70'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          notif.isRead ? 'bg-gray-300 dark:bg-slate-600' : 'bg-blue-600 ring-2 ring-blue-300'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-snug line-clamp-1 ${
                            notif.isRead
                              ? 'font-medium text-gray-700 dark:text-slate-300'
                              : 'font-bold text-gray-900 dark:text-white'
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View all footer */}
              <div className="mt-3 pt-3 border-t border-taruna-border dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    router.push('/dashboard/notifikasi');
                  }}
                  className="w-full py-2 text-xs font-bold text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <span>Lihat Semua Notifikasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
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
                  <Badge variant={user.role === 'ADMIN' ? 'accent' : 'primary'} size="sm">
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
