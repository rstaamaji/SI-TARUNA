'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface MeetingMinuteItem {
  id: string;
  meetingDate: string;
  dayOfWeek: string | null;
  title: string;
  location: string;
  meetingLeader: string;
  noteTaker: string;
  content: string;
  conclusion: string | null;
  followUp: string | null;
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

export default function NotulensiListPage() {
  const toast = useToast();

  // Layout & Auth State
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  // Data State
  const [minutes, setMinutes] = useState<MeetingMinuteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Form State (Admin Only)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MeetingMinuteItem | null>(null);
  const [formMeetingDate, setFormMeetingDate] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState('Kamis');
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('Balai Dusun Tuk Uluh');
  const [formMeetingLeader, setFormMeetingLeader] = useState('Rustam Aji (Ketua Karang Taruna)');
  const [formNoteTaker, setFormNoteTaker] = useState('Siti Nurhaliza (Sekretaris)');
  const [formContent, setFormContent] = useState('');
  const [formConclusion, setFormConclusion] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MeetingMinuteItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Read Auth
  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'ADMIN' || u.role === 'MEMBER') {
          setUserRole(u.role);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const isAdmin = userRole === 'ADMIN';

  // Helper day auto-derivation
  const deriveDayIndo = (dateStr: string) => {
    if (!dateStr) return 'Senin';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Senin';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()] || 'Senin';
  };

  // Fetch API
  const fetchMinutes = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/meeting-minutes', { headers });
      const json = await res.json();

      if (res.ok && json.success && Array.isArray(json.data)) {
        setMinutes(json.data);
      } else {
        toast.error(json.message || 'Gagal memuat arsip notulensi rapat');
      }
    } catch {
      toast.error('Gagal terhubung ke server notulensi');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMinutes();
  }, [fetchMinutes]);

  // Filtered List
  const filteredMinutes = useMemo(() => {
    if (!searchQuery.trim()) return minutes;
    const q = searchQuery.toLowerCase();
    return minutes.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.meetingLeader.toLowerCase().includes(q) ||
        m.noteTaker.toLowerCase().includes(q) ||
        (m.conclusion && m.conclusion.toLowerCase().includes(q)) ||
        (m.followUp && m.followUp.toLowerCase().includes(q))
    );
  }, [minutes, searchQuery]);

  // Open Create
  const openCreateModal = () => {
    setEditingItem(null);
    const today = new Date().toISOString().split('T')[0];
    setFormMeetingDate(today);
    setFormDayOfWeek(deriveDayIndo(today));
    setFormTitle('');
    setFormLocation('Balai Dusun Tuk Uluh');
    setFormMeetingLeader('Rustam Aji (Ketua Karang Taruna)');
    setFormNoteTaker('Siti Nurhaliza (Sekretaris)');
    setFormContent('');
    setFormConclusion('');
    setFormFollowUp('');
    setIsFormModalOpen(true);
  };

  // Open Edit
  const openEditModal = (item: MeetingMinuteItem) => {
    setEditingItem(item);
    if (item.meetingDate) {
      const d = new Date(item.meetingDate);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toISOString().split('T')[0];
        setFormMeetingDate(dateStr);
        setFormDayOfWeek(item.dayOfWeek || deriveDayIndo(dateStr));
      }
    }
    setFormTitle(item.title);
    setFormLocation(item.location || 'Balai Dusun Tuk Uluh');
    setFormMeetingLeader(item.meetingLeader || 'Ketua Karang Taruna');
    setFormNoteTaker(item.noteTaker || 'Sekretaris');
    setFormContent(item.content);
    setFormConclusion(item.conclusion || '');
    setFormFollowUp(item.followUp || '');
    setIsFormModalOpen(true);
  };

  // Save Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error('Judul rapat wajib diisi');
      return;
    }
    if (!formContent.trim()) {
      toast.error('Isi notulensi rapat wajib diisi');
      return;
    }
    if (!formMeetingDate) {
      toast.error('Tanggal rapat wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const meetingIso = new Date(`${formMeetingDate}T19:30:00`).toISOString();

      const payload = {
        meetingDate: meetingIso,
        dayOfWeek: formDayOfWeek.trim() || deriveDayIndo(formMeetingDate),
        title: formTitle.trim(),
        location: formLocation.trim() || 'Balai Dusun Tuk Uluh',
        meetingLeader: formMeetingLeader.trim() || 'Ketua Karang Taruna',
        noteTaker: formNoteTaker.trim() || 'Sekretaris',
        content: formContent.trim(),
        conclusion: formConclusion.trim() || null,
        followUp: formFollowUp.trim() || null,
      };

      const url = editingItem
        ? `http://localhost:5000/api/meeting-minutes/${editingItem.id}`
        : 'http://localhost:5000/api/meeting-minutes';
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
            ? 'Notulensi rapat berhasil diperbarui!'
            : 'Notulensi rapat baru berhasil diarsipkan!'
        );
        setIsFormModalOpen(false);
        fetchMinutes();
      } else {
        toast.error(json.message || 'Gagal menyimpan notulensi rapat');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat menyimpan notulensi');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Action
  const confirmDelete = (item: MeetingMinuteItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const res = await fetch(`http://localhost:5000/api/meeting-minutes/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Notulensi rapat berhasil dihapus');
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        fetchMinutes();
      } else {
        toast.error(json.message || 'Gagal menghapus notulensi');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus notulensi');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. PAGE HEADER
      ───────────────────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Dokumentasi &amp; Transparansi Rapat
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
                <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                Notulensi Rapat
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Catatan resmi, keputusan pleno, kesimpulan, dan tindak lanjut rapat Karang Taruna Setya Bakti.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchMinutes(true)}
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
                  Tulis Notulensi Baru
                </Button>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              2. SUMMARY CARDS
          ───────────────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                  Total Notulensi
                </span>
                <span className="text-2xl font-black text-taruna-dark dark:text-white">
                  {minutes.length} Dokumen
                </span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                  Rapat Terakhir
                </span>
                <span className="text-sm font-black text-taruna-dark dark:text-white line-clamp-1">
                  {minutes.length > 0 ? formatDateIndo(minutes[0].meetingDate) : 'Belum Ada'}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate block">
                  {minutes.length > 0 ? minutes[0].location : '-'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-taruna-yellow-50 dark:bg-taruna-yellow-950/60 text-taruna-yellow-700 dark:text-taruna-yellow-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                  Akses Anggota
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Transparan &amp; Terbuka
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400 block">
                  Seluruh anggota dapat membaca
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              3. SEARCH BAR
          ───────────────────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-taruna-border dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-taruna-dark dark:text-white tracking-tight">
                Arsip Catatan Rapat
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Daftar kronologis notulensi rapat pleno, koordinasi, dan pertemuan rutin anggota.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul, pimpinan, notulis, tempat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
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
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              4. LIST / CARDS NOTULENSI
          ───────────────────────────────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 animate-pulse space-y-4"
                >
                  <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-md w-1/3" />
                  <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-md w-3/4" />
                  <div className="h-20 bg-gray-200 dark:bg-slate-800 rounded-md w-full" />
                </div>
              ))}
            </div>
          ) : filteredMinutes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 space-y-3">
              <FileText className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="font-bold text-base text-taruna-dark dark:text-white">
                Belum ada notulensi rapat yang ditemukan
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                {searchQuery
                  ? 'Tidak ada hasil yang sesuai dengan kata kunci pencarian Anda.'
                  : 'Pengurus belum mengarsipkan notulensi rapat. Klik "Tulis Notulensi Baru" untuk menambahkan.'}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Reset Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMinutes.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
                >
                  {/* Top: Header & Badges */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm">
                          {item.dayOfWeek || deriveDayIndo(item.meetingDate)}
                        </Badge>
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {formatDateIndo(item.meetingDate)}
                        </span>
                      </div>

                      <span className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{item.location}</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-taruna-dark dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>

                    {/* Leaders info chips */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-taruna-surface dark:bg-slate-800/60 p-2.5 rounded-2xl border border-taruna-border/50 dark:border-slate-700/60">
                      <div>
                        <span className="text-gray-400 dark:text-slate-500 block">Pimpinan:</span>
                        <strong className="text-gray-700 dark:text-slate-300 truncate block">
                          {item.meetingLeader}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-slate-500 block">Notulis:</span>
                        <strong className="text-gray-700 dark:text-slate-300 truncate block">
                          {item.noteTaker}
                        </strong>
                      </div>
                    </div>

                    {/* Excerpt content */}
                    <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {item.content}
                    </p>

                    {/* Conclusion snippet if exists */}
                    {item.conclusion && (
                      <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          <CheckCircle2 className="w-3 h-3" /> Kesimpulan Rapat:
                        </span>
                        <p className="line-clamp-2 text-xs leading-relaxed opacity-90">
                          {item.conclusion}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Footer Links & Admin Actions */}
                  <div className="pt-3 border-t border-taruna-border/60 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/dashboard/notulensi/${item.id}`}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition"
                    >
                      <span>Baca Notulensi Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                          title="Edit Notulensi"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition"
                          title="Hapus Notulensi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              5. MODAL FORM: BUAT / EDIT NOTULENSI (ADMIN ONLY)
          ───────────────────────────────────────────────────────────────────────────── */}
          <Modal
            isOpen={isFormModalOpen}
            onClose={() => !isSaving && setIsFormModalOpen(false)}
            title={editingItem ? 'Edit Notulensi Rapat' : 'Tulis Notulensi Rapat Baru'}
            description="Dokumentasikan hasil rapat pleno atau rapat koordinasi Karang Taruna secara lengkap."
            size="xl"
          >
            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Judul Rapat */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Judul Rapat <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Rapat Pleno Evaluasi Kegiatan & Keuangan September 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Tanggal & Hari & Tempat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tanggal Rapat <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formMeetingDate}
                    onChange={(e) => {
                      setFormMeetingDate(e.target.value);
                      setFormDayOfWeek(deriveDayIndo(e.target.value));
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Hari Pelaksanaan <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Senin / Kamis / dll"
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tempat Rapat <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Balai Dusun Tuk Uluh"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Pimpinan & Notulis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Pimpinan Rapat <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Rustam Aji (Ketua Karang Taruna)"
                    value={formMeetingLeader}
                    onChange={(e) => setFormMeetingLeader(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Notulis <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Siti Nurhaliza (Sekretaris)"
                    value={formNoteTaker}
                    onChange={(e) => setFormNoteTaker(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Isi Notulensi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Isi Notulensi / Dinamika Rapat <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Tuliskan poin-poin pembukaan, sambutan penasihat, paparan keuangan, pembahasan agenda kegiatan, tanya jawab anggota..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-taruna-dark dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>

              {/* Kesimpulan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Kesimpulan Rapat
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan keputusan final, voting suara, atau konsensus bersama anggota rapat..."
                  value={formConclusion}
                  onChange={(e) => setFormConclusion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-taruna-dark dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Tindak Lanjut */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Tindak Lanjut / Action Items
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan tugas seksi, tenggat waktu (deadline), dan penanggung jawab tindak lanjut..."
                  value={formFollowUp}
                  onChange={(e) => setFormFollowUp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-taruna-dark dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                />
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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingItem ? 'Simpan Perubahan Notulensi' : 'Arsipkan Notulensi'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* ─────────────────────────────────────────────────────────────────────────────
              6. MODAL KONFIRMASI HAPUS
          ───────────────────────────────────────────────────────────────────────────── */}
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Konfirmasi Hapus Notulensi"
            size="sm"
          >
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-taruna-red-600 shrink-0 mt-0.5" />
                <p>
                  Apakah Anda yakin ingin menghapus notulensi{' '}
                  <strong>&quot;{itemToDelete?.title}&quot;</strong>? Dokumen rapat yang terhapus tidak dapat dipulihkan.
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
    </div>
  );
}
