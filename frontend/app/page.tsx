'use client';

import React, { useState } from 'react';
import {
  Users,
  Wallet,
  CalendarCheck2,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Sparkles,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Info,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Dialog } from '@/components/ui/Dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState, CardSkeleton, TableSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Logo } from '@/components/ui/Logo';

interface CurrentUser {
  name: string;
  role: 'ADMIN' | 'MEMBER';
  username: string;
}

export default function UnifiedMainPage() {
  const toast = useToast();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewState, setPreviewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  // Handle Login Submission
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      setIsLoggingIn(false);
      const trimmedUser = usernameInput.trim().toLowerCase();

      if (trimmedUser === 'admin' && passwordInput === 'admin123') {
        const user: CurrentUser = {
          name: 'Rustam Aji (Admin)',
          role: 'ADMIN',
          username: 'admin',
        };
        setCurrentUser(user);
        toast.success('Selamat datang kembali, Pengurus Karang Taruna Setya Bakti!');
      } else if (trimmedUser === 'member' && passwordInput === 'member123') {
        const user: CurrentUser = {
          name: 'Bambang Sudiro',
          role: 'MEMBER',
          username: 'member',
        };
        setCurrentUser(user);
        toast.success('Selamat datang di portal anggota Karang Taruna Setya Bakti!');
      } else if (trimmedUser && passwordInput) {
        // Fallback for custom username
        const isAdm = trimmedUser.includes('admin');
        const user: CurrentUser = {
          name: usernameInput,
          role: isAdm ? 'ADMIN' : 'MEMBER',
          username: trimmedUser,
        };
        setCurrentUser(user);
        toast.success(`Berhasil masuk sebagai ${user.role}!`);
      } else {
        setLoginError('Username dan password wajib diisi.');
        toast.error('Gagal masuk. Periksa username dan password Anda.');
      }
    }, 400);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast.info('Anda telah keluar dari sistem.');
  };

  const stats = [
    {
      title: 'Total Anggota Aktif',
      value: '64 Pemuda',
      change: '+4 bulan ini',
      isPositive: true,
      icon: <Users className="w-5 h-5 text-taruna-yellow-600" />,
      bg: 'bg-taruna-yellow-50',
    },
    {
      title: 'Saldo Kas Organisasi',
      value: 'Rp 8.450.000',
      change: '+Rp 650.000',
      isPositive: true,
      icon: <Wallet className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      title: 'Kehadiran Rapat Terakhir',
      value: '88%',
      change: '56 dari 64 hadir',
      isPositive: true,
      icon: <CalendarCheck2 className="w-5 h-5 text-taruna-red-600" />,
      bg: 'bg-taruna-red-50',
    },
    {
      title: 'Jimpitan Terkumpul (Bulan Ini)',
      value: 'Rp 920.000',
      change: 'Target Rp 1.000.000',
      isPositive: false,
      icon: <Coins className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
    },
  ];

  const recentTransactions = [
    {
      id: 'TRX-001',
      date: '28 Sep 2026',
      desc: 'Iuran Wajib Bulanan September',
      category: 'Pemasukan',
      amount: '+Rp 640.000',
      status: 'SELESAI',
      user: 'Bambang Sudiro',
    },
    {
      id: 'TRX-002',
      date: '25 Sep 2026',
      desc: 'Pembelian Cat Gapura & Konsumsi Kerja Bakti',
      category: 'Pengeluaran',
      amount: '-Rp 350.000',
      status: 'SELESAI',
      user: 'Rustam Aji',
    },
    {
      id: 'TRX-003',
      date: '20 Sep 2026',
      desc: 'Hasil Jimpitan RT 01 & RT 02 Dusun Tuk Uluh',
      category: 'Jimpitan',
      amount: '+Rp 460.000',
      status: 'SELESAI',
      user: 'Eko Prasetyo',
    },
    {
      id: 'TRX-004',
      date: '15 Sep 2026',
      desc: 'Uang Keluar Penyerahan Pemenang Arisan',
      category: 'Arisan',
      amount: '-Rp 500.000',
      status: 'SELESAI',
      user: 'Siti Rahma',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TAMPILAN LOGIN JIKA BELUM LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-taruna-surface via-white to-taruna-yellow-50/30 text-taruna-dark">
        {/* Header Branding */}
        <header className="px-6 py-4 border-b border-taruna-border/60 bg-white/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
          <Logo size={48} subtitle="Tuk Uluh, Sringin, Jumantono" />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-taruna-yellow-100 text-taruna-yellow-800 border border-taruna-yellow-200">
              <Sparkles className="w-3.5 h-3.5 text-taruna-red-600" />
              Sistem Informasi Digital
            </span>
          </div>
        </header>

        {/* Main Login Card Section */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl border border-taruna-border shadow-xl shadow-taruna-dark/5 p-6 sm:p-8">
              {/* Logo & Headline */}
              <div className="text-center mb-6">
                <div className="inline-block p-1.5 rounded-3xl bg-taruna-surface border border-taruna-border shadow-inner mb-3">
                  <div className="w-20 h-20 rounded-2xl bg-taruna-dark ring-2 ring-taruna-yellow-500/60 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/logo.png"
                      alt="Logo Karang Taruna Setya Bakti"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-taruna-dark tracking-tight">
                  SI-TARUNA
                </h1>
                <p className="text-xs font-bold text-taruna-red-600 uppercase tracking-wider mt-0.5">
                  Karang Taruna Setya Bakti
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Dusun Tuk Uluh, Desa Sringin, Kec. Jumantono
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-taruna-red-600">
                    {loginError}
                  </div>
                )}

                <Input
                  label="Username"
                  placeholder="Masukkan username Anda"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={isLoggingIn}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Masuk ke Sistem
                </Button>
              </form>

              {/* Quick Login Shortcut for Instant Testing */}
              <div className="mt-6 pt-5 border-t border-taruna-border">
                <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 text-taruna-yellow-600" />
                  Akses Cepat Pengujian:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('admin');
                      setPasswordInput('admin123');
                      const user: CurrentUser = {
                        name: 'Rustam Aji (Admin)',
                        role: 'ADMIN',
                        username: 'admin',
                      };
                      setCurrentUser(user);
                      toast.success('Login instan sebagai ADMIN berhasil!');
                    }}
                    className="p-2.5 rounded-xl border border-taruna-yellow-200 bg-taruna-yellow-50 hover:bg-taruna-yellow-100 text-left transition flex flex-col group"
                  >
                    <span className="text-xs font-bold text-taruna-yellow-900 flex items-center justify-between">
                      Akun Admin
                      <ShieldCheck className="w-3.5 h-3.5 text-taruna-red-600" />
                    </span>
                    <span className="text-[11px] text-taruna-yellow-700 font-mono mt-0.5">
                      admin / admin123
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('member');
                      setPasswordInput('member123');
                      const user: CurrentUser = {
                        name: 'Bambang Sudiro',
                        role: 'MEMBER',
                        username: 'member',
                      };
                      setCurrentUser(user);
                      toast.success('Login instan sebagai MEMBER berhasil!');
                    }}
                    className="p-2.5 rounded-xl border border-taruna-border bg-taruna-surface hover:bg-gray-100 text-left transition flex flex-col group"
                  >
                    <span className="text-xs font-bold text-taruna-dark flex items-center justify-between">
                      Akun Member
                      <User className="w-3.5 h-3.5 text-gray-400" />
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono mt-0.5">
                      member / member123
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-gray-500 border-t border-taruna-border bg-white">
          &copy; {new Date().getFullYear()} Karang Taruna Setya Bakti | Tuk Uluh, Sringin, Jumantono.
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TAMPILAN DASHBOARD TERINTEGRASI JIKA SUDAH LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-taruna-surface text-taruna-dark">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notificationCount={3}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          user={{
            name: currentUser.name,
            role: currentUser.role,
          }}
          notificationCount={3}
        />

        {/* Integrated User Session Banner */}
        <div className="bg-gradient-to-r from-taruna-yellow-500 to-amber-600 text-white px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span>
              Sesi Aktif: <strong>{currentUser.name}</strong> (Peran: <strong>{currentUser.role}</strong>)
            </span>
            <span className="hidden md:inline text-white/80">
              — Wilayah Tuk Uluh, Sringin, Jumantono
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar ke Login
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-taruna-border shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-taruna-dark ring-2 ring-taruna-yellow-500/60 overflow-hidden shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.png"
                  alt="Logo Karang Taruna Setya Bakti"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-taruna-yellow-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-taruna-yellow-700">
                    Karang Taruna Setya Bakti
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark tracking-tight">
                  Dashboard Utama
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                onClick={() => toast.info('Fitur ekspor laporan keuangan kas aktif.')}
              >
                Ekspor Data
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Tambah Agenda
              </Button>
            </div>
          </div>

          {/* State Switcher Controls for Verification */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-taruna-border max-w-fit flex-wrap">
            <span className="text-xs font-bold text-gray-400 px-2 uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-taruna-yellow-600" />
              Uji Status Komponen:
            </span>
            <button
              onClick={() => setPreviewState('normal')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${
                previewState === 'normal'
                  ? 'bg-taruna-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-taruna-surface'
              }`}
            >
              Data Normal
            </button>
            <button
              onClick={() => setPreviewState('loading')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${
                previewState === 'loading'
                  ? 'bg-taruna-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-taruna-surface'
              }`}
            >
              Loading Skeleton
            </button>
            <button
              onClick={() => setPreviewState('empty')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${
                previewState === 'empty'
                  ? 'bg-taruna-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-taruna-surface'
              }`}
            >
              Empty State
            </button>
            <button
              onClick={() => setPreviewState('error')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${
                previewState === 'error'
                  ? 'bg-taruna-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-taruna-surface'
              }`}
            >
              Error State
            </button>
          </div>

          {/* Conditional State Renders */}
          {previewState === 'loading' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
              <TableSkeleton rows={4} />
              <LoadingState message="Memuat seluruh data Karang Taruna Setya Bakti..." />
            </div>
          )}

          {previewState === 'empty' && (
            <EmptyState
              title="Belum Ada Jadwal Pertemuan"
              description="Saat ini belum ada agenda kerja bakti, pertemuan bulanan, atau arisan yang dibuat untuk warga Tuk Uluh."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setIsModalOpen(true);
                    setPreviewState('normal');
                  }}
                >
                  Buat Jadwal Baru
                </Button>
              }
            />
          )}

          {previewState === 'error' && (
            <ErrorState
              title="Gagal Memuat Data Server"
              message="Terjadi gangguan saat menghubungkan database Setya Bakti. Silakan coba kembali sesaat lagi."
              onRetry={() => {
                toast.info('Menyambungkan kembali...');
                setPreviewState('normal');
              }}
            />
          )}

          {previewState === 'normal' && (
            <>
              {/* Statistic Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((item, idx) => (
                  <Card key={idx} hoverable className="border-taruna-border">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {item.title}
                      </span>
                      <div className={`p-2.5 rounded-2xl ${item.bg} ring-2 ring-black/5`}>
                        {item.icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-black text-taruna-dark tracking-tight">
                        {item.value}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
                        {item.isPositive ? (
                          <span className="inline-flex items-center text-emerald-600">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {item.change}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-taruna-red-600">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {item.change}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Design System Interactive Playground Section */}
              <Card className="border-taruna-yellow-200 bg-gradient-to-br from-white to-taruna-yellow-50/20">
                <CardHeader>
                  <div className="flex items-center gap-2 text-taruna-yellow-700">
                    <Sparkles className="w-5 h-5 text-taruna-red-600" />
                    <CardTitle>Design System &amp; Uji Coba Komponen</CardTitle>
                  </div>
                  <CardDescription>
                    Komponen reusable berstandar Karang Taruna Setya Bakti (Tuk Uluh, Sringin, Jumantono).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Buttons */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Button Variants &amp; Sizes</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="primary">Primary (Yellow/Gold)</Button>
                      <Button variant="accent">Accent (Red)</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="danger">Danger</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="primary" isLoading>Loading</Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Badges with Status Dot</p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant="primary" dot>Primary (Gold)</Badge>
                      <Badge variant="accent" dot>Accent (Red)</Badge>
                      <Badge variant="success" dot>Hadir Presensi</Badge>
                      <Badge variant="warning" dot>Menunggu Kas</Badge>
                      <Badge variant="info" dot>Pengumuman Baru</Badge>
                      <Badge variant="neutral">Dusun Tuk Uluh</Badge>
                    </div>
                  </div>

                  {/* Form Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Pencarian Cepat"
                      placeholder="Cari anggota atau jadwal kegiatan..."
                      leftIcon={<Search className="w-4 h-4" />}
                      helperText="Masukkan nama anggota atau agenda pertemuan"
                    />
                    <Select
                      label="Wilayah Kelompok"
                      placeholder="Pilih Kelompok"
                      options={[
                        { value: 'rt01', label: 'RT 01 Tuk Uluh' },
                        { value: 'rt02', label: 'RT 02 Tuk Uluh' },
                        { value: 'rt03', label: 'RT 03 Tuk Uluh' },
                      ]}
                    />
                  </div>

                  {/* Toast & Dialog Triggers */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Uji Notifikasi Toast &amp; Dialog</p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toast.success('Pencatatan kas Setya Bakti berhasil disimpan!')}
                      >
                        Toast Sukses
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toast.error('Gagal mencatat transaksi kas.')}
                      >
                        Toast Error
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toast.warning('Iuran jimpitan RT 02 belum disetorkan.')}
                      >
                        Toast Peringatan
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toast.info('Rapat pleno Karang Taruna malam ini pukul 19:30 WIB.')}
                      >
                        Toast Info
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Uji Dialog Konfirmasi
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table Component */}
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Riwayat Transaksi Kas &amp; Jimpitan Setya Bakti</CardTitle>
                    <CardDescription>
                      Daftar arus kas masuk, pengeluaran kegiatan, dan kas jimpitan Tuk Uluh, Sringin.
                    </CardDescription>
                  </div>
                  <Badge variant="success" dot>Transparan &amp; Akuntabel</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Uraian Transaksi</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Penanggung Jawab</TableHead>
                        <TableHead className="text-right">Nominal</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((trx) => (
                        <TableRow key={trx.id}>
                          <TableCell className="font-mono font-bold text-xs text-taruna-yellow-800">
                            {trx.id}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{trx.date}</TableCell>
                          <TableCell className="font-medium">{trx.desc}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                trx.category === 'Pemasukan'
                                  ? 'success'
                                  : trx.category === 'Pengeluaran'
                                  ? 'accent'
                                  : 'primary'
                              }
                              size="sm"
                            >
                              {trx.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar name={trx.user} size="xs" />
                              <span className="text-xs font-semibold">{trx.user}</span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold text-sm ${
                              trx.amount.startsWith('+') ? 'text-emerald-600' : 'text-taruna-red-600'
                            }`}
                          >
                            {trx.amount}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              {trx.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Jadwal Kegiatan Setya Bakti"
        description="Kegiatan baru akan otomatis tampil pada jadwal seluruh pemuda Dusun Tuk Uluh."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                toast.success('Agenda kegiatan berhasil disimpan!');
              }}
            >
              Simpan Jadwal
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <Input label="Nama Kegiatan" placeholder="Contoh: Kerja Bakti Lapangan Dusun Tuk Uluh" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Tanggal" type="date" />
            <Input label="Waktu" type="time" />
          </div>
          <Select
            label="Lokasi"
            placeholder="Pilih Lokasi Pertemuan"
            options={[
              { value: 'balai', label: 'Balai Dusun Tuk Uluh' },
              { value: 'posko', label: 'Pos Ronda RT 01' },
              { value: 'lapangan', label: 'Lapangan Sringin' },
            ]}
          />
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          setIsDialogOpen(false);
          toast.success('Tindakan konfirmasi berhasil dieksekusi!');
        }}
        variant="danger"
        title="Hapus Pencatatan Kas?"
        message="Apakah Anda yakin ingin menghapus catatan kas ini? Tindakan ini akan mempengaruhi rekapitulasi keuangan Karang Taruna Setya Bakti."
        confirmText="Ya, Hapus Data"
        cancelText="Batalkan"
      />
    </div>
  );
}
