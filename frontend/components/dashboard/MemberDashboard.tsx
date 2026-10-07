'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  CalendarCheck2,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  BadgeCheck,
  Building2,
  Check,
  FileText,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  const [data, setData] = useState<MemberDashboardData>(FALLBACK_DASHBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
          PALETTE INDICATOR BAR (SIDEBAR #163E4F • HEADER #466060 • BG #D6DDD5 • ISI #6A8578)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F] shadow-sm flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D6DDD5] animate-pulse" />
            Tema Warna Aktif:
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#163E4F] text-white font-medium border border-[#466060]">
              Sidebar: #163E4F
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#466060] text-white font-medium border border-[#163E4F]">
              Header / Utama: #466060
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#D6DDD5] text-[#163E4F] font-bold">
              Background: #D6DDD5
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#6A8578] text-white font-medium border border-[#466060]">
              Isinya: #6A8578
            </span>
          </div>
        </div>
        <span className="text-[11px] text-[#D6DDD5]/80 italic">
          (Logo Karang Taruna tetap asli &amp; orisinil)
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER PROFIL ANGGOTA & KARTU SELAMAT DATANG (BAGIAN UTAMA #466060)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#466060] text-white p-6 sm:p-8 rounded-3xl border border-[#163E4F] shadow-lg transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Logo Karang Taruna ASLI & TIDAK DIRUBAH */}
            <Logo size={60} showText={false} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D6DDD5]">
                  Dashboard Anggota
                </span>
                <span className="text-[#D6DDD5]/60">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
                  {data.memberProfile.memberNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6A8578] text-white border border-[#163E4F] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {data.memberProfile.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Halo, {data.memberProfile.name}! 👋
              </h1>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-[#D6DDD5] flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#D6DDD5]" />
                  {data.memberProfile.address}
                </span>
                <span className="hidden sm:inline text-[#D6DDD5]/60">•</span>
                <span className="inline-flex items-center gap-1 text-[#D6DDD5]">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
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
              className="bg-[#6A8578] hover:bg-[#163E4F] text-white border-[#163E4F] hover:border-[#6A8578] transition shadow-sm"
            >
              Segarkan
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. SECTION "ATTENTION / INFORMASI PENTING"
          (Isinya menggunakan warna #6A8578)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F] shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#163E4F] tracking-tight">
                Attention / Informasi Penting
              </h2>
              <p className="text-xs text-[#163E4F]/80">
                Pemberitahuan mendesak yang memerlukan tindakan atau kehadiran Anda
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-white bg-[#466060] px-3 py-1 rounded-full border border-[#163E4F] shadow-sm">
            {data.attentionItems.length} Perlu Diperhatikan
          </span>
        </div>

        {data.attentionItems.length === 0 ? (
          <div className="p-6 rounded-2xl border border-[#466060] bg-[#6A8578] text-white text-center flex flex-col items-center justify-center shadow-md">
            <CheckCircle2 className="w-8 h-8 text-[#D6DDD5] mb-1.5" />
            <p className="text-sm font-bold text-white">Tidak Ada Pemberitahuan Penting</p>
            <p className="text-xs text-[#D6DDD5] mt-0.5">Semua kewajiban, arisan, dan kegiatan Anda telah terselesaikan dengan baik.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.attentionItems.map((item) => (
              <div
                key={item.id}
                className="relative p-5 rounded-2xl bg-[#6A8578] text-white border border-[#466060] hover:border-[#163E4F] shadow-md hover:shadow-lg transition-all flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#466060] text-white border border-[#163E4F]">
                      {item.badge}
                    </span>
                    {item.dueDate && (
                      <span className="text-[11px] font-semibold text-[#D6DDD5] inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D6DDD5]" />
                        {item.dueDate}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-[#D6DDD5] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#D6DDD5] mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.actionLabel && (
                  <div className="pt-3 border-t border-[#466060] flex items-center justify-between">
                    <a
                      href={item.actionUrl || '#'}
                      target={item.actionUrl?.startsWith('http') ? '_blank' : '_self'}
                      rel="noreferrer"
                      className="text-xs font-bold text-white hover:text-[#D6DDD5] inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#D6DDD5]" />
                    </a>
                    {item.actionUrl?.startsWith('http') && (
                      <ExternalLink className="w-3.5 h-3.5 text-[#D6DDD5]" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. STATISTIK UTAMA RINGKAS (ISINYA #6A8578)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Total Anggota */}
        <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-md hover:shadow-lg">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Total Anggota
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {data.stats.totalMembers} Pemuda
            </div>
            <p className="text-xs font-semibold text-[#D6DDD5] mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              {data.stats.activeMembers} Anggota Aktif Dusun
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Saldo Kas */}
        <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-md hover:shadow-lg">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Saldo Kas Organisasi
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <Wallet className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiah(data.stats.totalCashBalance)}
            </div>
            <p className="text-xs font-semibold text-[#D6DDD5] mt-1">
              Transparan &amp; Terbuka untuk Anggota
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Status Absensi Pribadi */}
        <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-md hover:shadow-lg">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Kehadiran Pribadi
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {data.personalAttendance.attendancePercentage}%
            </div>
            <p className="text-xs font-semibold text-[#D6DDD5] mt-1 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              {data.personalAttendance.totalAttended} dari {data.personalAttendance.totalEvents} Kegiatan Diikuti
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. STATUS ABSENSI PRIBADI & DOKUMENTASI NOTULENSI (ISINYA #6A8578)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 ${data.latestMeetingMinute ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Card: Status Absensi Pribadi */}
        <Card className="!bg-[#6A8578] text-white border-[#466060] shadow-md">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-white">Status Absensi Pribadi</CardTitle>
                <CardDescription className="text-[#D6DDD5]">Riwayat kehadiran Anda pada kegiatan pemuda</CardDescription>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#466060] text-white border border-[#163E4F]">
              {data.personalAttendance.attendancePercentage}% Kehadiran
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-[#466060] border border-[#163E4F] text-white">
              <div>
                <span className="text-xs text-[#D6DDD5] block">Total Agenda</span>
                <span className="text-lg font-black text-white">
                  {data.personalAttendance.totalEvents}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#D6DDD5] block">Hadir</span>
                <span className="text-lg font-black text-emerald-300">
                  {data.personalAttendance.totalAttended}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#D6DDD5] block">Izin / Alpha</span>
                <span className="text-lg font-black text-amber-300">
                  {data.personalAttendance.totalEvents - data.personalAttendance.totalAttended}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider block">
                Riwayat Terakhir
              </span>
              {data.personalAttendance.history.map((hist) => (
                <div
                  key={hist.id}
                  className="p-3 rounded-xl border border-[#163E4F] bg-[#466060] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{hist.eventTitle}</p>
                    <p className="text-[11px] text-[#D6DDD5]">
                      {new Date(hist.eventDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {hist.notes ? ` • ${hist.notes}` : ''}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      hist.status === 'PRESENT'
                        ? 'bg-[#163E4F] text-emerald-300 border border-emerald-500/40'
                        : hist.status === 'EXCUSED'
                        ? 'bg-[#163E4F] text-amber-300 border border-amber-500/40'
                        : 'bg-[#163E4F] text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {hist.status === 'PRESENT' ? 'HADIR' : hist.status === 'EXCUSED' ? 'IZIN' : 'ALPHA'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card: Dokumentasi & Notulensi Rapat Terbaru */}
        {data.latestMeetingMinute && (
          <Card className="!bg-[#6A8578] text-white border-[#466060] shadow-md">
            <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-white">Notulensi Rapat Terbaru</CardTitle>
                  <CardDescription className="text-[#D6DDD5]">Catatan resmi keputusan pleno dan tindak lanjut kegiatan</CardDescription>
                </div>
              </div>
              <Link
                href="/dashboard/notulensi"
                className="text-xs font-bold text-[#D6DDD5] hover:text-white hover:underline inline-flex items-center gap-1"
              >
                Lihat Seluruh Arsip Notulensi <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="p-5 rounded-2xl bg-[#466060] border border-[#163E4F] space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
                        {data.latestMeetingMinute.dayOfWeek || 'Rapat Pleno'}
                      </span>
                      <span className="text-xs text-[#D6DDD5] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#D6DDD5]" />
                        {new Date(data.latestMeetingMinute.meetingDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[#D6DDD5]/60">•</span>
                      <span className="text-xs text-[#D6DDD5] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D6DDD5]" />
                        {data.latestMeetingMinute.location}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {data.latestMeetingMinute.title}
                    </h3>
                  </div>

                  <Link
                    href={`/dashboard/notulensi/${data.latestMeetingMinute.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#163E4F] hover:bg-[#6A8578] text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5 shrink-0 border border-[#6A8578]"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Buka Dokumen Lengkap
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#163E4F]/60 p-3.5 rounded-xl border border-[#6A8578]/40 text-[#D6DDD5]">
                  <div>
                    <span className="text-[#D6DDD5]/70 block">Pimpinan Rapat:</span>
                    <strong className="text-white">{data.latestMeetingMinute.meetingLeader}</strong>
                  </div>
                  <div>
                    <span className="text-[#D6DDD5]/70 block">Notulis:</span>
                    <strong className="text-white">{data.latestMeetingMinute.noteTaker}</strong>
                  </div>
                </div>

                {data.latestMeetingMinute.conclusion && (
                  <div className="p-3 rounded-xl bg-[#163E4F]/60 border border-[#6A8578]/40 text-xs text-[#D6DDD5]">
                    <span className="font-bold flex items-center gap-1 mb-0.5 text-[11px] uppercase tracking-wider text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Kesimpulan Rapat:
                    </span>
                    <p className="line-clamp-2 leading-relaxed opacity-95 text-[#D6DDD5]">
                      {data.latestMeetingMinute.conclusion}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
