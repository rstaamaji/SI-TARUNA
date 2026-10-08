'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Gift,
  CalendarDays,
  CalendarCheck2,
  MapPin,
  User,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Trophy,
  History,
  Eye,
  Check,
  Crown,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { getStoredUser, isUserAdmin, UserRole } from '@/lib/auth';

export interface ArisanMember {
  id: string;
  name: string;
  memberNumber: string;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  hasWon?: boolean;
  winMonth?: number | null;
  winMonthName?: string | null;
  winYear?: number | null;
}

export interface ArisanItem {
  id: string;
  month: number;
  monthName: string;
  year: number;
  periodLabel: string;
  memberId?: string | null;
  recipientName: string;
  recipientNumber?: string | null;
  recipientPhone?: string | null;
  recipientAddress?: string | null;
  member?: ArisanMember | null;
  drawDate?: string | null;
  location: string;
  status: 'PENDING' | 'UPCOMING' | 'WON' | 'PAID';
  rawStatus?: string;
  notes?: string | null;
  amount: number;
  daysRemaining?: number | null;
  timingLabel?: string;
  isUpcoming?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

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

export default function ArisanPage() {
  const toast = useToast();

  // Role & User
  const [userRole, setUserRole] = useState<UserRole>('MEMBER');

  // Main Data States
  const [arisans, setArisans] = useState<ArisanItem[]>([]);
  const [nearestArisan, setNearestArisan] = useState<ArisanItem | null>(null);
  const [historyList, setHistoryList] = useState<ArisanItem[]>([]);
  const [members, setMembers] = useState<ArisanMember[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tab State: 'SCHEDULE' | 'HISTORY' | 'MEMBERS'
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'HISTORY' | 'MEMBERS'>('SCHEDULE');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal Detail State
  const [detailItem, setDetailItem] = useState<ArisanItem | null>(null);

  // Modal Create/Edit Arisan State (Admin)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ArisanItem | null>(null);
  const [formMonth, setFormMonth] = useState('10');
  const [formYear, setFormYear] = useState('2026');
  const [formMemberId, setFormMemberId] = useState('');
  const [formDate, setFormDate] = useState('2026-10-01');
  const [formLocation, setFormLocation] = useState('Balai Dusun Tuk Uluh');
  const [formStatus, setFormStatus] = useState<'PENDING' | 'UPCOMING' | 'WON' | 'PAID'>('UPCOMING');
  const [formAmount, setFormAmount] = useState('500000');
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal Tentukan Pemenang (Winner Quick Assign)
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [winnerTargetArisan, setWinnerTargetArisan] = useState<ArisanItem | null>(null);
  const [winnerMemberId, setWinnerMemberId] = useState('');
  const [winnerLocation, setWinnerLocation] = useState('');
  const [winnerNotes, setWinnerNotes] = useState('');
  const [isSettingWinner, setIsSettingWinner] = useState(false);

  // Modal Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ArisanItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Preset Locations for Dusun Tuk Uluh
  const locationPresets = [
    'Balai Dusun Tuk Uluh',
    'Pos Ronda RT 01',
    'Pos Ronda RT 02',
    'Pos Ronda RT 03',
    'Kediaman Sdr. Bambang (RT 01)',
    'Kediaman Sdr. Rustam Aji (RT 01)',
    'Kediaman Sdri. Siti Nurhaliza (RT 02)',
    'Kediaman Sdr. Fajar Nugroho (RT 03)',
  ];

  // Helper token & API
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

    const getApiBase = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location.hostname) {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  };

  // Read Auth
  useEffect(() => {
    try {
      const u = getStoredUser();
      if (u) {
        setUserRole(u.role);
      }
    } catch {
      // fallback
    }
  }, []);

  const isAdmin = isUserAdmin(userRole);

  // Helper rupiah format
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
  };

  // Helper fetch all arisan data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = getApiBase();

      const [allRes, nearestRes, historyRes, membersRes] = await Promise.all([
        fetch(`${apiBase}/arisan`, { headers }),
        fetch(`${apiBase}/arisan/upcoming`, { headers }),
        fetch(`${apiBase}/arisan/history`, { headers }),
        fetch(`${apiBase}/arisan/members?year=2026`, { headers }),
      ]);

      const [allJson, nearestJson, historyJson, membersJson] = await Promise.all([
        allRes.json(),
        nearestRes.json(),
        historyRes.json(),
        membersRes.json(),
      ]);

      if (allJson.success && Array.isArray(allJson.data) && allJson.data.length > 0) {
        setArisans(allJson.data);
      } else {
        loadFallbackArisans();
      }

      if (nearestJson.success && nearestJson.data) {
        setNearestArisan(nearestJson.data);
      }

      if (historyJson.success && Array.isArray(historyJson.data)) {
        setHistoryList(historyJson.data);
      }

      if (membersJson.success && Array.isArray(membersJson.data)) {
        setMembers(membersJson.data);
      }

      if (isManual) {
        toast.success('Data jadwal & riwayat arisan berhasil diperbarui.');
      }
    } catch {
      loadFallbackArisans();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

    const loadFallbackArisans = () => {
    const demoItems: ArisanItem[] = [
      {
        id: 'ar-demo-1',
        month: 10,
        monthName: 'Oktober',
        year: 2026,
        periodLabel: 'Arisan Oktober 2026',
        recipientName: 'Siti Rahmawati',
        recipientNumber: 'KT-SB-005',
        recipientPhone: '081234567805',
        recipientAddress: 'RT 02 / RW 01, Dusun Tuk Uluh',
        drawDate: '2026-10-15T19:30:00.000Z',
        location: 'Kediaman Sdri. Siti Rahmawati (RT 02)',
        status: 'UPCOMING',
        amount: 500000,
        daysRemaining: 8,
        timingLabel: '8 Hari Lagi',
        isUpcoming: true,
        notes: 'Pertemuan kocokan arisan pemuda putaran ke-10 bertempat di rumah Sdri. Siti Rahmawati.',
      },
      {
        id: 'ar-demo-2',
        month: 11,
        monthName: 'November',
        year: 2026,
        periodLabel: 'Arisan November 2026',
        recipientName: 'Belum Ditentukan',
        drawDate: '2026-11-15T19:30:00.000Z',
        location: 'Balai Dusun Tuk Uluh',
        status: 'PENDING',
        amount: 500000,
        daysRemaining: 39,
        timingLabel: '39 Hari Lagi',
        isUpcoming: false,
        notes: 'Undian arisan putaran ke-11.',
      },
      {
        id: 'ar-demo-3',
        month: 12,
        monthName: 'Desember',
        year: 2026,
        periodLabel: 'Arisan Desember 2026',
        recipientName: 'Belum Ditentukan',
        drawDate: '2026-12-15T19:30:00.000Z',
        location: 'Balai Dusun Tuk Uluh',
        status: 'PENDING',
        amount: 500000,
        daysRemaining: 69,
        timingLabel: '69 Hari Lagi',
        isUpcoming: false,
        notes: 'Undian arisan putaran ke-12 penutup tahun.',
      },
      {
        id: 'ar-demo-4',
        month: 9,
        monthName: 'September',
        year: 2026,
        periodLabel: 'Arisan September 2026',
        recipientName: 'Bambang Setyawan',
        recipientNumber: 'KT-SB-003',
        recipientPhone: '081234567803',
        drawDate: '2026-09-15T19:30:00.000Z',
        location: 'Kediaman Sdr. Bambang (RT 01)',
        status: 'PAID',
        amount: 500000,
        timingLabel: 'Selesai',
        isUpcoming: false,
        notes: 'Telah diserahkan lunas.',
      },
      {
        id: 'ar-demo-5',
        month: 8,
        monthName: 'Agustus',
        year: 2026,
        periodLabel: 'Arisan Agustus 2026',
        recipientName: 'Eko Prasetyo',
        recipientNumber: 'KT-SB-002',
        recipientPhone: '081234567802',
        drawDate: '2026-08-15T19:30:00.000Z',
        location: 'Kediaman Sdr. Eko (RT 02)',
        status: 'PAID',
        amount: 500000,
        timingLabel: 'Selesai',
        isUpcoming: false,
        notes: 'Telah diserahkan lunas.',
      },
      {
        id: 'ar-demo-6',
        month: 7,
        monthName: 'Juli',
        year: 2026,
        periodLabel: 'Arisan Juli 2026',
        recipientName: 'Rustam Aji',
        recipientNumber: 'KT-SB-001',
        recipientPhone: '081234567801',
        drawDate: '2026-07-15T19:30:00.000Z',
        location: 'Kediaman Sdr. Rustam Aji (RT 01)',
        status: 'PAID',
        amount: 500000,
        timingLabel: 'Selesai',
        isUpcoming: false,
        notes: 'Telah diserahkan lunas.',
      },
      {
        id: 'ar-demo-7',
        month: 6,
        monthName: 'Juni',
        year: 2026,
        periodLabel: 'Arisan Juni 2026',
        recipientName: 'Wahyu Pratama',
        recipientNumber: 'KT-SB-004',
        recipientPhone: '081234567804',
        drawDate: '2026-06-15T19:30:00.000Z',
        location: 'Kediaman Sdr. Wahyu Pratama (RT 02)',
        status: 'PAID',
        amount: 500000,
        timingLabel: 'Selesai',
        isUpcoming: false,
        notes: 'Telah diserahkan lunas.',
      },
      {
        id: 'ar-demo-8',
        month: 5,
        monthName: 'Mei',
        year: 2026,
        periodLabel: 'Arisan Mei 2026',
        recipientName: 'Dwi Astuti',
        recipientNumber: 'KT-SB-006',
        recipientPhone: '081234567806',
        drawDate: '2026-05-15T19:30:00.000Z',
        location: 'Kediaman Sdri. Dwi Astuti (RT 03)',
        status: 'PAID',
        amount: 500000,
        timingLabel: 'Selesai',
        isUpcoming: false,
        notes: 'Telah diserahkan lunas.',
      },
    ];

    const demoMembers: ArisanMember[] = [
      { id: 'm-01', memberNumber: 'KT-SB-001', name: 'Rustam Aji', phone: '081234567801', address: 'RT 01 / RW 01', hasWon: true, winMonth: 7, winMonthName: 'Juli', winYear: 2026 },
      { id: 'm-02', memberNumber: 'KT-SB-002', name: 'Eko Prasetyo', phone: '081234567802', address: 'RT 02 / RW 01', hasWon: true, winMonth: 8, winMonthName: 'Agustus', winYear: 2026 },
      { id: 'm-03', memberNumber: 'KT-SB-003', name: 'Bambang Setyawan', phone: '081234567803', address: 'RT 01 / RW 01', hasWon: true, winMonth: 9, winMonthName: 'September', winYear: 2026 },
      { id: 'm-04', memberNumber: 'KT-SB-004', name: 'Wahyu Pratama', phone: '081234567804', address: 'RT 02 / RW 01', hasWon: true, winMonth: 6, winMonthName: 'Juni', winYear: 2026 },
      { id: 'm-05', memberNumber: 'KT-SB-005', name: 'Siti Rahmawati', phone: '081234567805', address: 'RT 02 / RW 01', hasWon: true, winMonth: 10, winMonthName: 'Oktober', winYear: 2026 },
      { id: 'm-06', memberNumber: 'KT-SB-006', name: 'Dwi Astuti', phone: '081234567806', address: 'RT 03 / RW 01', hasWon: true, winMonth: 5, winMonthName: 'Mei', winYear: 2026 },
      { id: 'm-07', memberNumber: 'KT-SB-007', name: 'Hendra Gunawan', phone: '081234567807', address: 'RT 03 / RW 01', hasWon: false },
      { id: 'm-08', memberNumber: 'KT-SB-008', name: 'Rina Wijaya', phone: '081234567808', address: 'RT 01 / RW 01', hasWon: false },
      { id: 'm-09', memberNumber: 'KT-SB-009', name: 'Agus Santoso', phone: '081234567809', address: 'RT 02 / RW 01', hasWon: false },
      { id: 'm-10', memberNumber: 'KT-SB-010', name: 'Nur Hidayah', phone: '081234567810', address: 'RT 01 / RW 01', hasWon: false },
      { id: 'm-11', memberNumber: 'KT-SB-011', name: 'Fajar Nugroho', phone: '081234567811', address: 'RT 03 / RW 01', hasWon: false },
      { id: 'm-12', memberNumber: 'KT-SB-012', name: 'Budi Utomo', phone: '081234567812', address: 'RT 02 / RW 01', hasWon: false },
    ];

    setArisans(demoItems);
    setNearestArisan(demoItems[0]);
    setHistoryList(demoItems.filter((d) => d.status === 'PAID' || d.status === 'WON'));
    setMembers(demoMembers);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered arisan schedule
  const filteredSchedule = useMemo(() => {
    return arisans.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPeriod = item.periodLabel.toLowerCase().includes(q);
        const matchRecip = item.recipientName.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        if (!matchPeriod && !matchRecip && !matchLoc) return false;
      }

      // Year
      if (selectedYear !== 'ALL' && item.year !== Number(selectedYear)) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [arisans, searchQuery, selectedYear, selectedStatus]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MODAL FORM OPEN HANDLERS (ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingItem(null);
    setFormMonth('10');
    setFormYear('2026');
    setFormMemberId('');
    setFormDate('2026-10-01');
    setFormLocation('Balai Dusun Tuk Uluh');
    setFormStatus('UPCOMING');
    setFormAmount('500000');
    setFormNotes('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: ArisanItem) => {
    setEditingItem(item);
    setFormMonth(String(item.month));
    setFormYear(String(item.year));
    setFormMemberId(item.memberId || '');
    if (item.drawDate) {
      setFormDate(item.drawDate.split('T')[0]);
    } else {
      setFormDate('2026-10-01');
    }
    setFormLocation(item.location);
    setFormStatus(item.status);
    setFormAmount(String(item.amount || 500000));
    setFormNotes(item.notes || '');
    setIsFormModalOpen(true);
  };

  // Helper when member selection changes in form
  const handleFormMemberChange = (mId: string) => {
    setFormMemberId(mId);
    if (mId) {
      const selected = members.find((m) => m.id === mId);
      if (selected) {
        setFormLocation(`Rumah ${selected.name}`);
        setFormStatus('WON');
      }
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        month: Number(formMonth),
        year: Number(formYear),
        memberId: formMemberId || null,
        drawDate: formDate ? new Date(formDate).toISOString() : null,
        location: formLocation.trim() || 'Balai Dusun Tuk Uluh',
        status: formStatus,
        amount: Number(formAmount) || 500000,
        notes: formNotes.trim() || null,
      };

      const apiBase = getApiBase();
      const url = editingItem ? `${apiBase}/arisan/${editingItem.id}` : `${apiBase}/arisan`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          editingItem
            ? 'Data arisan berhasil diperbarui!'
            : 'Jadwal putaran arisan berhasil dibuat!'
        );
        setIsFormModalOpen(false);
        fetchData(false);
      } else {
        toast.error(json.message || 'Gagal menyimpan data arisan.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MODAL TENTUKAN PEMENANG / RECIPIENT QUICK HANDLER
  // ─────────────────────────────────────────────────────────────────────────────
  const openWinnerModal = (item: ArisanItem) => {
    setWinnerTargetArisan(item);
    setWinnerMemberId(item.memberId || '');
    setWinnerLocation(item.location || (item.member ? `Rumah ${item.member.name}` : 'Balai Dusun Tuk Uluh'));
    setWinnerNotes(item.notes || '');
    setIsWinnerModalOpen(true);
  };

  const handleWinnerMemberSelect = (mId: string) => {
    setWinnerMemberId(mId);
    const selected = members.find((m) => m.id === mId);
    if (selected) {
      setWinnerLocation(`Rumah ${selected.name}`);
    }
  };

  const handleSaveWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerTargetArisan) return;

    if (!winnerMemberId) {
      toast.error('Pilih anggota yang mendapatkan arisan.');
      return;
    }

    setIsSettingWinner(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/arisan/${winnerTargetArisan.id}/winner`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          memberId: winnerMemberId,
          location: winnerLocation.trim(),
          notes: winnerNotes.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Anggota berhasil ditetapkan sebagai penerima ${winnerTargetArisan.periodLabel}!`);
        setIsWinnerModalOpen(false);
        setWinnerTargetArisan(null);
        fetchData(false);
      } else {
        toast.error(json.message || 'Gagal menentukan penerima arisan.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsSettingWinner(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE HANDLER
  // ─────────────────────────────────────────────────────────────────────────────
  const confirmDelete = (item: ArisanItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/arisan/${itemToDelete.id}`, {
        method: 'DELETE',
        headers,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Data arisan berhasil dihapus.');
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        fetchData(false);
      } else {
        toast.error(json.message || 'Gagal menghapus data arisan.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge variant="warning" size="sm" dot>UPCOMING</Badge>;
      case 'WON':
        return <Badge variant="success" size="sm">Sudah Menang</Badge>;
      case 'PAID':
        return <Badge variant="primary" size="sm">Telah Diserahkan</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="neutral" size="sm">Menunggu Undian</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. HEADER & HERO SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#466060] text-white p-6 sm:p-7 rounded-3xl border border-[#163E4F] shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Module 20 • Arisan Management
            </span>
            <Badge variant="warning" size="sm">
              <Gift className="w-3 h-3 mr-1 inline" />
              Arisan Pemuda
            </Badge>
            {isAdmin && (
              <Badge variant="primary" size="sm">
                <ShieldCheck className="w-3 h-3 mr-1 inline" />
                Admin Pengurus
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
            Manajemen &amp; Jadwal Arisan
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Pengelolaan giliran arisan bergilir pemuda Dusun Tuk Uluh. Admin menentukan penerima arisan tiap bulan, lokasi pertemuan tuan rumah, dan rekapitulasi riwayat penyerahan dana.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchData(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Segarkan
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Tambah Jadwal Arisan
            </Button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. DASHBOARD SPECIAL SECTION: "ARISAN TERDEKAT" (STATUS UPCOMING)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#163E4F] tracking-tight">
                Arisan Terdekat
              </h2>
              <p className="text-xs text-[#163E4F]/80 font-medium">
                Informasi jadwal dan tuan rumah arisan putaran terdekat yang akan segera dilaksanakan.
              </p>
            </div>
          </div>

          {nearestArisan && nearestArisan.status === 'UPCOMING' && (
            <Badge variant="warning" size="sm" dot>
              Status: UPCOMING
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="h-56 rounded-3xl bg-gray-100 dark:bg-slate-800 animate-pulse border border-taruna-border dark:border-slate-800" />
        ) : !nearestArisan ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-taruna-border dark:border-slate-800 text-center space-y-2">
            <Gift className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-gray-600 dark:text-slate-300">
              Belum Ada Jadwal Arisan Terdekat
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Admin belum menambahkan jadwal putaran arisan mendatang.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-xs relative overflow-hidden">
            {/* Background Decorative Icon */}
            <div className="absolute right-4 -bottom-6 opacity-5 dark:opacity-10 pointer-events-none">
              <Trophy className="w-48 h-48" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Column: Period, Recipient, Details */}
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge variant="warning" size="md">
                    <Gift className="w-3.5 h-3.5 mr-1 inline" />
                    {nearestArisan.periodLabel}
                  </Badge>

                  {nearestArisan.status === 'UPCOMING' ? (
                    <Badge variant="warning" size="sm" dot>
                      UPCOMING
                    </Badge>
                  ) : (
                    getStatusBadge(nearestArisan.status)
                  )}

                  {nearestArisan.timingLabel && (
                    <Badge variant="accent" size="sm">
                      {nearestArisan.timingLabel}
                    </Badge>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">
                    Penerima / Tuan Rumah Arisan:
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white mt-1 leading-tight flex items-center gap-2.5 flex-wrap">
                    <span>{nearestArisan.recipientName}</span>
                    {nearestArisan.recipientNumber && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                        {nearestArisan.recipientNumber}
                      </span>
                    )}
                  </h3>
                </div>

                {/* Grid info: Tanggal & Tempat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2 border-t border-amber-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-slate-300">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Tanggal Arisan:</span>
                      <strong className="text-taruna-dark dark:text-white font-bold">
                        {nearestArisan.drawDate
                          ? new Date(nearestArisan.drawDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Tanggal belum ditentukan'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-slate-300">
                    <div className="p-2 rounded-xl bg-red-100 dark:bg-slate-800 text-red-600 dark:text-red-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Tempat Pertemuan:</span>
                      <strong className="text-taruna-dark dark:text-white font-bold">
                        {nearestArisan.location}
                      </strong>
                    </div>
                  </div>
                </div>

                {nearestArisan.notes && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                    Catatan: {nearestArisan.notes}
                  </p>
                )}
              </div>

              {/* Right Column: Pot Amount Card & Actions */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 flex flex-col justify-between gap-4 shrink-0 lg:w-72 shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Total Dana Arisan / Putaran
                  </span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    Rp {formatRupiah(nearestArisan.amount)}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-slate-400 block mt-0.5">
                    Iuran bulanan: Rp 20.000 / anggota
                  </span>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-taruna-border/60 dark:border-slate-800 space-y-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => openWinnerModal(nearestArisan)}
                      leftIcon={<Crown className="w-4 h-4 text-amber-900" />}
                    >
                      Tentukan Penerima
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditModal(nearestArisan)}
                        leftIcon={<Pencil className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => confirmDelete(nearestArisan)}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. STATS SUMMARY ROW
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#6A8578] text-white border border-[#466060]">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Putaran
          </span>
          <span className="text-2xl font-black text-taruna-dark dark:text-white mt-1 block">
            {arisans.length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Tercatat di sistem</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#6A8578] text-white border border-[#466060]">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Akan Datang
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {arisans.filter((a) => a.status === 'UPCOMING' || a.status === 'PENDING').length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Putaran terjadwal</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#6A8578] text-white border border-[#466060]">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Penerima / Selesai
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {arisans.filter((a) => a.status === 'WON' || a.status === 'PAID').length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Telah mendapatkan arisan</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#6A8578] text-white border border-[#466060]">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Belum Dapat
          </span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {members.filter((m) => !m.hasWon).length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Menunggu giliran kocokan</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. TAB NAVIGATION: JADWAL ARISAN vs HISTORY vs STATUS ANGGOTA
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-taruna-border dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'SCHEDULE'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Jadwal &amp; Putaran Arisan ({arisans.length})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          History Arisan ({historyList.length})
        </button>

        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'MEMBERS'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          Status Giliran Anggota ({members.length})
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 1: JADWAL & PUTARAN ARISAN
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-taruna-border dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari periode, nama penerima, atau tempat arisan..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#466060] bg-[#163E4F] text-white placeholder:text-[#D6DDD5]/70 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-[#466060] bg-[#163E4F] text-white font-semibold focus:outline-hidden"
              >
                <option value="ALL">Semua Status</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="WON">Sudah Menang</option>
                <option value="PAID">Telah Diserahkan</option>
                <option value="PENDING">Menunggu Undian</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-[#466060] bg-[#163E4F] text-white font-semibold focus:outline-hidden"
              >
                <option value="ALL">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse border border-taruna-border dark:border-slate-800"
                />
              ))}
            </div>
          ) : filteredSchedule.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-taruna-border dark:border-slate-800 text-center space-y-3">
              <Gift className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-taruna-dark dark:text-white">
                Tidak Ada Putaran Arisan Ditemukan
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                Silakan ubah filter pencarian atau tambahkan jadwal putaran arisan baru.
              </p>
              {isAdmin && (
                <Button variant="primary" size="sm" onClick={openCreateModal}>
                  Tambah Jadwal Baru
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchedule.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 hover:border-amber-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Period Badge & Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-16 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 dark:from-slate-800 dark:to-slate-800/80 border border-amber-500/20 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                        {item.monthName ? item.monthName.slice(0, 3) : 'BLN'}
                      </span>
                      <span className="text-xl font-black text-taruna-dark dark:text-white leading-tight">
                        {item.month}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400">
                        {item.year}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-taruna-dark dark:text-white">
                          {item.periodLabel}
                        </span>
                        {getStatusBadge(item.status)}
                        {item.timingLabel && (
                          <Badge variant="accent" size="sm">
                            {item.timingLabel}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 dark:text-slate-300">
                        Penerima:{' '}
                        <strong className="text-taruna-dark dark:text-white font-bold">
                          {item.recipientName}
                        </strong>
                        {item.recipientNumber && (
                          <span className="text-gray-400 dark:text-slate-500 ml-1.5 font-medium">
                            ({item.recipientNumber})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                          <CalendarCheck2 className="w-3.5 h-3.5" />
                          {item.drawDate
                            ? new Date(item.drawDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Belum dijadwalkan'}
                        </span>
                        <span className="text-gray-300 dark:text-slate-700">•</span>
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => setDetailItem(item)}
                      className="px-3 py-1.5 rounded-xl border border-taruna-border dark:border-slate-700 bg-taruna-surface/60 dark:bg-slate-800 hover:bg-taruna-surface text-taruna-dark dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      Detail
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openWinnerModal(item)}
                          className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold inline-flex items-center gap-1.5 transition"
                          title="Tentukan Anggota Penerima"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          Penerima
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-taruna-yellow-50 dark:hover:bg-slate-700 text-taruna-dark dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <Pencil className="w-3.5 h-3.5 text-taruna-yellow-600" />
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 2: HISTORY ARISAN (RIWAYAT PUTARAN SELESAI & PEMENANG SEBELUMNYA)
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-taruna-dark dark:text-white">
                Riwayat Pemenang &amp; Penerima Arisan
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Daftar anggota yang telah menerima dana arisan pada putaran-putaran sebelumnya.
              </p>
            </div>
            <Badge variant="primary" size="sm">
              {historyList.length} Penerima
            </Badge>
          </div>

          {historyList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-taruna-border dark:border-slate-800 text-center space-y-2">
              <History className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-gray-600 dark:text-slate-300">
                Belum Ada History Arisan Selesai
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Riwayat akan otomatis terisi saat putaran arisan telah dimenangkan atau diserahkan.
              </p>
            </div>
          ) : (
            <div className="bg-[#6A8578] text-white rounded-3xl border border-[#466060] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-taruna-surface/70 dark:bg-slate-800/80 border-b border-taruna-border dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Periode</th>
                      <th className="py-3.5 px-4">Nama Penerima</th>
                      <th className="py-3.5 px-4">Tanggal Arisan</th>
                      <th className="py-3.5 px-4">Tempat / Tuan Rumah</th>
                      <th className="py-3.5 px-4">Nominal</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-taruna-border/60 dark:divide-slate-800">
                    {historyList.map((hist) => (
                      <tr key={hist.id} className="hover:bg-taruna-surface/40 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-black text-taruna-dark dark:text-white whitespace-nowrap">
                          {hist.periodLabel}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-taruna-dark dark:text-white">
                            {hist.recipientName}
                          </div>
                          {hist.recipientNumber && (
                            <span className="text-[11px] text-gray-400 block font-normal">
                              {hist.recipientNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                          {hist.drawDate
                            ? new Date(hist.drawDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300 max-w-xs truncate" title={hist.location}>
                          {hist.location}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          Rp {formatRupiah(hist.amount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(hist.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDetailItem(hist)}
                            className="p-1.5 rounded-lg border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 text-gray-600 dark:text-slate-300 transition"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 3: STATUS GILIRAN ANGGOTA (SIKLUS TAHUN BERJALAN)
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-taruna-dark dark:text-white">
                Status Giliran Anggota Tahun {selectedYear}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Memantau anggota yang sudah mendapatkan undian vs yang masih menunggu giliran dalam siklus arisan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                Sudah Dapat: {members.filter((m) => m.hasWon).length}
              </Badge>
              <Badge variant="warning" size="sm">
                Belum Dapat: {members.filter((m) => !m.hasWon).length}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {members.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  m.hasWon
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-white dark:bg-slate-900 border-taruna-border dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-taruna-dark dark:text-white">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {m.memberNumber}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-slate-400 block mt-0.5 truncate max-w-[200px]">
                    {m.address || 'Dusun Tuk Uluh'}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  {m.hasWon ? (
                    <Badge variant="success" size="sm">
                      <Check className="w-3 h-3 mr-0.5 inline" />
                      {m.winMonthName ? `${m.winMonthName.slice(0, 3)} ${m.winYear}` : 'Sudah'}
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Belum
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL DETAIL ARISAN
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Rincian Putaran Arisan"
        description="Informasi detail putaran arisan Karang Taruna Setya Bakti Tuk Uluh."
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-400">SI-TARUNA Arisan System</span>
            <Button variant="secondary" size="sm" onClick={() => setDetailItem(null)}>
              Tutup
            </Button>
          </div>
        }
      >
        {detailItem && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="warning" size="md">
                {detailItem.periodLabel}
              </Badge>
              {getStatusBadge(detailItem.status)}
              {detailItem.timingLabel && (
                <Badge variant="accent" size="sm">
                  {detailItem.timingLabel}
                </Badge>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200 dark:border-amber-800/40">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                Penerima Arisan:
              </span>
              <p className="text-xl font-black text-taruna-dark dark:text-white mt-0.5">
                {detailItem.recipientName}
              </p>
              {detailItem.recipientNumber && (
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block mt-0.5">
                  Nomor Anggota: {detailItem.recipientNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-2xl bg-[#6A8578] text-white border border-[#466060]">
              <div>
                <span className="text-gray-400 block font-medium">Tanggal Arisan:</span>
                <strong className="text-taruna-dark dark:text-white font-bold">
                  {detailItem.drawDate
                    ? new Date(detailItem.drawDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Belum dijadwalkan'}
                </strong>
              </div>

              <div>
                <span className="text-gray-400 block font-medium">Nominal Pot:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Rp {formatRupiah(detailItem.amount)}
                </strong>
              </div>

              <div className="sm:col-span-2">
                <span className="text-gray-400 block font-medium">Tempat Pertemuan:</span>
                <strong className="text-taruna-dark dark:text-white font-bold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  {detailItem.location}
                </strong>
              </div>
            </div>

            {detailItem.notes && (
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-600 dark:text-slate-300">
                <span className="font-bold block text-gray-700 dark:text-slate-200 mb-0.5">Catatan:</span>
                {detailItem.notes}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL TENTUKAN PENERIMA ARISAN (ADMIN QUICK ACTION)
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        title="Tentukan Penerima Arisan"
        description="Pilih anggota yang mendapatkan arisan pada putaran ini. Lokasi pertemuan akan otomatis disesuaikan ke kediaman penerima."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSettingWinner}
              onClick={() => setIsWinnerModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSettingWinner}
              onClick={handleSaveWinner}
              leftIcon={<Crown className="w-4 h-4 text-amber-900" />}
            >
              Tetapkan Penerima
            </Button>
          </>
        }
      >
        {winnerTargetArisan && (
          <form onSubmit={handleSaveWinner} className="space-y-4 text-left">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
              Menentukan penerima untuk putaran:{' '}
              <strong className="font-bold underline">{winnerTargetArisan.periodLabel}</strong>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-semibold text-taruna-dark dark:text-slate-200 block mb-1.5">
                Pilih Anggota Penerima
              </label>
              <select
                value={winnerMemberId}
                onChange={(e) => handleWinnerMemberSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-taruna-dark dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
                required
              >
                <option value="">-- Pilih Anggota Penerima --</option>
                <optgroup label="⭐ Belum Pernah Mendapatkan (Direkomendasikan)">
                  {members
                    .filter((m) => !m.hasWon)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberNumber}) - {m.address || 'Tuk Uluh'}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Sudah Pernah Mendapatkan">
                  {members
                    .filter((m) => m.hasWon)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        ✓ {m.name} ({m.memberNumber}) - [Dapat {m.winMonthName} {m.winYear}]
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <Input
              label="Tempat / Lokasi Arisan"
              value={winnerLocation}
              onChange={(e) => setWinnerLocation(e.target.value)}
              placeholder="Contoh: Rumah Anggota 05 / Kediaman Sdr. Bambang"
              helperText="Otomatis diisi rumah penerima terpilih."
              required
            />

            <div>
              <label className="text-xs sm:text-sm font-semibold text-taruna-dark dark:text-slate-200 block mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={winnerNotes}
                onChange={(e) => setWinnerNotes(e.target.value)}
                placeholder="Catatan penyerahan atau pengundian arisan..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-taruna-dark dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL TAMBAH / EDIT ARISAN (ADMIN ONLY)
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingItem ? 'Edit Jadwal Arisan' : 'Tambah Jadwal Putaran Arisan'}
        description="Atur bulan, tahun, tanggal, tempat, serta status putaran arisan."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsFormModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleSaveForm}
            >
              {editingItem ? 'Simpan Perubahan' : 'Jadwalkan Arisan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveForm} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Bulan"
              value={formMonth}
              onChange={(e) => setFormMonth(e.target.value)}
              options={MONTH_OPTIONS}
            />

            <Input
              label="Tahun"
              type="number"
              value={formYear}
              onChange={(e) => setFormYear(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs sm:text-sm font-semibold text-taruna-dark dark:text-slate-200 block mb-1.5">
              Penerima Arisan (Opsional jika belum dikocok)
            </label>
            <select
              value={formMemberId}
              onChange={(e) => handleFormMemberChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-taruna-dark dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
            >
              <option value="">-- Belum Dikocok / Belum Ditentukan --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberNumber}) {m.hasWon ? '✓ [Sudah Dapat]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Arisan"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />

            <Select
              label="Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              options={[
                { value: 'UPCOMING', label: 'UPCOMING (Mendekati Hari H)' },
                { value: 'WON', label: 'Sudah Menang' },
                { value: 'PAID', label: 'Telah Diserahkan' },
                { value: 'PENDING', label: 'Menunggu Undian' },
              ]}
            />
          </div>

          <div>
            <Input
              label="Tempat / Lokasi Pertemuan"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Contoh: Rumah Anggota 05 / Balai Dusun Tuk Uluh"
              required
            />
            {/* Quick preset locations */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-gray-400 dark:text-slate-500 self-center mr-1">
                Pilih Cepat:
              </span>
              {locationPresets.map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setFormLocation(loc)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
                    formLocation === loc
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-taruna-surface dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-taruna-border dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Total Pot Arisan (Rp)"
            type="number"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            placeholder="500000"
          />

          <div>
            <label className="text-xs sm:text-sm font-semibold text-taruna-dark dark:text-slate-200 block mb-1.5">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Catatan agenda atau iuran..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-taruna-dark dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL HAPUS ARISAN (ADMIN ONLY)
      ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Arisan"
        description="Tindakan ini tidak dapat dibatalkan. Pastikan data putaran arisan ini memang ingin dihapus."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteItem}
            >
              Hapus Arisan
            </Button>
          </>
        }
      >
        {itemToDelete && (
          <div className="space-y-3 text-left">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 dark:text-red-300">
                Apakah Anda yakin ingin menghapus data{' '}
                <strong className="font-bold underline">{itemToDelete.periodLabel}</strong>?
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Penerima: {itemToDelete.recipientName}</div>
              <div>Tempat: {itemToDelete.location}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
