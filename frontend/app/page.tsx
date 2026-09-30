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
  CheckCircle,
  FileSpreadsheet,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Info,
  CalendarDays,
  Megaphone,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Logo } from '@/components/ui/Logo';

interface CurrentUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  username: string;
  token?: string;
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

  // Real backend login request with fallback
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const user: CurrentUser = {
          id: json.data.user.id,
          name: json.data.user.member?.name || json.data.user.username,
          role: json.data.user.role,
          username: json.data.user.username,
          token: json.data.token,
        };
        setCurrentUser(user);
        toast.success(`Berhasil masuk sebagai ${user.role}!`);
      } else {
        const errMsg = json.message || 'Username atau password salah.';
        setLoginError(errMsg);
        toast.error(errMsg);
      }
    } catch {
      // Local fallback if backend temporarily unreachable
      const trimmedUser = usernameInput.trim().toLowerCase();
      if (trimmedUser === 'admin' && passwordInput === 'admin123') {
        const user: CurrentUser = {
          id: 'admin-id',
          name: 'Rustam Aji Prabowo',
          role: 'ADMIN',
          username: 'admin',
        };
        setCurrentUser(user);
        toast.success('Login sebagai ADMIN (Sesi Lokal)');
      } else if (trimmedUser === 'member' && passwordInput === 'member123') {
        const user: CurrentUser = {
          id: 'member-id',
          name: 'Bambang Sudiro',
          role: 'MEMBER',
          username: 'member',
        };
        setCurrentUser(user);
        toast.success('Login sebagai MEMBER (Sesi Lokal)');
      } else {
        setLoginError('Kredensial tidak valid');
        toast.error('Gagal masuk');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast.info('Anda telah keluar dari sistem.');
  };

  const stats = [
    {
      title: 'Total Anggota Aktif',
      value: '25 Pemuda',
      change: 'Terdaftar di Database',
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
      value: '92%',
      change: '23 dari 25 hadir',
      isPositive: true,
      icon: <CalendarCheck2 className="w-5 h-5 text-taruna-red-600" />,
      bg: 'bg-taruna-red-50',
    },
    {
      title: 'Jimpitan Terkumpul',
      value: 'Rp 920.000',
      change: '7 Kelompok RT',
      isPositive: true,
      icon: <Coins className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
    },
  ];

  const upcomingEvents = [
    {
      title: 'Pertemuan Rutin & Arisan Pemuda Oktober',
      date: 'Minggu, 05 Okt 2026',
      time: '19:30 WIB',
      location: 'Balai Dusun Tuk Uluh',
      tag: 'Pertemuan',
      color: 'primary',
    },
    {
      title: 'Kerja Bakti Bersih Selokan & Gapura Tuk Uluh',
      date: 'Minggu, 12 Okt 2026',
      time: '06:30 WIB',
      location: 'Area Lapangan & Gapura Tuk Uluh',
      tag: 'Sosial',
      color: 'accent',
    },
  ];

  const announcements = [
    {
      title: 'Iuran Wajib Bulanan Periode Oktober 2026',
      date: 'Kemarin, 29 Sep 2026',
      desc: 'Iuran kas wajib pemuda sebesar Rp 10.000 dapat diserahkan kepada bendahara paling lambat tanggal 10 Oktober 2026.',
      author: 'Bendahara Setya Bakti',
    },
    {
      title: 'Pelaksanaan Kerja Bakti Dusun Tuk Uluh',
      date: '24 Sep 2026',
      desc: 'Seluruh pemuda diharapkan hadir membawa alat kerja bakti pada hari Minggu pagi di area gapura dusun.',
      author: 'Ketua Karang Taruna',
    },
  ];

  const recentTransactions = [
    {
      id: 'TRX-001',
      date: '28 Sep 2026',
      desc: 'Iuran wajib anggota periode September 2026',
      category: 'Pemasukan',
      amount: '+Rp 640.000',
      status: 'SELESAI',
      user: 'Bambang Sudiro',
    },
    {
      id: 'TRX-002',
      date: '25 Sep 2026',
      desc: 'Pembelian cat gapura & konsumsi rapat koordinasi',
      category: 'Pengeluaran',
      amount: '-Rp 350.000',
      status: 'SELESAI',
      user: 'Rustam Aji',
    },
    {
      id: 'TRX-003',
      date: '20 Sep 2026',
      desc: 'Setoran jimpitan seluruh kelompok RT 01-RT 03 Dusun Tuk Uluh',
      category: 'Jimpitan',
      amount: '+Rp 920.000',
      status: 'SELESAI',
      user: 'Eko Prasetyo',
    },
    {
      id: 'TRX-004',
      date: '15 Sep 2026',
      desc: 'Uang keluar penyerahan pemenang arisan periode September',
      category: 'Arisan',
      amount: '-Rp 500.000',
      status: 'SELESAI',
      user: 'Bambang Sudiro',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TAMPILAN LOGIN (PORTAL RESMI)
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
                  label="Username atau Email"
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
                  Akses Cepat Pengujian Role:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('admin');
                      setPasswordInput('admin123');
                    }}
                    className="p-2.5 rounded-xl border border-taruna-yellow-200 bg-taruna-yellow-50 hover:bg-taruna-yellow-100 text-left transition flex flex-col group"
                  >
                    <span className="text-xs font-bold text-taruna-yellow-900 flex items-center justify-between">
                      Akun ADMIN
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
                    }}
                    className="p-2.5 rounded-xl border border-taruna-border bg-taruna-surface hover:bg-gray-100 text-left transition flex flex-col group"
                  >
                    <span className="text-xs font-bold text-taruna-dark flex items-center justify-between">
                      Akun MEMBER
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
  // 2. TAMPILAN DASHBOARD RESMI DENGAN ROLE-BASED ACCESS CONTROL (RBAC)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-taruna-surface text-taruna-dark">
      {/* Sidebar Navigation - Otomatis menyaring menu khusus ADMIN dari MEMBER */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notificationCount={3}
        userRole={currentUser.role}
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

        {/* Sesi Pengguna Bar */}
        <div className="bg-gradient-to-r from-taruna-yellow-500 to-amber-600 text-white px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span>
              Sesi Aktif: <strong>{currentUser.name}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-taruna-dark">
              Peran: {currentUser.role}
            </span>
            <span className="hidden md:inline text-white/80">
              — Dusun Tuk Uluh, Sringin, Jumantono
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
                  <Badge variant={currentUser.role === 'ADMIN' ? 'accent' : 'primary'} size="sm">
                    {currentUser.role}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark tracking-tight">
                  Dashboard Utama
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono
                </p>
              </div>
            </div>

            {/* Tombol aksi khusus ADMIN (disembunyikan dari MEMBER) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {currentUser.role === 'ADMIN' ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                    onClick={() => toast.info('Fitur ekspor laporan kas aktif untuk Admin.')}
                  >
                    Ekspor Laporan
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Tambah Kegiatan
                  </Button>
                </>
              ) : (
                <div className="text-xs text-gray-500 bg-taruna-surface px-3 py-1.5 rounded-xl border border-taruna-border">
                  Mode Anggota (Akses Baca Saja)
                </div>
              )}
            </div>
          </div>

          {/* Metric Statistic Cards */}
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

          {/* Agenda & Pengumuman Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agenda Kegiatan Terdekat */}
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-taruna-yellow-50 text-taruna-yellow-700">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Jadwal Kegiatan Terdekat</CardTitle>
                    <CardDescription>Agenda pemuda Dusun Tuk Uluh mendatang</CardDescription>
                  </div>
                </div>
                <Badge variant="primary" dot>Aktif</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-taruna-border bg-taruna-surface/50 hover:bg-taruna-surface transition flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-taruna-dark">{event.title}</span>
                      <Badge variant={event.color === 'primary' ? 'primary' : 'accent'} size="sm">
                        {event.tag}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-taruna-yellow-600" />
                        {event.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {event.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-taruna-red-600" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pengumuman Terkini */}
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-taruna-red-50 text-taruna-red-600">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Pengumuman Organisasi</CardTitle>
                    <CardDescription>Informasi resmi pengurus Setya Bakti</CardDescription>
                  </div>
                </div>
                <Badge variant="accent">Penting</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {announcements.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-taruna-border bg-white hover:border-taruna-yellow-300 transition flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-taruna-dark">{item.title}</h4>
                      <span className="text-[11px] text-gray-400">{item.date}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-taruna-border/50">
                      <span>Oleh: <strong className="text-taruna-dark">{item.author}</strong></span>
                      <span className="text-taruna-yellow-700 font-semibold inline-flex items-center cursor-pointer hover:underline">
                        Baca Detail <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Table Kas & Jimpitan Setya Bakti */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Riwayat Transaksi Kas &amp; Jimpitan</CardTitle>
                <CardDescription>
                  Pencatatan kas masuk, pengeluaran kegiatan, dan rekapitulasi jimpitan warga Tuk Uluh.
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
        </main>
      </div>

      {/* Modal Dialog Form Tambah Kegiatan (Hanya untuk Admin) */}
      {currentUser.role === 'ADMIN' && (
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
                  toast.success('Agenda kegiatan berhasil ditambahkan!');
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
      )}
    </div>
  );
}
