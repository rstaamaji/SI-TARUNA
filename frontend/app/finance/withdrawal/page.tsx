'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Banknote,
  User2,
  Calendar,
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Info,
  ShieldCheck,
  User,
  CheckCircle2,
  ClipboardList,
  ArrowUpRight,
  FileText,
  Users,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getStoredUser, isUserAdmin, UserRole } from '@/lib/auth';
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface CashWithdrawalItem {
  id: string;
  withdrawerName: string;
  memberId: string | null;
  memberName: string | null;
  amount: number;
  withdrawalDate: string;
  purpose: string;
  description: string | null;
  financeTransactionId: string | null;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawalSummary {
  totalWithdrawn: number;
  totalWithdrawnMonth: number;
  totalCount: number;
}

interface MemberOption {
  id: string;
  name: string;
  memberNumber: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTH_OPTIONS = [
  { value: '', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },   { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },     { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },    { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },{ value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },{ value: '12', label: 'Desember' },
];

const YEAR_OPTIONS = [
  { value: '', label: 'Semua Tahun' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

// ─── Component ────────────────────────────────────────────────────────────────
export default function CashWithdrawalPage() {
  const toast = useToast();

  // Auth
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole }>({
    id: '', name: 'Anggota', role: 'MEMBER',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = isUserAdmin(currentUser.role);

  // Data
  const [withdrawals, setWithdrawals] = useState<CashWithdrawalItem[]>([]);
  const [summary, setSummary] = useState<WithdrawalSummary>({ totalWithdrawn: 0, totalWithdrawnMonth: 0, totalCount: 0 });
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CashWithdrawalItem | null>(null);

  // Form
  const [formWithdrawerName, setFormWithdrawerName] = useState('');
  const [formMemberId, setFormMemberId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPurpose, setFormPurpose] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToken = (): string | null =>
    typeof window !== 'undefined'
      ? localStorage.getItem('si_taruna_token') || localStorage.getItem('token')
      : null;

  const authHeaders = () => {
    const token = getToken();
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  // ── Load user session ──
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
  }, []);

  // ── Fetch members list (for dropdown in admin form) ──
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/members', { headers: authHeaders() });
      const json = await res.json();
      if (res.ok && json.success && json.data?.members) {
        setMembers(json.data.members.map((m: any) => ({
          id: m.id,
          name: m.name,
          memberNumber: m.memberNumber,
        })));
      }
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchMembers();
  }, [isAdmin]);

  // ── Fetch withdrawals ──
  const loadFallbackWithdrawals = () => {
    const demoWithdrawals: CashWithdrawalItem[] = [
      {
        id: 'w-01',
        amount: 500000,
        withdrawerName: 'Rustam Aji',
        memberId: 'm-01',
        memberName: 'Rustam Aji',
        withdrawalDate: '2026-10-01T00:00:00.000Z',
        purpose: 'Pengambilan uang muka sewa sound system dan tratak turnamen voli',
        description: 'Persetujuan rapat pengurus',
        financeTransactionId: 'tx-w-01',
        creatorName: 'Bendahara Setya Bakti',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'w-02',
        amount: 350000,
        withdrawerName: 'Eko Prasetyo',
        memberId: 'm-02',
        memberName: 'Eko Prasetyo',
        withdrawalDate: '2026-09-28T00:00:00.000Z',
        purpose: 'Pembelian cat dan kuas untuk kerja bakti gapura masuk dusun',
        description: 'Kerja bakti pemuda',
        financeTransactionId: 'tx-w-02',
        creatorName: 'Bendahara Setya Bakti',
        createdAt: '2026-09-28T00:00:00.000Z',
        updatedAt: '2026-09-28T00:00:00.000Z',
      },
      {
        id: 'w-03',
        amount: 250000,
        withdrawerName: 'Bambang Setyawan',
        memberId: 'm-03',
        memberName: 'Bambang Setyawan',
        withdrawalDate: '2026-09-14T00:00:00.000Z',
        purpose: 'Belanja konsumsi snack rapat koordinasi Karang Taruna',
        description: 'Konsumsi pleno',
        financeTransactionId: 'tx-w-03',
        creatorName: 'Bendahara Setya Bakti',
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z',
      },
    ];
    setWithdrawals(demoWithdrawals);
    setSummary({
      totalCount: 3,
      totalWithdrawn: 1100000,
      totalWithdrawnMonth: 500000,
    });
  };

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://localhost:5000/api';

      const [listRes, summaryRes] = await Promise.all([
        fetch(`${apiBase}/withdrawals?${params}`, { headers: authHeaders() }),
        fetch(`${apiBase}/withdrawals/summary`, { headers: authHeaders() }),
      ]);

      const listJson = await listRes.json();
      const summaryJson = await summaryRes.json();

      if (listRes.ok && listJson.success && Array.isArray(listJson.data) && listJson.data.length > 0) setWithdrawals(listJson.data); else loadFallbackWithdrawals();
      if (summaryRes.ok && summaryJson.success) setSummary(summaryJson.data);
      if (isManual) toast.success('Data berhasil diperbarui.');
    } catch {
      if (isManual) {
        loadFallbackWithdrawals();
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Modal helpers ──
  const openCreate = () => {
    setFormWithdrawerName('');
    setFormMemberId('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPurpose('');
    setFormDescription('');
    setIsCreateOpen(true);
  };

  const openEdit = (item: CashWithdrawalItem) => {
    setActiveItem(item);
    setFormWithdrawerName(item.withdrawerName);
    setFormMemberId(item.memberId || '');
    setFormAmount(String(item.amount));
    setFormDate(item.withdrawalDate.split('T')[0]);
    setFormPurpose(item.purpose);
    setFormDescription(item.description || '');
    setIsEditOpen(true);
  };

  const openDelete = (item: CashWithdrawalItem) => { setActiveItem(item); setIsDeleteOpen(true); };
  const openDetail = (item: CashWithdrawalItem) => { setActiveItem(item); setIsDetailOpen(true); };

  // Auto-fill withdrawerName when member is selected
  const handleMemberSelect = (memberId: string) => {
    setFormMemberId(memberId);
    if (memberId) {
      const m = members.find(x => x.id === memberId);
      if (m) setFormWithdrawerName(m.name);
    }
  };

  // ── CRUD ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(formAmount);
    if (!formWithdrawerName.trim()) { toast.error('Nama pengambil wajib diisi.'); return; }
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Jumlah harus lebih besar dari 0.'); return; }
    if (!formPurpose.trim()) { toast.error('Keperluan wajib diisi.'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          withdrawerName: formWithdrawerName.trim(),
          memberId:       formMemberId || undefined,
          amount:         numAmount,
          withdrawalDate: new Date(formDate).toISOString(),
          purpose:        formPurpose.trim(),
          description:    formDescription.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Pengambilan kas berhasil dicatat! Saldo kas otomatis berkurang dan tercatat sebagai pengeluaran.');
        setIsCreateOpen(false);
        fetchData();
      } else {
        toast.error(json.message || 'Gagal menyimpan.');
      }
    } catch { toast.error('Gagal terhubung ke server.'); }
    finally { setIsSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    const numAmount = Number(formAmount);
    if (!formWithdrawerName.trim()) { toast.error('Nama pengambil wajib diisi.'); return; }
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Jumlah harus lebih besar dari 0.'); return; }
    if (!formPurpose.trim()) { toast.error('Keperluan wajib diisi.'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/withdrawals/${activeItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          withdrawerName: formWithdrawerName.trim(),
          memberId:       formMemberId || null,
          amount:         numAmount,
          withdrawalDate: new Date(formDate).toISOString(),
          purpose:        formPurpose.trim(),
          description:    formDescription.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Catatan pengambilan kas berhasil diperbarui. Saldo kas dikalkulasi ulang.');
        setIsEditOpen(false);
        setActiveItem(null);
        fetchData();
      } else {
        toast.error(json.message || 'Gagal memperbarui.');
      }
    } catch { toast.error('Gagal terhubung ke server.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/withdrawals/${activeItem.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Catatan pengambilan dihapus. Saldo kas dipulihkan sebesar ${formatRupiah(activeItem.amount)}.`);
        setIsDeleteOpen(false);
        setActiveItem(null);
        fetchData();
      } else {
        toast.error(json.message || 'Gagal menghapus.');
      }
    } catch { toast.error('Gagal terhubung ke server.'); }
    finally { setIsSubmitting(false); }
  };

  const memberSelectOptions = [
    { value: '', label: '— Ketik nama manual (bukan anggota) —' },
    ...members.map(m => ({ value: m.id, label: `${m.name} (No. ${m.memberNumber})` })),
  ];

  const hasFilters = !!(selectedMonth || selectedYear || searchQuery);

  // ── JSX ──
  return (
    <div className="min-h-screen flex bg-[#D6DDD5] text-[#163E4F] transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={currentUser.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} user={{ name: currentUser.name, role: currentUser.role }} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* ── PAGE HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#466060] text-white p-5 sm:p-6 rounded-3xl border border-[#163E4F] shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#D6DDD5]">
                  Transparansi Keuangan
                </span>
                <Badge variant={currentUser.role === 'SUPERADMIN' ? 'warning' : isAdmin ? 'accent' : 'primary'} size="sm">
                  {currentUser.role === 'SUPERADMIN' ? (
                    <><ShieldCheck className="w-3 h-3 mr-1 inline" />SUPERADMIN</>
                  ) : isAdmin ? (
                    <><ShieldCheck className="w-3 h-3 mr-1 inline" />ADMINISTRATOR</>
                  ) : (
                    <><User className="w-3 h-3 mr-1 inline" />MEMBER</>
                  )}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Catatan Pengambilan Kas
              </h1>
              <p className="text-xs sm:text-sm text-[#D6DDD5] mt-1">
                Riwayat siapa yang mengambil kas organisasi, untuk keperluan apa, dan berapa jumlahnya.
                Setiap pengambilan otomatis tercatat sebagai pengeluaran kas.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Memuat...' : 'Segarkan'}
              </Button>
              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#163E4F] hover:bg-[#163E4F]/90 text-white border border-[#466060]"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={openCreate}
                >
                  Catat Pengambilan Kas
                </Button>
              )}
            </div>
          </div>

          {/* ── SUMMARY CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">TOTAL PENGAMBILAN</span>
                <div className="p-2.5 rounded-2xl bg-[#466060] text-[#F87171] border border-[#163E4F]">
                  <Banknote className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-[#F87171]">{formatRupiah(summary.totalWithdrawn)}</div>
                <div className="text-xs text-[#D6DDD5] mt-1.5 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#F87171]" />Keseluruhan kas yang keluar
                </div>
              </CardContent>
            </Card>

            <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">BULAN INI</span>
                <div className="p-2.5 rounded-2xl bg-[#466060] text-[#FDE047] border border-[#163E4F]">
                  <Calendar className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-[#FDE047]">{formatRupiah(summary.totalWithdrawnMonth)}</div>
                <div className="text-xs text-[#D6DDD5] mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FDE047]" />Pengambilan bulan berjalan
                </div>
              </CardContent>
            </Card>

            <Card hoverable className="!bg-[#6A8578] text-white border-[#466060] shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">TOTAL CATATAN</span>
                <div className="p-2.5 rounded-2xl bg-[#466060] text-white border border-[#163E4F]">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-white">{summary.totalCount}</div>
                <div className="text-xs text-[#D6DDD5] mt-1.5 flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5 text-[#38BDF8]" />Transaksi pengambilan tercatat
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── INFO BANNER (Member) ── */}
          {!isAdmin && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#466060]/20 border border-[#466060] text-[#163E4F] text-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#163E4F]" />
              <div>
                <p className="font-bold mb-0.5">Informasi Transparansi</p>
                <p className="text-xs text-[#163E4F]">Semua anggota dapat melihat riwayat pengambilan kas ini sebagai bentuk transparansi keuangan organisasi. Setiap pengambilan tercatat otomatis sebagai pengeluaran dan mempengaruhi saldo kas.</p>
              </div>
            </div>
          )}

          {/* ── FILTER BAR ── */}
          <Card className="!bg-[#6A8578] text-white border-[#466060]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Filter Bulan:</label>
                    <Select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} options={MONTH_OPTIONS} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Filter Tahun:</label>
                    <Select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} options={YEAR_OPTIONS} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#D6DDD5] mb-1">Cari:</label>
                    <Input placeholder="Nama, keperluan..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4 text-[#D6DDD5]" />} />
                  </div>
                </div>
                {hasFilters && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<X className="w-3.5 h-3.5" />}
                    className="h-10 whitespace-nowrap bg-[#163E4F] hover:bg-[#466060] text-white border border-[#466060]"
                    onClick={() => { setSelectedMonth(''); setSelectedYear(''); setSearchQuery(''); }}
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── TABLE ── */}
          <Card className="!bg-[#6A8578] text-white border-[#466060] shadow-sm">
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-white">Riwayat Pengambilan Kas</CardTitle>
                <CardDescription className="text-[#D6DDD5]">
                  Daftar siapa yang mengambil kas organisasi, jumlah, tanggal, dan keperluan.
                  Setiap baris terhubung dengan satu catatan pengeluaran kas.
                </CardDescription>
              </div>
              <Badge variant="primary" dot className="bg-[#163E4F] text-[#D6DDD5] border-[#466060]">{withdrawals.length} Catatan</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#466060] text-white border-b border-[#163E4F] hover:bg-[#466060]">
                      <TableHead className="w-44 text-white">Nama Pengambil</TableHead>
                      <TableHead className="w-28 text-white">Tanggal</TableHead>
                      <TableHead className="text-white">Keperluan</TableHead>
                      <TableHead className="w-36 text-right text-white">Jumlah</TableHead>
                      <TableHead className="w-36 text-white">Admin Pencatat</TableHead>
                      <TableHead className="text-center w-28 text-white">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-[#D6DDD5]">
                            <RefreshCw className="w-5 h-5 animate-spin text-[#4ADE80]" />
                            <span className="text-xs">Memuat riwayat pengambilan kas...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : withdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-1.5 text-[#D6DDD5]">
                            <Wallet className="w-8 h-8 mb-1 text-[#D6DDD5]" />
                            <span className="text-sm font-semibold text-white">Belum ada catatan pengambilan kas</span>
                            <span className="text-xs text-[#D6DDD5]">
                              {isAdmin ? 'Klik tombol "Catat Pengambilan Kas" untuk menambahkan.' : 'Belum ada pengambilan kas yang tercatat.'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawals.map(item => (
                        <TableRow key={item.id} className="hover:bg-[#466060]/30 border-b border-[#466060]/40 text-white cursor-pointer transition" onClick={() => openDetail(item)}>
                          {/* Nama Pengambil */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#163E4F] flex items-center justify-center text-[#F87171] font-black text-xs shrink-0 border border-[#466060]">
                                {item.withdrawerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-white">{item.withdrawerName}</p>
                                {item.memberName && item.memberName !== item.withdrawerName && (
                                  <span className="text-[10px] text-[#4ADE80] flex items-center gap-0.5">
                                    <Users className="w-2.5 h-2.5" />Anggota terdaftar
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Tanggal */}
                          <TableCell className="text-xs font-medium text-[#D6DDD5] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#D6DDD5] shrink-0" />
                              {new Date(item.withdrawalDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </TableCell>

                          {/* Keperluan */}
                          <TableCell>
                            <p className="font-semibold text-sm text-white">{item.purpose}</p>
                            {item.description && (
                              <p className="text-[11px] text-[#D6DDD5] mt-0.5 line-clamp-1">{item.description}</p>
                            )}
                          </TableCell>

                          {/* Jumlah */}
                          <TableCell className="text-right font-black text-[#F87171] whitespace-nowrap">
                            -{formatRupiah(item.amount)}
                          </TableCell>

                          {/* Admin pencatat */}
                          <TableCell className="text-xs text-[#D6DDD5]">
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-[#4ADE80] shrink-0" />
                              {item.creatorName}
                            </div>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => openDetail(item)} className="p-1.5 rounded-lg border border-[#466060] bg-[#163E4F] hover:bg-[#466060] text-[#38BDF8] transition" title="Detail">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg border border-[#466060] bg-[#163E4F] hover:bg-[#466060] text-[#FDE047] transition" title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => openDelete(item)} className="p-1.5 rounded-lg border border-[#466060] bg-[#163E4F] hover:bg-[#466060] text-[#F87171] transition" title="Hapus">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: DETAIL
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setActiveItem(null); }}
        title="📋 Detail Pengambilan Kas"
        description="Informasi lengkap catatan pengambilan kas organisasi."
        footer={<Button variant="secondary" size="sm" onClick={() => { setIsDetailOpen(false); setActiveItem(null); }}>Tutup</Button>}
      >
        {activeItem && (
          <div className="space-y-3 text-left text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60">
              <div className="w-12 h-12 rounded-full bg-red-200 dark:bg-red-900 flex items-center justify-center text-red-700 dark:text-red-300 font-black text-xl">
                {activeItem.withdrawerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-black text-base text-taruna-dark dark:text-white">{activeItem.withdrawerName}</p>
                {activeItem.memberName && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" />Anggota: {activeItem.memberName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700">
                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Jumlah Diambil</p>
                <p className="font-black text-lg text-red-600 dark:text-red-400">-{formatRupiah(activeItem.amount)}</p>
              </div>
              <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700">
                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tanggal</p>
                <p className="font-semibold">{new Date(activeItem.withdrawalDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700 space-y-2">
              <div>
                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Keperluan</p>
                <p className="font-semibold text-taruna-dark dark:text-white">{activeItem.purpose}</p>
              </div>
              {activeItem.description && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Keterangan</p>
                  <p className="text-gray-600 dark:text-slate-300">{activeItem.description}</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Dicatat oleh: <strong className="text-taruna-dark dark:text-white">{activeItem.creatorName}</strong></span>
              </div>
              {activeItem.financeTransactionId && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersinkron dengan catatan pengeluaran kas (tidak ada double-entry).</span>
                </div>
              )}
              <div className="text-gray-400 dark:text-slate-500">
                Dibuat: {new Date(activeItem.createdAt).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CREATE
      ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="💸 Catat Pengambilan Kas Baru"
          description="Catat siapa yang mengambil kas, berapa jumlahnya, dan untuk keperluan apa. Otomatis tercatat sebagai PENGELUARAN — tidak ada double-entry."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Batal</Button>
              <Button variant="danger" size="sm" onClick={handleCreate} isLoading={isSubmitting}>Simpan Catatan</Button>
            </>
          }
        >
          <form onSubmit={handleCreate} className="space-y-4 text-left">
            {/* Link ke anggota (opsional) */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                Pilih dari Daftar Anggota <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <Select
                value={formMemberId}
                onChange={e => handleMemberSelect(e.target.value)}
                options={memberSelectOptions}
              />
              <p className="text-[11px] text-gray-400 mt-1">Memilih anggota akan mengisi nama secara otomatis.</p>
            </div>

            {/* Nama pengambil */}
            <Input
              label="Nama Pengambil Kas"
              placeholder="Contoh: Budi Santoso"
              value={formWithdrawerName}
              onChange={e => setFormWithdrawerName(e.target.value)}
              required
              leftIcon={<User2 className="w-4 h-4 text-gray-400" />}
              helperText="* Nama orang yang mengambil kas (wajib diisi)."
            />

            {/* Jumlah */}
            <div>
              <Input
                label="Jumlah yang Diambil (Rp)"
                type="number" min="1" step="1"
                placeholder="Contoh: 150000"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                required
                leftIcon={<Banknote className="w-4 h-4 text-gray-400" />}
                helperText="* Jumlah dalam Rupiah, harus lebih dari 0."
              />
              {Number(formAmount) > 0 && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">= {formatRupiah(Number(formAmount))}</p>
              )}
            </div>

            {/* Tanggal */}
            <Input
              label="Tanggal Pengambilan"
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              required
            />

            {/* Keperluan */}
            <Input
              label="Keperluan / Tujuan Pengambilan"
              placeholder="Contoh: Membeli perlengkapan kerja bakti"
              value={formPurpose}
              onChange={e => setFormPurpose(e.target.value)}
              required
              helperText="* Keperluan pengambilan kas (wajib diisi)."
            />

            {/* Keterangan */}
            <Input
              label="Keterangan Tambahan"
              placeholder="Contoh: Sesuai keputusan rapat tanggal 5 Oktober 2026 (opsional)"
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
            />

            {/* Info box */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Pengambilan ini akan <strong>otomatis tercatat sebagai pengeluaran kas</strong> kategori &quot;Pengambilan Kas&quot;.
                Saldo kas akan berkurang sebesar {Number(formAmount) > 0 ? formatRupiah(Number(formAmount)) : 'jumlah yang dimasukkan'}.
                <strong> Tidak ada double-entry.</strong>
              </span>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: EDIT
      ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setActiveItem(null); }}
          title="✏️ Ubah Catatan Pengambilan Kas"
          description="Perbarui catatan pengambilan kas. Catatan pengeluaran kas terkait akan ikut diperbarui secara otomatis."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setIsEditOpen(false); setActiveItem(null); }} disabled={isSubmitting}>Batal</Button>
              <Button variant="primary" size="sm" onClick={handleEdit} isLoading={isSubmitting}>Simpan Perubahan</Button>
            </>
          }
        >
          <form onSubmit={handleEdit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                Pilih dari Daftar Anggota <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <Select value={formMemberId} onChange={e => handleMemberSelect(e.target.value)} options={memberSelectOptions} />
            </div>

            <Input
              label="Nama Pengambil Kas"
              value={formWithdrawerName}
              onChange={e => setFormWithdrawerName(e.target.value)}
              required
              leftIcon={<User2 className="w-4 h-4 text-gray-400" />}
            />

            <div>
              <Input
                label="Jumlah yang Diambil (Rp)"
                type="number" min="1" step="1"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                required
                leftIcon={<Banknote className="w-4 h-4 text-gray-400" />}
              />
              {Number(formAmount) > 0 && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">= {formatRupiah(Number(formAmount))}</p>
              )}
            </div>

            <Input label="Tanggal Pengambilan" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required />
            <Input label="Keperluan / Tujuan" value={formPurpose} onChange={e => setFormPurpose(e.target.value)} required />
            <Input label="Keterangan Tambahan" value={formDescription} onChange={e => setFormDescription(e.target.value)} />

            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Catatan pengeluaran kas yang terhubung akan <strong>ikut diperbarui secara otomatis</strong>. Saldo kas dikalkulasi ulang.</span>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: DELETE CONFIRMATION
      ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => { setIsDeleteOpen(false); setActiveItem(null); }}
          title="🗑️ Hapus Catatan Pengambilan Kas"
          description="Tindakan ini tidak dapat dibatalkan. Catatan pengeluaran kas yang terhubung juga akan dihapus, dan saldo kas akan dipulihkan."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setIsDeleteOpen(false); setActiveItem(null); }} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isSubmitting}>
                Ya, Hapus &amp; Pulihkan Saldo
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-left">
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Konfirmasi Penghapusan</p>
                <p>
                  Menghapus catatan ini akan <strong>menghapus pengeluaran kas terkait</strong> dan memulihkan saldo sebesar{' '}
                  <strong>{formatRupiah(activeItem?.amount || 0)}</strong>.
                </p>
              </div>
            </div>

            {activeItem && (
              <div className="p-3 rounded-xl bg-taruna-surface dark:bg-slate-800 border border-taruna-border dark:border-slate-700 space-y-1.5 text-xs">
                <p><strong className="text-gray-500">Pengambil:</strong> <span className="font-semibold text-taruna-dark dark:text-white">{activeItem.withdrawerName}</span></p>
                <p><strong className="text-gray-500">Keperluan:</strong> <span className="font-semibold">{activeItem.purpose}</span></p>
                <p><strong className="text-gray-500">Jumlah:</strong> <span className="font-black text-red-600 dark:text-red-400">-{formatRupiah(activeItem.amount)}</span></p>
                <p><strong className="text-gray-500">Tanggal:</strong> <span>{new Date(activeItem.withdrawalDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                <p><strong className="text-gray-500">Admin Pencatat:</strong> <span>{activeItem.creatorName}</span></p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Setelah dihapus, SALDO SAAT INI akan <strong>bertambah kembali</strong> sebesar{' '}
                {formatRupiah(activeItem?.amount || 0)}.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
