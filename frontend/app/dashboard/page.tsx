'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Wallet,
  CalendarCheck2,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle,
  FileSpreadsheet,
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
import { Logo } from '@/components/ui/Logo';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';
import { AdminEventsAndAnnouncements } from '@/components/dashboard/AdminEventsAndAnnouncements';

export default function DashboardPage() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [viewMode, setViewMode] = useState<'AUTO' | 'MEMBER' | 'ADMIN'>('AUTO');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'ADMIN' || parsed.role === 'MEMBER') {
          setUserRole(parsed.role);
        }
      }
    } catch (e) {
      // Fallback silently if storage read fails
      console.debug('Failed to read stored user session:', e);
    }
  }, []);

  const isMemberView = viewMode === 'MEMBER' || (viewMode === 'AUTO' && userRole === 'MEMBER');

  const stats = [
    {
      title: 'Total Anggota Aktif',
      value: '64 Pemuda',
      change: '+4 bulan ini',
      isPositive: true,
      icon: <Users className="w-5 h-5 text-taruna-yellow-600 dark:text-taruna-yellow-400" />,
      bg: 'bg-taruna-yellow-50 dark:bg-slate-800',
    },
    {
      title: 'Saldo Kas Organisasi',
      value: 'Rp 8.450.000',
      change: '+Rp 650.000',
      isPositive: true,
      icon: <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-slate-800',
    },
    {
      title: 'Kehadiran Rapat Terakhir',
      value: '88%',
      change: '56 dari 64 hadir',
      isPositive: true,
      icon: <CalendarCheck2 className="w-5 h-5 text-taruna-red-600 dark:text-red-400" />,
      bg: 'bg-taruna-red-50 dark:bg-slate-800',
    },
    {
      title: 'Jimpitan Terkumpul',
      value: 'Rp 920.000',
      change: 'Target Rp 1.000.000',
      isPositive: false,
      icon: <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-50 dark:bg-slate-800',
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

  if (isMemberView) {
    return (
      <div className="space-y-6">
        {userRole === 'ADMIN' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs flex-wrap">
            <span className="text-amber-800 dark:text-amber-300 font-semibold">
              👁️ Pratinjau: Anda sedang melihat tampilan <strong>Dashboard Member</strong> (Mode Admin).
            </span>
            <button
              onClick={() => setViewMode('ADMIN')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition"
            >
              Kembali ke Dashboard Admin
            </button>
          </div>
        )}
        <MemberDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-start gap-4">
          <Logo size={54} showText={false} />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-taruna-yellow-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-taruna-yellow-700 dark:text-taruna-yellow-400">
                Karang Taruna Setya Bakti
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
              Dashboard Utama
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('MEMBER')}
          >
            Lihat Dashboard Member
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            onClick={() => toast.info('Fitur ekspor laporan kas akan aktif pada modul kas.')}
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
        </div>
      </div>

      {/* Metric Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => (
          <Card key={idx} hoverable>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {item.title}
              </span>
              <div className={`p-2.5 rounded-2xl ${item.bg} ring-2 ring-black/5 dark:ring-white/10`}>
                {item.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-taruna-dark dark:text-white tracking-tight">
                {item.value}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
                {item.isPositive ? (
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {item.change}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-taruna-red-600 dark:text-red-400">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {item.change}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agenda & Pengumuman Grid (Full CRUD Real-Time Synchronized) */}
      <AdminEventsAndAnnouncements />

      {/* Table Kas & Jimpitan Setya Bakti */}
      <Card>
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
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
                  <TableCell className="font-mono font-bold text-xs text-taruna-yellow-800 dark:text-taruna-yellow-400">
                    {trx.id}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 dark:text-slate-400">{trx.date}</TableCell>
                  <TableCell className="font-medium text-taruna-dark dark:text-slate-100">{trx.desc}</TableCell>
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
                      <span className="text-xs font-semibold text-taruna-dark dark:text-slate-200">{trx.user}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold text-sm ${
                      trx.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-taruna-red-600 dark:text-red-400'
                    }`}
                  >
                    {trx.amount}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {trx.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Dialog Form Tambah Kegiatan */}
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
    </div>
  );
}
