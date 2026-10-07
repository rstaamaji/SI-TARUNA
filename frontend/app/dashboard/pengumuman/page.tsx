'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Megaphone,
  AlertTriangle,
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  User,
  ShieldCheck,
  CheckCircle2,
  Users,
  Shovel,
  Gift,
  Info,
  FileText,
  ChevronRight,
  Flame,
  Smartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { getStoredUser, isUserAdmin, UserRole } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────────

type AnnouncementType =
  | 'PENGUMUMAN'
  | 'RAPAT'
  | 'KERJA_BAKTI'
  | 'ARISAN'
  | 'INFORMASI'
  | 'LAINNYA';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isAttention: boolean;
  announcementDate: string;
  eventDate: string | null;
  createdAt?: string;
  createdBy?: {
    id?: string;
    username: string;
    role?: string;
    member?: {
      id?: string;
      name: string;
      memberNumber?: string;
    } | null;
  };
}

const ANNOUNCEMENT_TYPE_CONFIG: Record<
  AnnouncementType,
  {
    label: string;
    badgeVariant: 'primary' | 'accent' | 'success' | 'warning' | 'info' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderColor: string;
    bgLight: string;
  }
> = {
  PENGUMUMAN: {
    label: 'Pengumuman',
    badgeVariant: 'info',
    icon: Megaphone,
    accentColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-900/60',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
  },
  RAPAT: {
    label: 'Rapat',
    badgeVariant: 'primary',
    icon: Users,
    accentColor: 'text-taruna-yellow-700 dark:text-taruna-yellow-400',
    borderColor: 'border-taruna-yellow-200 dark:border-taruna-yellow-800/60',
    bgLight: 'bg-taruna-yellow-50 dark:bg-taruna-yellow-950/40',
  },
  KERJA_BAKTI: {
    label: 'Kerja Bakti',
    badgeVariant: 'success',
    icon: Shovel,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-900/60',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  ARISAN: {
    label: 'Arisan',
    badgeVariant: 'warning',
    icon: Gift,
    accentColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-900/60',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
  },
  INFORMASI: {
    label: 'Informasi',
    badgeVariant: 'info',
    icon: Info,
    accentColor: 'text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-200 dark:border-sky-900/60',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
  },
  LAINNYA: {
    label: 'Lainnya',
    badgeVariant: 'neutral',
    icon: FileText,
    accentColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-800',
    bgLight: 'bg-slate-50 dark:bg-slate-800/50',
  },
};

export default function PengumumanPage() {
  const toast = useToast();

  // ── Layout & Auth State ──
  const [userRole, setUserRole] = useState<UserRole>('MEMBER');

  // ── Data State ──
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Filter State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [onlyAttention, setOnlyAttention] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // ── Modal State (Admin Form) ──
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<AnnouncementType>('PENGUMUMAN');
  const [formIsAttention, setFormIsAttention] = useState(false);
  const [formPublishDate, setFormPublishDate] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventTime, setFormEventTime] = useState('');
  const [hasEventDate, setHasEventDate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Modal Delete State ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AnnouncementItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Modal Detail State ──
  const [detailItem, setDetailItem] = useState<AnnouncementItem | null>(null);

  // Read auth user
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

  // ── API Fetch with Server-Side Search & Filtering ──
  const fetchAnnouncements = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const apiBase = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
          : 'http://localhost:5000/api';

        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (selectedType && selectedType !== 'ALL') params.append('type', selectedType);
        if (onlyAttention) params.append('isAttention', 'true');
        if (selectedDate) {
          params.append('startDate', selectedDate);
          params.append('endDate', selectedDate);
        }
        if (selectedMonth && selectedMonth !== 'ALL') params.append('month', selectedMonth);
        if (selectedYear && selectedYear !== 'ALL') params.append('year', selectedYear);

        const qs = params.toString();
        const res = await fetch(`${apiBase}/announcements${qs ? `?${qs}` : ''}`, { headers });
        const json = await res.json();

        if (res.ok && json.success && Array.isArray(json.data)) {
          setAnnouncements(json.data);
        } else if (isManualRefresh) {
          toast.error(json.message || 'Gagal memuat daftar pengumuman');
        }
      } catch {
        if (isManualRefresh) {
          toast.error('Gagal terhubung ke server pengumuman');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, selectedType, onlyAttention, selectedDate, selectedMonth, selectedYear]
  );

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // ── Filtered Data ──
  const attentionItems = useMemo(() => {
    return announcements.filter((a) => a.isAttention);
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      // Type filter
      if (selectedType !== 'ALL' && a.type !== selectedType) {
        return false;
      }
      // Attention only filter
      if (onlyAttention && !a.isAttention) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchContent = a.content.toLowerCase().includes(q);
        const matchAuthor = (a.createdBy?.member?.name || a.createdBy?.username || '').toLowerCase().includes(q);
        return matchTitle || matchContent || matchAuthor;
      }
      return true;
    });
  }, [announcements, selectedType, onlyAttention, searchQuery]);

  // ── Helper Formatter ──
  const formatDateIndo = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTimeIndo = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const datePart = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} • ${timePart} WIB`;
  };

  // ── Form Modal Handlers ──
  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormType('PENGUMUMAN');
    setFormIsAttention(false);

    // Default publish date: today YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setFormPublishDate(today);

    // Event date default null
    setHasEventDate(false);
    setFormEventDate(today);
    setFormEventTime('19:30');

    setIsFormModalOpen(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormType(item.type || 'PENGUMUMAN');
    setFormIsAttention(Boolean(item.isAttention));

    // Parse publish date
    if (item.announcementDate) {
      const pubD = new Date(item.announcementDate);
      if (!isNaN(pubD.getTime())) {
        setFormPublishDate(pubD.toISOString().split('T')[0]);
      }
    } else {
      setFormPublishDate(new Date().toISOString().split('T')[0]);
    }

    // Parse event date
    if (item.eventDate) {
      const evD = new Date(item.eventDate);
      if (!isNaN(evD.getTime())) {
        setHasEventDate(true);
        setFormEventDate(evD.toISOString().split('T')[0]);
        const hh = String(evD.getHours()).padStart(2, '0');
        const mm = String(evD.getMinutes()).padStart(2, '0');
        setFormEventTime(`${hh}:${mm}`);
      } else {
        setHasEventDate(false);
      }
    } else {
      setHasEventDate(false);
      setFormEventDate(new Date().toISOString().split('T')[0]);
      setFormEventTime('19:30');
    }

    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error('Judul pengumuman wajib diisi');
      return;
    }
    if (!formContent.trim()) {
      toast.error('Isi pengumuman wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;

      // Construct publication date ISO
      const pubIso = formPublishDate
        ? new Date(`${formPublishDate}T08:00:00`).toISOString()
        : new Date().toISOString();

      // Construct event date ISO if enabled
      let evIso: string | null = null;
      if (hasEventDate && formEventDate) {
        const timePart = formEventTime || '19:30';
        evIso = new Date(`${formEventDate}T${timePart}:00`).toISOString();
      }

      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        type: formType,
        isAttention: formIsAttention,
        announcementDate: pubIso,
        eventDate: evIso,
      };

      const url = editingItem
        ? `http://localhost:5000/api/announcements/${editingItem.id}`
        : 'http://localhost:5000/api/announcements';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          editingItem
            ? 'Pengumuman berhasil diperbarui!'
            : 'Pengumuman baru berhasil diterbitkan!'
        );
        setIsFormModalOpen(false);
        fetchAnnouncements();
      } else {
        toast.error(json.message || 'Gagal menyimpan pengumuman');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat menyimpan pengumuman');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete Handler ──
  const confirmDelete = (item: AnnouncementItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const res = await fetch(`http://localhost:5000/api/announcements/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Pengumuman berhasil dihapus');
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        fetchAnnouncements();
      } else {
        toast.error(json.message || 'Gagal menghapus pengumuman');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus pengumuman');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. PAGE HEADER
      ───────────────────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-taruna-yellow-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-taruna-yellow-700 dark:text-taruna-yellow-400">
                  Pusat Informasi &amp; Edaran Resmi
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
                <Megaphone className="w-7 h-7 text-taruna-yellow-600 dark:text-taruna-yellow-400" />
                Pengumuman &amp; Attention System
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Informasi penting, jadwal kegiatan, rapat, dan edaran resmi Karang Taruna Setya Bakti.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchAnnouncements(true)}
                disabled={isRefreshing}
              >
                Segarkan
              </Button>

              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={openCreateModal}
                >
                  Buat Pengumuman
                </Button>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              2. SECTION KHUSUS: ATTENTION
              (Menampilkan informasi penting yang perlu diketahui anggota segera)
          ───────────────────────────────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-red-100 dark:bg-red-950/60 text-taruna-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 shadow-xs">
                  <Flame className="w-5 h-5 animate-pulse text-taruna-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#163E4F] tracking-tight flex items-center gap-2">
                    ATTENTION / PERHATIAN PENTING
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-taruna-red-600 text-white uppercase tracking-wider">
                      Wajib Diketahui
                    </span>
                  </h2>
                  <p className="text-xs font-bold text-[#163E4F]/80">
                    Instruksi, rapat prioritas, dan agenda mendesak yang memerlukan kehadiran atau tanggapan anggota.
                  </p>
                </div>
              </div>

              <div className="text-xs font-bold text-taruna-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900/60">
                {attentionItems.length} Informasi Perlu Perhatian
              </div>
            </div>

            {attentionItems.length === 0 ? (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-taruna-dark dark:text-white">
                  Tidak ada pengumuman mendesak saat ini
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  Seluruh agenda rutin berjalan normal. Anda dapat melihat daftar pengumuman lengkap pada bagian di bawah ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {attentionItems.map((item) => {
                  const cfg = ANNOUNCEMENT_TYPE_CONFIG[item.type] || ANNOUNCEMENT_TYPE_CONFIG.PENGUMUMAN;
                  const TypeIcon = cfg.icon;

                  return (
                    <div
                      key={item.id}
                      className="relative p-6 rounded-3xl bg-[#466060] text-white border-2 border-red-400 shadow-md hover:shadow-lg transition-all flex flex-col justify-between gap-5 group"
                    >
                      {/* Priority Ribbon */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="accent" size="sm" dot>
                            ATTENTION
                          </Badge>
                          <Badge variant={cfg.badgeVariant} size="sm">
                            <TypeIcon className="w-3 h-3 mr-1 inline" />
                            {cfg.label}
                          </Badge>
                        </div>

                        {item.eventDate && (
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.eventDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-white leading-snug group-hover:text-[#FDE047] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#D6DDD5] leading-relaxed line-clamp-3">
                          {item.content}
                        </p>
                      </div>

                      {/* Metadata & Actions */}
                      <div className="space-y-3 pt-3 border-t border-red-100 dark:border-slate-800">
                        {item.eventDate && (
                          <div className="p-2.5 rounded-xl bg-[#163E4F] border border-[#6A8578] text-xs text-[#D6DDD5] flex items-start gap-2">
                            <CalendarDays className="w-4 h-4 shrink-0 mt-0.5 text-taruna-red-600" />
                            <div>
                              <span className="block font-bold">Jadwal Pelaksanaan:</span>
                              <span>{formatDateTimeIndo(item.eventDate)}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-[#D6DDD5]">
                          <span>
                            Publikasi: {formatDateIndo(item.announcementDate) || '-'}
                          </span>
                          <span className="font-semibold text-white truncate max-w-[130px]">
                            Oleh: {item.createdBy?.member?.name || item.createdBy?.username || 'Admin'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="text-xs font-bold text-[#FDE047] hover:text-white inline-flex items-center gap-1 group-hover:translate-x-0.5 transition"
                          >
                            <span>Baca Selengkapnya</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                                title="Edit Pengumuman"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => confirmDelete(item)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition"
                                title="Hapus Pengumuman"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────────────────────
              3. SECTION: SELURUH PENGUMUMAN & AGENDA
          ───────────────────────────────────────────────────────────────────────────── */}
          <section className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-taruna-border dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-taruna-dark dark:text-white tracking-tight">
                  Daftar Seluruh Pengumuman &amp; Agenda
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Filter pengumuman berdasarkan kategori informasi atau cari judul agenda.
                </p>
              </div>

              {/* Search Bar & Date Filter */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari pengumuman..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-taruna-yellow-500/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Tanggal & Periode */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    title="Filter Tanggal Pengumuman"
                    className="px-3 py-1.5 text-xs rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-taruna-yellow-500/50"
                  />

                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    title="Filter Bulan Pengumuman"
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 font-semibold focus:outline-hidden"
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
                    title="Filter Tahun Pengumuman"
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 font-semibold focus:outline-hidden"
                  >
                    <option value="ALL">Semua Tahun</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>

                  {(selectedDate || selectedMonth !== 'ALL' || selectedYear !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSelectedDate('');
                        setSelectedMonth('ALL');
                        setSelectedYear('ALL');
                      }}
                      className="px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Hapus filter tanggal dan periode"
                    >
                      Reset Tgl
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Tabs by Category */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
              <button
                onClick={() => {
                  setSelectedType('ALL');
                  setOnlyAttention(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedType === 'ALL' && !onlyAttention
                    ? 'bg-taruna-yellow-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-taruna-border dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                Semua ({announcements.length})
              </button>

              <button
                onClick={() => {
                  setOnlyAttention(!onlyAttention);
                  if (!onlyAttention) setSelectedType('ALL');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  onlyAttention
                    ? 'bg-taruna-red-600 text-white shadow-xs'
                    : 'bg-red-50 dark:bg-red-950/40 text-taruna-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Attention ({attentionItems.length})
              </button>

              {(
                [
                  'PENGUMUMAN',
                  'RAPAT',
                  'KERJA_BAKTI',
                  'ARISAN',
                  'INFORMASI',
                  'LAINNYA',
                ] as AnnouncementType[]
              ).map((typeKey) => {
                const cfg = ANNOUNCEMENT_TYPE_CONFIG[typeKey];
                const TypeIcon = cfg.icon;
                const count = announcements.filter((a) => a.type === typeKey).length;
                const isActive = selectedType === typeKey && !onlyAttention;

                return (
                  <button
                    key={typeKey}
                    onClick={() => {
                      setSelectedType(typeKey);
                      setOnlyAttention(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-taruna-dark dark:bg-white text-white dark:text-taruna-dark shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-taruna-border dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <TypeIcon className="w-3.5 h-3.5" />
                    <span>{cfg.label}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* List / Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 animate-pulse space-y-4"
                  >
                    <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-md w-1/3" />
                    <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-md w-3/4" />
                    <div className="h-16 bg-gray-200 dark:bg-slate-800 rounded-md w-full" />
                  </div>
                ))}
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 space-y-3">
                <Info className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="font-bold text-base text-taruna-dark dark:text-white">
                  Tidak ada pengumuman yang sesuai filter
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Coba ubah kata kunci pencarian atau pilih tab kategori lain.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedType('ALL');
                    setOnlyAttention(false);
                    setSearchQuery('');
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredAnnouncements.map((item) => {
                  const cfg = ANNOUNCEMENT_TYPE_CONFIG[item.type] || ANNOUNCEMENT_TYPE_CONFIG.PENGUMUMAN;
                  const TypeIcon = cfg.icon;

                  return (
                    <div
                      key={item.id}
                      className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between gap-4 group hover:shadow-md ${
                        item.isAttention
                          ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-400/20'
                          : 'border-taruna-border dark:border-slate-800 hover:border-taruna-yellow-300 dark:hover:border-taruna-yellow-500/50'
                      }`}
                    >
                      <div>
                        {/* Badges Header */}
                        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge variant={cfg.badgeVariant} size="sm">
                              <TypeIcon className="w-3 h-3 mr-1 inline" />
                              {cfg.label}
                            </Badge>
                            {item.isAttention && (
                              <Badge variant="accent" size="sm" dot>
                                ATTENTION
                              </Badge>
                            )}
                          </div>

                          <span className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateIndo(item.announcementDate) || '-'}
                          </span>
                        </div>

                        {/* Title & Body */}
                        <h3 className="text-base font-bold text-taruna-dark dark:text-white leading-snug group-hover:text-taruna-yellow-800 dark:group-hover:text-taruna-yellow-400 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mt-2 line-clamp-3">
                          {item.content}
                        </p>
                      </div>

                      {/* Event Date Info Box if present */}
                      {item.eventDate && (
                        <div className="p-3 rounded-2xl bg-taruna-surface dark:bg-slate-800/60 border border-taruna-border/60 dark:border-slate-700/60 flex items-start gap-2.5 text-xs text-gray-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4 text-taruna-yellow-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-taruna-dark dark:text-white block">
                              Jadwal Agenda / Kegiatan:
                            </span>
                            <span>{formatDateTimeIndo(item.eventDate)}</span>
                          </div>
                        </div>
                      )}

                      {/* Footer & Admin Actions */}
                      <div className="pt-3 border-t border-taruna-border/60 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">
                          Oleh:{' '}
                          <strong className="text-gray-700 dark:text-slate-300">
                            {item.createdBy?.member?.name || item.createdBy?.username || 'Admin'}
                          </strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="text-xs font-bold text-taruna-yellow-800 dark:text-taruna-yellow-400 hover:underline inline-flex items-center gap-0.5"
                          >
                            Detail <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <div className="flex items-center gap-1 pl-2 border-l border-taruna-border dark:border-slate-800">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                                title="Edit Pengumuman"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => confirmDelete(item)}
                                className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition"
                                title="Hapus Pengumuman"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────────────────────
              4. MODAL FORM: BUAT / EDIT PENGUMUMAN (ADMIN ONLY)
          ───────────────────────────────────────────────────────────────────────────── */}
          <Modal
            isOpen={isFormModalOpen}
            onClose={() => !isSaving && setIsFormModalOpen(false)}
            title={editingItem ? 'Edit Pengumuman / Agenda' : 'Buat Pengumuman Baru'}
            description="Tentukan judul, kategori informasi, tanggal publikasi, dan jadwalkan kegiatan."
            size="lg"
          >
            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Judul Pengumuman <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Rapat Pleno Evaluasi Kas Periode Oktober"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Tipe & Attention Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Jenis Informasi <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AnnouncementType)}
                  >
                    <option value="PENGUMUMAN">📢 PENGUMUMAN</option>
                    <option value="RAPAT">👥 RAPAT</option>
                    <option value="KERJA_BAKTI">🧹 KERJA BAKTI</option>
                    <option value="ARISAN">🎁 ARISAN</option>
                    <option value="INFORMASI">ℹ️ INFORMASI</option>
                    <option value="LAINNYA">📄 LAINNYA</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Prioritas / Section Khusus
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-taruna-border dark:border-slate-800 bg-taruna-surface/50 dark:bg-slate-800/40 cursor-pointer hover:bg-taruna-surface">
                    <input
                      type="checkbox"
                      checked={formIsAttention}
                      onChange={(e) => setFormIsAttention(e.target.checked)}
                      className="w-4 h-4 rounded text-taruna-red-600 focus:ring-taruna-red-500 accent-taruna-red-600"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-taruna-red-700 dark:text-red-400">
                        Tandai sebagai ATTENTION
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Ditampilkan di banner prioritas atas
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tanggal Publikasi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Tanggal Publikasi Edaran <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formPublishDate}
                  onChange={(e) => setFormPublishDate(e.target.value)}
                  required
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  Tanggal resmi pengumuman ini diterbitkan untuk seluruh anggota.
                </p>
              </div>

              {/* Tanggal Kegiatan (Opsional) */}
              <div className="p-4 rounded-2xl border border-taruna-border dark:border-slate-800 bg-taruna-surface/40 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasEventDate}
                      onChange={(e) => setHasEventDate(e.target.checked)}
                      className="w-4 h-4 rounded text-taruna-yellow-600 focus:ring-taruna-yellow-500 accent-taruna-yellow-600"
                    />
                    <span className="text-xs font-bold text-taruna-dark dark:text-white">
                      Memiliki Jadwal Tanggal Kegiatan (Opsional)
                    </span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {hasEventDate ? 'Aktif' : 'Tidak ada jadwal'}
                  </span>
                </div>

                {hasEventDate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-taruna-border/50 dark:border-slate-700">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1">
                        Hari &amp; Tanggal Kegiatan
                      </label>
                      <Input
                        type="date"
                        value={formEventDate}
                        onChange={(e) => setFormEventDate(e.target.value)}
                        required={hasEventDate}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1">
                        Waktu / Jam (WIB)
                      </label>
                      <Input
                        type="time"
                        value={formEventTime}
                        onChange={(e) => setFormEventTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Isi Pengumuman */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Isi Pengumuman / Rincian <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Tuliskan isi pengumuman, instruksi kehadiran, peralatan yang harus dibawa, atau rincian penting lainnya..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-taruna-dark dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-taruna-yellow-500/50"
                  required
                />
              </div>

              {/* Device Push Notification Note */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Otomatis ke Layar Anggota:</strong> Pengumuman ini akan otomatis dikirimkan langsung ke layar HP &amp; komputer seluruh anggota seperti notifikasi WhatsApp.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-taruna-border dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  className="bg-taruna-yellow-500 hover:bg-taruna-yellow-600 text-white"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* ─────────────────────────────────────────────────────────────────────────────
              5. MODAL KONFIRMASI HAPUS
          ───────────────────────────────────────────────────────────────────────────── */}
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Konfirmasi Hapus Pengumuman"
            size="sm"
          >
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-taruna-red-600 shrink-0 mt-0.5" />
                <p>
                  Apakah Anda yakin ingin menghapus pengumuman{' '}
                  <strong>&quot;{itemToDelete?.title}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Batal
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  isLoading={isDeleting}
                  onClick={handleDelete}
                  className="bg-taruna-red-600 hover:bg-taruna-red-700 text-white"
                >
                  Hapus Sekarang
                </Button>
              </div>
            </div>
          </Modal>

          {/* ─────────────────────────────────────────────────────────────────────────────
              6. MODAL DETAIL PENGUMUMAN
          ───────────────────────────────────────────────────────────────────────────── */}
          <Modal
            isOpen={Boolean(detailItem)}
            onClose={() => setDetailItem(null)}
            title={
              detailItem && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={
                      (ANNOUNCEMENT_TYPE_CONFIG[detailItem.type] || ANNOUNCEMENT_TYPE_CONFIG.PENGUMUMAN)
                        .badgeVariant
                    }
                    size="sm"
                  >
                    {
                      (ANNOUNCEMENT_TYPE_CONFIG[detailItem.type] || ANNOUNCEMENT_TYPE_CONFIG.PENGUMUMAN)
                        .label
                    }
                  </Badge>
                  {detailItem.isAttention && (
                    <Badge variant="accent" size="sm" dot>
                      ATTENTION
                    </Badge>
                  )}
                </div>
              )
            }
            size="lg"
          >
            {detailItem && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-taruna-dark dark:text-white leading-snug">
                    {detailItem.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Diterbitkan: {formatDateIndo(detailItem.announcementDate) || '-'}
                    </span>
                    <span>•</span>
                    <span>
                      Oleh: <strong>{detailItem.createdBy?.member?.name || detailItem.createdBy?.username || 'Admin'}</strong>
                    </span>
                  </div>
                </div>

                {detailItem.eventDate && (
                  <div className="p-4 rounded-2xl bg-taruna-yellow-50 dark:bg-slate-800 border border-taruna-yellow-200 dark:border-slate-700 flex items-start gap-3 text-xs text-taruna-dark dark:text-slate-200">
                    <Calendar className="w-5 h-5 text-taruna-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-sm">Jadwal Agenda Kegiatan:</span>
                      <span className="text-xs text-gray-600 dark:text-slate-300">
                        {formatDateTimeIndo(detailItem.eventDate)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-taruna-border/60 dark:border-slate-800 text-sm leading-relaxed text-gray-700 dark:text-slate-200 whitespace-pre-line">
                  {detailItem.content}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400">
                    Karang Taruna Setya Bakti • Dusun Tuk Uluh
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setDetailItem(null)}>
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </Modal>
    </div>
  );
}
