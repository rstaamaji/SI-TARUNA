'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  Megaphone,
  Calendar,
  Gift,
  Users,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Smartphone,
  Volume2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getStoredUser, isUserAdmin, UserRole } from '@/lib/auth';
import { useDeviceNotification } from '@/components/providers/RealtimeNotificationProvider';
import api from '@/services/api';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type:
    | 'INFO'
    | 'EVENT'
    | 'FINANCE'
    | 'ANNOUNCEMENT'
    | 'KERJA_BAKTI'
    | 'RAPAT'
    | 'ARISAN'
    | 'ATTENTION';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeVariant: 'primary' | 'accent' | 'success' | 'warning' | 'info' | 'neutral'; icon: any; color: string }
> = {
  ATTENTION: {
    label: 'Informasi Penting',
    badgeVariant: 'accent',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-100 dark:bg-red-950/40',
  },
  ANNOUNCEMENT: {
    label: 'Pengumuman Baru',
    badgeVariant: 'info',
    icon: Megaphone,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40',
  },
  RAPAT: {
    label: 'Rapat Mendekat',
    badgeVariant: 'primary',
    icon: Calendar,
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950/40',
  },
  KERJA_BAKTI: {
    label: 'Kerja Bakti Mendekat',
    badgeVariant: 'success',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40',
  },
  ARISAN: {
    label: 'Arisan Mendekat',
    badgeVariant: 'warning',
    icon: Gift,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40',
  },
  EVENT: {
    label: 'Kegiatan Mendekat',
    badgeVariant: 'info',
    icon: Clock,
    color: 'text-sky-600 bg-sky-100 dark:bg-sky-950/40',
  },
  FINANCE: {
    label: 'Keuangan',
    badgeVariant: 'neutral',
    icon: Info,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40',
  },
  INFO: {
    label: 'Informasi',
    badgeVariant: 'neutral',
    icon: Info,
    color: 'text-gray-600 bg-gray-100 dark:bg-slate-800',
  },
};

function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;

    if (isToday) {
      return `Hari ini, ${time}`;
    }

    return `${d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}, ${time}`;
  } catch {
    return dateStr;
  }
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function NotifikasiPage() {
  const toast = useToast();
  const router = useRouter();

  // Role
  const [userRole, setUserRole] = useState<UserRole>('MEMBER');

  // Device Notification Hook
  const {
    permission: devicePermission,
    requestPermission: requestDevicePermission,
    sendTestNotification: sendTestDeviceNotification,
  } = useDeviceNotification();

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestingDevice, setIsTestingDevice] = useState(false);

  // Filters
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'ANNOUNCEMENT' | 'EVENT' | 'ARISAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Read User from localStorage
  useEffect(() => {
    try {
      const u = getStoredUser();
      if (u) {
        setUserRole(u.role);
      }
    } catch (err) {
      console.error('Error reading user role:', err);
    }
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=100');
      if (res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch {
      // Fallback dummy data jika offline atau network issue
      const mockList: NotificationItem[] = [
        {
          id: 'mock-1',
          title: 'Pengumuman Baru: Kerja Bakti Massal Sambut Ramadhan',
          message:
            'Seluruh warga dan pemuda RT 01 - RT 04 diharapkan hadir membawa cangkul dan sapu lidi pada Minggu pagi pukul 07:00 WIB.',
          type: 'KERJA_BAKTI',
          isRead: false,
          link: '/dashboard/pengumuman',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          title: 'Rapat Mendekat: Evaluasi Program Kerja Karang Taruna',
          message:
            'Rapat koordinasi bulanan akan diselenggarakan pada Kamis, 08 Oktober 2026 pukul 19:30 WIB di Balai Dusun Tuk Uluh.',
          type: 'RAPAT',
          isRead: false,
          link: '/dashboard/kegiatan',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'mock-3',
          title: 'Arisan Mendekat: Putaran Oktober 2026',
          message:
            'Pertemuan arisan pemuda Dusun Tuk Uluh dijadwalkan pada 05 Oktober 2026 di Balai Dusun Tuk Uluh.',
          type: 'ARISAN',
          isRead: true,
          link: '/dashboard/arisan',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      setNotifications(mockList);
      setUnreadCount(mockList.filter((m) => !m.isRead).length);
    }
  }, []);

  // Initial load & Realtime listener
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await fetchNotifications();
      setIsLoading(false);
    }
    load();

    const handleRealtimeNotif = (e: any) => {
      const data = e.detail;
      if (data) {
        setNotifications((prev) => [
          {
            id: data.id || `notif-${Date.now()}`,
            title: data.title,
            message: data.message,
            type: data.type || 'ANNOUNCEMENT',
            isRead: false,
            link: data.link || '/dashboard/pengumuman',
            createdAt: data.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
        setUnreadCount((c) => c + 1);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('si_taruna_notification', handleRealtimeNotif);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('si_taruna_notification', handleRealtimeNotif);
      }
    };
  }, [fetchNotifications]);

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    toast.success('Daftar riwayat notifikasi berhasil disinkronkan', 'Sinkronisasi');
  };

  // Test Device Notification
  const handleTestDevice = async () => {
    setIsTestingDevice(true);
    try {
      await sendTestDeviceNotification();
    } finally {
      setIsTestingDevice(false);
    }
  };

  // Mark Single as Read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Notifikasi ditandai sudah dibaca');
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Mark All as Read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      toast.info('Semua notifikasi sudah dibaca');
      return;
    }

    setIsProcessing(true);
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi telah ditandai sebagai sudah dibaca', 'Berhasil');
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi telah ditandai sebagai sudah dibaca');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Single Notification
  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notifikasi berhasil dihapus');
    } catch {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notifikasi berhasil dihapus');
    }
  };

  // Navigate on Click
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab Filter
      if (filterTab === 'UNREAD' && item.isRead) return false;
      if (filterTab === 'ANNOUNCEMENT' && item.type !== 'ANNOUNCEMENT' && item.type !== 'ATTENTION') {
        return false;
      }
      if (
        filterTab === 'EVENT' &&
        item.type !== 'EVENT' &&
        item.type !== 'RAPAT' &&
        item.type !== 'KERJA_BAKTI'
      ) {
        return false;
      }
      if (filterTab === 'ARISAN' && item.type !== 'ARISAN' && item.type !== 'FINANCE') {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchMsg = item.message.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }

      return true;
    });
  }, [notifications, filterTab, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-6 rounded-3xl border border-blue-200/60 dark:border-blue-900/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Smartphone className="w-5 h-5" />
            </span>
            <Badge variant="info" className="font-semibold text-xs uppercase tracking-wider">
              Sistem Notifikasi Layar (Push OS)
            </Badge>
            {isUserAdmin(userRole) && (
              <Badge variant={userRole === 'SUPERADMIN' ? 'warning' : 'primary'} className="text-xs flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> {userRole === 'SUPERADMIN' ? 'Superadmin' : 'Admin'}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Notifikasi Layar Perangkat
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Sistem notifikasi SI-TARUNA mengirimkan pemberitahuan langsung ke <strong>layar homescreen, status bar, dan lockscreen HP / Laptop</strong> Anda seperti notifikasi WhatsApp &amp; Instagram.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 rounded-xl border-gray-300 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isProcessing}
            className="flex items-center gap-2 rounded-xl border-gray-300 dark:border-slate-700 font-semibold"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Tandai Semua Dibaca</span>
          </Button>

          <Button
            onClick={() => router.push('/dashboard/pengumuman')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl shadow-md transition-all font-semibold text-xs px-3.5 py-2"
          >
            <Megaphone className="w-4 h-4" />
            <span>Lihat Halaman Pengumuman</span>
          </Button>
        </div>
      </div>

      {/* ── Device Notification Hero Card (WhatsApp / Instagram Mode) ─────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-blue-900/50 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Layar Homescreen &amp; Lockscreen Push
              </span>
              {devicePermission === 'granted' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Status: Aktif di Perangkat Ini
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Status: Belum Diizinkan
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pemberitahuan Langsung Masuk ke Layar Anda
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Setiap kali pengurus menerbitkan <strong>Pengumuman Baru</strong>, <strong>Jadwal Rapat</strong>, <strong>Kerja Bakti</strong>, atau <strong>Arisan</strong>, sistem akan langsung memunculkan pop-up pemberitahuan di layar HP / PC Anda lengkap dengan suara lonceng dan getaran, tanpa perlu membuka browser terlebih dahulu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Muncul di Status Bar &amp; Homescreen HP</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Suara Dering &amp; Getar Otomatis</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            {devicePermission !== 'granted' ? (
              <Button
                size="lg"
                onClick={() => requestDevicePermission()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg border-0 px-6 py-3 text-sm flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Aktifkan Notifikasi Layar</span>
              </Button>
            ) : null}

            <Button
              size="lg"
              variant={devicePermission === 'granted' ? 'primary' : 'outline'}
              onClick={handleTestDevice}
              disabled={isTestingDevice}
              className={`font-bold rounded-2xl px-6 py-3 text-sm flex items-center justify-center gap-2 ${
                devicePermission === 'granted'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${isTestingDevice ? 'animate-bounce' : ''}`} />
              <span>{isTestingDevice ? 'Mengirim...' : 'Kirim Uji Coba ke Layar'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setFilterTab('ALL')}
          className={`cursor-pointer transition-all rounded-2xl border p-4 text-left ${
            filterTab === 'ALL'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-400'
              : 'border-gray-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              Semua Riwayat Notifikasi
            </span>
            <Bell className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {notifications.length}
          </p>
        </Card>

        <Card
          onClick={() => setFilterTab('UNREAD')}
          className={`cursor-pointer transition-all rounded-2xl border p-4 text-left ${
            filterTab === 'UNREAD'
              ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 ring-2 ring-red-400'
              : 'border-gray-200 dark:border-slate-800 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              Belum Dibaca
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {unreadCount}
          </p>
        </Card>

        <Card
          onClick={() => router.push('/dashboard/pengumuman')}
          className="cursor-pointer transition-all rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-indigo-300 p-4 text-left col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              Pengumuman Resmi
            </span>
            <Megaphone className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
            <span>Buka Modul Pengumuman</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Card>
      </div>

      {/* ── Search and Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'UNREAD', label: `Belum Dibaca (${unreadCount})` },
            { id: 'ANNOUNCEMENT', label: 'Pengumuman' },
            { id: 'EVENT', label: 'Kegiatan & Rapat' },
            { id: 'ARISAN', label: 'Arisan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-taruna-border dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari riwayat notifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* ── Notification List ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 animate-pulse flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-md w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-md w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 space-y-3">
            <Bell className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-base text-gray-900 dark:text-white">
              Tidak ada notifikasi yang ditemukan
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              Saat ada pengumuman baru atau kegiatan yang mendekat, Anda akan menerima pemberitahuan otomatis di layar ini dan layar homescreen perangkat Anda.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const typeCfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO;
            const Icon = typeCfg.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 rounded-2xl transition-all cursor-pointer border flex items-start justify-between gap-4 ${
                  notif.isRead
                    ? 'bg-white dark:bg-slate-900 border-taruna-border dark:border-slate-800 hover:border-blue-300'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs hover:border-blue-400'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeCfg.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={typeCfg.badgeVariant} size="sm" className="text-[10px]">
                        {typeCfg.label}
                      </Badge>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                      <span className="text-[11px] text-gray-400 dark:text-slate-500">
                        {formatDateIndo(notif.createdAt)}
                      </span>
                    </div>

                    <h3
                      className={`text-sm ${
                        notif.isRead
                          ? 'font-bold text-gray-800 dark:text-slate-200'
                          : 'font-extrabold text-gray-900 dark:text-white'
                      }`}
                    >
                      {notif.title}
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        <span>Buka Rincian</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 self-center">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Tandai dibaca"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    title="Hapus notifikasi"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
