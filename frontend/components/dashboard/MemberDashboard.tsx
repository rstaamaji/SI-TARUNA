'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  CalendarCheck2,
  Gift,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Info,
  Calendar,
  BadgeCheck,
  Building2,
  Check,
  FileText,
  BookOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Logo } from '@/components/ui/Logo';

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: 'accent' | 'warning' | 'primary' | 'info';
  dueDate?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface MemberDashboardData {
  memberProfile: {
    id: string | null;
    name: string;
    memberNumber: string;
    role: string;
    gender: string;
    address: string;
    status: string;
    joinDate: string;
  };
  stats: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    totalCashBalance: number;
  };
  attentionItems: AttentionItem[];
  announcements: {
    id: string;
    title: string;
    content: string;
    type?: string;
    isAttention?: boolean;
    date: string;
    eventDate: string | null;
    author: string;
  }[];
  upcomingEvents: {
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
    dayOfWeek?: string | null;
    time?: string | null;
    location: string;
    type: string;
    myAttendance: string | null;
  }[];
  arisanSummary: {
    monthlyFee: number;
    totalPot: number;
    currentCycleMonth: number;
    currentCycleYear: number;
    nextDrawDate: string;
    nextDrawLocation: string;
    memberStatus: string;
    nearestArisan?: any;
    recentDraws: {
      id: string;
      month: number;
      year: number;
      drawDate: string | null;
      status: string;
      winnerName: string;
      winnerNumber: string;
    }[];
  };
  personalAttendance: {
    totalAttended: number;
    totalEvents: number;
    attendancePercentage: number;
    lastStatus: string;
    history: {
      id: string;
      eventId: string;
      eventTitle: string;
      eventDate: string;
      status: string;
      notes: string | null;
    }[];
  };
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }[];
  unreadNotificationsCount: number;
  latestMeetingMinute?: {
    id: string;
    title: string;
    meetingDate: string;
    dayOfWeek: string | null;
    location: string;
    meetingLeader: string;
    noteTaker: string;
    content: string;
    conclusion: string | null;
    followUp: string | null;
    author: string;
  } | null;
}

// Fallback data realistis untuk Dusun Tuk Uluh, Desa Sringin, Jumantono
const FALLBACK_DASHBOARD: MemberDashboardData = {
  memberProfile: {
    id: 'm-02',
    name: 'Anggota 2',
    memberNumber: 'KT-SB-002',
    role: 'MEMBER',
    gender: 'MALE',
    address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
    status: 'ACTIVE',
    joinDate: '2023-01-15T00:00:00.000Z',
  },
  stats: {
    totalMembers: 25,
    activeMembers: 23,
    inactiveMembers: 2,
    totalCashBalance: 6420000,
  },
  attentionItems: [
    {
      id: 'att-1',
      title: 'Batas Penyetoran Iuran Kas Wajib Oktober 2026',
      description:
        'Iuran kas pemuda sebesar Rp 10.000 wajib diserahkan kepada Bendahara Setya Bakti paling lambat tanggal 10 Oktober 2026.',
      badge: 'PENTING - KAS',
      badgeVariant: 'accent',
      dueDate: '10 Oktober 2026',
      actionLabel: 'Konfirmasi Bendahara',
      actionUrl: 'https://wa.me/6281234567801?text=Halo%20Bendahara%20Setya%20Bakti,%20saya%20ingin%20konfirmasi%20iuran%20kas',
    },
    {
      id: 'att-2',
      title: 'Pertemuan Rutin & Undian Arisan Pemuda',
      description:
        'Diharapkan hadir tepat waktu pada Minggu malam di Balai Dusun Tuk Uluh pukul 19:30 WIB. Undian arisan putaran ke-9 akan dikocok.',
      badge: 'KEGIATAN UTAMA',
      badgeVariant: 'warning',
      dueDate: '05 Oktober 2026, 19:30 WIB',
      actionLabel: 'Konfirmasi Hadir',
      actionUrl: '#kegiatan',
    },
    {
      id: 'att-3',
      title: 'Kerja Bakti Gotong Royong Dusun Tuk Uluh',
      description:
        'Pembersihan saluran air dan pengecatan gapura dusun menjelang musim hujan. Harap membawa cangkul atau sabit.',
      badge: 'GOTONG ROYONG',
      badgeVariant: 'primary',
      dueDate: '12 Oktober 2026, 06:30 WIB',
      actionLabel: 'Lihat Lokasi',
      actionUrl: '#kegiatan',
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Iuran Wajib Bulanan Periode Oktober 2026',
      content:
        'Diberitahukan kepada seluruh anggota Karang Taruna Setya Bakti bahwa iuran wajib sebesar Rp 10.000 dapat disetorkan kepada bendahara dusun paling lambat tanggal 10 Oktober 2026.',
      date: '2026-09-29T00:00:00.000Z',
      eventDate: '2026-10-10T00:00:00.000Z',
      author: 'Bendahara Setya Bakti',
    },
    {
      id: 'ann-2',
      title: 'Pelaksanaan Kerja Bakti Dusun Tuk Uluh',
      content:
        'Dalam rangka menjaga kebersihan lingkungan dan mengantisipasi musim penghujan, seluruh pemuda diharapkan hadir pada kerja bakti hari Minggu, 12 Oktober 2026 pukul 06.30 WIB dengan membawa alat kerja bakti.',
      date: '2026-09-24T00:00:00.000Z',
      eventDate: '2026-10-12T06:30:00.000Z',
      author: 'Rustam Aji (Ketua)',
    },
  ],
  upcomingEvents: [
    {
      id: 'ev-1',
      title: 'Pertemuan Rutin & Arisan Pemuda Oktober 2026',
      description:
        'Pertemuan rutin bulanan Karang Taruna Setya Bakti, evaluasi kas, dan penarikan undian arisan.',
      eventDate: '2026-10-05T12:30:00.000Z',
      location: 'Balai Dusun Tuk Uluh',
      type: 'MEETING',
      myAttendance: 'PRESENT',
    },
    {
      id: 'ev-2',
      title: 'Kerja Bakti Bersih Lingkungan Dusun',
      description:
        'Pembersihan saluran air dan pengecatan gapura Dusun Tuk Uluh menjelang musim hujan.',
      eventDate: '2026-10-12T06:30:00.000Z',
      location: 'Area Lapangan & Gapura Tuk Uluh',
      type: 'COMMUNITY_SERVICE',
      myAttendance: null,
    },
    {
      id: 'ev-3',
      title: 'Turnamen Bola Voli Antar RT Sringin',
      description: 'Pertandingan persahabatan bola voli pemuda antar RT se-Desa Sringin.',
      eventDate: '2026-10-25T15:30:00.000Z',
      location: 'Lapangan Olahraga Sringin',
      type: 'SPORTS',
      myAttendance: null,
    },
  ],
  arisanSummary: {
    monthlyFee: 20000,
    totalPot: 500000,
    currentCycleMonth: 10,
    currentCycleYear: 2026,
    nextDrawDate: '2026-10-05T12:30:00.000Z',
    nextDrawLocation: 'Balai Dusun Tuk Uluh',
    memberStatus: 'BELUM_DAPAT',
    recentDraws: [
      {
        id: 'ar-1',
        month: 9,
        year: 2026,
        drawDate: '2026-09-10T19:30:00.000Z',
        status: 'WON',
        winnerName: 'Anggota 3',
        winnerNumber: 'KT-SB-003',
      },
      {
        id: 'ar-2',
        month: 8,
        year: 2026,
        drawDate: '2026-08-10T19:30:00.000Z',
        status: 'WON',
        winnerName: 'Anggota 2',
        winnerNumber: 'KT-SB-002',
      },
      {
        id: 'ar-3',
        month: 7,
        year: 2026,
        drawDate: '2026-07-10T19:30:00.000Z',
        status: 'WON',
        winnerName: 'Rustam Aji',
        winnerNumber: 'KT-SB-001',
      },
    ],
  },
  personalAttendance: {
    totalAttended: 3,
    totalEvents: 3,
    attendancePercentage: 100,
    lastStatus: 'PRESENT',
    history: [
      {
        id: 'att-h-1',
        eventId: 'ev-1',
        eventTitle: 'Pertemuan Rutin & Arisan Pemuda Oktober',
        eventDate: '2026-10-05T19:30:00.000Z',
        status: 'PRESENT',
        notes: 'Hadir tepat waktu',
      },
      {
        id: 'att-h-2',
        eventId: 'ev-prev-1',
        eventTitle: 'Rapat Pleno Penyusunan Rencana Kerja September',
        eventDate: '2026-09-10T19:30:00.000Z',
        status: 'PRESENT',
        notes: null,
      },
      {
        id: 'att-h-3',
        eventId: 'ev-prev-2',
        eventTitle: 'Peringatan HUT Kemerdekaan RI di Balai Dusun',
        eventDate: '2026-08-17T08:00:00.000Z',
        status: 'PRESENT',
        notes: 'Panitia Lomba',
      },
    ],
  },
  notifications: [
    {
      id: 'notif-1',
      title: 'Pengingat Iuran Kas Oktober',
      message: 'Jangan lupa untuk melunasi iuran wajib kas bulanan sebelum tanggal 10 Oktober 2026.',
      type: 'FINANCE',
      isRead: false,
      createdAt: '2026-09-30T10:00:00.000Z',
    },
    {
      id: 'notif-2',
      title: 'Pertemuan Rutin Minggu Ini',
      message: 'Pertemuan bulanan Karang Taruna Setya Bakti dijadwalkan pada hari Minggu, 05 Oktober 2026 di Balai Dusun.',
      type: 'EVENT',
      isRead: false,
      createdAt: '2026-09-29T14:30:00.000Z',
    },
    {
      id: 'notif-3',
      title: 'Selamat! Pemenang Arisan September',
      message: 'Arisan periode September 2026 telah diserahkan kepada Anggota 3. Terima kasih atas partisipasinya.',
      type: 'INFO',
      isRead: true,
      createdAt: '2026-09-15T20:00:00.000Z',
    },
  ],
  unreadNotificationsCount: 2,
  latestMeetingMinute: {
    id: 'mm-1',
    title: 'Rapat Pleno & Evaluasi Program Kerja September 2026',
    meetingDate: '2026-09-10T19:30:00.000Z',
    dayOfWeek: 'Kamis',
    location: 'Balai Dusun Tuk Uluh, Desa Sringin',
    meetingLeader: 'Rustam Aji (Ketua Karang Taruna)',
    noteTaker: 'Siti Nurhaliza (Sekretaris)',
    content: 'Pembahasan evaluasi kas keuangan, kesepakatan jadwal kerja bakti saluran air, dan partisipasi turnamen voli antardusun.',
    conclusion: 'Laporan kas disetujui, kerja bakti disepakati 12 Oktober 2026, dan subsidi tim voli disetujui.',
    followUp: 'Seksi perlengkapan menyiapkan alat kerja bakti, seksi olahraga mengadakan seleksi pemain.',
    author: 'Siti Nurhaliza',
  },
};

export const MemberDashboard: React.FC = () => {
  const toast = useToast();
  const [data, setData] = useState<MemberDashboardData>(FALLBACK_DASHBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rsvpState, setRsvpState] = useState<Record<string, boolean>>({
    'ev-1': true,
  });

  // Dynamic API base and token retrieval
  const getApiBase = () => {
    return typeof window !== 'undefined' && window.location.hostname
      ? `http://${window.location.hostname}:5000/api`
      : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';
  };

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('si_taruna_token');
  };

  // Filter only upcoming events (today or later) and sort nearest first.
  // Expired events are automatically excluded.
  const activeUpcomingEvents = useMemo(() => {
    if (!data?.upcomingEvents || !Array.isArray(data.upcomingEvents)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.upcomingEvents
      .filter((event) => {
        const evDate = new Date(event.eventDate);
        return !isNaN(evDate.getTime()) && evDate.getTime() >= today.getTime();
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [data?.upcomingEvents]);

  // Load dashboard data from API with fallback
  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/member/dashboard`, { headers });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setData(json.data);
      } else {
        // Use fallback if response not success
        setData(FALLBACK_DASHBOARD);
      }
    } catch {
      // Offline / network fallback
      setData(FALLBACK_DASHBOARD);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle RSVP confirmation
  const handleRsvp = (eventId: string, eventTitle: string) => {
    setRsvpState((prev) => {
      const current = !!prev[eventId];
      const next = !current;
      if (next) {
        toast.success(`Konfirmasi kehadiran berhasil untuk "${eventTitle}"!`);
      } else {
        toast.info(`Status kehadiran dibatalkan untuk "${eventTitle}".`);
      }
      return { ...prev, [eventId]: next };
    });
  };

  // Format currency IDR
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER PROFIL ANGGOTA & KARTU SELAMAT DATANG
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-white via-white to-taruna-yellow-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 p-6 sm:p-8 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <Logo size={60} showText={false} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-taruna-yellow-700 dark:text-taruna-yellow-400">
                  Dashboard Anggota
                </span>
                <span className="text-gray-300 dark:text-slate-700">•</span>
                <Badge variant="primary" size="sm">
                  {data.memberProfile.memberNumber}
                </Badge>
                <Badge variant="success" size="sm" dot>
                  {data.memberProfile.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
                Halo, {data.memberProfile.name}! 👋
              </h1>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-taruna-yellow-600 dark:text-taruna-yellow-400" />
                  {data.memberProfile.address}
                </span>
                <span className="hidden sm:inline text-gray-300 dark:text-slate-700">•</span>
                <span className="inline-flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Karang Taruna Setya Bakti
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <Button
              variant="secondary"
              size="sm"
              isLoading={isLoading}
              onClick={fetchDashboard}
            >
              Segarkan
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Calendar className="w-4 h-4" />}
              onClick={() => {
                const el = document.getElementById('kegiatan-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Jadwal Kegiatan
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. SECTION "ATTENTION / INFORMASI PENTING"
          (Highlight informasi penting yang membutuhkan perhatian segera dari anggota)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-taruna-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-taruna-dark dark:text-white tracking-tight">
                Attention / Informasi Penting
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Pemberitahuan mendesak yang memerlukan tindakan atau kehadiran Anda
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-taruna-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/40">
            {data.attentionItems.length} Perlu Diperhatikan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.attentionItems.map((item) => (
            <div
              key={item.id}
              className="relative p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-200/80 dark:border-red-900/50 shadow-xs hover:border-red-400 dark:hover:border-red-700/80 transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant={item.badgeVariant} size="sm">
                    {item.badge}
                  </Badge>
                  {item.dueDate && (
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-500" />
                      {item.dueDate}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-taruna-dark dark:text-white group-hover:text-taruna-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.actionLabel && (
                <div className="pt-3 border-t border-taruna-border/60 dark:border-slate-800 flex items-center justify-between">
                  <a
                    href={item.actionUrl || '#'}
                    target={item.actionUrl?.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="text-xs font-bold text-taruna-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition"
                  >
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                  {item.actionUrl?.startsWith('http') && (
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. STATISTIK UTAMA RINGKAS (SEDERHANA DAN MUDAH DIPAHAMI)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Total Anggota */}
        <Card hoverable>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Total Anggota
            </span>
            <div className="p-2.5 rounded-2xl bg-taruna-yellow-50 dark:bg-slate-800 ring-2 ring-black/5 dark:ring-white/10 text-taruna-yellow-600 dark:text-taruna-yellow-400">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
              {data.stats.totalMembers} Pemuda
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {data.stats.activeMembers} Anggota Aktif Dusun
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Saldo Kas */}
        <Card hoverable>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo Kas Organisasi
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 ring-2 ring-black/5 dark:ring-white/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
              {formatRupiah(data.stats.totalCashBalance)}
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
              Transparan & Terbuka untuk Anggota
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Status Absensi Pribadi */}
        <Card hoverable>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Kehadiran Pribadi
            </span>
            <div className="p-2.5 rounded-2xl bg-taruna-red-50 dark:bg-slate-800 ring-2 ring-black/5 dark:ring-white/10 text-taruna-red-600 dark:text-red-400">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
              {data.personalAttendance.attendancePercentage}%
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {data.personalAttendance.totalAttended} dari {data.personalAttendance.totalEvents} Kegiatan Diikuti
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. DUA KOLOM UTAMA: KEGIATAN TERDEKAT & JADWAL ARISAN
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="kegiatan-section">
        {/* Card: Kegiatan Terdekat */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-taruna-yellow-50 dark:bg-slate-800 text-taruna-yellow-700 dark:text-taruna-yellow-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Kegiatan Terdekat</CardTitle>
                <CardDescription>
                  Agenda resmi pemuda Dusun Tuk Uluh •{' '}
                  <Link
                    href="/dashboard/kegiatan"
                    className="text-taruna-yellow-600 dark:text-taruna-yellow-400 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    Buka Kalender Lengkap <ChevronRight className="w-3 h-3" />
                  </Link>
                </CardDescription>
              </div>
            </div>
            <Badge variant="primary" dot>
              Aktif
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {activeUpcomingEvents.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-taruna-border dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                <CalendarCheck2 className="w-10 h-10 text-gray-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Belum Ada Agenda Terdekat</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
                  Semua kegiatan sebelumnya telah selesai atau belum ada jadwal kegiatan baru yang diagendakan.
                </p>
              </div>
            ) : (
              activeUpcomingEvents.map((event) => {
                const isRsvpd = !!rsvpState[event.id];
              return (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl border border-taruna-border dark:border-slate-800 bg-taruna-surface/50 dark:bg-slate-800/40 hover:bg-taruna-surface dark:hover:bg-slate-800 transition flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-taruna-dark dark:text-white">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        event.type === 'MEETING'
                          ? 'primary'
                          : event.type === 'COMMUNITY_SERVICE'
                          ? 'success'
                          : event.type === 'ARISAN'
                          ? 'warning'
                          : event.type === 'SOCIAL'
                          ? 'accent'
                          : event.type === 'TARUNA'
                          ? 'primary'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {event.type === 'MEETING'
                        ? 'Rapat'
                        : event.type === 'COMMUNITY_SERVICE'
                        ? 'Kerja Bakti'
                        : event.type === 'ARISAN'
                        ? 'Arisan'
                        : event.type === 'SOCIAL'
                        ? 'Kegiatan Sosial'
                        : event.type === 'TARUNA'
                        ? 'Karang Taruna'
                        : event.type === 'SPORTS'
                        ? 'Olahraga'
                        : 'Lainnya'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-taruna-yellow-600 dark:text-taruna-yellow-400" />
                      {event.dayOfWeek || new Date(event.eventDate).toLocaleDateString('id-ID', { weekday: 'long' })},{' '}
                      {new Date(event.eventDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • <strong className="text-taruna-dark dark:text-slate-200">{event.time || '19:30 WIB'}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-taruna-red-600 dark:text-red-400" />
                      {event.location}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-taruna-border/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Konfirmasi Anda:{' '}
                      <strong className={isRsvpd ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                        {isRsvpd ? '✓ Pasti Hadir' : 'Belum Konfirmasi'}
                      </strong>
                    </span>
                    <Button
                      variant={isRsvpd ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleRsvp(event.id, event.title)}
                    >
                      {isRsvpd ? 'Batal Hadir' : 'Saya Akan Hadir'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
          </CardContent>
        </Card>

        {/* Card: Arisan Terdekat (Module 20) */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Arisan Terdekat</CardTitle>
                <CardDescription>
                  Putaran Arisan Periode {data.arisanSummary.currentCycleMonth} / {data.arisanSummary.currentCycleYear} •{' '}
                  <Link
                    href="/dashboard/arisan"
                    className="text-amber-700 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    Buka Jadwal Arisan <ChevronRight className="w-3 h-3" />
                  </Link>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm" dot>
                UPCOMING
              </Badge>
              <Badge variant="warning">
                Rp {formatRupiah(data.arisanSummary.totalPot)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Box Arisan Terdekat Info */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-950/30 dark:to-slate-800/60 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Arisan {data.arisanSummary.nearestArisan?.monthName || 'Oktober'} {data.arisanSummary.currentCycleYear}
                  </span>
                  <p className="text-base font-black text-taruna-dark dark:text-white mt-0.5">
                    Penerima: <span className="text-amber-700 dark:text-amber-400">{data.arisanSummary.nearestArisan?.recipientName || 'Anggota 05'}</span>
                  </p>
                </div>
                <Badge variant="warning" size="sm" dot>
                  Status: UPCOMING
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-2 border-t border-amber-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Tanggal:{' '}
                    <strong className="text-taruna-dark dark:text-white">
                      {new Date(data.arisanSummary.nextDrawDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">
                    Tempat:{' '}
                    <strong className="text-taruna-dark dark:text-white">
                      {data.arisanSummary.nextDrawLocation || 'Rumah Anggota 05'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Box Status Pribadi Arisan */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border/80 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Status Undian Anda:</span>
                <strong className="text-taruna-dark dark:text-white text-sm font-bold block mt-0.5">
                  {data.arisanSummary.memberStatus === 'BELUM_DAPAT'
                    ? 'Belum Mendapatkan Undian'
                    : 'Sudah Pernah Menerima Undian'}
                </strong>
                <span className="text-[11px] text-gray-400">
                  Iuran bulanan: {formatRupiah(data.arisanSummary.monthlyFee)} / anggota
                </span>
              </div>
              <Link
                href="/dashboard/arisan"
                className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-bold transition shrink-0"
              >
                Lihat Jadwal
              </Link>
            </div>

            {/* Riwayat Pemenang Sebelumnya */}
            <div>
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Penerima Putaran Terakhir
              </span>
              <div className="divide-y divide-taruna-border/60 dark:divide-slate-800 border border-taruna-border/60 dark:border-slate-800 rounded-2xl overflow-hidden">
                {data.arisanSummary.recentDraws.map((draw) => (
                  <div
                    key={draw.id}
                    className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-taruna-yellow-100 dark:bg-slate-800 text-taruna-yellow-800 dark:text-taruna-yellow-400 font-bold flex items-center justify-center text-[10px]">
                        B{draw.month}
                      </span>
                      <div>
                        <p className="font-bold text-taruna-dark dark:text-white">{draw.winnerName}</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">{draw.winnerNumber}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Telah Diterima
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. PENGUMUMAN TERBARU & STATUS ABSENSI PRIBADI
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Pengumuman Terbaru */}
        <Card id="pengumuman-section">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-taruna-red-50 dark:bg-slate-800 text-taruna-red-600 dark:text-red-400">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Pengumuman Terbaru</CardTitle>
                <CardDescription>Kabar dan edaran resmi pengurus Setya Bakti</CardDescription>
              </div>
            </div>
            <Badge variant="accent" size="sm">
              Terbaru
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-taruna-yellow-300 dark:hover:border-taruna-yellow-500/50 transition flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ann.isAttention && (
                      <Badge variant="accent" size="sm" dot>
                        ATTENTION
                      </Badge>
                    )}
                    {ann.type && (
                      <Badge
                        variant={
                          ann.type === 'RAPAT'
                            ? 'primary'
                            : ann.type === 'KERJA_BAKTI'
                            ? 'success'
                            : ann.type === 'ARISAN'
                            ? 'warning'
                            : ann.type === 'INFORMASI'
                            ? 'info'
                            : ann.type === 'LAINNYA'
                            ? 'neutral'
                            : 'info'
                        }
                        size="sm"
                      >
                        {ann.type === 'KERJA_BAKTI' ? 'Kerja Bakti' : ann.type}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500 whitespace-nowrap">
                    {new Date(ann.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-taruna-dark dark:text-white leading-snug">
                  {ann.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  {ann.content}
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 border-t border-taruna-border/50 dark:border-slate-800">
                  <span>
                    Diterbitkan oleh: <strong className="text-taruna-dark dark:text-slate-200">{ann.author}</strong>
                  </span>
                  <a
                    href="/dashboard/pengumuman"
                    className="text-taruna-yellow-700 dark:text-taruna-yellow-400 font-semibold inline-flex items-center gap-0.5 cursor-pointer hover:underline"
                  >
                    Selengkapnya <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card: Status Absensi Pribadi */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Status Absensi Pribadi</CardTitle>
                <CardDescription>Riwayat kehadiran Anda pada kegiatan pemuda</CardDescription>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {data.personalAttendance.attendancePercentage}% Kehadiran
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-taruna-surface dark:bg-slate-800/40 border border-taruna-border dark:border-slate-800">
              <div>
                <span className="text-xs text-gray-500 dark:text-slate-400 block">Total Agenda</span>
                <span className="text-lg font-black text-taruna-dark dark:text-white">
                  {data.personalAttendance.totalEvents}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-slate-400 block">Hadir</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {data.personalAttendance.totalAttended}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-slate-400 block">Izin / Alpha</span>
                <span className="text-lg font-black text-taruna-yellow-600 dark:text-taruna-yellow-400">
                  {data.personalAttendance.totalEvents - data.personalAttendance.totalAttended}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                Riwayat Terakhir
              </span>
              {data.personalAttendance.history.map((hist) => (
                <div
                  key={hist.id}
                  className="p-3 rounded-xl border border-taruna-border/60 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-taruna-dark dark:text-white">{hist.eventTitle}</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">
                      {new Date(hist.eventDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {hist.notes ? ` • ${hist.notes}` : ''}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      hist.status === 'PRESENT'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : hist.status === 'EXCUSED'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {hist.status === 'PRESENT' ? 'HADIR' : hist.status === 'EXCUSED' ? 'IZIN' : 'ALPHA'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. DOKUMENTASI & NOTULENSI RAPAT TERBARU
      ───────────────────────────────────────────────────────────────────────────── */}
      {data.latestMeetingMinute && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Notulensi Rapat Terbaru</CardTitle>
                <CardDescription>Catatan resmi keputusan pleno dan tindak lanjut kegiatan</CardDescription>
              </div>
            </div>
            <Link
              href="/dashboard/notulensi"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Lihat Seluruh Arsip Notulensi <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant="primary" size="sm">
                      {data.latestMeetingMinute.dayOfWeek || 'Rapat Pleno'}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {new Date(data.latestMeetingMinute.meetingDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-gray-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {data.latestMeetingMinute.location}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-taruna-dark dark:text-white leading-snug">
                    {data.latestMeetingMinute.title}
                  </h3>
                </div>

                <Link
                  href={`/dashboard/notulensi/${data.latestMeetingMinute.id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Buka Dokumen Lengkap
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-taruna-border/60 dark:border-slate-700">
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block">Pimpinan Rapat:</span>
                  <strong className="text-gray-700 dark:text-slate-200">{data.latestMeetingMinute.meetingLeader}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block">Notulis:</span>
                  <strong className="text-gray-700 dark:text-slate-200">{data.latestMeetingMinute.noteTaker}</strong>
                </div>
              </div>

              {data.latestMeetingMinute.conclusion && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold flex items-center gap-1 mb-0.5 text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Kesimpulan Rapat:
                  </span>
                  <p className="line-clamp-2 leading-relaxed opacity-95">
                    {data.latestMeetingMinute.conclusion}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
