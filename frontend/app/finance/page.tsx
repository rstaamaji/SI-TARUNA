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
  Coffee,
  Package,
  HandHeart,
  Settings,
  Receipt,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
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
import { getStoredUser, isUserAdmin, UserRole } from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────
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
  category?: string;
  description: string;
  transactionDate: string;
  creatorName: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
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
  { value: '', label: 'Semua Sumber' },
  { value: 'Iuran Anggota', label: 'Iuran Anggota' },
  { value: 'Jimpitan', label: 'Jimpitan' },
  { value: 'Donasi', label: 'Donasi' },
  { value: 'Kegiatan', label: 'Kegiatan' },
  { value: 'Lainnya', label: 'Lainnya' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'Kegiatan', label: 'Kegiatan' },
  { value: 'Konsumsi', label: 'Konsumsi' },
  { value: 'Perlengkapan', label: 'Perlengkapan' },
  { value: 'Sosial', label: 'Sosial' },
  { value: 'Operasional', label: 'Operasional' },
  { value: 'Lainnya', label: 'Lainnya' },
];

// Income source presets
const PRESET_SOURCES = [
  { value: 'Iuran Anggota', label: 'Iuran Anggota', icon: Coins, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { value: 'Jimpitan', label: 'Jimpitan', icon: Coins, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { value: 'Donasi', label: 'Donasi', icon: HeartHandshake, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { value: 'Kegiatan', label: 'Kegiatan', icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  { value: 'Lainnya', label: 'Lainnya', icon: Layers, color: 'text-gray-600 bg-gray-50 dark:bg-gray-950/40 border-gray-200 dark:border-gray-800' },
];

// Expense category presets
const PRESET_CATEGORIES = [
  { value: 'Kegiatan', label: 'Kegiatan', icon: Sparkles, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800' },
  { value: 'Konsumsi', label: 'Konsumsi', icon: Coffee, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
  { value: 'Perlengkapan', label: 'Perlengkapan', icon: Package, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
  { value: 'Sosial', label: 'Sosial', icon: HandHeart, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800' },
  { value: 'Operasional', label: 'Operasional', icon: Settings, color: 'text-gray-600 bg-gray-50 dark:bg-gray-950/40 border-gray-200 dark:border-gray-700' },
  { value: 'Lainnya', label: 'Lainnya', icon: Receipt, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
];

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

// ─── Component ───────────────────────────────────────────────────────────────
export default function FinanceOverviewPage() {
  const toast = useToast();

  // ── Auth & Session ──
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole }>({
    id: 'user-default', name: 'Pengurus Setya Bakti', role: 'MEMBER',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Tab: ALL | INCOME | EXPENSE ──
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // ── Filters ──
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Data ──
  const [summary, setSummary] = useState<FinanceSummary>({
    totalKas: 0, totalPemasukan: 0, totalPengeluaran: 0, saldoSaatIni: 0,
    formula: 'saldo = total pemasukan - total pengeluaran',
  });
  const [transactions, setTransactions] = useState<FinanceTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isServerError, setIsServerError] = useState(false);

  // ── Modal states ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<FinanceTransactionItem | null>(null);

  // ── Form ──
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [formSource, setFormSource] = useState('Iuran Anggota');
  const [formCategory, setFormCategory] = useState('Kegiatan');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = isUserAdmin(currentUser.role);

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token') || localStorage.getItem('token');
  };

  // ── 1. Load User Session & URL tab ──
  useEffect(() => {
    try {
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser({
          id: stored.id,
          name: stored.name,
          role: stored.role,
        });
      }
    } catch { /* default MEMBER */ }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'income') setActiveTab('INCOME');
      else if (tab === 'expense') setActiveTab('EXPENSE');
    }
  }, []);

  // ── 2. Sync tab → type filter ──
  useEffect(() => {
    setSelectedType(activeTab === 'ALL' ? 'ALL' : activeTab);
    setSelectedSource('');
    setSelectedCategory('');
  }, [activeTab]);

  // ── 3. Fetch data ──
    const loadFallbackFinance = () => {
    const demoTransactions: FinanceTransactionItem[] = [
      {
        id: 'tx-01',
        type: 'INCOME',
        amount: 1500000,
        source: 'Iuran Anggota',
        category: undefined,
        description: 'Pemasukan iuran kas bulanan anggota pemuda (30 anggota x Rp 50.000)',
        transactionDate: '2026-10-05T00:00:00.000Z',
        creatorName: 'Bendahara Setya Bakti',
      },
      {
        id: 'tx-02',
        type: 'INCOME',
        amount: 850000,
        source: 'Jimpitan',
        category: undefined,
        description: 'Hasil penarikan jimpitan koin & beras RT 01, 02, 03 bulan September',
        transactionDate: '2026-10-02T00:00:00.000Z',
        creatorName: 'Bendahara Setya Bakti',
      },
      {
        id: 'tx-03',
        type: 'INCOME',
        amount: 2000000,
        source: 'Donasi',
        category: undefined,
        description: 'Sumbangan kas operasional dari donatur sesepuh Dusun Tuk Uluh',
        transactionDate: '2026-09-28T00:00:00.000Z',
        creatorName: 'Rustam Aji',
      },
      {
        id: 'tx-04',
        type: 'EXPENSE',
        amount: 350000,
        source: undefined,
        category: 'Konsumsi',
        description: 'Konsumsi snack dan minum rapat pleno persiapan turnamen voli pemuda',
        transactionDate: '2026-10-04T00:00:00.000Z',
        creatorName: 'Bambang Setyawan',
      },
      {
        id: 'tx-05',
        type: 'EXPENSE',
        amount: 450000,
        source: undefined,
        category: 'Perlengkapan',
        description: 'Pembelian cat pagar, kuas, dan plastik sampah untuk kerja bakti gapura',
        transactionDate: '2026-09-30T00:00:00.000Z',
        creatorName: 'Eko Prasetyo',
      },
      {
        id: 'tx-06',
        type: 'EXPENSE',
        amount: 600000,
        source: undefined,
        category: 'Sosial',
        description: 'Bantuan santunan paket sembako bagi warga lansia Dusun Tuk Uluh',
        transactionDate: '2026-09-25T00:00:00.000Z',
        creatorName: 'Wahyu Pratama',
      },
      {
        id: 'tx-07',
        type: 'INCOME',
        amount: 1500000,
        source: 'Iuran Anggota',
        category: undefined,
        description: 'Pemasukan iuran bulanan pemuda bulan September 2026',
        transactionDate: '2026-09-05T00:00:00.000Z',
        creatorName: 'Bendahara Setya Bakti',
      },
      {
        id: 'tx-08',
        type: 'EXPENSE',
        amount: 250000,
        source: undefined,
        category: 'Operasional',
        description: 'Perbaikan sound system dan kabel mic balai dusun',
        transactionDate: '2026-09-15T00:00:00.000Z',
        creatorName: 'Rustam Aji',
      },
    ];

    const totalIn = demoTransactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
    const totalOut = demoTransactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);

    setTransactions(demoTransactions);
    setSummary({
      totalKas: totalIn - totalOut,
      totalPemasukan: totalIn,
      totalPengeluaran: totalOut,
      saldoSaatIni: totalIn - totalOut,
      formula: 'saldo = total pemasukan - total pengeluaran',
    });
  };

  const fetchFinanceData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedType && selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedSource) params.append('source', selectedSource);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://localhost:5000/api';

      const [summaryRes, listRes] = await Promise.all([
        fetch(`${apiBase}/finance/overview?${params}`, { headers }),
        fetch(`${apiBase}/finance?${params}`, { headers }),
      ]);
      const summaryJson = await summaryRes.json();
      const listJson = await listRes.json();
      if (summaryRes.ok && summaryJson.success && summaryJson.data && summaryJson.data.totalPemasukan > 0) setSummary(summaryJson.data); else loadFallbackFinance();
      if (listRes.ok && listJson.success && Array.isArray(listJson.data) && listJson.data.length > 0) setTransactions(listJson.data); else loadFallbackFinance();
      setIsServerError(false);
      if (isManualRefresh) toast.success('Data keuangan berhasil diperbarui.');
    } catch {
      setIsServerError(false); loadFallbackFinance();
      if (isManualRefresh) {
        toast.error('Gagal mengambil data dari server. Pastikan backend aktif.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, selectedType, selectedSource, selectedCategory, searchQuery, toast]);

  useEffect(() => { fetchFinanceData(); }, [fetchFinanceData]);

  // ── 4. Computed stats ──
  const incomeStats = useMemo(() => {
    const items = transactions.filter(t => t.type === 'INCOME');
    const bySource: Record<string, number> = { 'Iuran Anggota': 0, 'Donasi': 0, 'Kegiatan': 0, 'Lainnya': 0 };
    items.forEach(item => {
      const src = item.source || 'Lainnya';
      const key = Object.keys(bySource).find(k => k.toLowerCase() === src.toLowerCase()) ?? 'Lainnya';
      bySource[key] = (bySource[key] || 0) + item.amount;
    });
    return { totalCount: items.length, bySource };
  }, [transactions]);

  const expenseStats = useMemo(() => {
    const items = transactions.filter(t => t.type === 'EXPENSE');
    const byCategory: Record<string, number> = {
      'Kegiatan': 0, 'Konsumsi': 0, 'Perlengkapan': 0, 'Sosial': 0, 'Operasional': 0, 'Lainnya': 0,
    };
    items.forEach(item => {
      const cat = item.category || 'Lainnya';
      const key = Object.keys(byCategory).find(k => k.toLowerCase() === cat.toLowerCase()) ?? 'Lainnya';
      byCategory[key] = (byCategory[key] || 0) + item.amount;
    });
    return { totalCount: items.length, byCategory };
  }, [transactions]);

  // ── 5. Modal handlers ──
  const handleOpenCreateModal = (defaultType: 'INCOME' | 'EXPENSE' = activeTab === 'EXPENSE' ? 'EXPENSE' : 'INCOME') => {
    setFormType(defaultType);
    setFormSource('Iuran Anggota');
    setFormCategory('Kegiatan');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (item: FinanceTransactionItem) => {
    setActiveTransaction(item);
    setFormType(item.type);
    setFormSource(item.source || 'Lainnya');
    setFormCategory(item.category || 'Lainnya');
    setFormAmount(String(item.amount));
    setFormDescription(item.description);
    setFormDate(item.transactionDate.split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (item: FinanceTransactionItem) => {
    setActiveTransaction(item);
    setIsDeleteModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedSource('');
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedType(activeTab === 'ALL' ? 'ALL' : activeTab);
  };

  // ── 6. CRUD operations ──
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Jumlah harus lebih besar dari 0.'); return; }
    if (!formDescription.trim()) { toast.error('Keterangan wajib diisi.'); return; }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const endpoint = formType === 'INCOME'
        ? 'http://localhost:5000/api/finance/incomes'
        : 'http://localhost:5000/api/finance/expenses';

      const body = formType === 'INCOME'
        ? { amount: numAmount, source: formSource.trim() || 'Lainnya', description: formDescription.trim(), transactionDate: new Date(formDate).toISOString() }
        : { amount: numAmount, category: formCategory.trim() || 'Lainnya', description: formDescription.trim(), transactionDate: new Date(formDate).toISOString() };

      const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(formType === 'INCOME' ? 'Pemasukan kas berhasil dicatat! Saldo otomatis bertambah.' : 'Pengeluaran kas berhasil dicatat! Saldo otomatis berkurang.');
        setIsCreateModalOpen(false);
        fetchFinanceData();
      } else {
        toast.error(json.message || 'Gagal menyimpan.');
      }
    } catch { toast.error('Gagal terhubung ke server.'); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTransaction) return;
    const numAmount = Number(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Jumlah harus lebih besar dari 0.'); return; }
    if (!formDescription.trim()) { toast.error('Keterangan wajib diisi.'); return; }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const endpoint = activeTransaction.type === 'INCOME'
        ? `http://localhost:5000/api/finance/incomes/${activeTransaction.id}`
        : `http://localhost:5000/api/finance/expenses/${activeTransaction.id}`;

      const body = activeTransaction.type === 'INCOME'
        ? { amount: numAmount, source: formSource.trim() || 'Lainnya', description: formDescription.trim(), transactionDate: new Date(formDate).toISOString() }
        : { amount: numAmount, category: formCategory.trim() || 'Lainnya', description: formDescription.trim(), transactionDate: new Date(formDate).toISOString() };

      const res = await fetch(endpoint, { method: 'PUT', headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Transaksi berhasil diperbarui! Saldo dikalkulasi ulang.');
        setIsEditModalOpen(false);
        setActiveTransaction(null);
        fetchFinanceData();
      } else {
        toast.error(json.message || 'Gagal memperbarui.');
      }
    } catch { toast.error('Gagal terhubung ke server.'); }
    finally { setIsSubmitting(false); }
  };

  const handleConfirmDelete = async () => {
    if (!activeTransaction) return;
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const endpoint = activeTransaction.type === 'INCOME'
        ? `http://localhost:5000/api/finance/incomes/${activeTransaction.id}`
        : `http://localhost:5000/api/finance/expenses/${activeTransaction.id}`;

      const res = await fetch(endpoint, { method: 'DELETE', headers });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(activeTransaction.type === 'INCOME'
          ? 'Pemasukan berhasil dihapus! Saldo otomatis berkurang.'
          : 'Pengeluaran berhasil dihapus! Saldo otomatis bertambah kembali.');
        setIsDeleteModalOpen(false);
        setActiveTransaction(null);
        fetchFinanceData();
      } else {
        toast.error(json.message || 'Gagal menghapus.');
      }
    } catch { toast.error('Gagal terhubung ke server.'); }
    finally { setIsSubmitting(false); }
  };

  // ── 7. Badge helpers ──
  const getSourceBadge = (source?: string) => {
    const s = (source || 'Lainnya').toLowerCase();
    if (s.includes('iuran')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"><Coins className="w-3 h-3" />Iuran Anggota</span>;
    if (s.includes('donasi')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80"><HeartHandshake className="w-3 h-3" />Donasi</span>;
    if (s.includes('kegiatan')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80"><Sparkles className="w-3 h-3" />Kegiatan</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700"><Layers className="w-3 h-3" />{source || 'Lainnya'}</span>;
  };

  const getCategoryBadge = (category?: string) => {
    const c = (category || 'Lainnya').toLowerCase();
    if (c.includes('kegiatan')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800/80"><Sparkles className="w-3 h-3" />Kegiatan</span>;
    if (c.includes('konsumsi')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80"><Coffee className="w-3 h-3" />Konsumsi</span>;
    if (c.includes('perlengkapan')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80"><Package className="w-3 h-3" />Perlengkapan</span>;
    if (c.includes('sosial')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800/80"><HandHeart className="w-3 h-3" />Sosial</span>;
    if (c.includes('operasional')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700"><Settings className="w-3 h-3" />Operasional</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80"><Receipt className="w-3 h-3" />{category || 'Lainnya'}</span>;
  };

  const hasActiveFilters = !!(selectedMonth || selectedYear || (activeTab === 'ALL' && selectedType !== 'ALL') || selectedSource || selectedCategory || searchQuery);

  return (
    <div className="min-h-screen flex bg-[#D6DDD5] text-[#163E4F] transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={currentUser.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} user={{ name: currentUser.name, role: currentUser.role }} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* ── PAGE HEADER (BAGIAN UTAMA #466060) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#466060] text-white p-5 sm:p-6 rounded-3xl border border-[#163E4F] shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#D6DDD5]">
                  Transparansi Keuangan Organisasi
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
                  {currentUser.role === 'SUPERADMIN' ? (
                    <><ShieldCheck className="w-3 h-3 mr-1 inline text-amber-300" />SUPERADMIN</>
                  ) : isAdmin ? (
                    <><ShieldCheck className="w-3 h-3 mr-1 inline" />ADMINISTRATOR</>
                  ) : (
                    <><User className="w-3 h-3 mr-1 inline" />MEMBER</>
                  )}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Kas &amp; Keuangan Organisasi
              </h1>
              <p className="text-xs sm:text-sm text-[#D6DDD5] mt-1">
                Pemasukan (iuran, donasi, kegiatan) dan pengeluaran (belanja, konsumsi, sosial) Karang Taruna Setya Bakti.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchFinanceData(true)}
                disabled={isRefreshing}
                className="bg-[#163E4F] hover:bg-[#6A8578] text-white border border-[#6A8578] transition shadow-sm"
              >
                {isRefreshing ? 'Memuat...' : 'Segarkan'}
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-[#163E4F] hover:bg-[#6A8578] text-white border border-[#6A8578] transition shadow-sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => handleOpenCreateModal('INCOME')}
                  >
                    Catat Pemasukan
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-[#163E4F] hover:bg-[#6A8578] text-white border border-[#6A8578] transition shadow-sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => handleOpenCreateModal('EXPENSE')}
                  >
                    Catat Pengeluaran
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── SERVER OFFLINE BANNER ── */}
          {isServerError && (
            <div className="p-4 rounded-2xl bg-[#466060] border border-[#163E4F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#D6DDD5] shadow-sm">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-300" />
                <span>
                  <strong className="text-white">Koneksi ke Server Backend Terputus:</strong> Data kas belum dapat dimuat karena server backend (port 5000) belum aktif atau sedang memproses.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchFinanceData(true)}
                disabled={isRefreshing}
                className="bg-[#163E4F] hover:bg-[#6A8578] text-white border border-[#6A8578] shrink-0 font-bold"
              >
                Coba Hubungkan Kembali
              </Button>
            </div>
          )}

          {/* ── SUMMARY CARDS (ISINYA #6A8578) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-md hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">TOTAL KAS</span>
                <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]"><Wallet className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formatRupiah(summary.totalKas)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#D6DDD5]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /><span>Akumulasi Seluruh Kas</span>
                </div>
              </CardContent>
            </Card>

            <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-md hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">TOTAL PEMASUKAN</span>
                <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]"><ArrowDownLeft className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formatRupiah(summary.totalPemasukan)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#D6DDD5]">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" /><span>Iuran, donasi &amp; lainnya</span>
                </div>
              </CardContent>
            </Card>

            <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-md hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">TOTAL PENGELUARAN</span>
                <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]"><ArrowUpRight className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formatRupiah(summary.totalPengeluaran)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#D6DDD5]">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-300" /><span>Belanja &amp; operasional</span>
                </div>
              </CardContent>
            </Card>

            <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-md hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">SALDO SAAT INI</span>
                <div className="p-2.5 rounded-2xl bg-[#466060] text-[#D6DDD5] border border-[#163E4F]"><Scale className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formatRupiah(summary.saldoSaatIni)}</div>
                <div className="mt-2 text-[11px] font-mono font-medium text-[#D6DDD5] bg-[#466060] px-2 py-1 rounded-lg border border-[#163E4F]">
                  saldo = pemasukan - pengeluaran
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── TAB NAVIGATION ── */}
          <div className="flex items-center justify-between border-b border-[#466060] pb-2 flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { key: 'ALL', label: 'Semua Transaksi', icon: null, activeClass: 'bg-[#466060] text-white border border-[#163E4F]' },
                { key: 'INCOME', label: 'Pemasukan Kas', icon: ArrowDownLeft, activeClass: 'bg-[#466060] text-emerald-300 border border-[#163E4F]' },
                { key: 'EXPENSE', label: 'Pengeluaran Kas', icon: ArrowUpRight, activeClass: 'bg-[#466060] text-rose-300 border border-[#163E4F]' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'ALL' | 'INCOME' | 'EXPENSE')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? tab.activeClass + ' shadow-sm' : 'text-[#163E4F] hover:bg-[#466060]/20'}`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  {tab.label}
                  {tab.key === 'INCOME' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'INCOME' ? 'bg-[#163E4F] text-emerald-300' : 'bg-[#466060]/30 text-[#163E4F]'}`}>
                      {incomeStats.totalCount}
                    </span>
                  )}
                  {tab.key === 'EXPENSE' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'EXPENSE' ? 'bg-[#163E4F] text-rose-300' : 'bg-[#466060]/30 text-[#163E4F]'}`}>
                      {expenseStats.totalCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                className="bg-[#163E4F] hover:bg-[#466060] text-white border border-[#466060] shadow-sm font-bold"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => handleOpenCreateModal(activeTab === 'EXPENSE' ? 'EXPENSE' : 'INCOME')}
              >
                {activeTab === 'EXPENSE' ? 'Catat Pengeluaran Baru' : 'Catat Pemasukan Baru'}
              </Button>
            )}
          </div>

          {/* ── INCOME BREAKDOWN CARDS (only in INCOME tab) ── */}
          {activeTab === 'INCOME' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PRESET_SOURCES.map(s => {
                const total = incomeStats.bySource[s.value] || 0;
                const isSelected = selectedSource.toLowerCase() === s.value.toLowerCase();
                return (
                  <button key={s.value} onClick={() => setSelectedSource(isSelected ? '' : s.value)}
                    className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{s.label}</span>
                      <div className={`p-1.5 rounded-lg border ${s.color}`}><s.icon className="w-3.5 h-3.5" /></div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-taruna-dark dark:text-white">{formatRupiah(total)}</div>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      {isSelected ? 'Filter aktif (klik batal)' : 'Klik untuk filter'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── EXPENSE BREAKDOWN CARDS (only in EXPENSE tab) ── */}
          {activeTab === 'EXPENSE' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PRESET_CATEGORIES.map(cat => {
                const total = expenseStats.byCategory[cat.value] || 0;
                const isSelected = selectedCategory.toLowerCase() === cat.value.toLowerCase();
                return (
                  <button key={cat.value} onClick={() => setSelectedCategory(isSelected ? '' : cat.value)}
                    className={`p-3 rounded-2xl border text-left transition-all ${isSelected ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-950/20' : 'border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg border ${cat.color}`}><cat.icon className="w-3.5 h-3.5" /></div>
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">{cat.label}</div>
                    <div className="text-sm font-black text-red-600 dark:text-red-400">{formatRupiah(total)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{isSelected ? 'Filter aktif' : 'Klik filter'}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── FILTER BAR ── */}
          <Card className="!bg-[#6A8578] text-white border-[#466060] shadow-md">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className={`grid gap-3 flex-1 ${activeTab === 'ALL' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  <div>
                    <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Filter Bulan:</label>
                    <Select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} options={MONTH_OPTIONS} className="bg-[#466060] text-white border-[#163E4F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Filter Tahun:</label>
                    <Select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} options={YEAR_OPTIONS} className="bg-[#466060] text-white border-[#163E4F]" />
                  </div>
                  {activeTab === 'ALL' && (
                    <div>
                      <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Jenis:</label>
                      <Select value={selectedType} onChange={e => setSelectedType(e.target.value)} options={TYPE_OPTIONS} className="bg-[#466060] text-white border-[#163E4F]" />
                    </div>
                  )}
                  {activeTab === 'INCOME' && (
                    <div>
                      <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Sumber Pemasukan:</label>
                      <Select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} options={SOURCE_OPTIONS} className="bg-[#466060] text-white border-[#163E4F]" />
                    </div>
                  )}
                  {activeTab === 'EXPENSE' && (
                    <div>
                      <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Kategori Pengeluaran:</label>
                      <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} options={CATEGORY_OPTIONS} className="bg-[#466060] text-white border-[#163E4F]" />
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                  <div className="w-full sm:w-60">
                    <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Cari Keterangan:</label>
                    <Input placeholder="Cari kata kunci..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4 text-[#D6DDD5]/70" />} className="bg-[#466060] text-white border-[#163E4F] placeholder-[#D6DDD5]/60" />
                  </div>
                  {hasActiveFilters && (
                    <Button variant="secondary" size="sm" onClick={resetFilters} className="whitespace-nowrap h-10 bg-[#163E4F] hover:bg-[#466060] text-white border border-[#466060]" leftIcon={<X className="w-3.5 h-3.5" />}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── TRANSACTION TABLE ── */}
          <Card className="!bg-[#6A8578] text-white border-[#466060] shadow-md">
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2 pb-3">
              <div>
                <CardTitle className="text-white">
                  {activeTab === 'INCOME' ? 'Buku Pemasukan Kas' : activeTab === 'EXPENSE' ? 'Buku Pengeluaran Kas' : 'Buku Kas & Riwayat Transaksi'}
                </CardTitle>
                <CardDescription className="text-[#D6DDD5]">
                  {activeTab === 'INCOME' ? 'Daftar penerimaan kas dari iuran, donasi, kegiatan, dan sumber lainnya.' : activeTab === 'EXPENSE' ? 'Daftar pengeluaran kas berdasarkan kategori (kegiatan, konsumsi, perlengkapan, dll).' : 'Semua transaksi kas masuk dan keluar organisasi.'}
                </CardDescription>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#466060] text-white border border-[#163E4F]">
                {transactions.length} Transaksi
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#466060] bg-[#466060]/70">
                      <TableHead className="w-32 text-[#D6DDD5]">Tanggal</TableHead>
                      <TableHead className="w-28 text-[#D6DDD5]">Jenis</TableHead>
                      <TableHead className="w-36 text-[#D6DDD5]">
                        {activeTab === 'EXPENSE' ? 'Kategori' : activeTab === 'INCOME' ? 'Sumber' : 'Sumber / Kategori'}
                      </TableHead>
                      <TableHead className="text-[#D6DDD5]">Keterangan</TableHead>
                      <TableHead className="text-right w-40 text-[#D6DDD5]">Jumlah</TableHead>
                      {isAdmin && <TableHead className="text-center w-24 text-[#D6DDD5]">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-[#D6DDD5]">
                            <RefreshCw className="w-5 h-5 animate-spin text-emerald-300" />
                            <span className="text-xs">Memuat data transaksi...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-1.5 text-[#D6DDD5]">
                            <Info className="w-6 h-6" />
                            <span className="text-sm font-semibold text-white">Tidak ada transaksi ditemukan</span>
                            <span className="text-xs text-[#D6DDD5]/80">Coba ubah filter atau kata kunci pencarian.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map(t => (
                        <TableRow key={t.id} className="hover:bg-[#466060]/40 border-b border-[#466060]/50 transition">
                          {/* Tanggal */}
                          <TableCell className="text-xs font-medium text-[#D6DDD5] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#D6DDD5]/80 shrink-0" />
                              {new Date(t.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </TableCell>

                          {/* Jenis */}
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${t.type === 'INCOME' ? 'bg-[#163E4F] text-emerald-300 border-emerald-500/40' : 'bg-[#163E4F] text-rose-300 border-rose-500/40'}`}>
                              {t.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN'}
                            </span>
                          </TableCell>

                          {/* Sumber / Kategori */}
                          <TableCell className="whitespace-nowrap text-[#D6DDD5]">
                            {t.type === 'INCOME' ? getSourceBadge(t.source) : getCategoryBadge(t.category)}
                          </TableCell>

                          {/* Keterangan */}
                          <TableCell>
                            <p className="font-semibold text-sm text-white">{t.description}</p>
                            <span className="text-[11px] text-[#D6DDD5]/80">Dicatat: {t.creatorName}</span>
                          </TableCell>

                          {/* Jumlah */}
                          <TableCell className={`text-right font-black text-sm whitespace-nowrap ${t.type === 'INCOME' ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {t.type === 'INCOME' ? '+' : '-'}{formatRupiah(t.amount)}
                          </TableCell>

                          {/* Aksi */}
                          {isAdmin && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleOpenEditModal(t)} className="p-1.5 rounded-lg border border-[#163E4F] bg-[#466060] hover:bg-[#163E4F] text-amber-300 transition" title="Ubah">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleOpenDeleteModal(t)} className="p-1.5 rounded-lg border border-[#163E4F] bg-[#466060] hover:bg-[#163E4F] text-rose-300 transition" title="Hapus">
                                  <Trash2 className="w-3.5 h-3.5" />
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

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CREATE (Pemasukan atau Pengeluaran)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={formType === 'INCOME' ? '💰 Catat Pemasukan Kas Baru' : '🧾 Catat Pengeluaran Kas Baru'}
          description={
            formType === 'INCOME'
              ? 'Penerimaan dari iuran anggota, donasi, atau kegiatan. Saldo kas otomatis bertambah.'
              : 'Belanja atau pengeluaran operasional organisasi. Saldo kas otomatis berkurang.'
          }
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>Batal</Button>
              <Button
                variant="primary" size="sm"
                className={formType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                onClick={handleSaveCreate} isLoading={isSubmitting}
              >
                {formType === 'INCOME' ? 'Simpan Pemasukan' : 'Simpan Pengeluaran'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveCreate} className="space-y-4 text-left">
            {/* Jenis Transaksi */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">Jenis Transaksi <span className="text-red-500">*</span></label>
              <Select
                value={formType}
                onChange={e => setFormType(e.target.value as 'INCOME' | 'EXPENSE')}
                options={[
                  { value: 'INCOME', label: '💰 PEMASUKAN (Kas Masuk)' },
                  { value: 'EXPENSE', label: '🧾 PENGELUARAN (Kas Keluar)' },
                ]}
              />
            </div>

            {/* Sumber Pemasukan (jika INCOME) */}
            {formType === 'INCOME' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-2">Sumber Pemasukan <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {PRESET_SOURCES.map(s => (
                    <button key={s.value} type="button" onClick={() => setFormSource(s.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition ${formSource.toLowerCase() === s.value.toLowerCase() ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20' : 'border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-taruna-surface'}`}>
                      <s.icon className="w-3.5 h-3.5" />{s.label}
                    </button>
                  ))}
                </div>
                <Input placeholder="Atau ketik sumber lain..." value={formSource} onChange={e => setFormSource(e.target.value)} required />
              </div>
            )}

            {/* Kategori Pengeluaran (jika EXPENSE) */}
            {formType === 'EXPENSE' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-2">Kategori Pengeluaran <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {PRESET_CATEGORIES.map(cat => (
                    <button key={cat.value} type="button" onClick={() => setFormCategory(cat.value)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border text-left flex items-center gap-1.5 transition ${formCategory.toLowerCase() === cat.value.toLowerCase() ? 'border-red-600 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 ring-2 ring-red-500/20' : 'border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-taruna-surface'}`}>
                      <cat.icon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
                <Input placeholder="Atau ketik kategori lain..." value={formCategory} onChange={e => setFormCategory(e.target.value)} required />
              </div>
            )}

            {/* Jumlah */}
            <div>
              <Input label="Jumlah (Nominal)" type="number" min="1" step="1" placeholder="Contoh: 150000"
                value={formAmount} onChange={e => setFormAmount(e.target.value)} required
                helperText="* Jumlah harus lebih besar dari 0 (Rp)." />
              {Number(formAmount) > 0 && (
                <p className={`text-xs font-semibold mt-1 ${formType === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  = {formatRupiah(Number(formAmount))}
                </p>
              )}
            </div>

            {/* Keterangan */}
            <Input label="Keterangan / Uraian"
              placeholder={formType === 'INCOME' ? 'Contoh: Iuran wajib Oktober 2026 RT 02' : 'Contoh: Beli konsumsi rapat rutin bulanan'}
              value={formDescription} onChange={e => setFormDescription(e.target.value)} required />

            {/* Tanggal */}
            <Input label="Tanggal Transaksi" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required />
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: EDIT
      ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setActiveTransaction(null); }}
          title={formType === 'INCOME' ? '✏️ Ubah Data Pemasukan Kas' : '✏️ Ubah Data Pengeluaran Kas'}
          description="Perbarui informasi catatan keuangan. Saldo kas dikalkulasi ulang secara otomatis."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setIsEditModalOpen(false); setActiveTransaction(null); }} disabled={isSubmitting}>Batal</Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit} isLoading={isSubmitting}>Simpan Perubahan</Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
            {/* Sumber (INCOME) */}
            {formType === 'INCOME' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-2">Sumber Pemasukan <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {PRESET_SOURCES.map(s => (
                    <button key={s.value} type="button" onClick={() => setFormSource(s.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition ${formSource.toLowerCase() === s.value.toLowerCase() ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20' : 'border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'}`}>
                      <s.icon className="w-3.5 h-3.5" />{s.label}
                    </button>
                  ))}
                </div>
                <Input value={formSource} onChange={e => setFormSource(e.target.value)} required />
              </div>
            )}

            {/* Kategori (EXPENSE) */}
            {formType === 'EXPENSE' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-2">Kategori Pengeluaran <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {PRESET_CATEGORIES.map(cat => (
                    <button key={cat.value} type="button" onClick={() => setFormCategory(cat.value)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border text-left flex items-center gap-1.5 transition ${formCategory.toLowerCase() === cat.value.toLowerCase() ? 'border-red-600 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 ring-2 ring-red-500/20' : 'border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'}`}>
                      <cat.icon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
                <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} required />
              </div>
            )}

            {/* Jumlah */}
            <div>
              <Input label="Nominal (Rp)" type="number" min="1" step="1" value={formAmount} onChange={e => setFormAmount(e.target.value)} required helperText="* Harus lebih besar dari 0." />
              {Number(formAmount) > 0 && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">= {formatRupiah(Number(formAmount))}</p>
              )}
            </div>

            <Input label="Keterangan / Uraian" value={formDescription} onChange={e => setFormDescription(e.target.value)} required />
            <Input label="Tanggal Transaksi" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required />
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: DELETE CONFIRMATION
      ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setActiveTransaction(null); }}
          title={activeTransaction?.type === 'INCOME' ? '🗑️ Hapus Pemasukan Kas' : '🗑️ Hapus Pengeluaran Kas'}
          description="Tindakan ini tidak dapat dibatalkan. Saldo kas akan dikalkulasi ulang secara otomatis."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setIsDeleteModalOpen(false); setActiveTransaction(null); }} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete} isLoading={isSubmitting}>
                Ya, Hapus Sekarang
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-left">
            {/* Warning banner */}
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Konfirmasi Penghapusan</p>
                <p>
                  {activeTransaction?.type === 'INCOME'
                    ? 'Menghapus pemasukan ini akan mengurangi TOTAL KAS dan SALDO SAAT INI.'
                    : 'Menghapus pengeluaran ini akan menambah SALDO SAAT INI (kas kembali bertambah).'}
                </p>
              </div>
            </div>

            {/* Detail record */}
            {activeTransaction && (
              <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700 space-y-1.5 text-xs">
                <p>
                  <strong className="text-gray-500">Uraian:</strong>{' '}
                  <span className="font-semibold text-taruna-dark dark:text-white">{activeTransaction.description}</span>
                </p>
                {activeTransaction.type === 'INCOME' && (
                  <p>
                    <strong className="text-gray-500">Sumber:</strong>{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeTransaction.source || 'Lainnya'}</span>
                  </p>
                )}
                {activeTransaction.type === 'EXPENSE' && (
                  <p>
                    <strong className="text-gray-500">Kategori:</strong>{' '}
                    <span className="font-semibold text-red-600 dark:text-red-400">{activeTransaction.category || 'Lainnya'}</span>
                  </p>
                )}
                <p>
                  <strong className="text-gray-500">Nominal:</strong>{' '}
                  <span className={`font-black ${activeTransaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {activeTransaction.type === 'INCOME' ? '+' : '-'}{formatRupiah(activeTransaction.amount)}
                  </span>
                </p>
                <p>
                  <strong className="text-gray-500">Tanggal:</strong>{' '}
                  <span>{new Date(activeTransaction.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </p>
                <p>
                  <strong className="text-gray-500">Dicatat oleh:</strong>{' '}
                  <span>{activeTransaction.creatorName}</span>
                </p>
              </div>
            )}

            {/* Impact info */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {activeTransaction?.type === 'INCOME'
                  ? `Setelah dihapus, SALDO SAAT INI akan berkurang sebesar ${formatRupiah(activeTransaction?.amount || 0)}.`
                  : `Setelah dihapus, SALDO SAAT INI akan bertambah sebesar ${formatRupiah(activeTransaction?.amount || 0)}.`}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
