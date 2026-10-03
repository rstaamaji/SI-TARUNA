'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  CalendarCheck2,
  Coins,
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
  Gift,
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
import { AdminEventsAndAnnouncements } from './AdminEventsAndAnnouncements';

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
    currentMonthJimpitan: number;
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
    currentMonthJimpitan: 2170000,
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

export const AdminDashboard: React.FC = () => {
  const toast = useToast();
  const [data, setData] = useState<AdminDashboardData>(FALLBACK_ADMIN_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://localhost:5000/api';

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
          1. HEADER DASHBOARD ADMIN
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Overview Organisasi
            </span>
            <Badge variant="accent" size="sm">
              <ShieldCheck className="w-3 h-3 mr-1 inline" />
              ADMINISTRATOR
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
            Dashboard Pengurus Setya Bakti
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Monitoring keuangan, partisipasi pemuda, jimpitan, dan kegiatan Dusun Tuk Uluh.
            {isLoading && (
              <span className="ml-2 text-xs text-taruna-yellow-600 dark:text-taruna-yellow-400 font-semibold animate-pulse">
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
          >
            {isRefreshing ? 'Memperbarui...' : 'Sinkronkan Data'}
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. METRIC STATISTIC CARDS (6 INDIKATOR KUNCI ORGANISASI)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Total Anggota Aktif */}
        <Card hoverable className="border-t-4 border-t-taruna-yellow-500">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Total Anggota Aktif
            </span>
            <div className="p-2.5 rounded-2xl bg-taruna-yellow-50 dark:bg-slate-800 text-taruna-yellow-700 dark:text-taruna-yellow-400 ring-2 ring-black/5 dark:ring-white/5">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
              {metrics.totalActiveMembers}{' '}
              <span className="text-base font-semibold text-gray-500 dark:text-slate-400">
                / {metrics.totalMembers} Pemuda
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dusun Tuk Uluh (RT 01 - RT 03)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Kas Organisasi */}
        <Card hoverable className="border-t-4 border-t-emerald-500">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Total Kas Organisasi
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 ring-2 ring-black/5 dark:ring-white/5">
              <Wallet className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatRupiah(metrics.totalCashBalance)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Saldo Kas Bersih Siap Pakai</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pemasukan Bulan Berjalan */}
        <Card hoverable className="border-t-4 border-t-emerald-600">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Pemasukan Bulan Berjalan
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-black/5 dark:ring-white/5">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
              {formatRupiah(metrics.currentMonthIncome)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Iuran kas, donasi, jimpitan &amp; kas desa</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Pengeluaran Bulan Berjalan */}
        <Card hoverable className="border-t-4 border-t-taruna-red-500">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Pengeluaran Bulan Berjalan
            </span>
            <div className="p-2.5 rounded-2xl bg-taruna-red-50 dark:bg-slate-800 text-taruna-red-600 dark:text-red-400 ring-2 ring-black/5 dark:ring-white/5">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-taruna-red-600 dark:text-red-400 tracking-tight">
              {formatRupiah(metrics.currentMonthExpense)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
              <span>Kegiatan sosial, logistik &amp; konsumsi</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Jumlah Anggota Hadir Kegiatan Terakhir */}
        <Card hoverable className="border-t-4 border-t-indigo-500">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Kehadiran Kegiatan Terakhir
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 ring-2 ring-black/5 dark:ring-white/5">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
                {metrics.lastEventAttendance.totalPresent} Pemuda
              </span>
              <Badge variant="success" size="sm">
                {metrics.lastEventAttendance.attendanceRate}% Hadir
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 truncate">
              {metrics.lastEventAttendance.eventTitle}
            </p>
          </CardContent>
        </Card>

        {/* Card 6: Total Jimpitan Bulan Berjalan */}
        <Card hoverable className="border-t-4 border-t-amber-500">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Total Jimpitan Bulan Ini
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 ring-2 ring-black/5 dark:ring-white/5">
              <Coins className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
              {formatRupiah(metrics.currentMonthJimpitan)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Terkumpul dari 7 Kelompok Ronda Dusun</span>
            </div>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-800" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs fill-gray-500 dark:fill-slate-400"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactRupiah}
                      className="text-xs fill-gray-500 dark:fill-slate-400"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      }}
                      formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                      formatter={(value) => (
                        <span className="font-semibold text-gray-700 dark:text-slate-300 capitalize">
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="pemasukan"
                      name="Pemasukan"
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="pengeluaran"
                      name="Pengeluaran"
                      fill="#dc2626"
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
                <Badge variant="success" dot>
                  Sehat
                </Badge>
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
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-800" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs fill-gray-500 dark:fill-slate-400"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactRupiah}
                      className="text-xs fill-gray-500 dark:fill-slate-400"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      }}
                      formatter={(val: any) => [formatRupiah(Number(val) || 0), 'Saldo Kas']}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      name="Saldo Akhir"
                      stroke="#ca8a04"
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
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Rata-rata:</span>
              <Badge variant="accent">91% Partisipasi</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.attendanceStats}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-800" />
                  <XAxis
                    dataKey="shortTitle"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-gray-500 dark:fill-slate-400"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-gray-500 dark:fill-slate-400"
                    unit=" org"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
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
                      <span className="font-semibold text-gray-700 dark:text-slate-300 capitalize">
                        {value === 'hadir' ? 'Hadir' : value === 'izin' ? 'Izin Resmi' : 'Alpa'}
                      </span>
                    )}
                  />
                  <Bar dataKey="hadir" fill="#059669" radius={[4, 4, 0, 0]} name="hadir" />
                  <Bar dataKey="izin" fill="#eab308" radius={[4, 4, 0, 0]} name="izin" />
                  <Bar dataKey="alpa" fill="#ef4444" radius={[4, 4, 0, 0]} name="alpa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3.5. ARISAN TERDEKAT (MODULE 20)
      ───────────────────────────────────────────────────────────────────────────── */}
      {data.nearestArisan && (
        <Card className="border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
          <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Arisan Terdekat</CardTitle>
                <CardDescription>
                  Putaran arisan pemuda Dusun Tuk Uluh mendatang •{' '}
                  <Link
                    href="/dashboard/arisan"
                    className="text-amber-700 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    Buka Kelola Arisan <ChevronRight className="w-3 h-3" />
                  </Link>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm" dot>
                {data.nearestArisan.status === 'UPCOMING' ? 'UPCOMING' : data.nearestArisan.status}
              </Badge>
              {data.nearestArisan.timingLabel && (
                <Badge variant="accent" size="sm">
                  {data.nearestArisan.timingLabel}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-amber-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {data.nearestArisan.periodLabel}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Nominal: <strong className="text-emerald-600 dark:text-emerald-400">Rp {formatRupiah(data.nearestArisan.amount || 500000)}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-black text-taruna-dark dark:text-white">
                  Penerima: <span className="text-amber-600 dark:text-amber-400">{data.nearestArisan.recipientName}</span>
                  {data.nearestArisan.recipientNumber && (
                    <span className="text-xs font-normal text-gray-400 dark:text-slate-500 ml-2">
                      ({data.nearestArisan.recipientNumber})
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Tanggal: {data.nearestArisan.drawDate ? new Date(data.nearestArisan.drawDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ditentukan'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Tempat: {data.nearestArisan.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Link
                  href="/dashboard/arisan"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Kelola Arisan
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. KEGIATAN TERDEKAT & PENGUMUMAN TERBARU (DENGAN CRUD REAL-TIME ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <div className="mb-4">
          <h2 className="text-xl font-black text-taruna-dark dark:text-white tracking-tight">
            Kegiatan Terdekat &amp; Pengumuman Terbaru
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
            Kelola agenda kegiatan arisan bergilir dan pengumuman resmi organisasi.
          </p>
        </div>
        <AdminEventsAndAnnouncements onDataChanged={() => fetchDashboardData(false)} />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. NOTULENSI RAPAT TERBARU (DOKUMENTASI ADMIN)
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
