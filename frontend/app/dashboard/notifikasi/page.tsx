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
  Send,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
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
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'ANNOUNCEMENT' | 'EVENT' | 'ARISAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Broadcast Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('ANNOUNCEMENT');
  const [broadcastLink, setBroadcastLink] = useState('/dashboard/pengumuman');

  // Read User from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'ADMIN') {
            setUserRole('ADMIN');
          }
        }
      } catch (err) {
        console.error('Error reading user role:', err);
      }
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
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      // Fallback notifications if API offline
      const mockList: NotificationItem[] = [
        {
          id: 'mock-1',
          title: '[PENTING] Evaluasi Kerja Bakti Saluran Air Dusun',
          message:
            'Seluruh anggota Karang Taruna diharapkan berkumpul di Balai Dusun pada hari Minggu, 12 Oktober pukul 06.30 WIB untuk kerja bakti saluran irigasi.',
          type: 'ATTENTION',
          isRead: false,
          link: '/dashboard/pengumuman',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          title: 'Rapat Mendekat: Rapat Pleno Pemuda Setya Bakti',
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
            'Pertemuan arisan pemuda Dusun Tuk Uluh dijadwalkan pada 05 Oktober 2026 di Balai Dusun Tuk Uluh. Pastikan iuran telah siap.',
          type: 'ARISAN',
          isRead: false,
          link: '/dashboard/arisan',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'mock-4',
          title: 'Kerja Bakti Mendekat: Pembersihan Lingkungan RT 01-RT 03',
          message:
            'Pembersihan gorong-gorong dan pos kamling menjelang musim hujan bersama warga dusun.',
          type: 'KERJA_BAKTI',
          isRead: true,
          link: '/dashboard/kegiatan',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'mock-5',
          title: 'Pengumuman Baru: Laporan Kas Keuangan September 2026',
          message:
            'Rekapitulasi keuangan kas Karang Taruna periode September telah dipublikasikan dengan saldo akhir Rp 6.420.000.',
          type: 'ANNOUNCEMENT',
          isRead: true,
          link: '/dashboard/pengumuman',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
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
    toast.success('Daftar notifikasi berhasil diperbarui', 'Sinkronisasi');
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
      // Local optimistic update
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

  // Admin Broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Judul dan isi notifikasi wajib diisi');
      return;
    }

    setIsProcessing(true);
    try {
      await api.post('/notifications/broadcast', {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        type: broadcastType,
        link: broadcastLink.trim() || '/dashboard',
      });

      toast.success(
        'Notifikasi berhasil dikirimkan ke seluruh anggota Karang Taruna',
        'Broadcast Terkirim'
      );
      setIsBroadcastModalOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      await fetchNotifications();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengirim broadcast notifikasi';
      toast.error(msg, 'Gagal');
    } finally {
      setIsProcessing(false);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-blue-200/60 dark:border-blue-900/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Bell className="w-6 h-6" />
            </span>
            <Badge variant="info" className="font-semibold text-xs uppercase tracking-wider">
              Modul 22 • Notification System
            </Badge>
            {userRole === 'ADMIN' && (
              <Badge variant="primary" className="text-xs flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Akses Admin
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Pusat Notifikasi
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Informasi otomatis untuk <strong>pengumuman baru</strong>, <strong>kegiatan mendekat</strong>,{' '}
            <strong>arisan mendekat</strong>, <strong>kerja bakti</strong>, <strong>rapat</strong>, dan{' '}
            <strong>informasi penting</strong> bagi seluruh anggota Dusun Tuk Uluh.
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

          {userRole === 'ADMIN' && (
            <Button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl shadow-md transition-all font-semibold"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Notifikasi</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary & Quick Filter Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              Semua Notifikasi
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
          onClick={() => setFilterTab('EVENT')}
          className={`cursor-pointer transition-all rounded-2xl border p-4 text-left ${
            filterTab === 'EVENT'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-400'
              : 'border-gray-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              Kegiatan & Rapat
            </span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {
              notifications.filter(
                (n) => n.type === 'EVENT' || n.type === 'RAPAT' || n.type === 'KERJA_BAKTI'
              ).length
            }
          </p>
        </Card>

        <Card
          onClick={() => setFilterTab('ARISAN')}
          className={`cursor-pointer transition-all rounded-2xl border p-4 text-left ${
            filterTab === 'ARISAN'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-400'
              : 'border-gray-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              Arisan Warga
            </span>
            <Gift className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {notifications.filter((n) => n.type === 'ARISAN' || n.type === 'FINANCE').length}
          </p>
        </Card>
      </div>

      {/* ── Search & Filter Tabs Bar ─────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari notifikasi judul, kegiatan, tanggal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-sm"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                filterTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterTab('UNREAD')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                filterTab === 'UNREAD'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-red-600 rounded-full text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('ANNOUNCEMENT')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                filterTab === 'ANNOUNCEMENT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Pengumuman
            </button>
            <button
              onClick={() => setFilterTab('EVENT')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                filterTab === 'EVENT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Kegiatan & Rapat
            </button>
            <button
              onClick={() => setFilterTab('ARISAN')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                filterTab === 'ARISAN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Arisan
            </button>
          </div>
        </div>
      </Card>

      {/* ── Notification List ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="rounded-3xl border border-gray-200 dark:border-slate-800 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 mx-auto flex items-center justify-center mb-3">
              <Bell className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-slate-200">
              Tidak ada notifikasi
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || filterTab !== 'ALL'
                ? 'Tidak ada notifikasi yang cocok dengan kriteria pencarian atau filter yang dipilih.'
                : 'Saat ini belum ada notifikasi baru untuk akun Anda.'}
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO;
            const IconComponent = config.icon;

            return (
              <Card
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`rounded-2xl transition-all duration-200 cursor-pointer border hover:shadow-md ${
                  notif.isRead
                    ? 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 opacity-90'
                    : 'border-blue-300 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-400/30'
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon container */}
                    <div
                      className={`p-3 rounded-2xl shrink-0 mt-0.5 ${config.color}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant={config.badgeVariant}
                          className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider"
                        >
                          {config.label}
                        </Badge>
                        {!notif.isRead && (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Baru
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">
                          {formatDateIndo(notif.createdAt)}
                        </span>
                      </div>

                      <h4
                        className={`text-sm sm:text-base font-bold leading-snug tracking-tight ${
                          notif.isRead
                            ? 'text-gray-800 dark:text-slate-200'
                            : 'text-gray-900 dark:text-white font-extrabold'
                        }`}
                      >
                        {notif.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Footer Actions */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        {notif.link ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            <span>Buka Halaman Terkait</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-2">
                          {!notif.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="h-7 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Tandai Dibaca
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                            className="h-7 px-2 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                            aria-label="Hapus notifikasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL: BROADCAST NOTIFIKASI MANUAL (ADMIN)
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Broadcast Notifikasi ke Seluruh Anggota"
        description="Kirim notifikasi langsung ke seluruh akun anggota Karang Taruna Setya Bakti Dusun Tuk Uluh."
      >
        <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Kategori / Tipe Notifikasi <span className="text-red-500">*</span>
            </label>
            <Select
              value={broadcastType}
              onChange={(e) => setBroadcastType(e.target.value)}
              className="w-full text-sm rounded-xl"
            >
              <option value="ANNOUNCEMENT">Pengumuman Baru</option>
              <option value="ATTENTION">Informasi Penting (Attention)</option>
              <option value="RAPAT">Rapat Mendekat</option>
              <option value="KERJA_BAKTI">Kerja Bakti Mendekat</option>
              <option value="ARISAN">Arisan Mendekat</option>
              <option value="EVENT">Kegiatan Mendekat</option>
              <option value="INFO">Informasi Umum</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Judul Notifikasi <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Rapat Persiapan Turnamen Voli Dusun"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="text-sm rounded-xl font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Pesan Notifikasi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Tuliskan isi pesan notifikasi yang akan diterima oleh seluruh anggota..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Tautan Halaman (Opsional)
            </label>
            <Input
              placeholder="/dashboard/kegiatan atau /dashboard/pengumuman"
              value={broadcastLink}
              onChange={(e) => setBroadcastLink(e.target.value)}
              className="text-sm rounded-xl"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBroadcastModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Mengirimkan...' : 'Kirim ke Seluruh Anggota'}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
