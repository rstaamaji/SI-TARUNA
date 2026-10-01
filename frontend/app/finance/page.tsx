'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Coins,
  HeartHandshake,
  Sparkles,
  Layers,
  TrendingUp,
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
  source?: string;
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

const SOURCE_OPTIONS = [
  { value: '', label: 'Semua Sumber Pemasukan' },
  { value: 'iuran anggota', label: 'Iuran Anggota' },
  { value: 'donasi', label: 'Donasi' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'lainnya', label: 'Lainnya' },
];

const PRESET_SOURCES = [
  { value: 'Iuran Anggota', label: 'Iuran Anggota', icon: Coins, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { value: 'Donasi', label: 'Donasi', icon: HeartHandshake, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { value: 'Kegiatan', label: 'Kegiatan', icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  { value: 'Lainnya', label: 'Lainnya', icon: Layers, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
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

  // Active Tab: ALL | INCOME | EXPENSE
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('');
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
  const [formSource, setFormSource] = useState<string>('Iuran Anggota');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Load User Session & URL Tab
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

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'income') {
        setActiveTab('INCOME');
      } else if (tab === 'expense') {
        setActiveTab('EXPENSE');
      }
    }
  }, []);

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

  // Sync activeTab with selectedType filter
  useEffect(() => {
    if (activeTab === 'ALL') {
      setSelectedType('ALL');
    } else if (activeTab === 'INCOME') {
      setSelectedType('INCOME');
    } else if (activeTab === 'EXPENSE') {
      setSelectedType('EXPENSE');
    }
  }, [activeTab]);

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
      if (selectedSource && selectedSource !== 'ALL') params.append('source', selectedSource);
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
      toast.error('Gagal mengambil data dari server, menampilkan data lokal.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, selectedType, selectedSource, searchQuery, toast]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Reset Filters
  const handleResetFilter = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedType(activeTab === 'ALL' ? 'ALL' : activeTab);
    setSelectedSource('');
    setSearchQuery('');
  };

  // 3. Admin CRUD Handlers
  const handleOpenCreateModal = (defaultType: 'INCOME' | 'EXPENSE' = 'INCOME') => {
    setFormType(defaultType);
    setFormSource('Iuran Anggota');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (item: FinanceTransactionItem) => {
    setActiveTransaction(item);
    setFormType(item.type);
    setFormSource(item.source || 'Lainnya');
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
      toast.error('Jumlah transaksi harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const endpoint = formType === 'INCOME'
        ? 'http://localhost:5000/api/finance/incomes'
        : 'http://localhost:5000/api/finance';

      const bodyPayload = formType === 'INCOME'
        ? {
            amount: numAmount,
            source: formSource.trim() || 'Lainnya',
            description: formDescription.trim(),
            transactionDate: new Date(formDate).toISOString(),
          }
        : {
            type: formType,
            amount: numAmount,
            source: formSource.trim() || 'Lainnya',
            description: formDescription.trim(),
            transactionDate: new Date(formDate).toISOString(),
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          formType === 'INCOME'
            ? 'Pemasukan kas berhasil dicatat! Saldo otomatis diperbarui.'
            : 'Transaksi kas berhasil dicatat!'
        );
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
      toast.error('Jumlah transaksi harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const endpoint = activeTransaction.type === 'INCOME' && formType === 'INCOME'
        ? `http://localhost:5000/api/finance/incomes/${activeTransaction.id}`
        : `http://localhost:5000/api/finance/${activeTransaction.id}`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: formType,
          amount: numAmount,
          source: formSource.trim() || 'Lainnya',
          description: formDescription.trim(),
          transactionDate: new Date(formDate).toISOString(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Transaksi kas berhasil diperbarui! Saldo otomatis dikalkulasi ulang.');
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
      const endpoint = activeTransaction.type === 'INCOME'
        ? `http://localhost:5000/api/finance/incomes/${activeTransaction.id}`
        : `http://localhost:5000/api/finance/${activeTransaction.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Transaksi kas berhasil dihapus! Saldo otomatis dikalkulasi ulang.');
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

  // Statistics for Income tab
  const incomeStats = useMemo(() => {
    const incomeItems = transactions.filter((t) => t.type === 'INCOME');
    const bySource: Record<string, number> = {
      'Iuran Anggota': 0,
      'Donasi': 0,
      'Kegiatan': 0,
      'Lainnya': 0,
    };

    incomeItems.forEach((item) => {
      const src = item.source || 'Lainnya';
      const key = Object.keys(bySource).find((k) => k.toLowerCase() === src.toLowerCase()) || 'Lainnya';
      bySource[key] = (bySource[key] || 0) + item.amount;
    });

    return {
      totalCount: incomeItems.length,
      bySource,
    };
  }, [transactions]);

  // Helper badge color for source
  const getSourceBadge = (source?: string) => {
    const s = (source || 'Lainnya').toLowerCase();
    if (s.includes('iuran')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
          <Coins className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Iuran Anggota
        </span>
      );
    }
    if (s.includes('donasi')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
          <HeartHandshake className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Donasi
        </span>
      );
    }
    if (s.includes('kegiatan')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
          <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          Kegiatan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
        <Layers className="w-3 h-3 text-gray-500 dark:text-slate-400" />
        {source || 'Lainnya'}
      </span>
    );
  };

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
                  Transparansi Keuangan &amp; Manajemen Kas
                </span>
                <Badge variant={isAdmin ? 'accent' : 'primary'} size="sm">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-1 inline" />
                      ADMINISTRATOR (Kelola Pemasukan &amp; Pengeluaran)
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1 inline" />
                      MEMBER (Akses Transparansi Kas)
                    </>
                  )}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
                Laporan Kas &amp; Pemasukan
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Pencatatan sumber kas masuk (iuran anggota, donasi, kegiatan), belanja kas, dan transparansi saldo terkini.
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
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => handleOpenCreateModal('INCOME')}
                  >
                    Catat Pemasukan
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => handleOpenCreateModal('EXPENSE')}
                  >
                    Tambah Transaksi Lain
                  </Button>
                </>
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
                  <span>Iuran, donasi, kegiatan &amp; lainnya</span>
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
                  <span>Belanja operasional kegiatan</span>
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
                  saldo = total pemasukan - total pengeluaran
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              3. TAB NAVIGATION (SEMUA TRANSAKSI | PEMASUKAN KAS | PENGELUARAN)
          ───────────────────────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-taruna-border dark:border-slate-800 pb-2 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-taruna-dark dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'text-gray-500 hover:text-taruna-dark dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                Semua Transaksi
              </button>
              <button
                onClick={() => setActiveTab('INCOME')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Pemasukan Kas (Income)
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'INCOME' ? 'bg-emerald-700 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}>
                  {incomeStats.totalCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('EXPENSE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'EXPENSE'
                    ? 'bg-taruna-red-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-taruna-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Pengeluaran Kas
              </button>
            </div>

            {activeTab === 'INCOME' && isAdmin && (
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => handleOpenCreateModal('INCOME')}
              >
                Catat Pemasukan Baru
              </Button>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              4. BREAKDOWN SUMBER PEMASUKAN (Khusus Tab Pemasukan atau saat ada transaksi)
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'INCOME' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {PRESET_SOURCES.map((s) => {
                const IconComponent = s.icon;
                const totalSrc = incomeStats.bySource[s.value] || 0;
                const isSelected = selectedSource.toLowerCase() === s.value.toLowerCase();

                return (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSource(isSelected ? '' : s.value)}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                        {s.label}
                      </span>
                      <div className={`p-1.5 rounded-lg border ${s.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-taruna-dark dark:text-white">
                      {formatRupiah(totalSrc)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      {isSelected ? 'Filter Aktif (Klik batal)' : 'Klik untuk filter'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              5. FILTER BAR (BULAN, TAHUN, JENIS TRANSAKSI, SUMBER, PENCARIAN)
          ───────────────────────────────────────────────────────────────────────────── */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
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

                  {/* Filter Jenis Transaksi (Hanya jika di tab ALL) */}
                  {activeTab === 'ALL' ? (
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
                  ) : null}

                  {/* Filter Sumber Pemasukan */}
                  <div className={activeTab !== 'ALL' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                      Sumber Pemasukan:
                    </label>
                    <Select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      options={SOURCE_OPTIONS}
                    />
                  </div>
                </div>

                {/* Pencarian Uraian & Reset */}
                <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                      Cari Keterangan / Sumber:
                    </label>
                    <Input
                      placeholder="Cari kata kunci..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                    />
                  </div>

                  {(selectedMonth || selectedYear || (activeTab === 'ALL' && selectedType !== 'ALL') || selectedSource || searchQuery) && (
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
              6. TABEL TRANSAKSI KEUANGAN & PEMASUKAN
              Kolom:
              - Tanggal
              - Jenis (PEMASUKAN / PENGELUARAN)
              - Sumber Pemasukan (iuran anggota, donasi, kegiatan, lainnya)
              - Keterangan
              - Jumlah (> 0)
              - Aksi (Admin Only: Edit & Delete)
          ───────────────────────────────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>
                  {activeTab === 'INCOME'
                    ? 'Buku Pemasukan Kas (Income Records)'
                    : activeTab === 'EXPENSE'
                    ? 'Buku Pengeluaran Kas'
                    : 'Buku Kas & Riwayat Transaksi'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'INCOME'
                    ? 'Daftar seluruh penerimaan kas masuk dari iuran, donasi, kegiatan, dan sumber lainnya.'
                    : 'Daftar transaksi kas masuk dan keluar Karang Taruna Setya Bakti.'}
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
                      <TableHead className="w-32">Jenis</TableHead>
                      <TableHead className="w-40">Sumber</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right w-44">Jumlah</TableHead>
                      {isAdmin && <TableHead className="text-center w-28">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-taruna-yellow-600" />
                            <span className="text-xs">Memuat data transaksi kas...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <Info className="w-6 h-6 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                              Tidak ada catatan transaksi ditemukan
                            </span>
                            <span className="text-xs text-gray-400">
                              Coba ubah filter bulan, tahun, sumber pemasukan, atau kata kunci pencarian.
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
                              className="font-bold uppercase tracking-wider text-[10px]"
                            >
                              {t.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN'}
                            </Badge>
                          </TableCell>

                          {/* 3. Sumber Pemasukan */}
                          <TableCell className="whitespace-nowrap">
                            {t.type === 'INCOME' ? (
                              getSourceBadge(t.source)
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-slate-500 italic">
                                Belanja Kas
                              </span>
                            )}
                          </TableCell>

                          {/* 4. Keterangan */}
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

                          {/* 5. Jumlah */}
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

                          {/* 6. Aksi (Hanya untuk ADMIN) */}
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
          MODAL TAMBAH TRANSAKSI / PEMASUKAN KAS (KHUSUS ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={formType === 'INCOME' ? 'Catat Pemasukan Kas Baru' : 'Tambah Transaksi Kas Baru'}
          description={
            formType === 'INCOME'
              ? 'Catat penerimaan kas masuk dari iuran anggota, donasi, kegiatan, atau sumber lainnya. Saldo kas akan otomatis bertambah.'
              : 'Catat belanja atau pengeluaran operasional Karang Taruna Setya Bakti.'
          }
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
                className={formType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                onClick={handleSaveCreate}
                isLoading={isSubmitting}
              >
                {formType === 'INCOME' ? 'Simpan Pemasukan' : 'Simpan Transaksi'}
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

            {/* Sumber Pemasukan (Tampil jika PEMASUKAN) */}
            {formType === 'INCOME' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                  Sumber Pemasukan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {PRESET_SOURCES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setFormSource(s.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition ${
                        formSource.toLowerCase() === s.value.toLowerCase()
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-taruna-surface'
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5 text-emerald-600" />
                      {s.label}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Atau ketik sumber lainnya..."
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Jumlah / Nominal (> 0) */}
            <div>
              <Input
                label="Jumlah (Nominal Kas)"
                type="number"
                min="1"
                step="1"
                placeholder="Contoh: 150000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
                helperText="* Jumlah harus lebih besar dari 0 (amount > 0)."
              />
              {Number(formAmount) > 0 && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  Terbilang: {formatRupiah(Number(formAmount))}
                </p>
              )}
            </div>

            {/* Keterangan */}
            <Input
              label="Keterangan / Uraian"
              placeholder={
                formType === 'INCOME'
                  ? 'Contoh: Iuran kas pemuda bulanan RT 02 Dusun Tuk Uluh'
                  : 'Contoh: Pembelian sound system untuk tirakatan'
              }
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              required
            />

            {/* Tanggal */}
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
          MODAL EDIT TRANSAKSI / PEMASUKAN KAS (KHUSUS ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setActiveTransaction(null);
          }}
          title={formType === 'INCOME' ? 'Ubah Data Pemasukan Kas' : 'Ubah Transaksi Kas'}
          description="Perbarui informasi catatan keuangan yang telah tersimpan. Saldo kas akan dihitung ulang secara otomatis."
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

            {/* Sumber Pemasukan */}
            {formType === 'INCOME' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                  Sumber Pemasukan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {PRESET_SOURCES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setFormSource(s.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition ${
                        formSource.toLowerCase() === s.value.toLowerCase()
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-taruna-surface'
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5 text-emerald-600" />
                      {s.label}
                    </button>
                  ))}
                </div>
                <Input
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Nominal / Jumlah */}
            <div>
              <Input
                label="Nominal Transaksi (Rp)"
                type="number"
                min="1"
                step="1"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
                helperText="* Jumlah harus lebih besar dari 0."
              />
              {Number(formAmount) > 0 && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  Terbilang: {formatRupiah(Number(formAmount))}
                </p>
              )}
            </div>

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
          MODAL KONFIRMASI HAPUS TRANSAKSI / PEMASUKAN (KHUSUS ADMIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setActiveTransaction(null);
          }}
          title={activeTransaction?.type === 'INCOME' ? 'Hapus Catatan Pemasukan' : 'Hapus Catatan Transaksi'}
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
                  Penghapusan transaksi akan langsung memengaruhi perhitungan <strong>TOTAL KAS</strong> dan <strong>SALDO SAAT INI</strong> (saldo = total pemasukan - total pengeluaran).
                </p>
              </div>
            </div>

            {activeTransaction && (
              <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700 space-y-1.5 text-xs">
                <p>
                  <strong className="text-gray-500">Uraian:</strong>{' '}
                  <span className="font-semibold text-taruna-dark dark:text-white">
                    {activeTransaction.description}
                  </span>
                </p>
                {activeTransaction.type === 'INCOME' && (
                  <p>
                    <strong className="text-gray-500">Sumber Pemasukan:</strong>{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {activeTransaction.source || 'Lainnya'}
                    </span>
                  </p>
                )}
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
