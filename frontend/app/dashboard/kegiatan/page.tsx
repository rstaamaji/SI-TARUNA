'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
  CalendarCheck2,
  Clock,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Eye,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { getStoredUser, isUserAdmin, UserRole } from '@/lib/auth';

export interface EventScheduleItem {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  dayOfWeek?: string | null;
  time?: string | null;
  location: string;
  type: 'MEETING' | 'COMMUNITY_SERVICE' | 'ARISAN' | 'SOCIAL' | 'TARUNA' | 'SPORTS' | 'OTHER' | string;
  attendances?: {
    id: string;
    status: string;
    memberId: string;
  }[];
}

const EVENT_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'primary' | 'accent' | 'warning' | 'success' | 'info' | 'neutral' | 'outline';
    bgLight: string;
    textLight: string;
    borderLight: string;
    darkBg: string;
    darkText: string;
  }
> = {
  MEETING: {
    label: 'Rapat',
    variant: 'primary',
    bgLight: 'bg-blue-50',
    textLight: 'text-blue-700',
    borderLight: 'border-blue-200',
    darkBg: 'dark:bg-blue-950/40',
    darkText: 'dark:text-blue-300',
  },
  COMMUNITY_SERVICE: {
    label: 'Kerja Bakti',
    variant: 'success',
    bgLight: 'bg-emerald-50',
    textLight: 'text-emerald-700',
    borderLight: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-950/40',
    darkText: 'dark:text-emerald-300',
  },
  ARISAN: {
    label: 'Arisan',
    variant: 'warning',
    bgLight: 'bg-amber-50',
    textLight: 'text-amber-800',
    borderLight: 'border-amber-200',
    darkBg: 'dark:bg-amber-950/40',
    darkText: 'dark:text-amber-300',
  },
  SOCIAL: {
    label: 'Kegiatan Sosial',
    variant: 'accent',
    bgLight: 'bg-indigo-50',
    textLight: 'text-indigo-700',
    borderLight: 'border-indigo-200',
    darkBg: 'dark:bg-indigo-950/40',
    darkText: 'dark:text-indigo-300',
  },
  TARUNA: {
    label: 'Kegiatan Karang Taruna',
    variant: 'primary',
    bgLight: 'bg-cyan-50',
    textLight: 'text-cyan-800',
    borderLight: 'border-cyan-200',
    darkBg: 'dark:bg-cyan-950/40',
    darkText: 'dark:text-cyan-300',
  },
  SPORTS: {
    label: 'Olahraga',
    variant: 'info',
    bgLight: 'bg-sky-50',
    textLight: 'text-sky-700',
    borderLight: 'border-sky-200',
    darkBg: 'dark:bg-sky-950/40',
    darkText: 'dark:text-sky-300',
  },
  OTHER: {
    label: 'Lainnya',
    variant: 'neutral',
    bgLight: 'bg-slate-50',
    textLight: 'text-slate-700',
    borderLight: 'border-slate-200',
    darkBg: 'dark:bg-slate-800/60',
    darkText: 'dark:text-slate-300',
  },
};

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function KegiatanPage() {
  const toast = useToast();

  // Role & User
  const [userRole, setUserRole] = useState<UserRole>('MEMBER');

  // Events Data
  const [events, setEvents] = useState<EventScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Modal Detail State
  const [detailEvent, setDetailEvent] = useState<EventScheduleItem | null>(null);

  // Modal Create/Edit State (Admin)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventScheduleItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('MEETING');
  const [formDate, setFormDate] = useState('2026-10-15');
  const [formDayOfWeek, setFormDayOfWeek] = useState('Kamis');
  const [formTime, setFormTime] = useState('19:30 WIB');
  const [formLocation, setFormLocation] = useState('Balai Dusun Tuk Uluh');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EventScheduleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Preset Locations for Dusun Tuk Uluh
  const locationPresets = [
    'Balai Dusun Tuk Uluh',
    'Pos Ronda RT 01 Dusun Tuk Uluh',
    'Pos Ronda RT 02 Dusun Tuk Uluh',
    'Pos Ronda RT 03 Dusun Tuk Uluh',
    'Lapangan Voli Dusun Tuk Uluh',
    'Kediaman Sdr. Rustam Aji (RT 01)',
    'Kediaman Sdr. Bambang (RT 01)',
    'Kediaman Sdri. Siti Nurhaliza (RT 02)',
    'Kediaman Sdr. Fajar Nugroho (RT 03)',
  ];

  // Read Auth
  useEffect(() => {
    try {
      const u = getStoredUser();
      if (u) {
        setUserRole(u.role);
      }
    } catch {
      // fallback
    }
  }, []);

  const isAdmin = isUserAdmin(userRole);

  // Helper date auto derivation
  const handleDateChange = (dateVal: string) => {
    setFormDate(dateVal);
    if (dateVal) {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        setFormDayOfWeek(INDO_DAYS[d.getDay()] || 'Minggu');
      }
    }
  };

  // Helper API Base URL
  const getApiBase = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }
    return 'http://localhost:5000/api';
  };

  // Fetch Events from API with Server-Side Search and Filter
  const fetchEvents = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const apiBase = getApiBase();

        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (selectedType && selectedType !== 'ALL') params.append('type', selectedType);
        if (selectedMonth && selectedMonth !== 'ALL') params.append('month', selectedMonth);
        if (selectedYear && selectedYear !== 'ALL') params.append('year', selectedYear);
        if (selectedDate) {
          params.append('startDate', selectedDate);
          params.append('endDate', selectedDate);
        }

        const qs = params.toString();
        const res = await fetch(`${apiBase}/events${qs ? `?${qs}` : ''}`, { headers });
        const json = await res.json();

        if (res.ok && json.success && Array.isArray(json.data)) {
          setEvents(json.data);
          if (isManual) {
            toast.success('Daftar jadwal kegiatan berhasil disegarkan.');
          }
        } else {
          // Fallback demo events for Dusun Tuk Uluh
          loadFallbackEvents();
        }
      } catch {
        loadFallbackEvents();
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, selectedType, selectedMonth, selectedYear, selectedDate, toast]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const loadFallbackEvents = () => {
    setEvents([
      {
        id: 'ev-demo-1',
        title: 'Pertemuan Rutin & Arisan Pemuda Putaran Ke-10',
        type: 'ARISAN',
        eventDate: '2026-10-05T19:30:00.000Z',
        dayOfWeek: 'Senin',
        time: '19:30 WIB',
        location: 'Kediaman Sdr. Rustam Aji (RT 01)',
        description: 'Pertemuan rutin bulanan, pengundian arisan putaran ke-10, koordinasi jimpitan beras, serta pembahasan evaluasi kegiatan pemuda.',
      },
      {
        id: 'ev-demo-2',
        title: 'Kerja Bakti Bersih Saluran Air & Gapura Dusun',
        type: 'COMMUNITY_SERVICE',
        eventDate: '2026-10-11T06:30:00.000Z',
        dayOfWeek: 'Minggu',
        time: '06:30 WIB',
        location: 'Area Gapura Masuk Dusun Tuk Uluh',
        description: 'Kerja bakti pembersihan selokan dan perapian lingkungan menjelang musim penghujan. Seluruh anggota diharapkan membawa alat cangkul dan sabit.',
      },
      {
        id: 'ev-demo-3',
        title: 'Rapat Koordinasi Persiapan Turnamen Voli Taruna Cup',
        type: 'MEETING',
        eventDate: '2026-10-18T20:00:00.000Z',
        dayOfWeek: 'Minggu',
        time: '20:00 WIB',
        location: 'Balai Dusun Tuk Uluh',
        description: 'Pembentukan susunan panitia pelaksana turnamen voli persahabatan antar dusun Desa Sringin.',
      },
      {
        id: 'ev-demo-4',
        title: 'Bakti Sosial & Santunan Warga Lansia',
        type: 'SOCIAL',
        eventDate: '2026-10-25T09:00:00.000Z',
        dayOfWeek: 'Minggu',
        time: '09:00 WIB',
        location: 'Pos Ronda RT 02 Dusun Tuk Uluh',
        description: 'Penyaluran sembako hasil dana jimpitan kas pemuda bagi warga sepuh dan kurang mampu di Dusun Tuk Uluh.',
      },
      {
        id: 'ev-demo-5',
        title: 'Pelatihan Kewirausahaan Pemuda Karang Taruna',
        type: 'TARUNA',
        eventDate: '2026-11-01T13:30:00.000Z',
        dayOfWeek: 'Minggu',
        time: '13:30 WIB',
        location: 'Balai Dusun Tuk Uluh',
        description: 'Workshop pemanfaatan media sosial dan digital marketing untuk produk UMKM pemuda Dusun Tuk Uluh.',
      },
    ]);
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Compute status helpers
  const getEventTimingStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const evDatePure = new Date(dateStr);
    evDatePure.setHours(0, 0, 0, 0);

    const diffMs = evDatePure.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'PAST', label: 'Telah Selesai', badgeVariant: 'neutral' as const };
    }
    if (diffDays === 0) {
      return { status: 'TODAY', label: 'HARI INI', badgeVariant: 'accent' as const };
    }
    if (diffDays === 1) {
      return { status: 'TOMORROW', label: 'BESOK', badgeVariant: 'warning' as const };
    }
    if (diffDays <= 7) {
      return { status: 'SOON', label: `${diffDays} Hari Lagi`, badgeVariant: 'accent' as const };
    }
    return { status: 'UPCOMING', label: `${diffDays} Hari Lagi`, badgeVariant: 'primary' as const };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // KEGIATAN TERDEKAT (Urutkan berdasarkan tanggal terdekat)
  // ─────────────────────────────────────────────────────────────────────────────
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter events where date >= today, sorted ascending
    const futureOnly = events
      .filter((e) => {
        const d = new Date(e.eventDate);
        return d.getTime() >= today.getTime();
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    // Return only future events, sorted nearest first
    return futureOnly.slice(0, 3);
  }, [events]);

  // Filtered full list
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchLoc = e.location.toLowerCase().includes(q);
          const matchDesc = e.description?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchLoc && !matchDesc) return false;
        }

        // Type filter
        if (selectedType !== 'ALL') {
          const upperType = String(e.type).toUpperCase();
          if (upperType !== selectedType) return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const d = new Date(e.eventDate);
          if (selectedStatus === 'UPCOMING' && d.getTime() < today.getTime()) return false;
          if (selectedStatus === 'PAST' && d.getTime() >= today.getTime()) return false;
        }

        // Month filter
        if (selectedMonth !== 'ALL') {
          const m = new Date(e.eventDate).getMonth() + 1;
          if (m !== Number(selectedMonth)) return false;
        }

        // Year filter
        if (selectedYear !== 'ALL') {
          const y = new Date(e.eventDate).getFullYear();
          if (y !== Number(selectedYear)) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events, searchQuery, selectedType, selectedStatus, selectedMonth, selectedYear]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MODAL FORM OPEN HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormType('MEETING');
    setFormDate(new Date().toISOString().split('T')[0]);
    const today = new Date();
    setFormDayOfWeek(INDO_DAYS[today.getDay()] || 'Minggu');
    setFormTime('19:30 WIB');
    setFormLocation('Balai Dusun Tuk Uluh');
    setFormDescription('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: EventScheduleItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormType(item.type || 'MEETING');
    const d = new Date(item.eventDate);
    if (!isNaN(d.getTime())) {
      setFormDate(item.eventDate.split('T')[0]);
    } else {
      setFormDate('2026-10-15');
    }
    setFormDayOfWeek(item.dayOfWeek || INDO_DAYS[d.getDay()] || 'Kamis');
    setFormTime(item.time || '19:30 WIB');
    setFormLocation(item.location);
    setFormDescription(item.description || '');
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error('Nama kegiatan wajib diisi.');
      return;
    }
    if (!formDate) {
      toast.error('Tanggal kegiatan wajib dipilih.');
      return;
    }
    if (!formLocation.trim()) {
      toast.error('Lokasi kegiatan wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Combine date and time
      const payload = {
        title: formTitle.trim(),
        type: formType,
        eventDate: new Date(formDate).toISOString(),
        dayOfWeek: formDayOfWeek.trim() || 'Minggu',
        time: formTime.trim() || '19:30 WIB',
        location: formLocation.trim(),
        description: formDescription.trim() || null,
      };

      const apiBase = getApiBase();
      const url = editingItem ? `${apiBase}/events/${editingItem.id}` : `${apiBase}/events`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          editingItem
            ? 'Jadwal kegiatan berhasil diperbarui!'
            : 'Kegiatan baru berhasil dijadwalkan!'
        );
        setIsFormModalOpen(false);
        fetchEvents(false);
      } else {
        toast.error(json.message || 'Gagal menyimpan data kegiatan.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE HANDLER
  // ─────────────────────────────────────────────────────────────────────────────
  const confirmDelete = (item: EventScheduleItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/events/${itemToDelete.id}`, {
        method: 'DELETE',
        headers,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Kegiatan berhasil dihapus.');
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        fetchEvents(false);
      } else {
        toast.error(json.message || 'Gagal menghapus kegiatan.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. HEADER & HERO SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              Module 19 • Activity Scheduling
            </span>
            <Badge variant="accent" size="sm">
              <CalendarDays className="w-3 h-3 mr-1 inline" />
              Event Management
            </Badge>
            {isAdmin && (
              <Badge variant="primary" size="sm">
                <ShieldCheck className="w-3 h-3 mr-1 inline" />
                Admin Mode
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
            Jadwal &amp; Agenda Kegiatan
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Pusat manajemen jadwal kegiatan Karang Taruna Setya Bakti Dusun Tuk Uluh. Meliputi rapat pleno, kerja bakti, pertemuan arisan, dan kegiatan sosial pemuda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchEvents(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Segarkan
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Tambah Kegiatan
            </Button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. DASHBOARD SPECIAL SECTION: "KEGIATAN TERDEKAT" (URUTAN TANGGAL TERDEKAT)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-taruna-dark dark:text-white tracking-tight">
                Kegiatan Terdekat
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Agenda organisasi yang akan berlangsung dalam waktu dekat, diurutkan berdasarkan tanggal pelaksanaan.
              </p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            Prioritas Agenda
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-3xl bg-gray-100 dark:bg-slate-800 animate-pulse border border-taruna-border dark:border-slate-800"
              />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-taruna-border dark:border-slate-800 text-center space-y-2">
            <CalendarCheck2 className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-gray-600 dark:text-slate-300">
              Belum Ada Kegiatan Terdekat
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Saat ini belum ada jadwal kegiatan mendatang yang tercatat dalam agenda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((item, idx) => {
              const timing = getEventTimingStatus(item.eventDate);
              const cfg = EVENT_TYPE_CONFIG[item.type] || EVENT_TYPE_CONFIG.OTHER;
              const isFirst = idx === 0;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border transition flex flex-col justify-between relative overflow-hidden group shadow-xs hover:shadow-md ${
                    isFirst
                      ? 'bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/30'
                      : 'bg-white dark:bg-slate-900 border-taruna-border dark:border-slate-800 hover:border-taruna-yellow-500/50'
                  }`}
                >
                  {/* Decorative badge indicator */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={cfg.variant} size="sm">
                        {cfg.label}
                      </Badge>
                      <Badge variant={timing.badgeVariant} size="sm" dot>
                        {timing.label}
                      </Badge>
                    </div>

                    <button
                      onClick={() => setDetailEvent(item)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                      title="Lihat Detail Lengkap"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1.5 mb-4">
                    <h3 className="font-black text-base text-taruna-dark dark:text-white leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Day, Date, Time, Location Info */}
                  <div className="pt-3 border-t border-taruna-border/70 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                      <CalendarIcon className="w-3.5 h-3.5 text-taruna-yellow-600 shrink-0" />
                      <span className="font-semibold text-taruna-dark dark:text-white">
                        {item.dayOfWeek || 'Hari'},
                      </span>
                      <span>
                        {new Date(item.eventDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {item.time || '19:30 WIB'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate" title={item.location}>
                        {item.location}
                      </span>
                    </div>
                  </div>

                  {/* Admin Actions Footer */}
                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-taruna-border/60 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 rounded-lg border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-taruna-yellow-50 dark:hover:bg-slate-700 text-taruna-dark dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <Pencil className="w-3 h-3 text-taruna-yellow-600" />
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(item)}
                        className="p-1 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. STATS CARDS ROW
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Kegiatan
          </span>
          <span className="text-2xl font-black text-taruna-dark dark:text-white mt-1 block">
            {events.length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Tercatat di sistem</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Akan Datang
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {
              events.filter((e) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(e.eventDate).getTime() >= today.getTime();
              }).length
            }
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Agenda aktif</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Rapat &amp; Arisan
          </span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {events.filter((e) => e.type === 'MEETING' || e.type === 'ARISAN').length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Pertemuan rutin</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
            Sosial &amp; Kerja Bakti
          </span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {events.filter((e) => e.type === 'COMMUNITY_SERVICE' || e.type === 'SOCIAL' || e.type === 'TARUNA').length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Kegiatan lapangan</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. FILTER & SEARCH BAR
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-taruna-border dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kegiatan, lokasi, atau deskripsi agenda..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-taruna-border dark:border-slate-700 bg-taruna-surface/50 dark:bg-slate-800 text-taruna-dark dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-taruna-yellow-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Hapus
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 text-taruna-dark dark:text-slate-200 font-semibold focus:outline-hidden"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="MEETING">Rapat</option>
              <option value="COMMUNITY_SERVICE">Kerja Bakti</option>
              <option value="ARISAN">Arisan</option>
              <option value="SOCIAL">Kegiatan Sosial</option>
              <option value="TARUNA">Kegiatan Karang Taruna</option>
              <option value="OTHER">Lainnya</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 text-taruna-dark dark:text-slate-200 font-semibold focus:outline-hidden"
            >
              <option value="ALL">Semua Status</option>
              <option value="UPCOMING">Akan Datang</option>
              <option value="PAST">Telah Selesai</option>
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 text-taruna-dark dark:text-slate-200 font-semibold focus:outline-hidden"
            >
              <option value="ALL">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 text-taruna-dark dark:text-slate-200 font-semibold focus:outline-hidden"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* Input Tanggal Khusus */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                title="Filter Tanggal Spesifik"
                className="px-3 py-1.5 text-xs rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 text-taruna-dark dark:text-slate-200 font-semibold focus:outline-hidden"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  title="Reset Tanggal"
                >
                  Reset Tgl
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter tags summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pt-1">
          <span>
            Menampilkan <strong className="text-taruna-dark dark:text-white">{filteredEvents.length}</strong> kegiatan
          </span>
          {(searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL' || selectedMonth !== 'ALL' || selectedYear !== '2026' || selectedDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
                setSelectedStatus('ALL');
                setSelectedMonth('ALL');
                setSelectedYear('2026');
                setSelectedDate('');
              }}
              className="text-taruna-yellow-600 dark:text-taruna-yellow-400 hover:underline font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. DAFTAR AGENDA LENGKAP
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse border border-taruna-border dark:border-slate-800"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-taruna-border dark:border-slate-800 text-center space-y-3">
            <CalendarDays className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-base text-taruna-dark dark:text-white">
              Tidak Ada Kegiatan Ditemukan
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Tidak ada jadwal kegiatan yang cocok dengan kriteria filter atau pencarian Anda.
            </p>
            {isAdmin && (
              <Button variant="primary" size="sm" onClick={openCreateModal} className="mt-2">
                Buat Kegiatan Baru
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((item) => {
              const timing = getEventTimingStatus(item.eventDate);
              const cfg = EVENT_TYPE_CONFIG[item.type] || EVENT_TYPE_CONFIG.OTHER;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 hover:border-taruna-yellow-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Date Stamp & Main Info */}
                  <div className="flex items-start gap-4">
                    {/* Calendar Badge Icon */}
                    <div className="w-14 h-16 rounded-2xl bg-gradient-to-b from-taruna-yellow-500/10 to-taruna-yellow-500/5 dark:from-slate-800 dark:to-slate-800/80 border border-taruna-yellow-500/20 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black uppercase text-taruna-yellow-700 dark:text-taruna-yellow-400 tracking-wider">
                        {item.dayOfWeek ? item.dayOfWeek.slice(0, 3) : 'HRI'}
                      </span>
                      <span className="text-xl font-black text-taruna-dark dark:text-white leading-tight">
                        {new Date(item.eventDate).getDate()}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {new Date(item.eventDate).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={cfg.variant} size="sm">
                          {cfg.label}
                        </Badge>
                        <Badge variant={timing.badgeVariant} size="sm" dot>
                          {timing.label}
                        </Badge>
                      </div>

                      <h3
                        onClick={() => setDetailEvent(item)}
                        className="text-base font-black text-taruna-dark dark:text-white hover:text-taruna-yellow-600 dark:hover:text-taruna-yellow-400 cursor-pointer transition"
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 max-w-2xl leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Detail Chips */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 flex-wrap pt-1">
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
                          <Clock className="w-3.5 h-3.5" />
                          {item.time || '19:30 WIB'}
                        </span>
                        <span className="text-gray-300 dark:text-slate-700">•</span>
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => setDetailEvent(item)}
                      className="px-3 py-1.5 rounded-xl border border-taruna-border dark:border-slate-700 bg-taruna-surface/60 dark:bg-slate-800 hover:bg-taruna-surface text-taruna-dark dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      Detail
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-taruna-yellow-50 dark:hover:bg-slate-700 text-taruna-yellow-700 dark:text-taruna-yellow-400 text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                          title="Hapus Kegiatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL DETAIL KEGIATAN (MEMBER & ADMIN)
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        title="Rincian Lengkap Kegiatan"
        description="Informasi detail jadwal kegiatan Karang Taruna Setya Bakti Tuk Uluh."
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-400">SI-TARUNA Agenda System</span>
            <Button variant="secondary" size="sm" onClick={() => setDetailEvent(null)}>
              Tutup
            </Button>
          </div>
        }
      >
        {detailEvent && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={EVENT_TYPE_CONFIG[detailEvent.type]?.variant || 'neutral'} size="sm">
                {EVENT_TYPE_CONFIG[detailEvent.type]?.label || detailEvent.type}
              </Badge>
              <Badge variant={getEventTimingStatus(detailEvent.eventDate).badgeVariant} size="sm" dot>
                {getEventTimingStatus(detailEvent.eventDate).label}
              </Badge>
            </div>

            <h3 className="text-lg font-black text-taruna-dark dark:text-white leading-snug">
              {detailEvent.title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-taruna-surface/60 dark:bg-slate-800/60 border border-taruna-border dark:border-slate-700 text-xs">
              <div>
                <span className="text-gray-400 dark:text-slate-500 block">Hari &amp; Tanggal:</span>
                <strong className="text-taruna-dark dark:text-slate-200">
                  {detailEvent.dayOfWeek || 'Hari'},{' '}
                  {new Date(detailEvent.eventDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>

              <div>
                <span className="text-gray-400 dark:text-slate-500 block">Waktu Pelaksanaan:</span>
                <strong className="text-blue-600 dark:text-blue-400">
                  {detailEvent.time || '19:30 WIB'}
                </strong>
              </div>

              <div className="sm:col-span-2">
                <span className="text-gray-400 dark:text-slate-500 block">Lokasi:</span>
                <strong className="text-taruna-dark dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  {detailEvent.location}
                </strong>
              </div>
            </div>

            {detailEvent.description ? (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Deskripsi &amp; Petunjuk Kegiatan
                </h4>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 text-xs leading-relaxed text-gray-700 dark:text-slate-300 whitespace-pre-line">
                  {detailEvent.description}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Tidak ada deskripsi tambahan.</p>
            )}
          </div>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL TAMBAH / EDIT KEGIATAN (ADMIN ONLY)
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingItem ? 'Edit Jadwal Kegiatan' : 'Tambah Jadwal Kegiatan Baru'}
        description="Isi form berikut untuk menjadwalkan kegiatan Karang Taruna. Informasi akan langsung tampil pada dashboard seluruh anggota."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsFormModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleSaveForm}
            >
              {editingItem ? 'Simpan Perubahan' : 'Jadwalkan Kegiatan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveForm} className="space-y-4 text-left">
          <Input
            label="Nama Kegiatan"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Contoh: Rapat Koordinasi HUT RI / Kerja Bakti Bersih Selokan"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Kategori Kegiatan"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              options={[
                { value: 'MEETING', label: 'Rapat (Pleno / Evaluasi)' },
                { value: 'COMMUNITY_SERVICE', label: 'Kerja Bakti' },
                { value: 'ARISAN', label: 'Arisan Pemuda' },
                { value: 'SOCIAL', label: 'Kegiatan Sosial' },
                { value: 'TARUNA', label: 'Kegiatan Karang Taruna' },
                { value: 'SPORTS', label: 'Olahraga Pemuda' },
                { value: 'OTHER', label: 'Lainnya' },
              ]}
            />

            <Input
              label="Tanggal Kegiatan"
              type="date"
              value={formDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Hari"
              value={formDayOfWeek}
              onChange={(e) => setFormDayOfWeek(e.target.value)}
              placeholder="Contoh: Minggu, Senin, Selasa"
              helperText="Otomatis terisi saat memilih tanggal."
              required
            />

            <Input
              label="Jam / Waktu"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              placeholder="Contoh: 19:30 WIB atau 06:30 WIB"
              required
            />
          </div>

          <div>
            <Input
              label="Lokasi Kegiatan"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Contoh: Balai Dusun Tuk Uluh / Kediaman Sdr. Bambang"
              required
            />

            {/* Quick preset locations */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-gray-400 dark:text-slate-500 self-center mr-1">
                Pilih Cepat:
              </span>
              {locationPresets.map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setFormLocation(loc)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
                    formLocation === loc
                      ? 'bg-taruna-yellow-500 text-white border-taruna-yellow-600'
                      : 'bg-taruna-surface dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-taruna-border dark:border-slate-700 hover:border-taruna-yellow-400'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-semibold text-taruna-dark dark:text-slate-200 block mb-1.5">
              Deskripsi / Keterangan Tambahan
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Keterangan agenda, perlengkapan yang perlu dibawa, agenda musyawarah..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-taruna-dark dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-taruna-yellow-500 transition"
            />
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL HAPUS KEGIATAN (ADMIN ONLY)
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Kegiatan"
        description="Tindakan ini tidak dapat dibatalkan. Pastikan kegiatan ini memang tidak lagi relevan."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteItem}
            >
              Hapus Kegiatan
            </Button>
          </>
        }
      >
        {itemToDelete && (
          <div className="space-y-3 text-left">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 dark:text-red-300">
                Apakah Anda yakin ingin menghapus agenda kegiatan{' '}
                <strong className="font-bold underline">{itemToDelete.title}</strong>?
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                Hari &amp; Tanggal: {itemToDelete.dayOfWeek || 'Hari'},{' '}
                {new Date(itemToDelete.eventDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div>Lokasi: {itemToDelete.location}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
