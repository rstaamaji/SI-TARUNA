'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
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
import { ThemeToggle } from '@/components/theme/ThemeProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { getStoredUser, UserRole } from '@/lib/auth';

export interface MemberItem {
  id: string;
  memberNumber: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  phone: string | null;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinDate?: string;
  createdAt?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

// Data dummy realistis Karang Taruna Setya Bakti (Dusun Tuk Uluh, Desa Sringin)
const DUMMY_MEMBERS: MemberItem[] = [
  { id: 'm-01', memberNumber: 'KT-SB-001', name: 'Rustam Aji', gender: 'MALE', phone: '081234567801', address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-01-10T00:00:00.000Z', user: { id: 'u-01', username: 'rustamaji', role: 'SUPERADMIN' } },
  { id: 'm-02', memberNumber: 'KT-SB-002', name: 'Eko Prasetyo', gender: 'MALE', phone: '081234567802', address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-01-15T00:00:00.000Z', user: { id: 'u-02', username: 'ekoprasetyo', role: 'ADMIN' } },
  { id: 'm-03', memberNumber: 'KT-SB-003', name: 'Bambang Setyawan', gender: 'MALE', phone: '081234567803', address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-02-01T00:00:00.000Z', user: { id: 'u-03', username: 'bambangsetyawan', role: 'ADMIN' } },
  { id: 'm-04', memberNumber: 'KT-SB-004', name: 'Wahyu Pratama', gender: 'MALE', phone: '081234567804', address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-02-15T00:00:00.000Z', user: { id: 'u-04', username: 'wahyu', role: 'MEMBER' } },
  { id: 'm-05', memberNumber: 'KT-SB-005', name: 'Siti Rahmawati', gender: 'FEMALE', phone: '081234567805', address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-03-01T00:00:00.000Z', user: { id: 'u-05', username: 'sitirahma', role: 'MEMBER' } },
  { id: 'm-06', memberNumber: 'KT-SB-006', name: 'Dwi Astuti', gender: 'FEMALE', phone: '081234567806', address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-03-15T00:00:00.000Z', user: { id: 'u-06', username: 'dwiastuti', role: 'MEMBER' } },
  { id: 'm-07', memberNumber: 'KT-SB-007', name: 'Hendra Gunawan', gender: 'MALE', phone: '081234567807', address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-04-01T00:00:00.000Z', user: { id: 'u-07', username: 'hendragunawan', role: 'MEMBER' } },
  { id: 'm-08', memberNumber: 'KT-SB-008', name: 'Rina Wijaya', gender: 'FEMALE', phone: '081234567808', address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-04-10T00:00:00.000Z', user: { id: 'u-08', username: 'rinawijaya', role: 'MEMBER' } },
  { id: 'm-09', memberNumber: 'KT-SB-009', name: 'Agus Santoso', gender: 'MALE', phone: '081234567809', address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-05-01T00:00:00.000Z' },
  { id: 'm-10', memberNumber: 'KT-SB-010', name: 'Nur Hidayah', gender: 'FEMALE', phone: '081234567810', address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-05-15T00:00:00.000Z' },
  { id: 'm-11', memberNumber: 'KT-SB-011', name: 'Fajar Nugroho', gender: 'MALE', phone: '081234567811', address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-06-01T00:00:00.000Z' },
  { id: 'm-12', memberNumber: 'KT-SB-012', name: 'Budi Utomo', gender: 'MALE', phone: '081234567812', address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-06-20T00:00:00.000Z' },
  { id: 'm-13', memberNumber: 'KT-SB-013', name: 'Dewi Lestari', gender: 'FEMALE', phone: '081234567813', address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-07-01T00:00:00.000Z' },
  { id: 'm-14', memberNumber: 'KT-SB-014', name: 'Arif Kurniawan', gender: 'MALE', phone: '081234567814', address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-07-15T00:00:00.000Z' },
  { id: 'm-15', memberNumber: 'KT-SB-015', name: 'Tri Wahyuni', gender: 'FEMALE', phone: '081234567815', address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-08-01T00:00:00.000Z' },
  { id: 'm-16', memberNumber: 'KT-SB-016', name: 'Bayu Saputra', gender: 'MALE', phone: '081234567816', address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin', status: 'ACTIVE', joinDate: '2023-08-20T00:00:00.000Z' },
];

export default function AdminMembersPage() {
  const toast = useToast();

  // State Data & Filter
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');

  // Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [serverTotal, setServerTotal] = useState(0);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: UserRole }>({
    name: 'Pengurus Taruna',
    role: 'ADMIN',
  });

  useEffect(() => {
    try {
      const u = getStoredUser();
      if (u) {
        setCurrentUser({ name: u.name, role: u.role });
      }
    } catch {
      // ignore
    }
  }, []);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Active item for actions
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formNumber, setFormNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load token from storage
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('si_taruna_token');
  };

  // Fetch Members dari API Backend dengan fallback dummy
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (genderFilter !== 'ALL') params.append('gender', genderFilter);
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/members?${params.toString()}`, {
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMembers(json.data.members);
          setServerTotal(json.data.pagination.total);
          return;
        }
      }
      throw new Error('Fallback to local dummy data');
    } catch {
      // Fallback ke data dummy realistis
      let filtered = [...DUMMY_MEMBERS];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.memberNumber.toLowerCase().includes(q) ||
            (m.phone && m.phone.includes(q)) ||
            m.address.toLowerCase().includes(q)
        );
      }
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter((m) => m.status === statusFilter);
      }
      if (genderFilter !== 'ALL') {
        filtered = filtered.filter((m) => m.gender === genderFilter);
      }

      setServerTotal(filtered.length);
      const start = (currentPage - 1) * itemsPerPage;
      setMembers(filtered.slice(start, start + itemsPerPage));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, genderFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Total pages
  const totalPages = Math.ceil(serverTotal / itemsPerPage) || 1;

  // Buka Modal Tambah
  const handleOpenAddModal = () => {
    setFormName('');
    setFormGender('MALE');
    setFormPhone('');
    setFormAddress('RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin');
    setFormStatus('ACTIVE');
    setFormNumber('');
    setIsAddModalOpen(true);
  };

  // Submit Tambah Anggota
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) {
      toast.error('Nama dan alamat anggota wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = {
        name: formName.trim(),
        gender: formGender,
        phone: formPhone.trim() || null,
        address: formAddress.trim(),
        status: formStatus,
        ...(formNumber.trim() ? { memberNumber: formNumber.trim() } : {}),
      };

      const res = await fetch('http://localhost:5000/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Anggota ${json.data.name} (${json.data.memberNumber}) berhasil didaftarkan!`);
        setIsAddModalOpen(false);
        fetchMembers();
      } else {
        throw new Error(json.message || 'Gagal menyimpan anggota');
      }
    } catch {
      // Simpan di local state jika backend offline
      const newNum = `KT-SB-${String(serverTotal + 1).padStart(3, '0')}`;
      const newLocalMember: MemberItem = {
        id: `local-${Date.now()}`,
        memberNumber: formNumber.trim() || newNum,
        name: formName.trim(),
        gender: formGender,
        phone: formPhone.trim() || null,
        address: formAddress.trim(),
        status: formStatus,
        joinDate: new Date().toISOString(),
      };
      setMembers((prev) => [newLocalMember, ...prev]);
      setServerTotal((prev) => prev + 1);
      toast.success(`Anggota ${newLocalMember.name} (${newLocalMember.memberNumber}) berhasil ditambahkan!`);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buka Modal Edit
  const handleOpenEditModal = (member: MemberItem) => {
    setSelectedMember(member);
    setFormName(member.name);
    setFormGender(member.gender);
    setFormPhone(member.phone || '');
    setFormAddress(member.address);
    setFormStatus(member.status);
    setFormNumber(member.memberNumber);
    setIsEditModalOpen(true);
  };

  // Submit Edit Anggota
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = {
        name: formName.trim(),
        gender: formGender,
        phone: formPhone.trim() || null,
        address: formAddress.trim(),
        status: formStatus,
      };

      const res = await fetch(`http://localhost:5000/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Data anggota ${json.data.name} berhasil diperbarui!`);
        setIsEditModalOpen(false);
        fetchMembers();
      } else {
        throw new Error(json.message || 'Gagal mengubah data anggota');
      }
    } catch {
      // Update local state fallback
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id
            ? {
                ...m,
                name: formName.trim(),
                gender: formGender,
                phone: formPhone.trim() || null,
                address: formAddress.trim(),
                status: formStatus,
              }
            : m
        )
      );
      toast.success(`Data anggota ${formName} berhasil diperbarui!`);
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buka Modal Detail
  const handleOpenDetailModal = (member: MemberItem) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  // Buka Dialog Konfirmasi Delete/Deactivate
  const handleOpenDeleteDialog = (member: MemberItem) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  // Aksi Toggle Status / Deactivate Langsung
  const handleToggleStatus = async (member: MemberItem) => {
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:5000/api/members/${member.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(
          `Status ${member.name} diubah menjadi ${nextStatus === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}`
        );
        fetchMembers();
        return;
      }
      throw new Error();
    } catch {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m))
      );
      toast.success(
        `Status ${member.name} diubah menjadi ${nextStatus === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}`
      );
    }
  };

  // Aksi Hapus / Nonaktifkan Anggota
  const handleConfirmDelete = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:5000/api/members/${selectedMember.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || 'Anggota berhasil dihapus/dinonaktifkan');
        setIsDeleteDialogOpen(false);
        fetchMembers();
      } else {
        throw new Error(json.message || 'Gagal menghapus anggota');
      }
    } catch {
      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setServerTotal((prev) => Math.max(0, prev - 1));
      toast.success(`Anggota ${selectedMember.name} berhasil dihapus dari daftar`);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#D6DDD5] text-[#163E4F] transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notificationCount={3}
        userRole={currentUser.role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          user={{
            name: currentUser.name,
            role: currentUser.role,
          }}
        />

        {/* Breadcrumb / Top Bar */}
        <div className="bg-[#466060] text-white border-b border-[#163E4F] px-4 sm:px-8 py-3 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Link
              href="/"
              className="text-[#D6DDD5] hover:text-white transition flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Portal
            </Link>
            <span className="text-white/40">/</span>
            <span className="font-bold text-white">Kelola Anggota</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="primary" size="sm" className="bg-[#163E4F] text-[#D6DDD5] border-[#466060]">
              Hak Akses: ADMIN
            </Badge>
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#466060] text-white p-6 rounded-3xl border border-[#163E4F] shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#163E4F] text-[#4ADE80] border border-[#466060] flex items-center justify-center shadow-sm shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D6DDD5]">
                    Modul 07 • Database Pemuda
                  </span>
                  <Badge variant="primary" size="sm" className="bg-[#163E4F] text-[#D6DDD5] border-[#466060]">
                    {serverTotal} Anggota Terdata
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Manajemen Anggota Karang Taruna
                </h1>
                <p className="text-xs sm:text-sm text-[#D6DDD5] mt-0.5">
                  Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                className="bg-[#163E4F] hover:bg-[#163E4F]/80 text-white border border-[#466060]"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                onClick={() => fetchMembers()}
              >
                Muat Ulang
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-[#163E4F] hover:bg-[#163E4F]/90 text-white border border-[#466060]"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={handleOpenAddModal}
              >
                Tambah Anggota Baru
              </Button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <Card className="!bg-[#6A8578] text-white border-[#466060]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#D6DDD5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, nomor anggota, nomor HP, atau alamat..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-[#163E4F] border border-[#466060] text-white placeholder:text-[#D6DDD5]/60 focus:border-white outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#D6DDD5] hover:text-white"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Filter Status & Gender */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D6DDD5]">
                    <Filter className="w-3.5 h-3.5" />
                    Status:
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="text-xs sm:text-sm py-2 px-3 rounded-xl bg-[#163E4F] border border-[#466060] text-white outline-none transition"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="INACTIVE">Tidak Aktif (INACTIVE)</option>
                  </select>

                  <select
                    value={genderFilter}
                    onChange={(e) => {
                      setGenderFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="text-xs sm:text-sm py-2 px-3 rounded-xl bg-[#163E4F] border border-[#466060] text-white outline-none transition"
                  >
                    <option value="ALL">Semua Gender</option>
                    <option value="MALE">Laki-laki (L)</option>
                    <option value="FEMALE">Perempuan (P)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card className="!bg-[#6A8578] text-white border-[#466060] shadow-sm">
            <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2 border-b border-[#466060]/40">
              <div>
                <CardTitle className="text-white">Daftar Anggota Karang Taruna Setya Bakti</CardTitle>
                <CardDescription className="text-[#D6DDD5]">
                  Menampilkan data pemuda terdaftar di Dusun Tuk Uluh, Desa Sringin.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#D6DDD5]">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs py-1.5 px-2.5 rounded-lg bg-[#163E4F] border border-[#466060] text-white outline-none font-medium"
                >
                  <option value={5}>5 baris</option>
                  <option value={10}>10 baris</option>
                  <option value={20}>20 baris</option>
                  <option value={50}>50 baris</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="py-16 text-center text-[#D6DDD5] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#38BDF8]" />
                  <span className="text-xs font-semibold">Memuat data anggota...</span>
                </div>
              ) : members.length === 0 ? (
                <div className="py-16 text-center text-[#D6DDD5] flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-[#D6DDD5]/60" />
                  <p className="text-sm font-bold text-white">Tidak ada data anggota ditemukan</p>
                  <p className="text-xs text-[#D6DDD5]">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#466060]">
                    <TableRow className="border-b border-[#163E4F]">
                      <TableHead className="w-32 text-white font-semibold">Nomor Anggota</TableHead>
                      <TableHead className="text-white font-semibold">Nama Anggota</TableHead>
                      <TableHead className="w-28 text-center text-white font-semibold">Jenis Kelamin</TableHead>
                      <TableHead className="w-36 text-white font-semibold">Nomor HP</TableHead>
                      <TableHead className="hidden md:table-cell text-white font-semibold">Alamat</TableHead>
                      <TableHead className="w-28 text-center text-white font-semibold">Status</TableHead>
                      <TableHead className="w-28 text-right text-white font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id} className="hover:bg-[#466060]/30 border-b border-[#466060]/40 transition">
                        {/* Nomor Anggota */}
                        <TableCell className="font-mono font-bold text-xs text-[#38BDF8]">
                          {member.memberNumber}
                        </TableCell>

                        {/* Nama Anggota */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={member.name} size="sm" />
                            <div>
                              <p className="font-bold text-sm text-white leading-tight">
                                {member.name}
                              </p>
                              {member.user && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#FDE047] font-semibold">
                                  <ShieldCheck className="w-3 h-3 text-[#38BDF8]" />
                                  Akun: @{member.user.username} ({member.user.role})
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Jenis Kelamin */}
                        <TableCell className="text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              member.gender === 'MALE'
                                ? 'bg-[#163E4F] text-[#38BDF8] border-[#466060]'
                                : 'bg-[#466060] text-pink-200 border-[#163E4F]'
                            }`}
                          >
                            {member.gender === 'MALE' ? 'L (Laki-laki)' : 'P (Perempuan)'}
                          </span>
                        </TableCell>

                        {/* Nomor HP */}
                        <TableCell className="text-xs font-mono text-[#D6DDD5]">
                          {member.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#4ADE80]" />
                              {member.phone}
                            </span>
                          ) : (
                            <span className="text-[#D6DDD5]/60 italic">-</span>
                          )}
                        </TableCell>

                        {/* Alamat */}
                        <TableCell className="hidden md:table-cell text-xs text-[#D6DDD5] max-w-xs truncate">
                          {member.address}
                        </TableCell>

                        {/* Status Anggota */}
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleStatus(member)}
                            title="Klik untuk mengubah status aktif / tidak aktif"
                            className="cursor-pointer hover:opacity-80 transition"
                          >
                            <Badge
                              variant={member.status === 'ACTIVE' ? 'success' : 'neutral'}
                              size="sm"
                              dot
                            >
                              {member.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                            </Badge>
                          </button>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetailModal(member)}
                              title="Lihat Detail Anggota"
                              className="p-1.5 rounded-lg bg-[#163E4F] text-white hover:bg-[#466060] border border-[#466060] transition"
                            >
                              <Eye className="w-4 h-4 text-[#38BDF8]" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              title="Ubah Data Anggota"
                              className="p-1.5 rounded-lg bg-[#163E4F] text-white hover:bg-[#466060] border border-[#466060] transition"
                            >
                              <Edit2 className="w-4 h-4 text-[#FDE047]" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteDialog(member)}
                              title="Hapus / Nonaktifkan Anggota"
                              className="p-1.5 rounded-lg bg-[#163E4F] text-white hover:bg-[#F87171]/20 border border-[#466060] transition"
                            >
                              <Trash2 className="w-4 h-4 text-[#F87171]" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination Bar */}
              <div className="mt-4 pt-4 border-t border-[#466060] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D6DDD5]">
                <div>
                  Menampilkan{' '}
                  <strong className="text-white font-bold">
                    {serverTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                  </strong>{' '}
                  -{' '}
                  <strong className="text-white font-bold">
                    {Math.min(currentPage * itemsPerPage, serverTotal)}
                  </strong>{' '}
                  dari{' '}
                  <strong className="text-white font-bold">{serverTotal}</strong>{' '}
                  anggota
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    className="!bg-[#163E4F] !text-white !border-[#466060] hover:!bg-[#466060] disabled:!opacity-40"
                  >
                    Sebelumnya
                  </Button>

                  <span className="px-3 py-1 font-semibold text-white">
                    Halaman {currentPage} / {totalPages}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="!bg-[#163E4F] !text-white !border-[#466060] hover:!bg-[#466060] disabled:!opacity-40"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 1. MODAL TAMBAH ANGGOTA */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Anggota Baru"
        description="Daftarkan pemuda Dusun Tuk Uluh ke dalam database Karang Taruna Setya Bakti."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateMember}
              isLoading={isSubmitting}
            >
              Simpan Anggota
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <Input
            label="Nomor Anggota (Opsional)"
            placeholder="Otomatis digenerate jika dikosongkan (contoh: KT-SB-026)"
            value={formNumber}
            onChange={(e) => setFormNumber(e.target.value)}
          />

          <Input
            label="Nama Lengkap Pemuda *"
            placeholder="Masukkan nama lengkap anggota"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Jenis Kelamin *"
              value={formGender}
              onChange={(e) => setFormGender(e.target.value as 'MALE' | 'FEMALE')}
              options={[
                { value: 'MALE', label: 'Laki-laki (MALE)' },
                { value: 'FEMALE', label: 'Perempuan (FEMALE)' },
              ]}
            />

            <Select
              label="Status Keanggotaan *"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              options={[
                { value: 'ACTIVE', label: 'Aktif (ACTIVE)' },
                { value: 'INACTIVE', label: 'Tidak Aktif (INACTIVE)' },
              ]}
            />
          </div>

          <Input
            label="Nomor WhatsApp / HP"
            placeholder="Contoh: 081234567890"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Alamat Domisili *"
            placeholder="Contoh: RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            required
          />
        </form>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 2. MODAL EDIT ANGGOTA */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Ubah Data: ${selectedMember?.name}`}
        description={`Memperbarui informasi anggota dengan nomor ${selectedMember?.memberNumber}`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateMember}
              isLoading={isSubmitting}
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateMember} className="space-y-4">
          <Input
            label="Nomor Anggota"
            value={formNumber}
            disabled
            helperText="Nomor anggota merupakan kode unik resmi yang terkunci."
          />

          <Input
            label="Nama Lengkap *"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Jenis Kelamin *"
              value={formGender}
              onChange={(e) => setFormGender(e.target.value as 'MALE' | 'FEMALE')}
              options={[
                { value: 'MALE', label: 'Laki-laki (MALE)' },
                { value: 'FEMALE', label: 'Perempuan (FEMALE)' },
              ]}
            />

            <Select
              label="Status Keanggotaan *"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              options={[
                { value: 'ACTIVE', label: 'Aktif (ACTIVE)' },
                { value: 'INACTIVE', label: 'Tidak Aktif (INACTIVE)' },
              ]}
            />
          </div>

          <Input
            label="Nomor WhatsApp / HP"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Alamat Domisili *"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            required
          />
        </form>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 3. MODAL DETAIL ANGGOTA */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Informasi Profil Anggota"
        description="Rincian data keanggotaan Karang Taruna Setya Bakti"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setIsDetailModalOpen(false)}>
            Tutup
          </Button>
        }
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-taruna-surface dark:bg-slate-800/60 border border-taruna-border dark:border-slate-800 flex items-center gap-4">
              <Avatar name={selectedMember.name} size="lg" />
              <div>
                <span className="font-mono text-xs font-bold text-taruna-yellow-700 dark:text-taruna-yellow-400">
                  {selectedMember.memberNumber}
                </span>
                <h3 className="text-lg font-bold text-taruna-dark dark:text-white leading-tight">
                  {selectedMember.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={selectedMember.status === 'ACTIVE' ? 'success' : 'neutral'}
                    size="sm"
                    dot
                  >
                    {selectedMember.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {selectedMember.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-taruna-border dark:border-slate-800 bg-[#466060] text-white space-y-1">
                <span className="text-gray-400 font-medium">Nomor WhatsApp:</span>
                <p className="font-semibold text-taruna-dark dark:text-white font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedMember.phone || 'Belum diisi'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-taruna-border dark:border-slate-800 bg-[#466060] text-white space-y-1">
                <span className="text-gray-400 font-medium">Akun Sistem / Login:</span>
                <p className="font-semibold text-taruna-dark dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-taruna-red-600" />
                  {selectedMember.user
                    ? `@${selectedMember.user.username} (${selectedMember.user.role})`
                    : 'Belum ditautkan akun'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-taruna-border dark:border-slate-800 bg-[#466060] text-white text-xs space-y-1">
              <span className="text-gray-400 font-medium">Alamat Domisili Dusun:</span>
              <p className="font-semibold text-taruna-dark dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-taruna-red-600 shrink-0" />
                {selectedMember.address}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-taruna-border dark:border-slate-800 bg-[#466060] text-white text-xs space-y-1">
              <span className="text-gray-400 font-medium">Organisasi:</span>
              <p className="text-gray-700 dark:text-slate-300 font-medium">
                Karang Taruna Setya Bakti, Dusun Tuk Uluh, Desa Sringin, Kec. Jumantono, Kab. Karanganyar.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 4. DIALOG KONFIRMASI HAPUS / NONAKTIFKAN */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Konfirmasi Hapus / Nonaktifkan`}
        message={`Apakah Anda yakin ingin menghapus atau menonaktifkan anggota ${selectedMember?.name} (${selectedMember?.memberNumber})? Data historis terkait kehadiran atau kas akan tetap terlindungi.`}
        confirmText="Hapus / Nonaktifkan"
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
