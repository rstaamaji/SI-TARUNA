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
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
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
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: 'ADMIN' | 'MEMBER' }>({
    id: 'user-default',
    name: 'Anggota Karang Taruna',
    role: 'MEMBER',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = currentUser.role === 'ADMIN';

  // Data
  const [attendanceData, setAttendanceData] = useState<PersonalAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED'>('ALL');

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

  // Load User Session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser({
          id: parsed.id || 'user-id',
          name: parsed.member?.name || parsed.username || 'Anggota',
          role: parsed.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
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

        const res = await fetch('http://localhost:5000/api/attendance/my-history', {
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
        toast.error('Gagal mengambil data absensi dari server.');
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

      return matchSearch && matchStatus;
    });
  }, [attendanceData?.history, searchQuery, statusFilter]);

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
    <div className="min-h-screen flex bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={currentUser.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} user={{ name: currentUser.name, role: currentUser.role }} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* ── HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Presensi &amp; Rekapitulasi Keaktifan
                </span>
                <Badge variant={isAdmin ? 'accent' : 'primary'} size="sm">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-1 inline" />
                      ADMINISTRATOR
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1 inline" />
                      MEMBER
                    </>
                  )}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight flex items-center gap-2.5">
                <CalendarCheck2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                Riwayat Absensi Saya
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
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
              >
                Segarkan
              </Button>

              {isAdmin && (
                <Link href="/admin/attendance">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    leftIcon={<CalendarCheck2 className="w-4 h-4" />}
                  >
                    Kelola Absensi Kegiatan
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* ── ADMIN NOTICE BANNER ── */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">
                    Mode Administrator Aktif
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Anda dapat mencatat dan memperbarui absensi seluruh anggota di lembar kelola presensi.
                  </p>
                </div>
              </div>
              <Link href="/admin/attendance" className="font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 shrink-0">
                Buka Kelola Absensi
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* ── MEMBER PROFILE & ACTIVE STATS ── */}
          {attendanceData?.member && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {attendanceData.member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-taruna-dark dark:text-white">
                      {attendanceData.member.name}
                    </h2>
                    <Badge variant="success" size="sm">
                      {attendanceData.member.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                    Nomor Anggota: {attendanceData.member.memberNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                <Award className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Tingkat Keaktifan</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {attendanceData.stats.attendanceRate}% Kehadiran
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4 STAT CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Kegiatan */}
            <Card hoverable className="border-t-4 border-t-purple-500">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Agenda</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {attendanceData?.stats.totalEvents || 0}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Kegiatan terekap</div>
              </CardContent>
            </Card>

            {/* Hadir */}
            <Card hoverable className="border-t-4 border-t-emerald-500">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Hadir</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {attendanceData?.stats.presentCount || 0}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mengikuti kegiatan
                </div>
              </CardContent>
            </Card>

            {/* Izin */}
            <Card hoverable className="border-t-4 border-t-amber-500">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Izin</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {attendanceData?.stats.excusedCount || 0}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Dengan pemberitahuan
                </div>
              </CardContent>
            </Card>

            {/* Tidak Hadir */}
            <Card hoverable className="border-t-4 border-t-red-500">
              <CardHeader className="pb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Tidak Hadir</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                  {attendanceData?.stats.absentCount || 0}
                </div>
                <div className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Tanpa keterangan
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── FILTER & SEARCH ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-taruna-border dark:border-slate-800 shadow-xs">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Cari kegiatan atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>

            <div className="w-full sm:w-48">
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
          </div>

          {/* ── HISTORY TABLE ── */}
          <Card>
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
                  <TableHeader>
                    <TableRow>
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
        </main>
      </div>
    </div>
  );
}
