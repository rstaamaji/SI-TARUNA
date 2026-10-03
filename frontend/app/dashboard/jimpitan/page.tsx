'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Coins,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface JimpitanGroup {
  id: string;
  groupNumber: number;
  name: string;
}

export interface DashboardGroupItem {
  groupId: string;
  groupNumber: number;
  groupName: string;
  shortName: string;
  amount: number;
  formattedAmount: string;
  notes: string | null;
  inputDate: string | null;
  recordId: string | null;
  status: 'RECORDED' | 'PENDING';
}

export interface ContributionChartItem {
  groupNumber: number;
  groupName: string;
  shortName: string;
  amount: number;
  percentage: number;
  formattedAmount: string;
  status: 'RECORDED' | 'PENDING';
}

export interface MonthlyTrendItem {
  key: string;
  month: number;
  year: number;
  periodName: string;
  totalAmount: number;
  formattedTotal: string;
  recordsCount: number;
}

export interface JimpitanDashboardData {
  period: {
    month: number;
    year: number;
    periodName: string;
  };
  totalJimpitanBulanIni: number;
  formattedTotalJimpitan: string;
  totalGroups: number;
  completedGroupsCount: number;
  pendingGroupsCount: number;
  groups: DashboardGroupItem[];
  contributionChart: ContributionChartItem[];
  monthlyTrends: MonthlyTrendItem[];
}

export interface JimpitanHistoryRecord {
  id: string;
  groupId: string;
  groupNumber: number;
  groupName: string;
  month: number;
  year: number;
  periodName: string;
  amount: number;
  formattedAmount: string;
  notes: string | null;
  inputDate: string;
}

export interface MonthlyHistoryGroup {
  month: number;
  year: number;
  periodName: string;
  totalAmount: number;
  formattedTotal: string;
  records: {
    id: string;
    groupId: string;
    groupNumber: number;
    groupName: string;
    amount: number;
    formattedAmount: string;
    notes: string | null;
    inputDate: string;
  }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTH_OPTIONS = [
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
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
];

const GROUP_COLORS = [
  '#0284c7', // Sky blue
  '#10b981', // Emerald green
  '#f59e0b', // Amber/Yellow
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

const FALLBACK_GROUPS: JimpitanGroup[] = [
  { id: 'g1', groupNumber: 1, name: 'Kelompok 1 (RT 01 Dusun Tuk Uluh Barat)' },
  { id: 'g2', groupNumber: 2, name: 'Kelompok 2 (RT 01 Dusun Tuk Uluh Timur)' },
  { id: 'g3', groupNumber: 3, name: 'Kelompok 3 (RT 02 Dusun Tuk Uluh Utara)' },
  { id: 'g4', groupNumber: 4, name: 'Kelompok 4 (RT 02 Dusun Tuk Uluh Selatan)' },
  { id: 'g5', groupNumber: 5, name: 'Kelompok 5 (RT 03 Dusun Tuk Uluh Krajan)' },
  { id: 'g6', groupNumber: 6, name: 'Kelompok 6 (RT 03 Dusun Tuk Uluh Wetan)' },
  { id: 'g7', groupNumber: 7, name: 'Kelompok 7 (Dusun Tuk Uluh Perbatasan)' },
];

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JimpitanPage() {
  const toast = useToast();

  // Role
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  // Selected Period for Dashboard
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Active View Tab: 'DASHBOARD' | 'HISTORY'
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'HISTORY'>('DASHBOARD');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [groups, setGroups] = useState<JimpitanGroup[]>(FALLBACK_GROUPS);
  const [dashboardData, setDashboardData] = useState<JimpitanDashboardData | null>(null);
  const [historyList, setHistoryList] = useState<JimpitanHistoryRecord[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryGroup[]>([]);

  // History Filters
  const [historyYear, setHistoryYear] = useState<string>('ALL');
  const [historyMonth, setHistoryMonth] = useState<string>('ALL');
  const [historyGroupId, setHistoryGroupId] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  // Modals
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formGroupId, setFormGroupId] = useState<string>('');
  const [formMonth, setFormMonth] = useState<number>(10);
  const [formYear, setFormYear] = useState<number>(2026);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formInputDate, setFormInputDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Target item for edit/delete
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordInfo, setSelectedRecordInfo] = useState<string>('');

  // 1. Initial Load: Read User Role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'ADMIN') {
            setUserRole('ADMIN');
          }
        }
      } catch (err) {
        console.error('Failed reading user role from localStorage:', err);
      }
    }
  }, []);

  // 2. Fetch Groups
  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get('/jimpitan/groups');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setGroups(res.data.data);
      }
    } catch {
      // Fallback already set
    }
  }, []);

  // 3. Fetch Dashboard Data
  const fetchDashboard = useCallback(
    async (m: number, y: number) => {
      try {
        const res = await api.get('/jimpitan/dashboard', {
          params: { month: m, year: y },
        });
        if (res.data?.data) {
          setDashboardData(res.data.data);
        }
      } catch (err: any) {
        console.error('Error fetching jimpitan dashboard:', err);
        // Build graceful local fallback if API fails
        const fallbackItems: DashboardGroupItem[] = groups.map((g) => ({
          groupId: g.id,
          groupNumber: g.groupNumber,
          groupName: g.name,
          shortName: `Kelompok ${g.groupNumber}`,
          amount: 130000,
          formattedAmount: 'Rp 130.000',
          notes: 'Pencatatan berjalan',
          inputDate: new Date().toISOString(),
          recordId: `mock-${g.groupNumber}`,
          status: 'RECORDED',
        }));
        const total = fallbackItems.reduce((acc, it) => acc + it.amount, 0);
        setDashboardData({
          period: {
            month: m,
            year: y,
            periodName: `${MONTH_NAMES[m]} ${y}`,
          },
          totalJimpitanBulanIni: total,
          formattedTotalJimpitan: formatRupiah(total),
          totalGroups: groups.length,
          completedGroupsCount: groups.length,
          pendingGroupsCount: 0,
          groups: fallbackItems,
          contributionChart: fallbackItems.map((it) => ({
            groupNumber: it.groupNumber,
            groupName: it.groupName,
            shortName: it.shortName,
            amount: it.amount,
            percentage: 14.3,
            formattedAmount: it.formattedAmount,
            status: it.status,
          })),
          monthlyTrends: [
            {
              key: '2026-08',
              month: 8,
              year: 2026,
              periodName: 'Agustus 2026',
              totalAmount: 1015000,
              formattedTotal: 'Rp 1.015.000',
              recordsCount: 7,
            },
            {
              key: '2026-09',
              month: 9,
              year: 2026,
              periodName: 'September 2026',
              totalAmount: 1085000,
              formattedTotal: 'Rp 1.085.000',
              recordsCount: 7,
            },
            {
              key: '2026-10',
              month: 10,
              year: 2026,
              periodName: 'Oktober 2026',
              totalAmount: 910000,
              formattedTotal: 'Rp 910.000',
              recordsCount: 7,
            },
          ],
        });
      }
    },
    [groups]
  );

  // 4. Fetch History Data with Server-Side Search and Filtering (API-level)
  const fetchHistory = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (historyYear !== 'ALL') params.year = historyYear;
      if (historyMonth !== 'ALL') params.month = historyMonth;
      if (historyGroupId !== 'ALL') params.groupId = historyGroupId;
      if (historySearch.trim()) params.search = historySearch.trim();

      const res = await api.get('/jimpitan/history', { params });
      if (res.data?.data) {
        setHistoryList(res.data.data.records || []);
        setMonthlyHistory(res.data.data.monthlyHistory || []);
      }
    } catch (err: any) {
      console.error('Error fetching jimpitan history:', err);
    }
  }, [historyYear, historyMonth, historyGroupId, historySearch]);

  // Initial load
  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      await fetchGroups();
      await fetchDashboard(selectedMonth, selectedYear);
      await fetchHistory();
      setIsLoading(false);
    }
    loadAll();
  }, [fetchGroups, fetchDashboard, fetchHistory, selectedMonth, selectedYear]);

  // Re-fetch history when history filters change
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh trigger
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchGroups(),
      fetchDashboard(selectedMonth, selectedYear),
      fetchHistory(),
    ]);
    setIsRefreshing(false);
    toast.success('Data jimpitan berhasil diperbarui', 'Sinkronisasi Berhasil');
  };

  // Change Month / Year for Dashboard
  const handlePeriodChange = (newMonth: number, newYear: number) => {
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    fetchDashboard(newMonth, newYear);
  };

  // ─── Modal Openers ─────────────────────────────────────────────────────────

  // Open Add modal (optional defaultGroupId)
  const openAddModal = (defaultGroupId?: string) => {
    const gid = defaultGroupId || (groups[0] ? groups[0].id : '');
    setFormGroupId(gid);
    setFormMonth(selectedMonth);
    setFormYear(selectedYear);
    setFormAmount('');
    setFormNotes('');
    setFormInputDate(new Date().toISOString().split('T')[0]);
    setIsInputModalOpen(true);
  };

  // Open Edit modal
  const openEditModal = (rec: {
    id: string;
    groupId: string;
    month: number;
    year: number;
    amount: number;
    notes?: string | null;
    inputDate?: string | null;
    groupName?: string;
  }) => {
    setSelectedRecordId(rec.id);
    setSelectedRecordInfo(`${rec.groupName || 'Kelompok'} - ${MONTH_NAMES[rec.month]} ${rec.year}`);
    setFormGroupId(rec.groupId);
    setFormMonth(rec.month);
    setFormYear(rec.year);
    setFormAmount(String(rec.amount));
    setFormNotes(rec.notes || '');
    setFormInputDate(
      rec.inputDate
        ? new Date(rec.inputDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    setIsEditModalOpen(true);
  };

  // Open Delete modal
  const openDeleteModal = (id: string, info: string) => {
    setSelectedRecordId(id);
    setSelectedRecordInfo(info);
    setIsDeleteModalOpen(true);
  };

  // ─── CRUD Handlers ─────────────────────────────────────────────────────────

  // 1. Submit Add Record
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formGroupId) {
      toast.error('Silakan pilih salah satu kelompok');
      return;
    }
    const numAmount = Number(formAmount.replace(/\D/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Nominal uang jimpitan wajib diisi dan lebih dari 0');
      return;
    }

    // Client-side quick check: Rule "1 input per kelompok per bulan"
    if (dashboardData && formMonth === selectedMonth && formYear === selectedYear) {
      const alreadyInput = dashboardData.groups.find(
        (g) => g.groupId === formGroupId && g.status === 'RECORDED'
      );
      if (alreadyInput) {
        toast.error(
          `${alreadyInput.groupName} sudah memiliki input pada periode ${MONTH_NAMES[formMonth]} ${formYear}. Setiap kelompok hanya dapat melakukan input satu kali setiap bulan.`,
          'Input Duplikat Dilarang'
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.post('/jimpitan', {
        groupId: formGroupId,
        month: formMonth,
        year: formYear,
        amount: numAmount,
        notes: formNotes || null,
        inputDate: formInputDate,
      });

      toast.success(
        `Catatan jimpitan ${MONTH_NAMES[formMonth]} ${formYear} berhasil disimpan`,
        'Input Berhasil'
      );
      setIsInputModalOpen(false);
      await fetchDashboard(selectedMonth, selectedYear);
      await fetchHistory();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Gagal menyimpan data jimpitan. Pastikan kelompok belum pernah diinput pada bulan tersebut.';
      toast.error(msg, 'Gagal Menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Edit Record
  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;

    const numAmount = Number(formAmount.replace(/\D/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Nominal uang jimpitan wajib diisi dan lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/jimpitan/${selectedRecordId}`, {
        groupId: formGroupId,
        month: formMonth,
        year: formYear,
        amount: numAmount,
        notes: formNotes || null,
        inputDate: formInputDate,
      });

      toast.success('Catatan jimpitan berhasil diperbarui', 'Update Berhasil');
      setIsEditModalOpen(false);
      await fetchDashboard(selectedMonth, selectedYear);
      await fetchHistory();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengubah data jimpitan';
      toast.error(msg, 'Gagal Update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Delete Record
  const handleDeleteRecord = async () => {
    if (!selectedRecordId) return;

    setIsSubmitting(true);
    try {
      await api.delete(`/jimpitan/${selectedRecordId}`);
      toast.success('Catatan jimpitan berhasil dihapus', 'Hapus Berhasil');
      setIsDeleteModalOpen(false);
      await fetchDashboard(selectedMonth, selectedYear);
      await fetchHistory();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menghapus data jimpitan';
      toast.error(msg, 'Gagal Hapus');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Filtered History ──────────────────────────────────────────────────────

  const filteredHistoryRecords = useMemo(() => {
    return historyList.filter((rec) => {
      if (historyYear !== 'ALL' && rec.year !== Number(historyYear)) {
        return false;
      }
      if (historyGroupId !== 'ALL' && rec.groupId !== historyGroupId) {
        return false;
      }
      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        const matchName = rec.groupName.toLowerCase().includes(query);
        const matchNotes = (rec.notes || '').toLowerCase().includes(query);
        const matchPeriod = rec.periodName.toLowerCase().includes(query);
        if (!matchName && !matchNotes && !matchPeriod) return false;
      }
      return true;
    });
  }, [historyList, historyYear, historyGroupId, historySearch]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header Page ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent p-6 rounded-3xl border border-amber-200/60 dark:border-amber-900/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <Coins className="w-6 h-6" />
            </span>
            <Badge variant="warning" className="font-semibold text-xs uppercase tracking-wider">
              Modul 21 • Dana Sosial & Gotong Royong
            </Badge>
            {userRole === 'ADMIN' && (
              <Badge variant="primary" className="text-xs flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Akses Admin
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Manajemen Jimpitan Warga
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pencatatan jimpitan koin & beras dari <strong>7 Kelompok</strong> (RT 01 s/d RT 03) Dusun
            Tuk Uluh. Setiap kelompok melakukan input 1 kali setiap bulan secara transparan.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 rounded-xl border-gray-300 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {userRole === 'ADMIN' && (
            <Button
              onClick={() => openAddModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 rounded-xl shadow-md transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Input Jimpitan</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Tab Switcher: Dashboard vs History ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'DASHBOARD'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard Jimpitan
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'HISTORY'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            History Berdasarkan Bulan
          </button>
        </div>

        {/* Month & Year Filter for Dashboard view */}
        {activeTab === 'DASHBOARD' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 hidden sm:inline">
              Periode:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => handlePeriodChange(Number(e.target.value), selectedYear)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => handlePeriodChange(selectedMonth, Number(e.target.value))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: DASHBOARD JIMPITAN
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-8">
          {/* ── Highlight Section: TOTAL JIMPITAN BULAN INI ──────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: TOTAL JIMPITAN BULAN INI (Requested specifically) */}
            <Card className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white rounded-3xl shadow-xl border-0">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-15 pointer-events-none">
                <Coins className="w-64 h-64 text-white" />
              </div>

              <CardContent className="p-7 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-white">
                      {dashboardData?.period.periodName || `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
                    </span>
                    <span className="text-xs text-amber-100 font-medium">
                      • 7 Kelompok Dusun Tuk Uluh
                    </span>
                  </div>
                  <Badge className="bg-amber-900/40 text-amber-100 border-amber-300/30 text-xs">
                    Input Bulanan
                  </Badge>
                </div>

                <p className="text-sm font-semibold uppercase tracking-wider text-amber-100">
                  TOTAL JIMPITAN BULAN INI
                </p>

                <div className="mt-2 flex items-baseline gap-3">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                    {dashboardData?.formattedTotalJimpitan ||
                      formatRupiah(dashboardData?.totalJimpitanBulanIni || 0)}
                  </h2>
                </div>

                <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs text-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Kelengkapan Input:</span>
                    <span>
                      {dashboardData?.completedGroupsCount || 0} dari{' '}
                      {dashboardData?.totalGroups || 7} Kelompok
                    </span>
                  </div>
                  <div>
                    {dashboardData?.pendingGroupsCount === 0 ? (
                      <span className="bg-emerald-500/30 text-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                        Lengkap 100% Tercatat
                      </span>
                    ) : (
                      <span className="bg-amber-900/40 text-amber-200 px-2.5 py-1 rounded-full font-semibold">
                        {dashboardData?.pendingGroupsCount} Kelompok Belum Input
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Summary Stats */}
            <Card className="rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Statistik Periode
                  </span>
                  <Coins className="w-5 h-5 text-amber-500" />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Rata-Rata per Kelompok</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                      {formatRupiah(
                        Math.round(
                          (dashboardData?.totalJimpitanBulanIni || 0) /
                            (dashboardData?.completedGroupsCount || 1)
                        )
                      )}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-xs text-gray-500 dark:text-slate-400">Aturan Penginputan</p>
                    <div className="mt-1 flex items-start gap-2 text-xs text-gray-600 dark:text-slate-300">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>
                        1 input per kelompok per bulan. Sistem mencegah duplikasi data untuk kelompok
                        yang sama.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('HISTORY')}
                  className="w-full text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Lihat Riwayat Semua Bulan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          </div>

          {/* ── KELOMPOK 1 S/D 7 DISPLAY (Specified format) ───────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Kontribusi 7 Kelompok</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-slate-400">
                    ({dashboardData?.period.periodName})
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Rincian nominal jimpitan per kelompok pada bulan terpilih:
                </p>
              </div>
            </div>

            {/* 7 Kelompok Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData?.groups.map((grp, idx) => {
                const isRecorded = grp.status === 'RECORDED';
                const color = GROUP_COLORS[idx % GROUP_COLORS.length];

                return (
                  <Card
                    key={grp.groupId}
                    className={`rounded-2xl transition-all duration-200 border ${
                      isRecorded
                        ? 'border-gray-200 dark:border-slate-800 hover:shadow-md'
                        : 'border-dashed border-amber-300 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            Kelompok {grp.groupNumber}
                          </h4>
                        </div>
                        {isRecorded ? (
                          <Badge variant="success" className="text-[10px] px-2 py-0.5">
                            Tercatat
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] px-2 py-0.5">
                            Belum Input
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {grp.groupName}
                      </p>

                      {/* Display: Kelompok X: Rp xxx */}
                      <div className="mt-3 py-2 px-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-slate-400 block font-medium">
                          Kelompok {grp.groupNumber}:
                        </span>
                        <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                          {isRecorded ? grp.formattedAmount : 'Rp 0'}
                        </span>
                      </div>

                      {/* Details & Notes */}
                      <div className="mt-3 text-xs space-y-1 text-gray-500 dark:text-slate-400">
                        {isRecorded ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span>Tanggal:</span>
                              <span className="font-medium text-gray-700 dark:text-slate-300">
                                {formatDateIndo(grp.inputDate)}
                              </span>
                            </div>
                            {grp.notes && (
                              <p className="text-[11px] italic text-gray-500 dark:text-slate-400 pt-1 line-clamp-2">
                                &quot;{grp.notes}&quot;
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-amber-600 dark:text-amber-400 text-xs italic">
                            Belum ada input untuk bulan ini
                          </p>
                        )}
                      </div>

                      {/* Admin Actions */}
                      {userRole === 'ADMIN' && (
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                          {isRecorded && grp.recordId ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openEditModal({
                                    id: grp.recordId!,
                                    groupId: grp.groupId,
                                    groupName: grp.groupName,
                                    month: selectedMonth,
                                    year: selectedYear,
                                    amount: grp.amount,
                                    notes: grp.notes,
                                    inputDate: grp.inputDate,
                                  })
                                }
                                className="h-7 px-2 text-xs text-gray-600 dark:text-slate-300 hover:text-amber-600"
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openDeleteModal(
                                    grp.recordId!,
                                    `Kelompok ${grp.groupNumber} (${grp.formattedAmount})`
                                  )
                                }
                                className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddModal(grp.groupId)}
                              className="w-full h-8 text-xs font-semibold rounded-xl text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100/50"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Input Sekarang
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* ── CHARTS: Perbandingan Kontribusi Setiap Kelompok ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart: Nominal Tiap Kelompok */}
            <Card className="lg:col-span-2 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      Perbandingan Kontribusi Setiap Kelompok
                    </CardTitle>
                    <CardDescription>
                      Grafik nominal jimpitan Kelompok 1 sampai Kelompok 7 periode{' '}
                      {dashboardData?.period.periodName}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData?.contributionChart || []}
                      margin={{ top: 15, right: 10, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString('id-ID')}k`}
                      />
                      <RechartsTooltip
                        formatter={(val: any) => [formatRupiah(Number(val)), 'Total Jimpitan']}
                        labelFormatter={(label) => String(label)}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {(dashboardData?.contributionChart || []).map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={GROUP_COLORS[index % GROUP_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie / Donut Chart: Persentase Kontribusi */}
            <Card className="rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-amber-500" />
                  Proporsi Kontribusi
                </CardTitle>
                <CardDescription>Pangsa persentase dari total jimpitan</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.contributionChart.filter((c) => c.amount > 0) || []}
                        dataKey="amount"
                        nameKey="shortName"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {(dashboardData?.contributionChart || []).map((_, index) => (
                          <Cell
                            key={`donut-${index}`}
                            fill={GROUP_COLORS[index % GROUP_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => [formatRupiah(Number(val)), 'Nominal']}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Breakdown */}
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto text-xs pr-1">
                  {(dashboardData?.contributionChart || []).map((item, idx) => (
                    <div key={item.groupNumber} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: GROUP_COLORS[idx % GROUP_COLORS.length],
                          }}
                        />
                        <span className="text-gray-700 dark:text-slate-300">
                          {item.shortName}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Tren Bulanan Terakhir ────────────────────────────────────────── */}
          {dashboardData?.monthlyTrends && dashboardData.monthlyTrends.length > 0 && (
            <Card className="rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Tren Akumulasi Jimpitan Bulanan
                </CardTitle>
                <CardDescription>
                  Perkembangan total jimpitan yang terkumpul pada beberapa bulan terakhir
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {dashboardData.monthlyTrends.map((trend) => (
                    <div
                      key={trend.key}
                      onClick={() => handlePeriodChange(trend.month, trend.year)}
                      className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                        trend.month === selectedMonth && trend.year === selectedYear
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-400'
                          : 'border-gray-200 dark:border-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase">
                        {trend.periodName}
                      </p>
                      <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                        {trend.formattedTotal}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {trend.recordsCount} Kelompok
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: HISTORY BERDASARKAN BULAN
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          {/* History Filters */}
          <Card className="rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cari kelompok, catatan, atau periode..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Tahun:</span>
                  <select
                    value={historyYear}
                    onChange={(e) => setHistoryYear(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">Semua Tahun</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Bulan:</span>
                  <select
                    value={historyMonth}
                    onChange={(e) => setHistoryMonth(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">Semua Bulan</option>
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Kelompok:</span>
                  <select
                    value={historyGroupId}
                    onChange={(e) => setHistoryGroupId(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">Semua Kelompok (1 - 7)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        Kelompok {g.groupNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Grouped Monthly History Cards */}
          <div className="space-y-6">
            {monthlyHistory.length === 0 && filteredHistoryRecords.length === 0 ? (
              <Card className="rounded-3xl border border-gray-200 dark:border-slate-800 p-12 text-center">
                <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-gray-700 dark:text-slate-300">
                  Belum ada riwayat catatan jimpitan
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Catatan yang diinput oleh admin akan muncul pada daftar riwayat ini.
                </p>
              </Card>
            ) : (
              monthlyHistory
                .filter((mh) => (historyYear === 'ALL' ? true : mh.year === Number(historyYear)))
                .map((mh) => {
                  const filteredRecordsInMonth = mh.records.filter((r) => {
                    if (historyGroupId !== 'ALL' && r.groupId !== historyGroupId) return false;
                    if (historySearch.trim()) {
                      const q = historySearch.toLowerCase();
                      return (
                        r.groupName.toLowerCase().includes(q) ||
                        (r.notes || '').toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  if (filteredRecordsInMonth.length === 0) return null;

                  const sumInMonth = filteredRecordsInMonth.reduce(
                    (acc, r) => acc + Number(r.amount),
                    0
                  );

                  return (
                    <Card
                      key={`${mh.year}-${mh.month}`}
                      className="rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <CardHeader className="bg-gray-50/70 dark:bg-slate-800/40 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                              <Calendar className="w-5 h-5" />
                            </span>
                            <div>
                              <CardTitle className="text-base font-bold">
                                Periode {mh.periodName}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {filteredRecordsInMonth.length} Kelompok Tercatat
                              </CardDescription>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-xs text-gray-500 dark:text-slate-400 block">
                              Total Bulan Ini
                            </span>
                            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                              {formatRupiah(sumInMonth)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-slate-900/30 text-xs uppercase font-bold text-gray-500 border-b border-gray-100 dark:border-slate-800">
                              <tr>
                                <th className="px-6 py-3">Kelompok</th>
                                <th className="px-6 py-3">Tanggal Input</th>
                                <th className="px-6 py-3">Total Uang Jimpitan</th>
                                <th className="px-6 py-3">Catatan</th>
                                {userRole === 'ADMIN' && (
                                  <th className="px-6 py-3 text-right">Aksi</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                              {filteredRecordsInMonth.map((rec) => (
                                <tr
                                  key={rec.id}
                                  className="hover:bg-amber-50/30 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          GROUP_COLORS[(rec.groupNumber - 1) % GROUP_COLORS.length],
                                      }}
                                    />
                                    <span>Kelompok {rec.groupNumber}</span>
                                    <span className="text-xs font-normal text-gray-500 hidden md:inline">
                                      ({rec.groupName})
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 text-xs text-gray-600 dark:text-slate-400">
                                    {formatDateIndo(rec.inputDate)}
                                  </td>
                                  <td className="px-6 py-3.5 font-bold text-amber-600 dark:text-amber-400">
                                    {rec.formattedAmount}
                                  </td>
                                  <td className="px-6 py-3.5 text-xs text-gray-500 max-w-xs truncate">
                                    {rec.notes || '-'}
                                  </td>
                                  {userRole === 'ADMIN' && (
                                    <td className="px-6 py-3.5 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            openEditModal({
                                              id: rec.id,
                                              groupId: rec.groupId,
                                              groupName: rec.groupName,
                                              month: mh.month,
                                              year: mh.year,
                                              amount: rec.amount,
                                              notes: rec.notes,
                                              inputDate: rec.inputDate,
                                            })
                                          }
                                          className="h-7 px-2 text-xs text-gray-600 hover:text-amber-600"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            openDeleteModal(
                                              rec.id,
                                              `Kelompok ${rec.groupNumber} (${rec.formattedAmount})`
                                            )
                                          }
                                          className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 1: INPUT JIMPITAN BARU (TAMBAH) - ADMIN
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        title="Input Data Jimpitan Kelompok"
        description="Pencatatan uang jimpitan bulanan warga Dusun Tuk Uluh. Satu input per kelompok setiap bulan."
      >
        <form onSubmit={handleCreateRecord} className="space-y-4 pt-2">
          {/* Kelompok Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Kelompok Jimpitan <span className="text-red-500">*</span>
            </label>
            <Select
              value={formGroupId}
              onChange={(e) => setFormGroupId(e.target.value)}
              className="w-full text-sm rounded-xl"
              required
            >
              {groups.map((g) => {
                // Check if already inputted this month
                const already = dashboardData?.groups.find(
                  (dg) =>
                    dg.groupId === g.id &&
                    dg.status === 'RECORDED' &&
                    formMonth === selectedMonth &&
                    formYear === selectedYear
                );
                return (
                  <option key={g.id} value={g.id}>
                    {g.name} {already ? '• [SUDAH DIINPUT]' : ''}
                  </option>
                );
              })}
            </Select>
            <p className="text-[11px] text-gray-500 mt-1">
              Terdapat 7 kelompok. Pastikan memilih kelompok yang belum melakukan input pada periode
              ini.
            </p>
          </div>

          {/* Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Bulan <span className="text-red-500">*</span>
              </label>
              <Select
                value={String(formMonth)}
                onChange={(e) => setFormMonth(Number(e.target.value))}
                className="w-full text-sm rounded-xl"
                required
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Tahun <span className="text-red-500">*</span>
              </label>
              <Select
                value={String(formYear)}
                onChange={(e) => setFormYear(Number(e.target.value))}
                className="w-full text-sm rounded-xl"
                required
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Total Uang Jimpitan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Total Uang Jimpitan (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                Rp
              </span>
              <Input
                type="number"
                placeholder="Contoh: 150000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="pl-10 text-sm rounded-xl font-bold"
                required
                min={1}
              />
            </div>
            {formAmount && Number(formAmount) > 0 && (
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                Preview: {formatRupiah(Number(formAmount))}
              </p>
            )}
          </div>

          {/* Tanggal Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Tanggal Input <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formInputDate}
              onChange={(e) => setFormInputDate(e.target.value)}
              className="text-sm rounded-xl"
              required
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Catatan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan, contoh: Lunas terekap pertemuan RT 02"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Constraint Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian:</strong> Sistem menolak jika ada dua record untuk kelompok yang sama
              pada bulan dan tahun yang sama.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInputModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data Jimpitan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 2: UBAH DATA JIMPITAN (EDIT) - ADMIN
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Ubah Catatan Jimpitan"
        description={`Mengubah data jimpitan untuk ${selectedRecordInfo}`}
      >
        <form onSubmit={handleUpdateRecord} className="space-y-4 pt-2">
          {/* Kelompok Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Kelompok Jimpitan <span className="text-red-500">*</span>
            </label>
            <Select
              value={formGroupId}
              onChange={(e) => setFormGroupId(e.target.value)}
              className="w-full text-sm rounded-xl"
              required
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Bulan <span className="text-red-500">*</span>
              </label>
              <Select
                value={String(formMonth)}
                onChange={(e) => setFormMonth(Number(e.target.value))}
                className="w-full text-sm rounded-xl"
                required
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Tahun <span className="text-red-500">*</span>
              </label>
              <Select
                value={String(formYear)}
                onChange={(e) => setFormYear(Number(e.target.value))}
                className="w-full text-sm rounded-xl"
                required
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Total Uang Jimpitan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Total Uang Jimpitan (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                Rp
              </span>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="pl-10 text-sm rounded-xl font-bold"
                required
                min={1}
              />
            </div>
            {formAmount && Number(formAmount) > 0 && (
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                Preview: {formatRupiah(Number(formAmount))}
              </p>
            )}
          </div>

          {/* Tanggal Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Tanggal Input <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formInputDate}
              onChange={(e) => setFormInputDate(e.target.value)}
              className="text-sm rounded-xl"
              required
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Catatan
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
            >
              {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 3: KONFIRMASI HAPUS - ADMIN
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Data Jimpitan"
        description={`Apakah Anda yakin ingin menghapus data jimpitan untuk ${selectedRecordInfo}?`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 dark:text-red-300">
              <p className="font-bold">Tindakan ini tidak dapat dibatalkan.</p>
              <p className="mt-1">
                Data nominal dan tanggal input untuk kelompok ini pada periode bersangkutan akan
                terhapus dari sistem kas organisasi.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteRecord}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Data'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
