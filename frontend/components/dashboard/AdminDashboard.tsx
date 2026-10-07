'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  CalendarCheck2,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FileText,
  BookOpen,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export interface AdminDashboardData {
  metrics: {
    totalActiveMembers: number;
    totalMembers: number;
    totalCashBalance: number;
    currentMonthIncome: number;
    currentMonthExpense: number;
    lastEventAttendance: {
      eventId: string | null;
      eventTitle: string;
      eventDate: string | null;
      totalPresent: number;
      totalExcused: number;
      totalAbsent: number;
      totalMembers: number;
      attendanceRate: number;
    };
  };
  charts: {
    incomeVsExpense: {
      month: string;
      pemasukan: number;
      pengeluaran: number;
    }[];
    balanceTrend: {
      month: string;
      saldo: number;
    }[];
    attendanceStats: {
      eventTitle: string;
      shortTitle: string;
      date: string;
      hadir: number;
      izin: number;
      alpa: number;
      rate: number;
    }[];
  };
  upcomingEvents: {
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
    location: string;
    type: string;
  }[];
  recentAnnouncements: {
    id: string;
    title: string;
    content: string;
    announcementDate: string;
    eventDate: string | null;
    author: string;
  }[];
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
  nearestArisan?: any;
}

// Fallback initial data
const FALLBACK_ADMIN_DASHBOARD: AdminDashboardData = {
  metrics: {
    totalActiveMembers: 23,
    totalMembers: 25,
    totalCashBalance: 6420000,
    currentMonthIncome: 8120000,
    currentMonthExpense: 1700000,
    lastEventAttendance: {
      eventId: '1',
      eventTitle: 'Pertemuan Rutin & Arisan Pemuda Oktober 2026',
      eventDate: '2026-10-05T19:30:00.000Z',
      totalPresent: 23,
      totalExcused: 1,
      totalAbsent: 1,
      totalMembers: 25,
      attendanceRate: 92,
    },
  },
  charts: {
    incomeVsExpense: [
      { month: 'Mei', pemasukan: 1200000, pengeluaran: 450000 },
      { month: 'Jun', pemasukan: 1450000, pengeluaran: 700000 },
      { month: 'Jul', pemasukan: 1800000, pengeluaran: 950000 },
      { month: 'Agu', pemasukan: 3200000, pengeluaran: 2100000 },
      { month: 'Sep', pemasukan: 4060000, pengeluaran: 850000 },
      { month: 'Okt', pemasukan: 8120000, pengeluaran: 1700000 },
    ],
    balanceTrend: [
      { month: 'Mei', saldo: 4250000 },
      { month: 'Jun', saldo: 5000000 },
      { month: 'Jul', saldo: 5850000 },
      { month: 'Agu', saldo: 6950000 },
      { month: 'Sep', saldo: 7420000 },
      { month: 'Okt', saldo: 8420000 },
    ],
    attendanceStats: [
      { eventTitle: 'Rapat Koordinasi HUT RI', shortTitle: 'Rapat HUT RI', date: '02 Agu', hadir: 24, izin: 1, alpa: 0, rate: 96 },
      { eventTitle: 'Kerja Bakti Lapangan Sringin', shortTitle: 'Kerja Bakti Sringin', date: '15 Agu', hadir: 22, izin: 2, alpa: 1, rate: 88 },
      { eventTitle: 'Rapat Pleno & Arisan September', shortTitle: 'Pleno & Arisan Sep', date: '10 Sep', hadir: 23, izin: 1, alpa: 1, rate: 92 },
      { eventTitle: 'Pertemuan Rutin & Arisan Oktober', shortTitle: 'Arisan Oktober', date: '05 Okt', hadir: 23, izin: 1, alpa: 1, rate: 92 },
    ],
  },
  upcomingEvents: [],
  recentAnnouncements: [],
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
  nearestArisan: {
    id: 'ar-demo-1',
    month: 10,
    monthName: 'Oktober',
    year: 2026,
    periodLabel: 'Arisan Oktober 2026',
    memberId: 'm-5',
    recipientName: 'Anggota 05',
    recipientNumber: 'KT-SB-005',
    drawDate: '2026-10-01T19:30:00.000Z',
    location: 'Rumah Anggota 05',
    status: 'UPCOMING',
    notes: 'Kocokan arisan pemuda Dusun Tuk Uluh',
    amount: 500000,
    timingLabel: 'HARI INI',
    isUpcoming: true,
  },
};

const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompactRupiah = (value: number): string => {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)} jt`;
  }
  if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(0)} rb`;
  }
  return `Rp ${value}`;
};

export interface AdminDashboardProps {
  userRole?: 'SUPERADMIN' | 'ADMIN';
  userName?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userRole = 'ADMIN',
  userName = 'Pengurus',
}) => {
  const toast = useToast();
  const [data, setData] = useState<AdminDashboardData>(FALLBACK_ADMIN_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('si_taruna_token')
          : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase =
        typeof window !== 'undefined' && window.location.hostname
          ? `http://${window.location.hostname}:5000/api`
          : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/admin/dashboard`, { headers });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setData(json.data);
        if (isManualRefresh) {
          toast.success('Data dashboard admin berhasil diperbarui.');
        }
      } else {
        // Fallback to initial state if token is demo
        setData(FALLBACK_ADMIN_DASHBOARD);
      }
    } catch {
      // Local fallback on network error
      setData(FALLBACK_ADMIN_DASHBOARD);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const { metrics, charts } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER DASHBOARD ADMIN / SUPERADMIN (BAGIAN UTAMA #466060)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#466060] text-white p-6 rounded-3xl border border-[#163E4F] shadow-lg transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#D6DDD5]">
              Overview Organisasi
            </span>
            {userRole === 'SUPERADMIN' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#163E4F] text-amber-300 border border-amber-400/40">
                👑 SUPERADMIN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
                <ShieldCheck className="w-3 h-3 mr-1 inline" />
                ADMINISTRATOR
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {userRole === 'SUPERADMIN'
              ? `Dashboard Superadmin: ${userName}`
              : `Dashboard Pengurus: ${userName}`}
          </h1>
          <p className="text-xs sm:text-sm text-[#D6DDD5] mt-1">
            {userRole === 'SUPERADMIN'
              ? 'Hak Akses Penuh: Monitoring seluruh data, kontrol anggaran, dan kelola otorisasi pengurus.'
              : 'Monitoring keuangan, partisipasi pemuda, dan kegiatan Dusun Tuk Uluh.'}
            {isLoading && (
              <span className="ml-2 text-xs text-amber-300 font-semibold animate-pulse">
                (Memuat data...)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="bg-[#163E4F] hover:bg-[#6A8578] text-white border border-[#6A8578] transition shadow-sm"
          >
            {isRefreshing ? 'Memperbarui...' : 'Sinkronkan Data'}
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          1.5. KONTROL KHUSUS SUPERADMIN (HANYA DITAMPILKAN KEPADA SUPERADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {userRole === 'SUPERADMIN' && (
        <div className="relative overflow-hidden rounded-3xl bg-[#163E4F] text-white border border-[#466060] p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-[#466060] text-amber-300 border border-amber-400/30 shadow-xs">
                👑 KONTROL OTORITAS TERTINGGI SUPERADMIN
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Pusat Otorisasi Pengurus &amp; Kendali Sistem
              </h2>
              <p className="text-xs sm:text-sm text-[#D6DDD5] leading-relaxed">
                Anda memiliki hak eksklusif untuk menyetujui, mengangkat, dan mencabut akses pengurus/admin. Pengguna dengan kredensial admin tidak akan dapat login ke dashboard sebelum mendapatkan konfirmasi langsung dari Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/dashboard/pengurus"
                className="px-4 py-2.5 rounded-2xl bg-[#6A8578] hover:bg-[#466060] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 border border-[#466060]"
              >
                <ShieldCheck className="w-4 h-4" />
                Kelola Otorisasi Pengurus
              </Link>
              <Link
                href="/admin/settings"
                className="px-4 py-2.5 rounded-2xl bg-[#466060] hover:bg-[#6A8578] text-white border border-[#163E4F] font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Konfigurasi Sistem
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. METRIC STATISTIC CARDS (6 INDIKATOR KUNCI ORGANISASI - ISINYA #6A8578)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Total Anggota Aktif */}
        <Card hoverable className="border-t-4 border-t-amber-300">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Total Anggota Aktif
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {metrics.totalActiveMembers}{' '}
              <span className="text-base font-semibold text-[#D6DDD5]">
                / {metrics.totalMembers} Pemuda
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dusun Tuk Uluh (RT 01 - RT 03)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Kas Organisasi */}
        <Card hoverable className="border-t-4 border-t-emerald-400">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Total Kas Organisasi
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <Wallet className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiah(metrics.totalCashBalance)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Saldo Kas Bersih Siap Pakai</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pemasukan Bulan Berjalan */}
        <Card hoverable className="border-t-4 border-t-emerald-300">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Pemasukan Bulan Berjalan
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiah(metrics.currentMonthIncome)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-300">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Iuran kas, donasi, &amp; kas desa</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Pengeluaran Bulan Berjalan */}
        <Card hoverable className="border-t-4 border-t-rose-400">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Pengeluaran Bulan Berjalan
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiah(metrics.currentMonthExpense)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#D6DDD5]">
              <span>Kegiatan sosial, logistik &amp; konsumsi</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Jumlah Anggota Hadir Kegiatan Terakhir */}
        <Card hoverable className="border-t-4 border-t-teal-300">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
              Kehadiran Kegiatan Terakhir
            </span>
            <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {metrics.lastEventAttendance.totalPresent} Pemuda
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#466060] text-emerald-300 border border-emerald-400/40">
                {metrics.lastEventAttendance.attendanceRate}% Hadir
              </span>
            </div>
            <p className="text-xs text-[#D6DDD5] mt-2 truncate">
              {metrics.lastEventAttendance.eventTitle}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. CHARTS MENGGUNAKAN RECHARTS (3 GRAFIK UTAMA PRIORITAS ORGANISASI)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-taruna-dark dark:text-white tracking-tight">
              Analisis Keuangan &amp; Partisipasi Pemuda
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Visualisasi data 3 pilar utama: Arus Kas, Pertumbuhan Saldo, dan Partisipasi Kehadiran.
            </p>
          </div>
        </div>

        {/* Baris 1: Chart Pemasukan vs Pengeluaran & Chart Perkembangan Saldo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Pemasukan vs Pengeluaran */}
          <Card className="p-2 sm:p-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    1. Arus Kas: Pemasukan vs Pengeluaran
                  </CardTitle>
                  <CardDescription>
                    Perbandingan pendapatan kas &amp; realisasi belanja 6 bulan terakhir
                  </CardDescription>
                </div>
                <Badge variant="primary">Kas</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.incomeVsExpense}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D6DDD5" strokeOpacity={0.25} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs fill-[#D6DDD5]"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactRupiah}
                      className="text-xs fill-[#D6DDD5]"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#163E4F',
                        borderColor: '#466060',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                      }}
                      formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                      formatter={(value) => (
                        <span className="font-semibold text-[#D6DDD5] capitalize">
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="pemasukan"
                      name="Pemasukan"
                      fill="#4ADE80"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="pengeluaran"
                      name="Pengeluaran"
                      fill="#F87171"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Perkembangan Saldo Kas */}
          <Card className="p-2 sm:p-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    2. Perkembangan Saldo Kas Bersih
                  </CardTitle>
                  <CardDescription>
                    Pertumbuhan akumulasi saldo simpanan kas pemuda Setya Bakti
                  </CardDescription>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#466060] text-emerald-300 border border-emerald-400/40">
                  ● Sehat
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts.balanceTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#163E4F" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D6DDD5" strokeOpacity={0.25} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs fill-[#D6DDD5]"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactRupiah}
                      className="text-xs fill-[#D6DDD5]"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#163E4F',
                        borderColor: '#466060',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                      }}
                      formatter={(val: any) => [formatRupiah(Number(val) || 0), 'Saldo Kas']}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      name="Saldo Akhir"
                      stroke="#38BDF8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSaldo)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Baris 2: Chart 3: Statistik Kehadiran Pemuda */}
        <Card className="p-2 sm:p-4">
          <CardHeader className="flex-row items-center justify-between pb-2 flex-wrap gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">
                3. Statistik Kehadiran Pemuda pada Kegiatan
              </CardTitle>
              <CardDescription>
                Tingkat partisipasi pemuda Dusun Tuk Uluh pada rapat, arisan, dan kerja bakti
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#D6DDD5]">Rata-rata:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#466060] text-emerald-300 border border-emerald-400/40">
                91% Partisipasi
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.attendanceStats}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D6DDD5" strokeOpacity={0.25} />
                  <XAxis
                    dataKey="shortTitle"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-[#D6DDD5]"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-[#D6DDD5]"
                    unit=" org"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#163E4F',
                      borderColor: '#466060',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} orang`,
                      name === 'hadir' ? 'Hadir' : name === 'izin' ? 'Izin' : 'Alpa',
                    ]}
                    labelFormatter={(label) => `Kegiatan: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                    formatter={(value) => (
                      <span className="font-semibold text-[#D6DDD5] capitalize">
                        {value === 'hadir' ? 'Hadir' : value === 'izin' ? 'Izin Resmi' : 'Alpa'}
                      </span>
                    )}
                  />
                  <Bar dataKey="hadir" fill="#4ADE80" radius={[4, 4, 0, 0]} name="hadir" />
                  <Bar dataKey="izin" fill="#FDE047" radius={[4, 4, 0, 0]} name="izin" />
                  <Bar dataKey="alpa" fill="#F87171" radius={[4, 4, 0, 0]} name="alpa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* ─────────────────────────────────────────────────────────────────────────────
          4. NOTULENSI RAPAT TERBARU (DOKUMENTASI ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {data.latestMeetingMinute && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Notulensi Rapat Terakhir</CardTitle>
                <CardDescription>Dokumen resmi keputusan pleno &amp; tindak lanjut kepengurusan</CardDescription>
              </div>
            </div>
            <Link
              href="/dashboard/notulensi"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Buka Seluruh Arsip Notulensi <ChevronRight className="w-3.5 h-3.5" />
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
