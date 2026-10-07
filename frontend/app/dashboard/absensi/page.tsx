'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  User,
  ShieldCheck,
  Award,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

interface PersonalAttendanceHistoryItem {
  attendanceId: string;
  eventId: string;
  eventTitle: string;
  description: string | null;
  eventDate: string;
  location: string;
  eventType: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  notes: string | null;
  recordedAt: string;
}

interface PersonalAttendanceResponse {
  member: {
    id: string;
    memberNumber: string;
    name: string;
    gender: string;
    status: string;
    joinDate: string;
  };
  stats: {
    totalEvents: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
  history: PersonalAttendanceHistoryItem[];
}

export default function MemberAttendancePage() {
  const toast = useToast();

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER' }>({
    id: 'user-default',
    name: 'Anggota Karang Taruna',
    role: 'MEMBER',
  });
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN';

  // Data
  const [attendanceData, setAttendanceData] = useState<PersonalAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('si_taruna_token');
  };

  // Load User Session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user') || localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser({
          id: parsed.id || 'user-id',
          name: parsed.member?.name || parsed.name || parsed.username || 'Anggota',
          role: parsed.role === 'SUPERADMIN' ? 'SUPERADMIN' : parsed.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        });
      }
    } catch {
      // Default to MEMBER
    }
  }, []);

  // Fetch Personal Attendance History
  const fetchMyAttendance = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const apiBase =
          typeof window !== 'undefined' && window.location.hostname
            ? `http://${window.location.hostname}:5000/api`
            : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

        const res = await fetch(`${apiBase}/attendance/my-history`, {
          headers,
        });
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          setAttendanceData(json.data);
          if (isManualRefresh) toast.success('Riwayat absensi berhasil diperbarui.');
        } else {
          // If user doesn't have a linked member profile yet
          setAttendanceData(null);
        }
      } catch {
        if (isManualRefresh) {
          toast.error('Gagal mengambil data absensi dari server.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchMyAttendance();
  }, [fetchMyAttendance]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!attendanceData?.history) return [];

    return attendanceData.history.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.eventTitle.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchDate = !dateFilter || item.eventDate.split('T')[0] === dateFilter;

      return matchSearch && matchStatus && matchDate;
    });
  }, [attendanceData?.history, searchQuery, statusFilter, dateFilter]);

  // Status Badge Helper
  const getStatusBadge = (status: 'PRESENT' | 'ABSENT' | 'EXCUSED') => {
    if (status === 'PRESENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          HADIR
        </span>
      );
    }
    if (status === 'EXCUSED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          IZIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
        <XCircle className="w-3.5 h-3.5 text-red-600" />
        TIDAK HADIR
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#466060] text-white p-5 sm:p-6 rounded-3xl border border-[#163E4F] shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#4ADE80]">
                  Presensi &amp; Rekapitulasi Keaktifan
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-1 inline text-[#38BDF8]" />
                      ADMINISTRATOR
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1 inline text-[#4ADE80]" />
                      MEMBER
                    </>
                  )}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <CalendarCheck2 className="w-7 h-7 text-[#4ADE80]" />
                Riwayat Absensi Saya
              </h1>
              <p className="text-xs sm:text-sm text-[#D6DDD5] mt-1 font-medium">
                Catatan kehadiran Anda pada setiap rapat dan kegiatan Karang Taruna Setya Bakti.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchMyAttendance(true)}
                disabled={isRefreshing}
                className="!bg-[#163E4F] !text-white !border-[#466060] hover:!bg-[#466060]"
              >
                Segarkan
              </Button>

              {isAdmin && (
                <Link href="/admin/attendance">
                  <Button
                    variant="primary"
                    size="sm"
                    className="!bg-[#163E4F] hover:!bg-[#466060] !text-white !border-[#466060]"
                    leftIcon={<CalendarCheck2 className="w-4 h-4 text-[#4ADE80]" />}
                  >
                    Kelola Absensi Kegiatan
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* ── ADMIN NOTICE BANNER ── */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-[#466060] text-white border border-[#163E4F] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#38BDF8] shrink-0" />
                <div>
                  <span className="font-bold text-white text-sm">
                    Mode Administrator Aktif
                  </span>
                  <p className="text-[#D6DDD5] font-medium mt-0.5">
                    Anda dapat mencatat dan memperbarui absensi seluruh anggota di lembar kelola presensi.
                  </p>
                </div>
              </div>
              <Link href="/admin/attendance" className="font-bold text-[#38BDF8] hover:text-white flex items-center gap-1 shrink-0 transition">
                Buka Kelola Absensi
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* ── MEMBER PROFILE & ACTIVE STATS ── */}
          {attendanceData?.member && (
            <div className="p-5 rounded-2xl bg-[#163E4F] text-white border border-[#466060] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#466060] text-white font-black text-lg flex items-center justify-center border border-[#6A8578] shadow-inner">
                  {attendanceData.member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      {attendanceData.member.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#466060] text-[#4ADE80] border border-[#6A8578]">
                      {attendanceData.member.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#D6DDD5] font-mono mt-0.5 font-medium">
                    Nomor Anggota: {attendanceData.member.memberNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-[#466060] md:border-t-0 pt-3 md:pt-0">
                <Award className="w-8 h-8 text-[#FDE047]" />
                <div>
                  <div className="text-xs text-[#D6DDD5] font-bold uppercase tracking-wider">Tingkat Keaktifan</div>
                  <div className="text-xl font-black text-[#4ADE80]">
                    {attendanceData.stats.attendanceRate}% Kehadiran
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ── 4 STAT CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Kegiatan */}
            <Card hoverable className="!bg-[#6A8578] text-white border border-[#466060] border-t-4 border-t-purple-400 shadow-sm">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Total Agenda</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-white">
                  {attendanceData?.stats.totalEvents || 0}
                </div>
                <p className="text-xs text-[#D6DDD5] font-semibold mt-1">Kegiatan terekap</p>
              </CardContent>
            </Card>

            {/* Hadir */}
            <Card hoverable className="!bg-[#6A8578] text-white border border-[#466060] border-t-4 border-t-emerald-400 shadow-sm">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Hadir</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-[#4ADE80]">
                  {attendanceData?.stats.presentCount || 0}
                </div>
                <div className="text-xs font-semibold text-[#D6DDD5] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" /> Mengikuti kegiatan
                </div>
              </CardContent>
            </Card>

            {/* Izin */}
            <Card hoverable className="!bg-[#6A8578] text-white border border-[#466060] border-t-4 border-t-amber-400 shadow-sm">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Izin</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-[#FDE047]">
                  {attendanceData?.stats.excusedCount || 0}
                </div>
                <div className="text-xs font-semibold text-[#D6DDD5] mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#FDE047]" /> Dengan pemberitahuan
                </div>
              </CardContent>
            </Card>

            {/* Tidak Hadir */}
            <Card hoverable className="!bg-[#6A8578] text-white border border-[#466060] border-t-4 border-t-red-400 shadow-sm">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Tidak Hadir</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-[#F87171]">
                  {attendanceData?.stats.absentCount || 0}
                </div>
                <div className="text-xs font-semibold text-[#D6DDD5] mt-1 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-[#F87171]" /> Tanpa keterangan
                </div>
              </CardContent>
            </Card>
          </div>



          {/* ── FILTER & SEARCH ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#466060] text-white p-4 rounded-2xl border border-[#163E4F] shadow-sm flex-wrap">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Cari kegiatan atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="w-full sm:w-44">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  options={[
                    { value: 'ALL', label: 'Semua Status' },
                    { value: 'PRESENT', label: 'Hanya Hadir' },
                    { value: 'EXCUSED', label: 'Hanya Izin' },
                    { value: 'ABSENT', label: 'Hanya Tidak Hadir' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  title="Filter Berdasarkan Tanggal"
                  className="px-3 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-taruna-yellow-500/50"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  >
                    Reset Tgl
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── HISTORY TABLE ── */}
          <Card className="!bg-[#6A8578] text-white border-[#466060] shadow-sm">
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2 pb-2">
              <div>
                <CardTitle className="text-lg">Catatan Kehadiran</CardTitle>
                <CardDescription>
                  Daftar seluruh agenda yang pernah diadakan dan status presensi Anda.
                </CardDescription>
              </div>
              <Badge variant="primary" dot>
                {filteredHistory.length} Kegiatan
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#466060]">
                    <TableRow className="border-b border-[#163E4F]">
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead className="w-32">Tanggal</TableHead>
                      <TableHead>Nama Kegiatan &amp; Lokasi</TableHead>
                      <TableHead className="w-36 text-center">Status</TableHead>
                      <TableHead>Catatan / Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                            <span className="text-xs">Memuat data absensi Anda...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-1.5 text-gray-400">
                            <Info className="w-6 h-6" />
                            <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                              Belum ada riwayat absensi
                            </span>
                            <span className="text-xs">
                              Riwayat akan muncul setelah pengurus mencatat kehadiran kegiatan.
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((item, idx) => (
                        <TableRow key={item.attendanceId} className="hover:bg-taruna-surface/60 dark:hover:bg-slate-800/50">
                          {/* No */}
                          <TableCell className="text-center text-xs text-gray-400 font-medium">
                            {idx + 1}
                          </TableCell>

                          {/* Tanggal */}
                          <TableCell className="text-xs font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {new Date(item.eventDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </TableCell>

                          {/* Kegiatan & Lokasi */}
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="font-bold text-sm text-taruna-dark dark:text-white">
                                {item.eventTitle}
                              </span>
                              <Badge variant="neutral" size="sm" className="text-[10px]">
                                {item.eventType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3 text-red-400" />
                              {item.location}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {getStatusBadge(item.status)}
                          </TableCell>

                          {/* Catatan */}
                          <TableCell className="text-xs text-gray-600 dark:text-slate-300">
                            {item.notes ? (
                              <span className="italic">{item.notes}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
    </div>
  );
}
