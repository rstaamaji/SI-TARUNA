'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  AlertTriangle,
  Home,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  dayOfWeek?: string | null;
  time?: string | null;
  location: string;
  type: 'MEETING' | 'COMMUNITY_SERVICE' | 'ARISAN' | 'SOCIAL' | 'TARUNA' | 'SPORTS' | 'OTHER' | string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type?: 'PENGUMUMAN' | 'RAPAT' | 'KERJA_BAKTI' | 'ARISAN' | 'INFORMASI' | 'LAINNYA';
  isAttention?: boolean;
  announcementDate: string;
  eventDate?: string | null;
  createdBy?: {
    username: string;
    member?: { name: string } | null;
  };
}

export interface AdminEventsAndAnnouncementsProps {
  onDataChanged?: () => void;
}

export const AdminEventsAndAnnouncements: React.FC<AdminEventsAndAnnouncementsProps> = ({
  onDataChanged,
}) => {
  const toast = useToast();

  // State data
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Event States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'MEETING' | 'COMMUNITY_SERVICE' | 'ARISAN' | 'SOCIAL' | 'TARUNA' | 'SPORTS' | 'OTHER' | string>('MEETING');
  const [eventDateOnly, setEventDateOnly] = useState('2026-10-05');
  const [eventTimeOnly, setEventTimeOnly] = useState('19:30');
  const [eventLocation, setEventLocation] = useState('Balai Dusun Tuk Uluh');
  const [eventDescription, setEventDescription] = useState('');

  // Quick preset locations for Arisan & Kegiatan Dusun Tuk Uluh
  const locationPresets = [
    'Balai Dusun Tuk Uluh',
    'Kediaman Sdr. Bambang (RT 01)',
    'Kediaman Sdr. Eko Prasetyo (RT 02)',
    'Kediaman Sdr. Rustam Aji (RT 01)',
    'Kediaman Sdri. Siti Nurhaliza (RT 01)',
    'Kediaman Sdr. Fajar Nugroho (RT 03)',
    'Area Gapura & Lapangan Dusun Tuk Uluh',
    'Pos Ronda RT 02 Dusun Tuk Uluh',
  ];

  // Modal Announcement States
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<AnnouncementItem | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'EVENT' | 'ANNOUNCEMENT';
    id: string;
    title: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper token
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('si_taruna_token');
  };

  const getApiBase = () => {
    return typeof window !== 'undefined' && window.location.hostname
      ? `http://${window.location.hostname}:5000/api`
      : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';
  };

  // Fetch events and announcements from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = getApiBase();
      const [evRes, annRes] = await Promise.all([
        fetch(`${apiBase}/events`, { headers }),
        fetch(`${apiBase}/announcements`, { headers }),
      ]);

      const evJson = await evRes.json();
      const annJson = await annRes.json();

      if (evJson.success && Array.isArray(evJson.data)) {
        setEvents(evJson.data);
      }
      if (annJson.success && Array.isArray(annJson.data)) {
        setAnnouncements(annJson.data);
      }
    } catch {
      // Local fallback if server unreachable
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT CRUD HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const openCreateEventModal = () => {
    setEditingEvent(null);
    setEventTitle('Pertemuan Rutin & Arisan Pemuda');
    setEventType('MEETING');
    setEventDateOnly('2026-10-05');
    setEventTimeOnly('19:30');
    setEventLocation('Kediaman Sdr. Bambang (RT 01)');
    setEventDescription('Kocokan arisan bulanan putaran berikutnya dan evaluasi kas.');
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev: EventItem) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventType(ev.type);

    const d = new Date(ev.eventDate);
    const dateStr = d.toISOString().split('T')[0];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    setEventDateOnly(dateStr || '2026-10-05');
    setEventTimeOnly(`${hours}:${minutes}`);
    setEventLocation(ev.location);
    setEventDescription(ev.description || '');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventLocation.trim()) {
      toast.error('Judul dan lokasi kegiatan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const fullIsoDate = new Date(`${eventDateOnly}T${eventTimeOnly}:00`).toISOString();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const derivedDay = days[new Date(`${eventDateOnly}T00:00:00`).getDay()] || 'Minggu';
      const formattedTime = `${eventTimeOnly} WIB`;

      const payload = {
        title: eventTitle.trim(),
        type: eventType,
        eventDate: fullIsoDate,
        dayOfWeek: derivedDay,
        time: formattedTime,
        location: eventLocation.trim(),
        description: eventDescription.trim(),
      };

      const apiBase = getApiBase();
      const url = editingEvent
        ? `${apiBase}/events/${editingEvent.id}`
        : `${apiBase}/events`;
      const method = editingEvent ? 'PUT' : 'POST';

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
          editingEvent
            ? 'Lokasi/Jadwal kegiatan berhasil diperbarui!'
            : 'Kegiatan baru berhasil ditambahkan!'
        );
        setIsEventModalOpen(false);
        fetchData();
        onDataChanged?.();
      } else {
        toast.error(json.message || 'Gagal menyimpan data kegiatan.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ANNOUNCEMENT CRUD HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const openCreateAnnModal = () => {
    setEditingAnn(null);
    setAnnTitle('');
    setAnnContent('');
    setIsAnnModalOpen(true);
  };

  const openEditAnnModal = (ann: AnnouncementItem) => {
    setEditingAnn(ann);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      toast.error('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = {
        title: annTitle.trim(),
        content: annContent.trim(),
      };

      const apiBase = getApiBase();
      const url = editingAnn
        ? `${apiBase}/announcements/${editingAnn.id}`
        : `${apiBase}/announcements`;
      const method = editingAnn ? 'PUT' : 'POST';

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
          editingAnn
            ? 'Pengumuman berhasil diperbarui!'
            : 'Pengumuman baru berhasil diterbitkan!'
        );
        setIsAnnModalOpen(false);
        fetchData();
        onDataChanged?.();
      } else {
        toast.error(json.message || 'Gagal menyimpan pengumuman.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const apiBase = getApiBase();
      const endpoint =
        deleteTarget.type === 'EVENT'
          ? `${apiBase}/events/${deleteTarget.id}`
          : `${apiBase}/announcements/${deleteTarget.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          deleteTarget.type === 'EVENT'
            ? 'Kegiatan telah berhasil dihapus.'
            : 'Pengumuman telah berhasil dihapus.'
        );
        setIsDeleteDialogOpen(false);
        setDeleteTarget(null);
        fetchData();
        onDataChanged?.();
      } else {
        toast.error(json.message || 'Gagal menghapus data.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ─────────────────────────────────────────────────────────────────────────────
          KARTU 1: JADWAL KEGIATAN & ARISAN (DENGAN LOKASI DINAMIS ANTAR RUMAH ANGGOTA)
      ───────────────────────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-taruna-yellow-50 dark:bg-slate-800 text-taruna-yellow-700 dark:text-taruna-yellow-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Jadwal Kegiatan &amp; Arisan</CardTitle>
              <CardDescription>
                Agenda pemuda Tuk Uluh •{' '}
                <Link
                  href="/dashboard/kegiatan"
                  className="text-taruna-yellow-600 dark:text-taruna-yellow-400 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  Buka Kalender Lengkap <ChevronRight className="w-3 h-3" />
                </Link>
              </CardDescription>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateEventModal}
          >
            Tambah Kegiatan
          </Button>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-gray-400 dark:text-slate-500 animate-pulse">
              Memuat data kegiatan...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 dark:text-slate-500">
              Belum ada kegiatan yang dijadwalkan.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-2xl border border-taruna-border dark:border-slate-800 bg-taruna-surface/50 dark:bg-slate-800/40 hover:bg-taruna-surface dark:hover:bg-slate-800 transition flex flex-col gap-2.5 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-taruna-dark dark:text-white leading-snug">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={
                        event.type === 'MEETING'
                          ? 'primary'
                          : event.type === 'COMMUNITY_SERVICE'
                          ? 'success'
                          : event.type === 'ARISAN'
                          ? 'warning'
                          : event.type === 'SOCIAL'
                          ? 'accent'
                          : event.type === 'TARUNA'
                          ? 'primary'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {event.type === 'MEETING'
                        ? 'Rapat'
                        : event.type === 'COMMUNITY_SERVICE'
                        ? 'Kerja Bakti'
                        : event.type === 'ARISAN'
                        ? 'Arisan'
                        : event.type === 'SOCIAL'
                        ? 'Kegiatan Sosial'
                        : event.type === 'TARUNA'
                        ? 'Karang Taruna'
                        : event.type === 'SPORTS'
                        ? 'Olahraga'
                        : 'Lainnya'}
                    </Badge>
                  </div>
                </div>

                {/* Lokasi & Jam */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-taruna-yellow-600 dark:text-taruna-yellow-400" />
                    {event.dayOfWeek || new Date(event.eventDate).toLocaleDateString('id-ID', { weekday: 'long' })},{' '}
                    {new Date(event.eventDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    • <strong className="text-taruna-dark dark:text-slate-200">{event.time || '19:30 WIB'}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-taruna-dark dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-taruna-red-600 dark:text-red-400" />
                    {event.location}
                  </span>
                </div>

                {/* Action Bar (Edit & Hapus) */}
                <div className="pt-2 border-t border-taruna-border/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400 dark:text-slate-500 inline-flex items-center gap-1">
                    <Home className="w-3 h-3 text-taruna-yellow-600" />
                    Tempat tuan rumah arisan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditEventModal(event)}
                      className="px-2.5 py-1 rounded-lg border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-taruna-yellow-50 dark:hover:bg-slate-800 text-taruna-yellow-700 dark:text-taruna-yellow-400 font-semibold inline-flex items-center gap-1 transition"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit Lokasi / Waktu
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget({
                          type: 'EVENT',
                          id: event.id,
                          title: event.title,
                        });
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-taruna-red-600 dark:text-red-400 transition"
                      title="Hapus Kegiatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────────────────
          KARTU 2: PENGUMUMAN ORGANISASI (DENGAN CRUD RESMI)
      ───────────────────────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-taruna-red-50 dark:bg-slate-800 text-taruna-red-600 dark:text-red-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Pengumuman Organisasi</CardTitle>
              <CardDescription>
                Informasi edaran resmi pengurus Setya Bakti untuk seluruh anggota
              </CardDescription>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4 text-taruna-red-600 dark:text-red-400" />}
            onClick={openCreateAnnModal}
          >
            Buat Pengumuman
          </Button>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-gray-400 dark:text-slate-500 animate-pulse">
              Memuat data pengumuman...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 dark:text-slate-500">
              Belum ada pengumuman yang diterbitkan.
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-taruna-yellow-300 dark:hover:border-taruna-yellow-500/50 transition flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ann.isAttention && (
                      <Badge variant="accent" size="sm" dot>
                        ATTENTION
                      </Badge>
                    )}
                    {ann.type && (
                      <Badge
                        variant={
                          ann.type === 'RAPAT'
                            ? 'primary'
                            : ann.type === 'KERJA_BAKTI'
                            ? 'success'
                            : ann.type === 'ARISAN'
                            ? 'warning'
                            : ann.type === 'INFORMASI'
                            ? 'info'
                            : ann.type === 'LAINNYA'
                            ? 'neutral'
                            : 'info'
                        }
                        size="sm"
                      >
                        {ann.type === 'KERJA_BAKTI' ? 'Kerja Bakti' : ann.type}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500 whitespace-nowrap">
                    {new Date(ann.announcementDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-taruna-dark dark:text-white leading-snug">
                  {ann.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  {ann.content}
                </p>

                {/* Author & Action buttons */}
                <div className="pt-2 border-t border-taruna-border/50 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                  <span>
                    Oleh:{' '}
                    <strong className="text-taruna-dark dark:text-slate-200">
                      {ann.createdBy?.member?.name || ann.createdBy?.username || 'Pengurus Setya Bakti'}
                    </strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditAnnModal(ann)}
                      className="px-2 py-0.5 rounded-lg border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-taruna-surface dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold inline-flex items-center gap-1 transition"
                    >
                      <Pencil className="w-3 h-3 text-taruna-yellow-600" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget({
                          type: 'ANNOUNCEMENT',
                          id: ann.id,
                          title: ann.title,
                        });
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-1 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-taruna-red-600 dark:text-red-400 transition"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: TAMBAH / EDIT KEGIATAN & ARISAN
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Ubah Kegiatan & Lokasi Arisan' : 'Tambah Jadwal Kegiatan & Arisan'}
        description="Perubahan lokasi tuan rumah atau jadwal akan otomatis tersinkronisasi ke dashboard seluruh anggota."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsEventModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSaveEvent}
            >
              {editingEvent ? 'Simpan Perubahan' : 'Terbitkan Kegiatan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 text-left">
          <Input
            label="Nama Kegiatan"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Contoh: Pertemuan Rutin & Arisan Putaran 9"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Kategori Kegiatan"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
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
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Tanggal"
                type="date"
                value={eventDateOnly}
                onChange={(e) => setEventDateOnly(e.target.value)}
                required
              />
              <Input
                label="Waktu"
                type="time"
                value={eventTimeOnly}
                onChange={(e) => setEventTimeOnly(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Input
              label="Lokasi Pertemuan / Rumah Tuan Rumah"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Contoh: Kediaman Sdr. Bambang (RT 01 Dusun Tuk Uluh)"
              helperText="Lokasi arisan fleksibel berpindah-pindah antar rumah anggota."
              required
            />
            {/* Quick Preset Buttons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-gray-400 dark:text-slate-500 self-center mr-1">
                Pilih Cepat:
              </span>
              {locationPresets.map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setEventLocation(loc)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
                    eventLocation === loc
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
              Keterangan / Deskripsi Agenda
            </label>
            <textarea
              rows={3}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Tambahkan info penting, cth: Membawa uang arisan Rp 20.000 dan kas wajib Rp 10.000..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 text-taruna-dark dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-taruna-yellow-500 outline-none transition"
            />
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: TAMBAH / EDIT PENGUMUMAN
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAnnModalOpen}
        onClose={() => setIsAnnModalOpen(false)}
        title={editingAnn ? 'Ubah Pengumuman Organisasi' : 'Buat Pengumuman Baru'}
        description="Pengumuman akan langsung tampil pada dashboard portal dan dashboard seluruh anggota."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsAnnModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSaveAnnouncement}
            >
              {editingAnn ? 'Simpan Pengumuman' : 'Terbitkan Sekarang'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-left">
          <Input
            label="Judul Pengumuman"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="Contoh: Perubahan Jadwal Ronda & Iuran Kas Oktober"
            required
          />

          <div>
            <label className="text-xs sm:text-sm font-semibold text-taruna-dark dark:text-slate-200 block mb-1.5">
              Isi Lengkap Pengumuman
            </label>
            <textarea
              rows={4}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Tuliskan isi pengumuman secara rinci..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 text-taruna-dark dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-taruna-yellow-500 outline-none transition"
              required
            />
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: KONFIRMASI HAPUS
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Konfirmasi Hapus Data"
        description="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={confirmDelete}
            >
              Ya, Hapus Sekarang
            </Button>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-taruna-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 dark:text-red-300">
            <p className="font-bold">
              Menghapus {deleteTarget?.type === 'EVENT' ? 'Kegiatan' : 'Pengumuman'}:
            </p>
            <p className="mt-1 font-semibold italic text-taruna-dark dark:text-white">
              &quot;{deleteTarget?.title}&quot;
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
