'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  X,
  TrendingUp,
  Scale,
  ShieldCheck,
  User,
  Info,
  Layers,
  Coins,
  HeartHandshake,
  Sparkles,
  Coffee,
  Package,
  HandHeart,
  Settings,
  Receipt,
  Banknote,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  Line,
} from 'recharts';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface FinancialReportSummary {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  jumlahTransaksi: number;
  saldoAwal: number;
  saldoAkhir: number;
}

interface FinancialReportTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  source: string;
  category: string;
  description: string;
  transactionDate: string;
  creatorName: string;
  runningBalance: number;
}

interface ChartItem {
  period: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

interface CategoryBreakdown {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

interface SourceBreakdown {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

interface FinancialReportResponse {
  summary: FinancialReportSummary;
  filter: {
    startDate?: string | null;
    endDate?: string | null;
    month?: number | null;
    year?: number | null;
    type?: string;
    periodLabel: string;
  };
  chartData: ChartItem[];
  categoryBreakdown: CategoryBreakdown[];
  sourceBreakdown: SourceBreakdown[];
  transactions: FinancialReportTransaction[];
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
  { value: 'ALL', label: 'Semua Jenis (Masuk & Keluar)' },
  { value: 'INCOME', label: 'Hanya Pemasukan' },
  { value: 'EXPENSE', label: 'Hanya Pengeluaran' },
];

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

// ─── Custom Tooltip Component for Recharts ────────────────────────────────────
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-taruna-border dark:border-slate-800 text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-taruna-dark dark:text-white border-b border-gray-100 dark:border-slate-800 pb-1 mb-1">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-taruna-dark dark:text-white">
              {formatRupiah(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FinancialReportsPage() {
  const toast = useToast();

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: 'ADMIN' | 'MEMBER' }>({
    id: 'user-default',
    name: 'Pengurus Setya Bakti',
    role: 'MEMBER',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = currentUser.role === 'ADMIN';

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTable, setSearchTable] = useState('');

  // Report Data
  const [report, setReport] = useState<FinancialReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'bar' | 'area'>('bar');

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

  // Load User Session
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
      // Default to MEMBER
    }
  }, []);

  // Fetch Report Data
  const fetchReport = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedMonth) params.append('month', selectedMonth);
        if (selectedYear) params.append('year', selectedYear);
        if (selectedType && selectedType !== 'ALL') params.append('type', selectedType);

        const res = await fetch(`http://localhost:5000/api/finance/reports?${params}`, {
          headers,
        });
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          setReport(json.data);
          if (isManualRefresh) toast.success('Laporan keuangan berhasil diperbarui.');
        } else {
          toast.error(json.message || 'Gagal memuat laporan keuangan.');
        }
      } catch {
        toast.error('Gagal terhubung ke server saat memuat laporan.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [startDate, endDate, selectedMonth, selectedYear, selectedType, toast]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Quick Preset Handlers
  const handlePresetAllTime = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedType('ALL');
  };

  const handlePresetThisYear = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSelectedYear('2026');
    setSelectedType('ALL');
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    setStartDate('');
    setEndDate('');
    setSelectedMonth(String(now.getMonth() + 1));
    setSelectedYear(String(now.getFullYear()));
    setSelectedType('ALL');
  };

  const handlePresetLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedType('ALL');
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSelectedYear('2026');
    setSelectedType('ALL');
    setSearchTable('');
  };

  const hasActiveFilters = !!(startDate || endDate || selectedMonth || selectedYear !== '2026' || selectedType !== 'ALL' || searchTable);

  // Filtered transactions for the table (with client-side search query)
  const filteredTransactions = useMemo(() => {
    if (!report?.transactions) return [];
    if (!searchTable.trim()) return report.transactions;

    const q = searchTable.toLowerCase().trim();
    return report.transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.creatorName.toLowerCase().includes(q)
    );
  }, [report?.transactions, searchTable]);

  // Client-side CSV Export Generator
  const handleExportCSV = () => {
    if (!report) return;

    try {
      const lines: string[] = [];
      lines.push('"LAPORAN KEUANGAN TRANSPARANSI KARANG TARUNA SETYA BAKTI"');
      lines.push('"Dukuh Tuk Uluh, Desa Sringin, Kec. Jumantono, Kab. Karanganyar"');
      lines.push(`"Periode Laporan","${report.filter.periodLabel}"`);
      lines.push(`"Total Pemasukan","Rp ${report.summary.totalPemasukan.toLocaleString('id-ID')}"`);
      lines.push(`"Total Pengeluaran","Rp ${report.summary.totalPengeluaran.toLocaleString('id-ID')}"`);
      lines.push(`"Saldo Periode (Surplus/Defisit)","Rp ${report.summary.saldo.toLocaleString('id-ID')}"`);
      lines.push(`"Saldo Awal Periode","Rp ${report.summary.saldoAwal.toLocaleString('id-ID')}"`);
      lines.push(`"Saldo Akhir Kas","Rp ${report.summary.saldoAkhir.toLocaleString('id-ID')}"`);
      lines.push(`"Jumlah Transaksi","${report.summary.jumlahTransaksi} transaksi"`);
      lines.push(`"Dicetak pada","${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}"`);
      lines.push('');

      lines.push('"No","Tanggal","Jenis","Kategori/Sumber","Keterangan","Pemasukan (Rp)","Pengeluaran (Rp)","Saldo Berjalan (Rp)","Dicatat Oleh"');

      // Sort chronological ascending for CSV audit
      const chronological = [...report.transactions].reverse();
      chronological.forEach((t, idx) => {
        const dateStr = new Date(t.transactionDate).toLocaleDateString('id-ID');
        const catOrSrc = t.type === 'INCOME' ? t.source : t.category;
        const desc = t.description.replace(/"/g, '""');
        const inc = t.type === 'INCOME' ? t.amount : 0;
        const exp = t.type === 'EXPENSE' ? t.amount : 0;
        lines.push(
          `"${idx + 1}","${dateStr}","${t.type}","${catOrSrc}","${desc}","${inc}","${exp}","${t.runningBalance}","${t.creatorName}"`
        );
      });

      const csvContent = '\uFEFF' + lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Laporan-Keuangan-Setya-Bakti-${report.filter.periodLabel.replace(/[/\\?%*:|"<> ]/g, '_')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('File CSV Laporan Keuangan berhasil diunduh.');
    } catch {
      toast.error('Gagal mengekspor data ke CSV.');
    }
  };

  // Browser Print trigger (PDF generation)
  const handlePrint = () => {
    window.print();
  };

  // Badge helpers
  const getSourceOrCategoryBadge = (t: FinancialReportTransaction) => {
    if (t.type === 'INCOME') {
      const s = (t.source || 'Lainnya').toLowerCase();
      if (s.includes('iuran'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Coins className="w-3 h-3" />
            Iuran
          </span>
        );
      if (s.includes('donasi'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <HeartHandshake className="w-3 h-3" />
            Donasi
          </span>
        );
      if (s.includes('kegiatan'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3 h-3" />
            Kegiatan
          </span>
        );
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
          <Layers className="w-3 h-3" />
          {t.source || 'Lainnya'}
        </span>
      );
    } else {
      const c = (t.category || 'Lainnya').toLowerCase();
      if (c.includes('kegiatan'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
            <Sparkles className="w-3 h-3" />
            Kegiatan
          </span>
        );
      if (c.includes('konsumsi'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <Coffee className="w-3 h-3" />
            Konsumsi
          </span>
        );
      if (c.includes('perlengkapan'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Package className="w-3 h-3" />
            Perlengkapan
          </span>
        );
      if (c.includes('sosial'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
            <HandHeart className="w-3 h-3" />
            Sosial
          </span>
        );
      if (c.includes('pengambilan'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Banknote className="w-3 h-3" />
            Pengambilan Kas
          </span>
        );
      if (c.includes('operasional'))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
            <Settings className="w-3 h-3" />
            Operasional
          </span>
        );
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Receipt className="w-3 h-3" />
          {t.category || 'Lainnya'}
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={currentUser.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} user={{ name: currentUser.name, role: currentUser.role }} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* ── PRINT-ONLY REPORT VIEW (rendered when printing) ── */}
          <div className="hidden print:block text-black bg-white p-6 space-y-6">
            <div className="text-center border-b-2 border-black pb-4">
              <h2 className="text-xl font-black uppercase tracking-wider">
                KARANG TARUNA SETYA BAKTI
              </h2>
              <p className="text-sm">Dukuh Tuk Uluh, Desa Sringin, Kecamatan Jumantono, Kabupaten Karanganyar</p>
              <h3 className="text-lg font-bold mt-2 underline">LAPORAN KEUANGAN ORGANISASI</h3>
              <p className="text-xs font-semibold mt-1">Periode: {report?.filter.periodLabel || 'Semua Waktu'}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 text-xs border p-3">
              <div>
                <strong>Saldo Awal:</strong>
                <div>{formatRupiah(report?.summary.saldoAwal || 0)}</div>
              </div>
              <div>
                <strong>Total Pemasukan:</strong>
                <div className="text-emerald-700 font-bold">+{formatRupiah(report?.summary.totalPemasukan || 0)}</div>
              </div>
              <div>
                <strong>Total Pengeluaran:</strong>
                <div className="text-red-700 font-bold">-{formatRupiah(report?.summary.totalPengeluaran || 0)}</div>
              </div>
              <div>
                <strong>Saldo Akhir:</strong>
                <div className="font-bold">{formatRupiah(report?.summary.saldoAkhir || 0)}</div>
              </div>
            </div>

            <table className="w-full text-xs border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1 text-center w-8">No</th>
                  <th className="border border-gray-400 p-1 text-center w-24">Tanggal</th>
                  <th className="border border-gray-400 p-1 text-center w-20">Jenis</th>
                  <th className="border border-gray-400 p-1 text-left">Kategori/Sumber</th>
                  <th className="border border-gray-400 p-1 text-left">Keterangan</th>
                  <th className="border border-gray-400 p-1 text-right w-24">Nominal</th>
                  <th className="border border-gray-400 p-1 text-right w-28">Saldo Kumulatif</th>
                </tr>
              </thead>
              <tbody>
                {report?.transactions.map((t, idx) => (
                  <tr key={t.id}>
                    <td className="border border-gray-400 p-1 text-center">{idx + 1}</td>
                    <td className="border border-gray-400 p-1 text-center">
                      {new Date(t.transactionDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="border border-gray-400 p-1 text-center font-bold">
                      {t.type === 'INCOME' ? 'MASUK' : 'KELUAR'}
                    </td>
                    <td className="border border-gray-400 p-1">
                      {t.type === 'INCOME' ? t.source : t.category}
                    </td>
                    <td className="border border-gray-400 p-1">{t.description}</td>
                    <td className="border border-gray-400 p-1 text-right font-semibold">
                      {t.type === 'INCOME' ? '+' : '-'}{formatRupiah(t.amount)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-bold">
                      {formatRupiah(t.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 flex justify-between text-xs px-8">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p className="font-bold mt-1">Ketua Karang Taruna</p>
                <div className="h-16" />
                <p className="font-bold underline">( Rustam Aji )</p>
              </div>
              <div className="text-center">
                <p>Sringin, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold mt-1">Bendahara Organisasi</p>
                <div className="h-16" />
                <p className="font-bold underline">( Bendahara Kas )</p>
              </div>
            </div>
          </div>

          {/* ── HEADER BANNER ── */}
          <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Transparansi &amp; Akuntabilitas Publik
                </span>
                <Badge variant={isAdmin ? 'accent' : 'primary'} size="sm">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-1 inline" />
                      ADMINISTRATOR
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1 inline" />
                      MEMBER
                    </>
                  )}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight flex items-center gap-2.5">
                <BarChart3 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                Laporan Keuangan Organisasi
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Laporan pemasukan, pengeluaran, saldo periode, visualisasi grafik Recharts, dan fitur ekspor CSV / PDF.
              </p>
            </div>

            {/* Top action buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchReport(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Memuat...' : 'Segarkan'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
              >
                Cetak / PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportCSV}
              >
                Ekspor CSV
              </Button>
            </div>
          </div>

          {/* ── FILTER SECTION ── */}
          <Card className="print:hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-base">Filter Periode Laporan</CardTitle>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 mr-1 font-semibold">Pintas:</span>
                  <button
                    onClick={handlePresetAllTime}
                    className="text-xs px-2.5 py-1 rounded-lg border border-taruna-border dark:border-slate-800 bg-taruna-surface dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-600 dark:text-slate-300 font-medium transition"
                  >
                    Semua Waktu
                  </button>
                  <button
                    onClick={handlePresetThisYear}
                    className="text-xs px-2.5 py-1 rounded-lg border border-taruna-border dark:border-slate-800 bg-taruna-surface dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-600 dark:text-slate-300 font-medium transition"
                  >
                    Tahun 2026
                  </button>
                  <button
                    onClick={handlePresetThisMonth}
                    className="text-xs px-2.5 py-1 rounded-lg border border-taruna-border dark:border-slate-800 bg-taruna-surface dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-600 dark:text-slate-300 font-medium transition"
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={handlePresetLast30Days}
                    className="text-xs px-2.5 py-1 rounded-lg border border-taruna-border dark:border-slate-800 bg-taruna-surface dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-600 dark:text-slate-300 font-medium transition"
                  >
                    30 Hari Terakhir
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Tanggal Awal */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                    Tanggal Awal:
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSelectedMonth(''); // clear month if custom date
                    }}
                  />
                </div>

                {/* Tanggal Akhir */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                    Tanggal Akhir:
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedMonth(''); // clear month if custom date
                    }}
                  />
                </div>

                {/* Bulan */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                    Pilih Bulan:
                  </label>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setStartDate('');
                      setEndDate('');
                    }}
                    options={MONTH_OPTIONS}
                  />
                </div>

                {/* Tahun */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                    Pilih Tahun:
                  </label>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    options={YEAR_OPTIONS}
                  />
                </div>

                {/* Jenis Transaksi */}
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

              {hasActiveFilters && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-taruna-border dark:border-slate-800 text-xs">
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-500" />
                    Periode aktif: <strong className="text-taruna-dark dark:text-white">{report?.filter.periodLabel}</strong>
                  </span>
                  <button
                    onClick={resetFilters}
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset Semua Filter
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 4 SUMMARY CARDS (REQUIRED: total pemasukan, total pengeluaran, saldo, jumlah transaksi) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            {/* 1. TOTAL PEMASUKAN */}
            <Card hoverable className="border-t-4 border-t-emerald-500">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  TOTAL PEMASUKAN
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 ring-2 ring-black/5 dark:ring-white/5">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(report?.summary.totalPemasukan || 0)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Kas masuk pada periode ini</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. TOTAL PENGELUARAN */}
            <Card hoverable className="border-t-4 border-t-red-500">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  TOTAL PENGELUARAN
                </span>
                <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-slate-800 text-red-600 dark:text-red-400 ring-2 ring-black/5 dark:ring-white/5">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                  {formatRupiah(report?.summary.totalPengeluaran || 0)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                  <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                  <span>Kas keluar pada periode ini</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. SALDO */}
            <Card hoverable className="border-t-4 border-t-sky-500">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  SALDO PERIODE (NET)
                </span>
                <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 ring-2 ring-black/5 dark:ring-white/5">
                  <Scale className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl sm:text-3xl font-black ${
                    (report?.summary.saldo || 0) >= 0
                      ? 'text-taruna-dark dark:text-white'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatRupiah(report?.summary.saldo || 0)}
                </div>
                <div className="mt-2 text-[11px] font-mono font-medium text-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-sky-200/60 dark:border-slate-700">
                  saldo = pemasukan - pengeluaran
                </div>
              </CardContent>
            </Card>

            {/* 4. JUMLAH TRANSAKSI */}
            <Card hoverable className="border-t-4 border-t-purple-500">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  JUMLAH TRANSAKSI
                </span>
                <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 ring-2 ring-black/5 dark:ring-white/5">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                  {report?.summary.jumlahTransaksi || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Transaksi terverifikasi pembukuan</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── SALDO FLOW AUDIT BANNER ── */}
          <div className="print:hidden p-4 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-taruna-dark dark:text-white">Rekonsiliasi Saldo Kas Organisasi</p>
                <p className="text-gray-500 dark:text-slate-400">
                  Saldo Awal ({formatRupiah(report?.summary.saldoAwal || 0)}) + Pemasukan ({formatRupiah(report?.summary.totalPemasukan || 0)}) - Pengeluaran ({formatRupiah(report?.summary.totalPengeluaran || 0)})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0">
              <span className="text-gray-500">Saldo Akhir Berjalan:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                {formatRupiah(report?.summary.saldoAkhir || 0)}
              </span>
            </div>
          </div>

          {/* ── CHARTS SECTION (RECHARTS) ── */}
          <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Utama: Pemasukan vs Pengeluaran */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between flex-wrap gap-2 pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Grafik Pemasukan vs Pengeluaran
                  </CardTitle>
                  <CardDescription>
                    Perbandingan visual kas masuk dan keluar per {report?.chartData?.length && report.chartData.length <= 12 ? 'bulan / periode' : 'hari'}.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 bg-taruna-surface dark:bg-slate-800 p-1 rounded-xl border border-taruna-border dark:border-slate-700">
                  <button
                    onClick={() => setActiveChartTab('bar')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeChartTab === 'bar'
                        ? 'bg-white dark:bg-slate-900 text-taruna-dark dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-taruna-dark'
                    }`}
                  >
                    Batang (Bar)
                  </button>
                  <button
                    onClick={() => setActiveChartTab('area')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeChartTab === 'area'
                        ? 'bg-white dark:bg-slate-900 text-taruna-dark dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-taruna-dark'
                    }`}
                  >
                    Area / Tren
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full pt-4">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2 text-emerald-600" />
                      <span>Memuat grafik keuangan...</span>
                    </div>
                  ) : !report?.chartData || report.chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <span>Tidak ada data untuk periode ini.</span>
                    </div>
                  ) : activeChartTab === 'bar' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          stroke="#cbd5e1"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          stroke="#cbd5e1"
                          tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                          formatter={(value) => <span className="font-semibold text-xs">{value}</span>}
                        />
                        <Bar
                          dataKey="pemasukan"
                          name="Pemasukan (Kas Masuk)"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="pengeluaran"
                          name="Pengeluaran (Kas Keluar)"
                          fill="#f43f5e"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={report.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          stroke="#cbd5e1"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          stroke="#cbd5e1"
                          tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                          formatter={(value) => <span className="font-semibold text-xs">{value}</span>}
                        />
                        <Area
                          type="monotone"
                          dataKey="pemasukan"
                          name="Pemasukan"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorInc)"
                        />
                        <Area
                          type="monotone"
                          dataKey="pengeluaran"
                          name="Pengeluaran"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorExp)"
                        />
                        <Line
                          type="monotone"
                          dataKey="saldo"
                          name="Net Saldo"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Distribusi Pengeluaran & Sumber Pemasukan */}
            <div className="space-y-6">
              {/* Kategori Pengeluaran */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-red-500" />
                    Distribusi Pengeluaran ({report?.categoryBreakdown?.length || 0} Kategori)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {report?.categoryBreakdown && report.categoryBreakdown.length > 0 ? (
                    report.categoryBreakdown.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700 dark:text-slate-300">{cat.name}</span>
                          <span className="font-black text-red-600 dark:text-red-400">
                            {formatRupiah(cat.amount)} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, cat.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">Belum ada pengeluaran pada periode ini.</p>
                  )}
                </CardContent>
              </Card>

              {/* Sumber Pemasukan */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    Sumber Pemasukan ({report?.sourceBreakdown?.length || 0} Sumber)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {report?.sourceBreakdown && report.sourceBreakdown.length > 0 ? (
                    report.sourceBreakdown.map((src) => (
                      <div key={src.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700 dark:text-slate-300">{src.name}</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(src.amount)} ({src.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, src.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">Belum ada pemasukan pada periode ini.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── TRANSACTIONS DETAIL TABLE ── */}
          <Card className="print:hidden">
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Rincian Buku Jurnal Transaksi
                </CardTitle>
                <CardDescription>
                  Semua transaksi dalam periode ini dengan kalkulasi akumulasi saldo berjalan (Running Balance).
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-52">
                  <Input
                    placeholder="Cari transaksi..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                  />
                </div>
                <Badge variant="success" dot>
                  {filteredTransactions.length} Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead className="w-32">Tanggal</TableHead>
                      <TableHead className="w-24 text-center">Jenis</TableHead>
                      <TableHead className="w-36">Kategori / Sumber</TableHead>
                      <TableHead>Keterangan Transaksi</TableHead>
                      <TableHead className="text-right w-36">Nominal</TableHead>
                      <TableHead className="text-right w-40">Saldo Berjalan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                            <span className="text-xs">Memuat rincian transaksi...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-1.5 text-gray-400">
                            <Info className="w-6 h-6" />
                            <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                              Tidak ada transaksi yang cocok
                            </span>
                            <span className="text-xs">Ubah rentang tanggal atau kata kunci pencarian.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((t, idx) => (
                        <TableRow key={t.id} className="hover:bg-taruna-surface/60 dark:hover:bg-slate-800/50">
                          {/* No */}
                          <TableCell className="text-center text-xs text-gray-400 font-medium">
                            {idx + 1}
                          </TableCell>

                          {/* Tanggal */}
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

                          {/* Jenis */}
                          <TableCell className="text-center">
                            <Badge
                              variant={t.type === 'INCOME' ? 'success' : 'accent'}
                              size="sm"
                              className="font-bold uppercase tracking-wider text-[10px]"
                            >
                              {t.type === 'INCOME' ? 'MASUK' : 'KELUAR'}
                            </Badge>
                          </TableCell>

                          {/* Kategori / Sumber */}
                          <TableCell className="whitespace-nowrap">
                            {getSourceOrCategoryBadge(t)}
                          </TableCell>

                          {/* Keterangan */}
                          <TableCell>
                            <p className="font-semibold text-sm text-taruna-dark dark:text-white">
                              {t.description}
                            </p>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">
                              Dicatat: {t.creatorName}
                            </span>
                          </TableCell>

                          {/* Nominal */}
                          <TableCell
                            className={`text-right font-black text-sm whitespace-nowrap ${
                              t.type === 'INCOME'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {t.type === 'INCOME' ? '+' : '-'}
                            {formatRupiah(t.amount)}
                          </TableCell>

                          {/* Saldo Berjalan */}
                          <TableCell className="text-right font-bold text-sm text-taruna-dark dark:text-white whitespace-nowrap bg-taruna-surface/40 dark:bg-slate-900/40">
                            {formatRupiah(t.runningBalance)}
                          </TableCell>
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
    </div>
  );
}
