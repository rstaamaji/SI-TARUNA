'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UserCircle,
  Award,
  CalendarCheck2,
  Bell,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Home,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  RefreshCw,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
} from 'lucide-react';
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
import { UserRole } from '@/lib/auth';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface MemberProfileData {
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    createdAt: string;
  };
  member: {
    id: string;
    memberNumber: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    phone: string | null;
    address: string;
    joinDate: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  stats: {
    totalEvents: number;
    presentCount: number;
    excusedCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  attendances: {
    id: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    notes: string | null;
    updatedAt: string;
    event: {
      id: string;
      title: string;
      eventDate: string;
      location: string;
      type: string;
    };
  }[];
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    link?: string | null;
  }[];
}

// Demo fallback data for Karang Taruna Setya Bakti Dusun Tuk Uluh
const FALLBACK_PROFILE: MemberProfileData = {
  user: {
    id: 'usr-demo-01',
    username: 'member01',
    email: 'member01@taruna-setyabakti.id',
    role: 'MEMBER',
    createdAt: '2023-01-15T00:00:00.000Z',
  },
  member: {
    id: 'mbr-demo-01',
    memberNumber: 'KT-SB-002',
    name: 'Bagus Prakoso',
    gender: 'MALE',
    phone: '081234567802',
    address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin, Karanganyar',
    joinDate: '2023-01-15T00:00:00.000Z',
    status: 'ACTIVE',
  },
  stats: {
    totalEvents: 14,
    presentCount: 12,
    excusedCount: 2,
    absentCount: 0,
    attendanceRate: 86,
  },
  attendances: [
    {
      id: 'att-1',
      status: 'PRESENT',
      notes: 'Hadir tepat waktu dan aktif dalam diskusi',
      updatedAt: '2026-10-01T19:30:00.000Z',
      event: {
        id: 'ev-1',
        title: 'Rapat Pleno Rutin Awal Bulan Oktober',
        eventDate: '2026-10-01T19:30:00.000Z',
        location: 'Balai Dusun Tuk Uluh',
        type: 'MEETING',
      },
    },
    {
      id: 'att-2',
      status: 'PRESENT',
      notes: 'Membawa cangkul dan perlengkapan',
      updatedAt: '2026-09-20T06:30:00.000Z',
      event: {
        id: 'ev-2',
        title: 'Kerja Bakti Saluran Irigasi RT 01',
        eventDate: '2026-09-20T06:30:00.000Z',
        location: 'Saluran Irigasi Barat Dusun',
        type: 'COMMUNITY_SERVICE',
      },
    },
    {
      id: 'att-3',
      status: 'EXCUSED',
      notes: 'Ada keperluan dinas kerja shift malam',
      updatedAt: '2026-09-05T19:30:00.000Z',
      event: {
        id: 'ev-3',
        title: 'Pertemuan & Pengundian Arisan September',
        eventDate: '2026-09-05T19:30:00.000Z',
        location: 'Kediaman Sdr. Bambang RT 01',
        type: 'ARISAN',
      },
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      title: 'Reminder: Kerja Bakti H-1',
      message: 'Besok pagi pukul 06.30 WIB kerja bakti pembersihan gapura dusun.',
      type: 'KERJA_BAKTI',
      isRead: false,
      createdAt: '2026-10-02T10:00:00.000Z',
      link: '/dashboard/kegiatan',
    },
    {
      id: 'notif-2',
      title: 'Pengumuman Arisan Putaran Baru',
      message: 'Jadwal arisan bulan Oktober telah diterbitkan oleh pengurus.',
      type: 'ARISAN',
      isRead: true,
      createdAt: '2026-10-01T14:00:00.000Z',
      link: '/dashboard/arisan',
    },
  ],
};

export default function MemberProfilePage() {
  const toast = useToast();

  // Profile data & UI state
  const [profile, setProfile] = useState<MemberProfileData>(FALLBACK_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [formEmail, setFormEmail] = useState('');
  const [formCurrentPassword, setFormCurrentPassword] = useState('');
  const [formNewPassword, setFormNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Active section tab inside profile: 'OVERVIEW' | 'ATTENDANCE' | 'NOTIFICATIONS'
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ATTENDANCE' | 'NOTIFICATIONS'>('OVERVIEW');

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

  const getApiBase = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }
    return 'http://localhost:5000/api';
  };

  // 1. Fetch Profile Data from Backend API
  const fetchProfile = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/members/profile`, { headers });
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          setProfile(json.data);
          if (isManual) {
            toast.success('Data profil anggota berhasil diperbarui.');
          }
        } else {
          // Keep fallback
        }
      } catch {
        // Keep fallback demo profile
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Open Edit Modal
  const openEditModal = () => {
    setFormName(profile.member.name || '');
    setFormPhone(profile.member.phone || '');
    setFormAddress(profile.member.address || '');
    setFormGender(profile.member.gender || 'MALE');
    setFormEmail(profile.user.email || '');
    setFormCurrentPassword('');
    setFormNewPassword('');
    setIsEditModalOpen(true);
  };

  // 2. Submit Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('Nama lengkap wajib diisi.');
      return;
    }
    if (!formAddress.trim()) {
      toast.error('Alamat tempat tinggal wajib diisi.');
      return;
    }

    if (formNewPassword && formNewPassword.trim().length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (formNewPassword && !formCurrentPassword) {
      toast.error('Harap masukkan kata sandi saat ini untuk konfirmasi perubahan sandi.');
      return;
    }

    setIsSaving(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload: Record<string, any> = {
        name: formName.trim(),
        phone: formPhone.trim() || null,
        address: formAddress.trim(),
        gender: formGender,
        email: formEmail.trim() || undefined,
      };

      if (formNewPassword) {
        payload.currentPassword = formCurrentPassword;
        payload.newPassword = formNewPassword.trim();
      }

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/members/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setProfile(json.data);
        setIsEditModalOpen(false);
        toast.success('Profil berhasil diperbarui!');

        // Update local session storage user name if changed
        try {
          const stored = localStorage.getItem('si_taruna_user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u.member) {
              u.member.name = json.data.member.name;
              u.member.phone = json.data.member.phone;
              u.member.address = json.data.member.address;
            }
            u.username = json.data.user.username;
            localStorage.setItem('si_taruna_user', JSON.stringify(u));
          }
        } catch {
          // ignore
        }
      } else {
        toast.error(json.message || 'Gagal memperbarui profil.');
      }
    } catch {
      toast.error('Gagal terhubung ke server saat memperbarui profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateIndo = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. HEADER & HERO SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#466060] text-white p-6 sm:p-7 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              Modul 26 • Member Profile
            </span>
            <Badge variant="primary" size="sm">
              <UserCircle className="w-3.5 h-3.5 mr-1 inline" />
              Profil Pribadi
            </Badge>
            <Badge variant={profile.user.role === 'SUPERADMIN' ? 'warning' : profile.user.role === 'ADMIN' ? 'accent' : 'neutral'} size="sm">
              {profile.user.role === 'SUPERADMIN' ? (
                <>
                  <ShieldCheck className="w-3 h-3 mr-1 inline" /> Superadmin / Pembina
                </>
              ) : profile.user.role === 'ADMIN' ? (
                <>
                  <ShieldCheck className="w-3 h-3 mr-1 inline" /> Pengurus / Administrator
                </>
              ) : (
                <>
                  <User className="w-3 h-3 mr-1 inline" /> Anggota Karang Taruna
                </>
              )}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
            Profil &amp; Keaktifan Anggota
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Kelola data diri, pantau riwayat keaktifan kegiatan, persentase kehadiran, dan notifikasi Karang Taruna Setya Bakti Dusun Tuk Uluh.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProfile(true)}
            disabled={isRefreshing || isLoading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Segarkan
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openEditModal}
            leftIcon={<Pencil className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            Ubah Profil
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. MEMBER PROFILE CARD & STATISTIK KEAKTIFAN
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Diri Anggota */}
        <Card className="lg:col-span-1 border-t-4 border-t-emerald-600">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {profile.member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">{profile.member.name}</CardTitle>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                    {profile.member.memberNumber}
                  </Badge>
                  <Badge variant={profile.member.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                    {profile.member.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2 border-t border-taruna-border dark:border-slate-800 text-xs">
            {/* Nomor HP */}
            <div className="flex items-start gap-2.5 text-gray-600 dark:text-slate-300">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Nomor HP / WhatsApp</span>
                <span className="font-semibold text-taruna-dark dark:text-white">
                  {profile.member.phone || 'Belum diisi'}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-2.5 text-gray-600 dark:text-slate-300">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Alamat Email Akun</span>
                <span className="font-semibold text-taruna-dark dark:text-white truncate block max-w-[200px]">
                  {profile.user.email}
                </span>
              </div>
            </div>

            {/* Alamat */}
            <div className="flex items-start gap-2.5 text-gray-600 dark:text-slate-300">
              <Home className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Alamat Tempat Tinggal</span>
                <span className="font-semibold text-taruna-dark dark:text-white leading-relaxed block">
                  {profile.member.address}
                </span>
              </div>
            </div>

            {/* Tanggal Bergabung */}
            <div className="flex items-start gap-2.5 text-gray-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Tanggal Bergabung</span>
                <span className="font-semibold text-taruna-dark dark:text-white">
                  {formatDateIndo(profile.member.joinDate)}
                </span>
              </div>
            </div>

            {/* Role Akun (Readonly) */}
            <div className="flex items-start gap-2.5 text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-taruna-border dark:border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Role Hak Akses</span>
                <span className="font-bold text-taruna-dark dark:text-white uppercase">
                  {profile.user.role}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                  Role dikelola oleh sistem dan Administrator. Member tidak dapat mengubah role.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Statistik Keaktifan Presensi */}
        <div className="lg:col-span-2 space-y-5">
          {/* Rate & Keaktifan Highlight */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 relative z-10">
              <span className="text-xs font-bold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full inline-block backdrop-blur-xs">
                Tingkat Kehadiran Anggota
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                {profile.stats.attendanceRate}% Keaktifan
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-md leading-relaxed">
                Telah mengikuti <strong>{profile.stats.presentCount}</strong> dari total <strong>{profile.stats.totalEvents}</strong> agenda kegiatan Karang Taruna Setya Bakti.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0 min-w-36">
              <Award className="w-10 h-10 text-amber-300 mx-auto mb-1 animate-bounce" />
              <div className="text-xs uppercase font-bold text-emerald-100">Status Keaktifan</div>
              <div className="text-base font-black text-white mt-0.5">
                {profile.stats.attendanceRate >= 75 ? 'Sangat Aktif' : profile.stats.attendanceRate >= 50 ? 'Cukup Aktif' : 'Perlu Ditingkatkan'}
              </div>
            </div>
          </div>

          {/* 4 Stat Cards: Total Kegiatan, Hadir, Izin, Tidak Hadir */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Kegiatan */}
            <div className="p-4 rounded-2xl bg-[#6A8578] text-white border border-[#466060] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Total Kegiatan
              </span>
              <span className="text-2xl font-black text-taruna-dark dark:text-white mt-1 block">
                {profile.stats.totalEvents}
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                <CalendarCheck2 className="w-3 h-3 text-purple-500" /> Seluruh agenda
              </span>
            </div>

            {/* Hadir */}
            <div className="p-4 rounded-2xl bg-[#466060] text-white border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                Hadir
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {profile.stats.presentCount}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Presensi hadir
              </span>
            </div>

            {/* Izin */}
            <div className="p-4 rounded-2xl bg-[#466060] text-white border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
                Izin
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {profile.stats.excusedCount}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Berhalangan izin
              </span>
            </div>

            {/* Tidak Hadir */}
            <div className="p-4 rounded-2xl bg-[#466060] text-white border border-red-200 dark:border-red-900/60 bg-red-50/20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider block">
                Tidak Hadir
              </span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 block">
                {profile.stats.absentCount}
              </span>
              <span className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Tanpa keterangan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. TABS: RIWAYAT ABSENSI & NOTIFIKASI
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-taruna-border dark:border-slate-800 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#466060] text-white text-gray-600 dark:text-slate-300 border border-taruna-border dark:border-slate-800 hover:bg-gray-50'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              Riwayat Absensi ({profile.attendances.length})
            </button>

            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#466060] text-white text-gray-600 dark:text-slate-300 border border-taruna-border dark:border-slate-800 hover:bg-gray-50'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifikasi ({profile.notifications.length})
            </button>
          </div>

          <div className="text-xs text-gray-400">
            {activeTab === 'OVERVIEW' ? 'Data presensi tercatat otomatis' : 'Notifikasi agenda dan pengumuman'}
          </div>
        </div>

        {/* ── SECTION A: RIWAYAT ABSENSI ── */}
        {activeTab === 'OVERVIEW' && (
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2 pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                  Riwayat Kehadiran Anggota
                </CardTitle>
                <CardDescription>
                  Catatan presensi agenda rapat, kerja bakti, dan arisan yang pernah Anda ikuti.
                </CardDescription>
              </div>
              <Link href="/dashboard/absensi">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Buka Halaman Presensi
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Nama Kegiatan &amp; Lokasi</TableHead>
                      <TableHead>Tanggal Pelaksanaan</TableHead>
                      <TableHead className="text-center w-36">Status</TableHead>
                      <TableHead>Catatan / Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.attendances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Belum ada catatan absensi untuk anggota ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      profile.attendances.map((att, idx) => (
                        <TableRow key={att.id}>
                          <TableCell className="text-center text-xs text-gray-500 font-mono">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-sm text-taruna-dark dark:text-white">
                              {att.event?.title || 'Agenda Karang Taruna'}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {att.event?.location || 'Balai Dusun'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 dark:text-slate-300">
                            {formatDateIndo(att.event?.eventDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            {att.status === 'PRESENT' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5" /> HADIR
                              </span>
                            )}
                            {att.status === 'EXCUSED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                <Clock className="w-3.5 h-3.5" /> IZIN
                              </span>
                            )}
                            {att.status === 'ABSENT' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                                <XCircle className="w-3.5 h-3.5" /> TIDAK HADIR
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 italic">
                            {att.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── SECTION B: NOTIFIKASI ANGGOTA ── */}
        {activeTab === 'NOTIFICATIONS' && (
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2 pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Notifikasi Terkini
                </CardTitle>
                <CardDescription>
                  Pemberitahuan resmi pengumuman, reminder kegiatan, dan arisan.
                </CardDescription>
              </div>
              <Link href="/dashboard/notifikasi">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Lihat Semua Notifikasi
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="pt-2">
              {profile.notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold">Tidak ada notifikasi saat ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                        notif.isRead
                          ? 'bg-gray-50 dark:bg-slate-800/40 border-taruna-border dark:border-slate-800'
                          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-taruna-dark dark:text-white">
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <Badge variant="accent" size="sm">
                              Baru
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 block pt-1">
                          {new Date(notif.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} WIB
                        </span>
                      </div>

                      {notif.link && (
                        <Link href={notif.link}>
                          <Button variant="ghost" size="sm" className="text-xs text-emerald-600 shrink-0">
                            Buka
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. MODAL: UBAH INFORMASI PROFIL (MEMBER DAPAT MENGUBAH INFO TERTENTU)
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Ubah Profil Anggota"
        description="Perbarui informasi data diri Anda. Role dan nomor anggota tidak dapat diubah."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateProfile}
              isLoading={isSaving}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
          {/* Readonly info notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Nomor Anggota &amp; Role Akun Dilindungi:</strong>
              <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                Nomor Anggota (<strong>{profile.member.memberNumber}</strong>) dan Role (<strong>{profile.user.role}</strong>) dikelola langsung oleh Administrator dan tidak dapat diubah oleh member.
              </p>
            </div>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Bagus Prakoso"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nomor HP */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                Nomor HP / WhatsApp
              </label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
              />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                Jenis Kelamin
              </label>
              <Select
                value={formGender}
                onChange={(e) => setFormGender(e.target.value as any)}
                options={[
                  { value: 'MALE', label: 'Laki-laki' },
                  { value: 'FEMALE', label: 'Perempuan' },
                ]}
              />
            </div>
          </div>

          {/* Alamat Tempat Tinggal */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <Input
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Contoh: RT 01 / RW 01 Dusun Tuk Uluh, Desa Sringin"
              required
            />
          </div>

          {/* Email Akun */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              Alamat Email Akun
            </label>
            <Input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="Contoh: member@taruna-setyabakti.id"
            />
          </div>

          {/* Ubah Password (Opsional) */}
          <div className="pt-2 border-t border-taruna-border dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gray-400" /> Ganti Kata Sandi (Kosongkan jika tidak ingin mengubah)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Kata Sandi Saat Ini
                </label>
                <Input
                  type="password"
                  value={formCurrentPassword}
                  onChange={(e) => setFormCurrentPassword(e.target.value)}
                  placeholder="Password saat ini"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Kata Sandi Baru (Min. 6 Karakter)
                </label>
                <Input
                  type="password"
                  value={formNewPassword}
                  onChange={(e) => setFormNewPassword(e.target.value)}
                  placeholder="Password baru"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
