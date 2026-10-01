'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  User,
  Info,
  Scale,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
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

export interface FinanceSummary {
  totalKas: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoSaatIni: number;
  formula: string;
}

export interface FinanceTransactionItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  transactionDate: string;
  creatorName: string;
}

const MONTH_OPTIONS = [
  { value: '', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const YEAR_OPTIONS = [
  { value: '', label: 'Semua Tahun' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Semua Jenis Transaksi' },
  { value: 'INCOME', label: 'PEMASUKAN' },
  { value: 'EXPENSE', label: 'PENGELUARAN' },
];

const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function FinanceOverviewPage() {
  const toast = useToast();

  // User Session & Role
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: 'ADMIN' | 'MEMBER';
  }>({
    id: 'user-default',
    name: 'Pengurus Setya Bakti',
    role: 'MEMBER',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [summary, setSummary] = useState<FinanceSummary>({
    totalKas: 6420000,
    totalPemasukan: 8120000,
    totalPengeluaran: 1700000,
    saldoSaatIni: 6420000,
    formula: 'saldo = total pemasukan - total pengeluaran',
  });
  const [transactions, setTransactions] = useState<FinanceTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Admin Modal States (CRUD)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<FinanceTransactionItem | null>(null);

  // Form State
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Load User Session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser({
          id: parsed.id || 'user-id',
          name: parsed.member?.name || parsed.username || 'Anggota',
          role: parsed.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        });
      }
    } catch {
      // Default to MEMBER if fails
    }
  }, []);

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

  // 2. Fetch Finance Summary & Transactions
  const fetchFinanceData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Build query string
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedType && selectedType !== 'ALL') params.append('type', selectedType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      // Fetch summary
      const summaryUrl = `http://localhost:5000/api/finance/overview?${params.toString()}`;
      const listUrl = `http://localhost:5000/api/finance?${params.toString()}`;

      const [summaryRes, listRes] = await Promise.all([
        fetch(summaryUrl, { headers }),
        fetch(listUrl, { headers }),
      ]);

      const summaryJson = await summaryRes.json();
      const listJson = await listRes.json();

      if (summaryRes.ok && summaryJson.success && summaryJson.data) {
        setSummary(summaryJson.data);
      }
      if (listRes.ok && listJson.success && listJson.data) {
        setTransactions(listJson.data);
      }

      if (isManualRefresh) {
        toast.success('Data keuangan berhasil diperbarui.');
      }
    } catch {
      // Fallback mock if server unreachable
      toast.error('Gagal mengambil data dari server, menampilkan data lokal.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, selectedType, searchQuery, toast]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Reset Filters
  const handleResetFilter = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedType('ALL');
    setSearchQuery('');
  };

  // 3. Admin CRUD Handlers
  const handleOpenCreateModal = () => {
    setFormType('INCOME');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (item: FinanceTransactionItem) => {
    setActiveTransaction(item);
    setFormType(item.type);
    setFormAmount(String(item.amount));
    setFormDescription(item.description);
    setFormDate(item.transactionDate.split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (item: FinanceTransactionItem) => {
    setActiveTransaction(item);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      toast.error('Keterangan transaksi wajib diisi.');
      return;
    }
    const numAmount = Number(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Nominal harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:5000/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: formType,
          amount: numAmount,
          description: formDescription.trim(),
          transactionDate: new Date(formDate).toISOString(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Transaksi kas berhasil ditambahkan!');
        setIsCreateModalOpen(false);
        fetchFinanceData();
      } else {
        toast.error(json.message || 'Gagal menyimpan transaksi.');
      }
    } catch {
      toast.error('Gagal terhubung ke backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTransaction) return;

    if (!formDescription.trim()) {
      toast.error('Keterangan transaksi wajib diisi.');
      return;
    }
    const numAmount = Number(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Nominal harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:5000/api/finance/${activeTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: formType,
          amount: numAmount,
          description: formDescription.trim(),
          transactionDate: new Date(formDate).toISOString(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Transaksi kas berhasil diperbarui!');
        setIsEditModalOpen(false);
        setActiveTransaction(null);
        fetchFinanceData();
      } else {
        toast.error(json.message || 'Gagal mengubah transaksi.');
      }
    } catch {
      toast.error('Gagal terhubung ke backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeTransaction) return;

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:5000/api/finance/${activeTransaction.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Transaksi kas berhasil dihapus!');
        setIsDeleteModalOpen(false);
        setActiveTransaction(null);
        fetchFinanceData();
      } else {
        toast.error(json.message || 'Gagal menghapus transaksi.');
      }
    } catch {
      toast.error('Gagal terhubung ke backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen flex bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={currentUser.role}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          user={{
            name: currentUser.name,
            role: currentUser.role,
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ─────────────────────────────────────────────────────────────────────────────
              1. PAGE HEADER
          ───────────────────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Transparansi Keuangan Organisasi
                </span>
                <Badge variant={isAdmin ? 'accent' : 'primary'} size="sm">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-1 inline" />
                      ADMINISTRATOR (Kelola Data)
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1 inline" />
                      MEMBER (Akses Baca Saja)
                    </>
                  )}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
                Laporan Kas &amp; Keuangan
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Laporan transparan penerimaan iuran, kas masuk, dan pengeluaran kegiatan Dusun Tuk Uluh.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchFinanceData(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Memuat...' : 'Segarkan Data'}
              </Button>

              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleOpenCreateModal}
                >
                  Tambah Transaksi
                </Button>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              2. FINANCIAL SUMMARY CARDS
              - TOTAL KAS
              - TOTAL PEMASUKAN
              - TOTAL PENGELUARAN
              - SALDO SAAT INI (Formula: saldo = total pemasukan - total pengeluaran)
          ───────────────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: TOTAL KAS */}
            <Card hoverable className="border-t-4 border-t-emerald-500">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  TOTAL KAS
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 ring-2 ring-black/5 dark:ring-white/5">
                  <Wallet className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {formatRupiah(summary.totalKas)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Akumulasi Seluruh Kas Aktif</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: TOTAL PEMASUKAN */}
            <Card hoverable className="border-t-4 border-t-emerald-600">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  TOTAL PEMASUKAN
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-black/5 dark:ring-white/5">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
                  {formatRupiah(summary.totalPemasukan)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Iuran, donasi &amp; jimpitan</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: TOTAL PENGELUARAN */}
            <Card hoverable className="border-t-4 border-t-taruna-red-500">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  TOTAL PENGELUARAN
                </span>
                <div className="p-2.5 rounded-2xl bg-taruna-red-50 dark:bg-slate-800 text-taruna-red-600 dark:text-red-400 ring-2 ring-black/5 dark:ring-white/5">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-taruna-red-600 dark:text-red-400 tracking-tight">
                  {formatRupiah(summary.totalPengeluaran)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                  <ArrowUpRight className="w-3.5 h-3.5 text-taruna-red-500" />
                  <span>Belanja &amp; operasional kegiatan</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: SALDO SAAT INI (Formula saldo = total pemasukan - total pengeluaran) */}
            <Card hoverable className="border-t-4 border-t-taruna-yellow-500">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  SALDO SAAT INI
                </span>
                <div className="p-2.5 rounded-2xl bg-taruna-yellow-50 dark:bg-slate-800 text-taruna-yellow-700 dark:text-taruna-yellow-400 ring-2 ring-black/5 dark:ring-white/5">
                  <Scale className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
                  {formatRupiah(summary.saldoSaatIni)}
                </div>
                <div className="mt-2 text-[11px] font-mono font-medium text-taruna-yellow-800 dark:text-taruna-yellow-300 bg-taruna-yellow-50/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-taruna-yellow-200/60 dark:border-slate-700">
                  saldo = pemasukan - pengeluaran
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              3. FILTER BAR (BULAN, TAHUN, JENIS TRANSAKSI, PENCARIAN)
          ───────────────────────────────────────────────────────────────────────────── */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1">
                  {/* Filter Bulan */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                      Filter Bulan:
                    </label>
                    <Select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      options={MONTH_OPTIONS}
                    />
                  </div>

                  {/* Filter Tahun */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                      Filter Tahun:
                    </label>
                    <Select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      options={YEAR_OPTIONS}
                    />
                  </div>

                  {/* Filter Jenis Transaksi */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                      Jenis Transaksi:
                    </label>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      options={TYPE_OPTIONS}
                    />
                  </div>
                </div>

                {/* Pencarian Uraian & Reset */}
                <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                      Cari Keterangan:
                    </label>
                    <Input
                      placeholder="Cari transaksi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                    />
                  </div>

                  {(selectedMonth || selectedYear || selectedType !== 'ALL' || searchQuery) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResetFilter}
                      className="whitespace-nowrap h-10"
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─────────────────────────────────────────────────────────────────────────────
              4. TABEL TRANSAKSI KEUANGAN
              Kolom:
              - Tanggal
              - Jenis (PEMASUKAN / PENGELUARAN)
              - Keterangan
              - Jumlah
              - Aksi (Admin Only)
          ───────────────────────────────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Buku Kas &amp; Riwayat Transaksi</CardTitle>
                <CardDescription>
                  Daftar transaksi kas masuk dan keluar Karang Taruna Setya Bakti.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>
                  {transactions.length} Transaksi Tercatat
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-36">Tanggal</TableHead>
                      <TableHead className="w-36">Jenis</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right w-44">Jumlah</TableHead>
                      {isAdmin && <TableHead className="text-center w-28">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-taruna-yellow-600" />
                            <span className="text-xs">Memuat data transaksi kas...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <Info className="w-6 h-6 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                              Tidak ada transaksi ditemukan
                            </span>
                            <span className="text-xs text-gray-400">
                              Coba ubah filter bulan, tahun, atau kata kunci pencarian.
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((t) => (
                        <TableRow key={t.id} className="hover:bg-taruna-surface/60 dark:hover:bg-slate-800/50">
                          {/* 1. Tanggal */}
                          <TableCell className="text-xs font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {new Date(t.transactionDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </TableCell>

                          {/* 2. Jenis (PEMASUKAN / PENGELUARAN) */}
                          <TableCell>
                            <Badge
                              variant={t.type === 'INCOME' ? 'success' : 'accent'}
                              size="sm"
                              className="font-bold uppercase tracking-wider"
                            >
                              {t.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN'}
                            </Badge>
                          </TableCell>

                          {/* 3. Keterangan */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-sm text-taruna-dark dark:text-white">
                                {t.description}
                              </p>
                              <span className="text-[11px] text-gray-400 dark:text-slate-500">
                                Dicatat oleh: {t.creatorName}
                              </span>
                            </div>
                          </TableCell>

                          {/* 4. Jumlah */}
                          <TableCell
                            className={`text-right font-black text-sm whitespace-nowrap ${
                              t.type === 'INCOME'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-taruna-red-600 dark:text-red-400'
                            }`}
                          >
                            {t.type === 'INCOME' ? '+' : '-'}
                            {formatRupiah(t.amount)}
                          </TableCell>

                          {/* 5. Aksi (Hanya untuk ADMIN) */}
                          {isAdmin && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(t)}
                                  className="p-1.5 rounded-lg border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-taruna-surface dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition"
                                  title="Ubah transaksi"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-taruna-yellow-600" />
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteModal(t)}
                                  className="p-1.5 rounded-lg border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-slate-300 transition"
                                  title="Hapus transaksi"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL TAMBAH TRANSAKSI KAS (KHUSUS ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Tambah Transaksi Kas Baru"
          description="Catat penerimaan kas masuk atau belanja pengeluaran Karang Taruna Setya Bakti."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCreate}
                isLoading={isSubmitting}
              >
                Simpan Transaksi
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveCreate} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                Jenis Transaksi <span className="text-red-500">*</span>
              </label>
              <Select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'INCOME' | 'EXPENSE')}
                options={[
                  { value: 'INCOME', label: 'PEMASUKAN (Kas Masuk)' },
                  { value: 'EXPENSE', label: 'PENGELUARAN (Kas Keluar)' },
                ]}
              />
            </div>

            <Input
              label="Nominal Transaksi (Rp)"
              type="number"
              placeholder="Contoh: 150000"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              required
            />

            <Input
              label="Keterangan / Uraian"
              placeholder="Contoh: Iuran wajib kas pemuda periode Oktober 2026"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              required
            />

            <Input
              label="Tanggal Transaksi"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL EDIT TRANSAKSI KAS (KHUSUS ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setActiveTransaction(null);
          }}
          title="Ubah Transaksi Kas"
          description="Perbarui informasi catatan keuangan yang telah tersimpan."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setActiveTransaction(null);
                }}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                isLoading={isSubmitting}
              >
                Simpan Perubahan
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                Jenis Transaksi <span className="text-red-500">*</span>
              </label>
              <Select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'INCOME' | 'EXPENSE')}
                options={[
                  { value: 'INCOME', label: 'PEMASUKAN (Kas Masuk)' },
                  { value: 'EXPENSE', label: 'PENGELUARAN (Kas Keluar)' },
                ]}
              />
            </div>

            <Input
              label="Nominal Transaksi (Rp)"
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              required
            />

            <Input
              label="Keterangan / Uraian"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              required
            />

            <Input
              label="Tanggal Transaksi"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL KONFIRMASI HAPUS TRANSAKSI (KHUSUS ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setActiveTransaction(null);
          }}
          title="Hapus Catatan Transaksi"
          description="Apakah Anda yakin ingin menghapus catatan transaksi ini dari pembukuan kas?"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setActiveTransaction(null);
                }}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isSubmitting}
              >
                Hapus Sekarang
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-left">
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Peringatan:</p>
                <p>
                  Penghapusan transaksi akan langsung memengaruhi perhitungan <strong>TOTAL KAS</strong> dan <strong>SALDO SAAT INI</strong>.
                </p>
              </div>
            </div>

            {activeTransaction && (
              <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700 space-y-1 text-xs">
                <p>
                  <strong className="text-gray-500">Uraian:</strong>{' '}
                  <span className="font-semibold text-taruna-dark dark:text-white">
                    {activeTransaction.description}
                  </span>
                </p>
                <p>
                  <strong className="text-gray-500">Nominal:</strong>{' '}
                  <span className="font-black text-taruna-dark dark:text-white">
                    {formatRupiah(activeTransaction.amount)} ({activeTransaction.type})
                  </span>
                </p>
                <p>
                  <strong className="text-gray-500">Tanggal:</strong>{' '}
                  <span>
                    {new Date(activeTransaction.transactionDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
