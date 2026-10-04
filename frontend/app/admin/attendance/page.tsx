'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarCheck2,
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Save,
  RefreshCw,
  ShieldCheck,
  User,
  CheckCheck,
  Info,
  Calendar,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface EventItem {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string;
  type: string;
  stats: {
    totalMembers: number;
    recordedCount: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
}

interface MemberAttendanceRow {
  memberId: string;
  memberNumber: string;
  name: string;
  gender: string;
  phone: string | null;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  notes: string;
  isRecorded: boolean;
  attendanceId: string | null;
}

interface EventAttendanceSheetResponse {
  event: {
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
    location: string;
    type: string;
  };
  stats: {
    totalMembers: number;
    recordedCount: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
  attendances: MemberAttendanceRow[];
}

interface AttendanceRecordItem {
  id: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  notes: string | null;
  updatedAt: string;
  member: {
    id: string;
    memberNumber: string;
    name: string;
    gender: string;
    phone: string | null;
  };
  event: {
    id: string;
    title: string;
    eventDate: string;
    location: string;
    type: string;
  };
}

export default function AdminAttendancePage() {
  const toast = useToast();

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: 'ADMIN' | 'MEMBER' }>({
    id: 'user-default',
    name: 'Pengurus Setya Bakti',
    role: 'ADMIN',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = currentUser.role === 'ADMIN';

  // Navigation Tabs: SHEET vs RECORDS (Pencarian & Rekap Server API)
  const [activeTab, setActiveTab] = useState<'SHEET' | 'RECORDS'>('SHEET');

  // Events & Selected Sheet
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendanceSheet, setAttendanceSheet] = useState<EventAttendanceSheetResponse | null>(null);
  const [memberRows, setMemberRows] = useState<MemberAttendanceRow[]>([]);

  // UI state
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Filters for Sheet Tab
  const [searchMember, setSearchMember] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED'>('ALL');

  // Server-side API Search & Filter State for All Attendance Records
  const [recordsList, setRecordsList] = useState<AttendanceRecordItem[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsTotalPages, setRecordsTotalPages] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsLimit] = useState(15);
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsEventId, setRecordsEventId] = useState('ALL');
  const [recordsStatus, setRecordsStatus] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED'>('ALL');
  const [recordsDate, setRecordsDate] = useState('');
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Form New Event
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventLocation, setNewEventLocation] = useState('Balai Pertemuan Tuk Uluh');
  const [newEventType, setNewEventType] = useState('MEETING');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

  // Load Session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser({
          id: parsed.id || 'user-id',
          name: parsed.member?.name || parsed.username || 'Pengurus',
          role: parsed.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        });
      }
    } catch {
      // default ADMIN
    }
  }, []);

  // Fetch Event List with Stats
  const fetchEvents = useCallback(async (selectFirst = false) => {
    setIsLoadingEvents(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/attendance/events`, { headers });
      const json = await res.json();

      if (res.ok && json.success && Array.isArray(json.data)) {
        setEvents(json.data);
        if (json.data.length > 0 && (selectFirst || !selectedEventId)) {
          setSelectedEventId(json.data[0].id);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoadingEvents(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents(true);
  }, []);

  // Fetch Event Attendance Sheet when selectedEventId changes
  const fetchEventSheet = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setIsLoadingSheet(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/attendance/events/${eventId}`, { headers });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setAttendanceSheet(json.data);
        setMemberRows(json.data.attendances || []);
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoadingSheet(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventSheet(selectedEventId);
    }
  }, [selectedEventId, fetchEventSheet]);

  // Fetch All Attendance Records from Server API with Filters & Pagination
  const fetchAttendanceRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (recordsSearch.trim()) params.append('search', recordsSearch.trim());
      if (recordsEventId && recordsEventId !== 'ALL') params.append('eventId', recordsEventId);
      if (recordsStatus && recordsStatus !== 'ALL') params.append('status', recordsStatus);
      if (recordsDate) params.append('date', recordsDate);
      params.append('page', String(recordsPage));
      params.append('limit', String(recordsLimit));

      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/attendance/records?${params.toString()}`, { headers });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setRecordsList(json.data.records || []);
        if (json.data.pagination) {
          setRecordsTotal(json.data.pagination.total);
          setRecordsTotalPages(json.data.pagination.totalPages);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoadingRecords(false);
    }
  }, [recordsSearch, recordsEventId, recordsStatus, recordsDate, recordsPage, recordsLimit]);

  useEffect(() => {
    if (activeTab === 'RECORDS') {
      fetchAttendanceRecords();
    }
  }, [activeTab, fetchAttendanceRecords]);

  // Handle Status Change for a member
  const handleStatusChange = (memberId: string, newStatus: 'PRESENT' | 'ABSENT' | 'EXCUSED') => {
    setMemberRows((prev) =>
      prev.map((row) => (row.memberId === memberId ? { ...row, status: newStatus } : row))
    );
  };

  // Handle Notes Change for a member
  const handleNotesChange = (memberId: string, notes: string) => {
    setMemberRows((prev) =>
      prev.map((row) => (row.memberId === memberId ? { ...row, notes } : row))
    );
  };

  // Mark all members as PRESENT
  const handleMarkAllPresent = () => {
    setMemberRows((prev) => prev.map((row) => ({ ...row, status: 'PRESENT' })));
    toast.success('Semua anggota ditandai HADIR.');
  };

  // Mark all members as EXCUSED
  const handleMarkAllExcused = () => {
    setMemberRows((prev) => prev.map((row) => ({ ...row, status: 'EXCUSED' })));
    toast.info('Semua anggota ditandai IZIN.');
  };

  // Save Attendances to Backend
  const handleSaveAttendance = async () => {
    if (!selectedEventId || memberRows.length === 0) return;

    setIsSaving(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        attendances: memberRows.map((r) => ({
          memberId: r.memberId,
          status: r.status,
          notes: r.notes.trim() || undefined,
        })),
      };

      const res = await fetch(`http://localhost:5000/api/attendance/events/${selectedEventId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Absensi anggota berhasil disimpan!');
        // Refresh event list to update stats badges
        fetchEvents(false);
        // Update local sheet stats
        if (json.data) {
          setAttendanceSheet(json.data);
          setMemberRows(json.data.attendances || []);
        }
      } else {
        toast.error(json.message || 'Gagal menyimpan absensi.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  // Create New Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error('Judul kegiatan wajib diisi.');
      return;
    }

    setIsCreatingEvent(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/attendance/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newEventTitle.trim(),
          description: newEventDescription.trim() || undefined,
          eventDate: new Date(newEventDate).toISOString(),
          location: newEventLocation.trim(),
          type: newEventType,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        toast.success('Kegiatan baru berhasil dibuat! Membuka lembar absensi...');
        setIsCreateEventModalOpen(false);
        // Reset form
        setNewEventTitle('');
        setNewEventDescription('');
        // Refresh event list and auto-select new event
        await fetchEvents(false);
        setSelectedEventId(json.data.id);
      } else {
        toast.error(json.message || 'Gagal membuat kegiatan.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Calculate live stats from memberRows state
  const liveStats = useMemo(() => {
    const total = memberRows.length;
    const present = memberRows.filter((r) => r.status === 'PRESENT').length;
    const absent = memberRows.filter((r) => r.status === 'ABSENT').length;
    const excused = memberRows.filter((r) => r.status === 'EXCUSED').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, excused, rate };
  }, [memberRows]);

  // Filtered rows for table view
  const filteredMemberRows = useMemo(() => {
    return memberRows.filter((r) => {
      const matchSearch =
        searchMember.trim() === '' ||
        r.name.toLowerCase().includes(searchMember.toLowerCase().trim()) ||
        r.memberNumber.toLowerCase().includes(searchMember.toLowerCase().trim());

      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [memberRows, searchMember, statusFilter]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || attendanceSheet?.event;
  }, [events, selectedEventId, attendanceSheet]);

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
                  Manajemen Absensi &amp; Keaktifan
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
                Kelola Absensi Anggota
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Pilih kegiatan, tentukan status kehadiran anggota (Hadir, Izin, Tidak Hadir), dan simpan absensi secara kolektif.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin' : ''}`} />}
                onClick={() => fetchEvents(false)}
                disabled={isLoadingEvents}
              >
                Segarkan
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateEventModalOpen(true)}
              >
                Buat Kegiatan Baru
              </Button>
            </div>
          </div>

          {/* ── TAB NAVIGATION ── */}
          <div className="flex items-center gap-2 border-b border-taruna-border dark:border-slate-800 pb-2 flex-wrap">
            <button
              onClick={() => setActiveTab('SHEET')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'SHEET'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-taruna-border dark:border-slate-800 hover:bg-gray-50'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              Lembar Presensi Kegiatan
            </button>
            <button
              onClick={() => setActiveTab('RECORDS')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'RECORDS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-taruna-border dark:border-slate-800 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4" />
              Pencarian &amp; Filter Absensi (Server API)
            </button>
          </div>

          {/* ── TAB 1: LEMBAR PRESENSI PER KEGIATAN ── */}
          {activeTab === 'SHEET' && (
            <div className="space-y-6">
              {/* ── EVENT SELECTOR CARD ── */}
              <Card>
                <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    Pilih Kegiatan / Pertemuan
                  </CardTitle>
                  <CardDescription>
                    Pilih salah satu agenda Karang Taruna untuk mulai mengisi lembar presensi.
                  </CardDescription>
                </div>

                <div className="w-full sm:w-72">
                  <Select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    options={
                      events.length > 0
                        ? events.map((ev) => ({
                            value: ev.id,
                            label: `${ev.title} (${new Date(ev.eventDate).toLocaleDateString('id-ID')})`,
                          }))
                        : [{ value: '', label: 'Belum ada kegiatan' }]
                    }
                  />
                </div>
              </div>
            </CardHeader>

            {/* Event detail banner if event selected */}
            {selectedEvent && (
              <CardContent className="pt-0 border-t border-taruna-border dark:border-slate-800 mt-2">
                <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-black text-taruna-dark dark:text-white">
                        {selectedEvent.title}
                      </span>
                      <Badge variant="primary" size="sm">
                        {selectedEvent.type || 'KEGIATAN'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        {new Date(selectedEvent.eventDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        {selectedEvent.location}
                      </span>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-taruna-border dark:border-slate-700">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Total</div>
                      <div className="text-base font-black text-taruna-dark dark:text-white">{liveStats.total}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Hadir</div>
                      <div className="text-base font-black text-emerald-700 dark:text-emerald-300">{liveStats.present}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Izin</div>
                      <div className="text-base font-black text-amber-700 dark:text-amber-300">{liveStats.excused}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                      <div className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold">Absen</div>
                      <div className="text-base font-black text-red-700 dark:text-red-300">{liveStats.absent}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* ── TOOLBAR & BULK ACTIONS ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-taruna-border dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-56">
                <Input
                  placeholder="Cari nama atau nomor..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                />
              </div>

              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  options={[
                    { value: 'ALL', label: 'Semua Status' },
                    { value: 'PRESENT', label: 'Hanya Hadir' },
                    { value: 'EXCUSED', label: 'Hanya Izin' },
                    { value: 'ABSENT', label: 'Hanya Absen' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
                onClick={handleMarkAllPresent}
              >
                Tandai Semua Hadir
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
                onClick={handleMarkAllExcused}
              >
                Tandai Semua Izin
              </Button>
            </div>
          </div>

          {/* ── ATTENDANCE SHEET TABLE ── */}
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Lembar Presensi Anggota ({filteredMemberRows.length} dari {memberRows.length} Pemuda)
                </CardTitle>
                <CardDescription>
                  Pilih status kehadiran untuk masing-masing pemuda Karang Taruna Tuk Uluh.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Tingkat Kehadiran:</span>
                <span className="text-sm font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  {liveStats.rate}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead className="w-60">Nama Anggota</TableHead>
                      <TableHead className="w-80 text-center">Status Kehadiran</TableHead>
                      <TableHead>Catatan / Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSheet ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                            <span className="text-xs">Memuat lembar absensi kegiatan...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredMemberRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-1.5 text-gray-400">
                            <Info className="w-6 h-6" />
                            <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                              Tidak ada anggota yang cocok dengan filter
                            </span>
                            <span className="text-xs">Coba bersihkan pencarian atau ubah status filter.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMemberRows.map((row, idx) => (
                        <TableRow key={row.memberId} className="hover:bg-taruna-surface/60 dark:hover:bg-slate-800/50">
                          {/* No */}
                          <TableCell className="text-center text-xs text-gray-400 font-medium">
                            {idx + 1}
                          </TableCell>

                          {/* Nama Anggota */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {row.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-taruna-dark dark:text-white leading-tight">
                                  {row.name}
                                </p>
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {row.memberNumber}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Status Kehadiran: HADIR | IZIN | TIDAK HADIR */}
                          <TableCell>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* HADIR */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(row.memberId, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                  row.status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                HADIR
                              </button>

                              {/* IZIN */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(row.memberId, 'EXCUSED')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                  row.status === 'EXCUSED'
                                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                IZIN
                              </button>

                              {/* TIDAK HADIR */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(row.memberId, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                  row.status === 'ABSENT'
                                    ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-500/30'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                TIDAK HADIR
                              </button>
                            </div>
                          </TableCell>

                          {/* Catatan */}
                          <TableCell>
                            <Input
                              placeholder="Ketik catatan / alasan izin..."
                              value={row.notes}
                              onChange={(e) => handleNotesChange(row.memberId, e.target.value)}
                              className="text-xs py-1.5 h-9"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ── STICKY SAVE BAR ── */}
          <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-taruna-border dark:border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-taruna-dark dark:text-white">Rekapitulasi:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {liveStats.present} Hadir
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {liveStats.excused} Izin
              </span>
              <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {liveStats.absent} Tidak Hadir
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold px-6"
              leftIcon={<Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />}
              onClick={handleSaveAttendance}
              isLoading={isSaving}
              disabled={isSaving || memberRows.length === 0}
            >
              Simpan Absensi Kegiatan
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB 2: PENCARIAN & FILTER SELURUH CATATAN ABSENSI (SERVER API) ── */}
      {activeTab === 'RECORDS' && (
        <div className="space-y-6">
          {/* Filter Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                Pencarian &amp; Filter Absensi (Database API)
              </CardTitle>
              <CardDescription>
                Pencarian data absensi yang dieksekusi langsung di level backend API untuk menangani volume data besar secara efisien.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Filter Nama */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Nama / No Anggota
                  </label>
                  <Input
                    placeholder="Ketik nama anggota..."
                    value={recordsSearch}
                    onChange={(e) => {
                      setRecordsSearch(e.target.value);
                      setRecordsPage(1);
                    }}
                    leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                  />
                </div>

                {/* 2. Filter Kegiatan */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Kegiatan
                  </label>
                  <Select
                    value={recordsEventId}
                    onChange={(e) => {
                      setRecordsEventId(e.target.value);
                      setRecordsPage(1);
                    }}
                    options={[
                      { value: 'ALL', label: 'Semua Kegiatan' },
                      ...events.map((ev) => ({
                        value: ev.id,
                        label: ev.title,
                      })),
                    ]}
                  />
                </div>

                {/* 3. Filter Status */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Status Kehadiran
                  </label>
                  <Select
                    value={recordsStatus}
                    onChange={(e) => {
                      setRecordsStatus(e.target.value as any);
                      setRecordsPage(1);
                    }}
                    options={[
                      { value: 'ALL', label: 'Semua Status' },
                      { value: 'PRESENT', label: 'Hadir' },
                      { value: 'EXCUSED', label: 'Izin' },
                      { value: 'ABSENT', label: 'Tidak Hadir' },
                    ]}
                  />
                </div>

                {/* 4. Filter Tanggal */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Tanggal Kegiatan
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={recordsDate}
                      onChange={(e) => {
                        setRecordsDate(e.target.value);
                        setRecordsPage(1);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {recordsDate && (
                      <button
                        onClick={() => {
                          setRecordsDate('');
                          setRecordsPage(1);
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reset All Filters Button */}
              {(recordsSearch || recordsEventId !== 'ALL' || recordsStatus !== 'ALL' || recordsDate) && (
                <div className="mt-3 pt-3 border-t border-taruna-border dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      setRecordsSearch('');
                      setRecordsEventId('ALL');
                      setRecordsStatus('ALL');
                      setRecordsDate('');
                      setRecordsPage(1);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Result Card */}
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2 pb-2">
              <div>
                <CardTitle className="text-base">Daftar Hasil Pencarian Absensi</CardTitle>
                <CardDescription>
                  Data presensi yang tersaring via query server Prisma database.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAttendanceRecords}
                  disabled={isLoadingRecords}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />}
                >
                  Segarkan
                </Button>
                <Badge variant="primary">
                  Total {recordsTotal} Catatan
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Nama Anggota</TableHead>
                      <TableHead>Kegiatan &amp; Tanggal</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead className="text-center w-36">Status</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRecords ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell colSpan={6} className="text-center py-4">
                            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-md animate-pulse w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : recordsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                          Tidak ditemukan catatan absensi yang sesuai kriteria pencarian.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recordsList.map((rec, idx) => {
                        const num = (recordsPage - 1) * recordsLimit + idx + 1;
                        return (
                          <TableRow key={rec.id}>
                            <TableCell className="text-center text-xs text-gray-500">{num}</TableCell>
                            <TableCell>
                              <div className="font-bold text-sm text-taruna-dark dark:text-white">
                                {rec.member?.name || '-'}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono">
                                {rec.member?.memberNumber || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                {rec.event?.title || '-'}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {rec.event?.eventDate ? new Date(rec.event.eventDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-600 dark:text-slate-300">
                              {rec.event?.location || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {rec.status === 'PRESENT' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> HADIR
                                </span>
                              )}
                              {rec.status === 'EXCUSED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  <Clock className="w-3.5 h-3.5" /> IZIN
                                </span>
                              )}
                              {rec.status === 'ABSENT' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                                  <XCircle className="w-3.5 h-3.5" /> TIDAK HADIR
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500 italic">
                              {rec.notes || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Footer */}
              {recordsTotalPages > 1 && (
                <div className="p-4 border-t border-taruna-border dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Halaman {recordsPage} dari {recordsTotalPages} ({recordsTotal} total catatan)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={recordsPage <= 1}
                      onClick={() => setRecordsPage((p) => Math.max(1, p - 1))}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={recordsPage >= recordsTotalPages}
                      onClick={() => setRecordsPage((p) => Math.min(recordsTotalPages, p + 1))}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
        <Footer />
      </div>

      {/* ── MODAL: BUAT KEGIATAN BARU ── */}
      <Modal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        title="Buat Kegiatan / Pertemuan Baru"
        description="Tambahkan kegiatan baru untuk segera diisi lembar absensinya."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateEventModalOpen(false)}
              disabled={isCreatingEvent}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreateEvent}
              isLoading={isCreatingEvent}
            >
              Simpan &amp; Buka Absensi
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEvent} className="space-y-3.5 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
              Judul Kegiatan <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Rapat Pleno Rutin Awal Bulan"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                Tanggal Kegiatan <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                Jenis Kegiatan
              </label>
              <Select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                options={[
                  { value: 'MEETING', label: 'Rapat / Pertemuan' },
                  { value: 'COMMUNITY_SERVICE', label: 'Kerja Bakti' },
                  { value: 'SOCIAL', label: 'Kegiatan Sosial' },
                  { value: 'SPORTS', label: 'Olahraga' },
                  { value: 'OTHER', label: 'Lainnya' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
              Lokasi Kegiatan <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Balai Pertemuan Dusun Tuk Uluh"
              value={newEventLocation}
              onChange={(e) => setNewEventLocation(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
              Deskripsi / Agenda (Opsional)
            </label>
            <Input
              placeholder="Contoh: Pembahasan program kerja dan arisan bulanan"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
