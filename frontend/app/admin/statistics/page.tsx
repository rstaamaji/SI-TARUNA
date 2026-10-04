'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Search,
  RefreshCw,
  Trophy,
  BarChart2,
  ChevronUp,
  ChevronDown,
  Minus,
  Info,
  CalendarDays,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberStat {
  memberId: string;
  memberNumber: string;
  name: string;
  gender: string;
  joinDate: string | null;
  stats: {
    totalEvents: number;
    totalRecorded: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
}

interface ChartDataPoint {
  month: string;
  hadir: number;
  izin: number;
  tidakHadir: number;
}

interface StatsSummary {
  totalEvents: number;
  totalMembers: number;
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  overallRate: number;
}

interface ApiResponse {
  summary: StatsSummary;
  ranking: MemberStat[];
  chartData: ChartDataPoint[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const medalColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-slate-400';
  if (rank === 3) return 'text-amber-600';
  return 'text-gray-400 dark:text-slate-500';
};

type SortKey = 'rank' | 'name' | 'present' | 'absent' | 'excused' | 'rate';
type SortDir = 'asc' | 'desc';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-taruna-dark dark:text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.fill }} />
          <span className="text-gray-600 dark:text-slate-300">{p.name}:</span>
          <span className="font-bold text-taruna-dark dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberStatisticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER'>('ADMIN');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [rateFilter, setRateFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // ─── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('si_taruna_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUserRole(u.role);
      } catch (_e: unknown) {
        void _e; // ignore malformed stored user
      }
    }
  }, []);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('si_taruna_token');
      const res = await fetch(`${API}/attendance/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat statistik keaktifan');
      const json = await res.json();
      setData(json.data);
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Sort & Filter ──────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  };

  const processedRanking = useMemo(() => {
    if (!data) return [];
    let list = [...data.ranking];

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.memberNumber.toLowerCase().includes(q)
      );
    }

    // Apply rate filter
    if (rateFilter !== 'all') {
      list = list.filter((m) => {
        const r = m.stats.attendanceRate;
        if (rateFilter === 'high') return r >= 80;
        if (rateFilter === 'mid') return r >= 60 && r < 80;
        if (rateFilter === 'low') return r < 60;
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      let va: number, vb: number;
      // Original rank from API (position in ranking array)
      const rankA = data.ranking.indexOf(a) + 1;
      const rankB = data.ranking.indexOf(b) + 1;

      switch (sortKey) {
        case 'rank':
          va = rankA; vb = rankB; break;
        case 'name':
          return sortDir === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'present':
          va = a.stats.presentCount; vb = b.stats.presentCount; break;
        case 'absent':
          va = a.stats.absentCount; vb = b.stats.absentCount; break;
        case 'excused':
          va = a.stats.excusedCount; vb = b.stats.excusedCount; break;
        case 'rate':
          va = a.stats.attendanceRate; vb = b.stats.attendanceRate; break;
        default:
          va = rankA; vb = rankB;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [data, search, sortKey, sortDir, rateFilter]);

  // ─── Pie chart data ──────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Hadir', value: data.summary.totalPresent, color: '#10b981' },
      { name: 'Izin', value: data.summary.totalExcused, color: '#f59e0b' },
      { name: 'Tidak Hadir', value: data.summary.totalAbsent, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [data]);

  // ─── Sort icon helper ────────────────────────────────────────────────────────
  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <Minus className="w-3 h-3 text-gray-300 dark:text-slate-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-taruna-yellow-600" />
      : <ChevronDown className="w-3 h-3 text-taruna-yellow-600" />;
  };

  const ThBtn = ({
    col,
    children,
    className = '',
  }: {
    col: SortKey;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 cursor-pointer select-none hover:text-taruna-dark dark:hover:text-white transition-colors ${className}`}
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon col={col} />
      </div>
    </th>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-taruna-surface dark:bg-slate-950 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 px-4 md:px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-taruna-dark dark:text-white flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-taruna-yellow-500" />
                Statistik Keaktifan Anggota
              </h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                Rekap kehadiran seluruh anggota aktif berdasarkan data absensi kegiatan.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Perbarui
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Statistik ini bersifat <strong>informatif</strong> sebagai bahan evaluasi partisipasi anggota.
              Ranking kehadiran bukan merupakan penilaian moral terhadap anggota.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {data && (
            <>
              {/* ── Summary Cards ─────────────────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  {
                    label: 'Total Kegiatan',
                    value: data.summary.totalEvents,
                    icon: CalendarDays,
                    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                  },
                  {
                    label: 'Total Anggota',
                    value: data.summary.totalMembers,
                    icon: Users,
                    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  },
                  {
                    label: 'Total Hadir',
                    value: data.summary.totalPresent,
                    icon: CheckCircle2,
                    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    label: 'Total Izin',
                    value: data.summary.totalExcused,
                    icon: Clock,
                    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                  },
                  {
                    label: 'Tidak Hadir',
                    value: data.summary.totalAbsent,
                    icon: XCircle,
                    color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                  },
                  {
                    label: 'Kehadiran Rata-rata',
                    value: `${data.summary.overallRate}%`,
                    icon: TrendingUp,
                    color: 'bg-taruna-yellow-100 dark:bg-taruna-yellow-900/30 text-taruna-yellow-700 dark:text-taruna-yellow-400',
                  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label} className="rounded-2xl border border-taruna-border dark:border-slate-800">
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-bold text-taruna-dark dark:text-white">{value}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-tight">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ── Charts Row ────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stacked Bar Chart */}
                <Card className="lg:col-span-2 rounded-2xl border border-taruna-border dark:border-slate-800">
                  <CardHeader className="px-5 pt-5 pb-2">
                    <CardTitle className="text-base">Tren Kehadiran Bulanan</CardTitle>
                    <CardDescription>Kehadiran, izin, dan ketidakhadiran per bulan (6 bulan terakhir)</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {data.chartData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">
                        Belum ada data kehadiran bulanan
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-gray-500 dark:text-slate-400"
                          />
                          <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-slate-400" />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey="hadir" name="Hadir" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="izin" name="Izin" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="tidakHadir" name="Tidak Hadir" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="rounded-2xl border border-taruna-border dark:border-slate-800">
                  <CardHeader className="px-5 pt-5 pb-2">
                    <CardTitle className="text-base">Distribusi Status</CardTitle>
                    <CardDescription>Proporsi kehadiran keseluruhan</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {pieData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">
                        Belum ada data absensi
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => [`${value} catatan`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-2">
                          {pieData.map((d) => {
                            const total = pieData.reduce((s, x) => s + x.value, 0);
                            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                            return (
                              <div key={d.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: d.color }}
                                  />
                                  <span className="text-gray-600 dark:text-slate-300">{d.name}</span>
                                </div>
                                <span className="font-semibold text-taruna-dark dark:text-white">
                                  {d.value} <span className="font-normal text-gray-400">({pct}%)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Ranking Table ─────────────────────────────────────────── */}
              <Card className="rounded-2xl border border-taruna-border dark:border-slate-800">
                <CardHeader className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Ranking Kehadiran Anggota
                      </CardTitle>
                      <CardDescription>
                        Diurutkan berdasarkan jumlah kehadiran. Klik header kolom untuk mengurutkan.
                      </CardDescription>
                    </div>
                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Cari anggota..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8 h-8 text-sm w-44"
                        />
                      </div>
                      <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden text-xs">
                        {(['all', 'high', 'mid', 'low'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setRateFilter(f)}
                            className={`px-2.5 py-1.5 transition-colors font-medium ${
                              rateFilter === f
                                ? 'bg-taruna-yellow-500 text-white'
                                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {f === 'all' ? 'Semua' : f === 'high' ? '≥80%' : f === 'mid' ? '60-79%' : '<60%'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-800/50 border-y border-gray-100 dark:border-slate-700">
                        <tr>
                          <ThBtn col="rank" className="w-16 pl-5">
                            #
                          </ThBtn>
                          <ThBtn col="name">Nama Anggota</ThBtn>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                            Tercatat
                          </th>
                          <ThBtn col="present">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Hadir
                          </ThBtn>
                          <ThBtn col="excused">
                            <Clock className="w-3 h-3 text-yellow-500" />
                            Izin
                          </ThBtn>
                          <ThBtn col="absent">
                            <XCircle className="w-3 h-3 text-red-500" />
                            Tdk Hadir
                          </ThBtn>
                          <ThBtn col="rate">% Hadir</ThBtn>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 pr-5">
                            Progress
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {processedRanking.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-5 py-10 text-center text-gray-400 dark:text-slate-500">
                              Tidak ada data yang sesuai
                            </td>
                          </tr>
                        ) : (
                          processedRanking.map((member) => {
                            const originalRank = data.ranking.indexOf(member) + 1;
                            const rate = member.stats.attendanceRate;
                            return (
                              <tr
                                key={member.memberId}
                                className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                {/* Rank */}
                                <td className="px-4 py-3 pl-5">
                                  <div className="flex items-center justify-center w-7 h-7">
                                    {originalRank <= 3 ? (
                                      <Trophy className={`w-5 h-5 ${medalColor(originalRank)}`} />
                                    ) : (
                                      <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
                                        {originalRank}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Name */}
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-semibold text-taruna-dark dark:text-white">
                                      {member.name}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">
                                      {member.memberNumber}
                                    </p>
                                  </div>
                                </td>

                                {/* Tercatat */}
                                <td className="px-4 py-3 text-gray-600 dark:text-slate-300 font-medium">
                                  {member.stats.totalRecorded}
                                  <span className="text-gray-400 dark:text-slate-500 text-xs">
                                    /{member.stats.totalEvents}
                                  </span>
                                </td>

                                {/* Present */}
                                <td className="px-4 py-3">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {member.stats.presentCount}
                                  </span>
                                </td>

                                {/* Excused */}
                                <td className="px-4 py-3">
                                  <span className="font-bold text-yellow-600 dark:text-yellow-400">
                                    {member.stats.excusedCount}
                                  </span>
                                </td>

                                {/* Absent */}
                                <td className="px-4 py-3">
                                  <span className="font-bold text-red-600 dark:text-red-400">
                                    {member.stats.absentCount}
                                  </span>
                                </td>

                                {/* Rate */}
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'neutral'}
                                    size="sm"
                                    className="font-bold"
                                  >
                                    {rate}%
                                  </Badge>
                                </td>

                                {/* Progress bar */}
                                <td className="px-4 py-3 pr-5 min-w-[120px]">
                                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                    {member.stats.totalRecorded > 0 && (
                                      <div className="flex h-2">
                                        <div
                                          className="bg-emerald-500 h-2"
                                          style={{
                                            width: `${(member.stats.presentCount / member.stats.totalEvents) * 100}%`,
                                          }}
                                        />
                                        <div
                                          className="bg-yellow-400 h-2"
                                          style={{
                                            width: `${(member.stats.excusedCount / member.stats.totalEvents) * 100}%`,
                                          }}
                                        />
                                        <div
                                          className="bg-red-400 h-2"
                                          style={{
                                            width: `${(member.stats.absentCount / member.stats.totalEvents) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table footer */}
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
                    <span>
                      Menampilkan {processedRanking.length} dari {data.ranking.length} anggota
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hadir
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" /> Izin
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" /> Tidak Hadir
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
