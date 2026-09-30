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
  CheckCircle,
  FileSpreadsheet,
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

export default function DashboardPage() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      title: 'Jimpitan Terkumpul',
      value: 'Rp 920.000',
      change: 'Target Rp 1.000.000',
      isPositive: false,
      icon: <Coins className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
    },
  ];

  const upcomingEvents = [
    {
      title: 'Pertemuan Rutin & Arisan Pemuda',
      date: 'Minggu, 05 Okt 2026',
      time: '19:30 WIB',
      location: 'Balai Dusun Tuk Uluh',
      tag: 'Pertemuan',
      color: 'primary',
    },
    {
      title: 'Kerja Bakti Bersih Lingkungan Dusun',
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
      title: 'Hasil Keputusan Rapat Pleno Dusun Tuk Uluh',
      date: '24 Sep 2026',
      desc: 'Telah disepakati rencana pengadaan seragam karang taruna serta pembaruan jadwal ronda malam.',
      author: 'Sekretariat',
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

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
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
