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

export default function DashboardPage() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewState, setPreviewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

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
      desc: 'Hasil Jimpitan RT 01 & RT 02 Dusun Springin',
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

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-taruna-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-taruna-yellow-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-taruna-yellow-700">
              Sistem Informasi Karang Taruna
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang di panel pengelolaan Karang Taruna Springin, Kecamatan Jumantono.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={() => toast.info('Fitur ekspor laporan akan aktif pada modul kas & pelaporan.')}
          >
            Ekspor
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

      {/* State Switcher for Component Verification */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-taruna-border max-w-fit">
        <span className="text-xs font-bold text-gray-400 px-2 uppercase">Uji Tampilan:</span>
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
          Loading State
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

      {/* Interactive States Preview */}
      {previewState === 'loading' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton rows={4} />
          <LoadingState message="Memuat seluruh data operasional organisasi..." />
        </div>
      )}

      {previewState === 'empty' && (
        <EmptyState
          title="Belum Ada Agenda Terbaru"
          description="Saat ini belum ada data jadwal kegiatan, arisan, maupun pencatatan kas baru yang dibuat oleh pengurus."
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
              Buat Agenda Pertama
            </Button>
          }
        />
      )}

      {previewState === 'error' && (
        <ErrorState
          title="Koneksi Database Terputus"
          message="Tidak dapat menghubungkan layanan backend API saat ini. Silakan periksa jaringan server dan coba muat ulang kembali."
          onRetry={() => {
            toast.info('Mencoba menyambungkan kembali...');
            setPreviewState('normal');
          }}
        />
      )}

      {/* Normal Content */}
      {previewState === 'normal' && (
        <>
          {/* Stats Grid */}
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
                <CardTitle>Design System Showcase &amp; Interactive Testing</CardTitle>
              </div>
              <CardDescription>
                Verifikasi komponen reusable: Buttons, Badges, Inputs, Selects, Toasts, Dialog, dan Modal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Button Variants &amp; Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary (Yellow)</Button>
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
                  <Badge variant="success" dot>Aktif / Selesai</Badge>
                  <Badge variant="warning" dot>Menunggu Kas</Badge>
                  <Badge variant="info" dot>Pengumuman Baru</Badge>
                  <Badge variant="neutral">Netral</Badge>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Anggota"
                  placeholder="Contoh: Rustam Aji"
                  leftIcon={<Search className="w-4 h-4" />}
                  helperText="Masukkan nama lengkap anggota Karang Taruna"
                />
                <Select
                  label="Wilayah RT / Dusun"
                  placeholder="Pilih Wilayah RT"
                  options={[
                    { value: 'rt01', label: 'RT 01 - Dusun Springin' },
                    { value: 'rt02', label: 'RT 02 - Dusun Springin' },
                    { value: 'rt03', label: 'RT 03 - Dusun Springin' },
                  ]}
                />
              </div>

              {/* Toast Triggers */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Uji Notifikasi Toast</p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toast.success('Data kegiatan Karang Taruna berhasil diperbarui!')}
                  >
                    Toast Sukses
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toast.error('Gagal mencatat transaksi kas, silakan cek input.')}
                  >
                    Toast Error
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toast.warning('Saldo kas mendekati batas minimum operasional.')}
                  >
                    Toast Peringatan
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toast.info('Rapat pengurus dijadwalkan malam ini pukul 19:30 WIB.')}
                  >
                    Toast Informasi
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

          {/* Table Component Showcase */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Riwayat Transaksi &amp; Kas Terbaru</CardTitle>
                <CardDescription>
                  Daftar transaksi kas, iuran wajib, dan rekapitulasi jimpitan terkini.
                </CardDescription>
              </div>
              <Badge variant="success" dot>Kas Transparan</Badge>
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

      {/* Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Jadwal Kegiatan Baru"
        description="Jadwal akan otomatis tersinkronisasi ke seluruh anggota Karang Taruna."
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
                toast.success('Agenda kegiatan Karang Taruna berhasil ditambahkan!');
              }}
            >
              Simpan Jadwal
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <Input label="Nama Kegiatan" placeholder="Contoh: Kerja Bakti Lapangan Voli" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Tanggal" type="date" />
            <Input label="Waktu" type="time" />
          </div>
          <Select
            label="Lokasi"
            placeholder="Pilih Lokasi Pertemuan"
            options={[
              { value: 'balai', label: 'Balai Dusun Springin' },
              { value: 'lapangan', label: 'Lapangan Olahraga' },
              { value: 'posko', label: 'Pos Ronda RT 01' },
            ]}
          />
        </div>
      </Modal>

      {/* Confirmation Dialog Demo */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          setIsDialogOpen(false);
          toast.success('Tindakan konfirmasi berhasil dieksekusi!');
        }}
        variant="danger"
        title="Hapus Pencatatan Kas?"
        message="Apakah Anda yakin ingin menghapus data transaksi ini? Tindakan ini akan mempengaruhi rekapitulasi saldo kas organisasi."
        confirmText="Ya, Hapus Data"
        cancelText="Batalkan"
      />
    </div>
  );
}
