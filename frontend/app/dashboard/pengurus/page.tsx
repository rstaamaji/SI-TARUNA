'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Crown,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface PengurusUser {
  id: string;
  username: string;
  email: string | null;
  role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  member?: {
    id: string;
    name: string;
    memberNumber: string;
    phone: string | null;
    address: string | null;
    status: string;
  } | null;
}

export default function PengurusManagementPage() {
  const toast = useToast();
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [users, setUsers] = useState<PengurusUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'SUPERADMIN' | 'ADMIN' | 'MEMBER'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check role authorization on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user') || localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUserRole(parsed.role || '');
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('si_taruna_token')
          : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase =
        typeof window !== 'undefined' && window.location.hostname
          ? `http://${window.location.hostname}:5000/api`
          : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/admin/pengurus`, { headers });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setUsers(json.data);
      } else {
            const demoPengurus: PengurusUser[] = [
      { id: 'u-01', username: 'rustamaji', email: 'rustam@taruna.id', role: 'SUPERADMIN', isApproved: true, approvedAt: '2023-01-01T00:00:00.000Z', approvedBy: 'SYSTEM', createdAt: '2023-01-01T00:00:00.000Z', member: { id: 'm-01', name: 'Rustam Aji', memberNumber: 'KT-SB-001', phone: '081234567801', address: 'RT 01 / RW 01', status: 'ACTIVE' } },
      { id: 'u-02', username: 'ekoprasetyo', email: 'eko@taruna.id', role: 'ADMIN', isApproved: true, approvedAt: '2023-01-05T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-01-05T00:00:00.000Z', member: { id: 'm-02', name: 'Eko Prasetyo', memberNumber: 'KT-SB-002', phone: '081234567802', address: 'RT 02 / RW 01', status: 'ACTIVE' } },
      { id: 'u-03', username: 'bambangsetyawan', email: 'bambang@taruna.id', role: 'ADMIN', isApproved: true, approvedAt: '2023-02-01T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-02-01T00:00:00.000Z', member: { id: 'm-03', name: 'Bambang Setyawan', memberNumber: 'KT-SB-003', phone: '081234567803', address: 'RT 01 / RW 01', status: 'ACTIVE' } },
      { id: 'u-04', username: 'wahyu', email: 'wahyu@taruna.id', role: 'MEMBER', isApproved: true, approvedAt: '2023-02-15T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-02-15T00:00:00.000Z', member: { id: 'm-04', name: 'Wahyu Pratama', memberNumber: 'KT-SB-004', phone: '081234567804', address: 'RT 02 / RW 01', status: 'ACTIVE' } },
      { id: 'u-05', username: 'sitirahma', email: 'siti@taruna.id', role: 'MEMBER', isApproved: true, approvedAt: '2023-03-01T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-03-01T00:00:00.000Z', member: { id: 'm-05', name: 'Siti Rahmawati', memberNumber: 'KT-SB-005', phone: '081234567805', address: 'RT 02 / RW 01', status: 'ACTIVE' } },
    ];
    setUsers(demoPengurus);
      }
    } catch {
          const demoPengurus: PengurusUser[] = [
      { id: 'u-01', username: 'rustamaji', email: 'rustam@taruna.id', role: 'SUPERADMIN', isApproved: true, approvedAt: '2023-01-01T00:00:00.000Z', approvedBy: 'SYSTEM', createdAt: '2023-01-01T00:00:00.000Z', member: { id: 'm-01', name: 'Rustam Aji', memberNumber: 'KT-SB-001', phone: '081234567801', address: 'RT 01 / RW 01', status: 'ACTIVE' } },
      { id: 'u-02', username: 'ekoprasetyo', email: 'eko@taruna.id', role: 'ADMIN', isApproved: true, approvedAt: '2023-01-05T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-01-05T00:00:00.000Z', member: { id: 'm-02', name: 'Eko Prasetyo', memberNumber: 'KT-SB-002', phone: '081234567802', address: 'RT 02 / RW 01', status: 'ACTIVE' } },
      { id: 'u-03', username: 'bambangsetyawan', email: 'bambang@taruna.id', role: 'ADMIN', isApproved: true, approvedAt: '2023-02-01T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-02-01T00:00:00.000Z', member: { id: 'm-03', name: 'Bambang Setyawan', memberNumber: 'KT-SB-003', phone: '081234567803', address: 'RT 01 / RW 01', status: 'ACTIVE' } },
      { id: 'u-04', username: 'wahyu', email: 'wahyu@taruna.id', role: 'MEMBER', isApproved: true, approvedAt: '2023-02-15T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-02-15T00:00:00.000Z', member: { id: 'm-04', name: 'Wahyu Pratama', memberNumber: 'KT-SB-004', phone: '081234567804', address: 'RT 02 / RW 01', status: 'ACTIVE' } },
      { id: 'u-05', username: 'sitirahma', email: 'siti@taruna.id', role: 'MEMBER', isApproved: true, approvedAt: '2023-03-01T00:00:00.000Z', approvedBy: 'Rustam Aji', createdAt: '2023-03-01T00:00:00.000Z', member: { id: 'm-05', name: 'Siti Rahmawati', memberNumber: 'KT-SB-005', phone: '081234567805', address: 'RT 02 / RW 01', status: 'ACTIVE' } },
    ];
    setUsers(demoPengurus);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUserRole === 'SUPERADMIN') {
      fetchUsers();
    } else if (currentUserRole && currentUserRole !== 'SUPERADMIN') {
      setIsLoading(false);
    }
  }, [currentUserRole, fetchUsers]);

  // Handle Change Role (Promote to ADMIN or Demote to MEMBER)
  const handleChangeRole = async (user: PengurusUser, targetRole: 'ADMIN' | 'MEMBER') => {
    if (user.role === 'SUPERADMIN') return;
    setActionLoading(user.id);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('si_taruna_token')
          : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase =
        typeof window !== 'undefined' && window.location.hostname
          ? `http://${window.location.hostname}:5000/api`
          : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/admin/pengurus/${user.id}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: targetRole }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        toast.success(json.message);
        fetchUsers();
      } else {
        toast.error(json.message || 'Gagal mengubah role pengurus.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.member?.name && u.member.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.member?.memberNumber && u.member.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRole && matchSearch;
  });

  const totalSuperAdmin = users.filter((u) => u.role === 'SUPERADMIN').length;
  const totalAdminActive = users.filter((u) => u.role === 'ADMIN').length;
  const totalMembers = users.filter((u) => u.role === 'MEMBER').length;

  // Access denied state for non-SUPERADMIN
  if (currentUserRole && currentUserRole !== 'SUPERADMIN') {
    return (
      <div className="py-12">
        <Card className="max-w-xl mx-auto border-red-200 dark:border-red-900/50 shadow-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-950/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-taruna-dark dark:text-white">
              Akses Dibatasi (Khusus Superadmin)
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              Halaman <strong>Kelola Pengurus</strong> hanya dapat diakses secara eksklusif oleh <strong>Superadmin</strong> untuk menjaga integritas otorisasi pengurus Karang Taruna.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-taruna-yellow-500 hover:bg-taruna-yellow-600 text-white font-bold text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#466060] text-white p-6 rounded-3xl border border-[#163E4F] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Link
              href="/dashboard"
              className="text-xs text-[#D6DDD5] font-bold hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-[#D6DDD5]/60">•</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#163E4F] text-amber-300 border border-amber-400/40">
              👑 OTORITAS SUPERADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Kelola Otorisasi Pengurus
          </h1>
          <p className="text-xs sm:text-sm text-[#D6DDD5] mt-1">
            Konfirmasi akses, angkat anggota menjadi admin, atau cabut hak akses pengurus Dusun Tuk Uluh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchUsers}
            disabled={isLoading}
            className="bg-[#163E4F] hover:bg-[#163E4F]/80 text-white border border-[#466060]"
          >
            {isLoading ? 'Memuat...' : 'Muat Ulang'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!bg-[#6A8578] text-white border border-[#466060] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
                Superadmin
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {totalSuperAdmin} Akun
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#466060] text-amber-300 border border-[#163E4F]">
              <Crown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-[#6A8578] text-white border border-[#466060] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
                Pengurus Aktif (ADMIN)
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {totalAdminActive} Pengurus
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#466060] text-[#38BDF8] border border-[#163E4F]">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-[#6A8578] text-white border border-[#466060] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider">
                Anggota Biasa (MEMBER)
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {totalMembers} Anggota
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#466060] text-[#4ADE80] border border-[#163E4F]">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="!bg-[#6A8578] text-white border border-[#466060]">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <Input
              placeholder="Cari nama, username, atau no anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-[#D6DDD5]" />}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-[#D6DDD5]">Filter Role:</span>
            {(['ALL', 'SUPERADMIN', 'ADMIN', 'MEMBER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  filterRole === r
                    ? 'bg-[#163E4F] text-white border-[#466060] shadow-xs'
                    : 'bg-[#466060] text-[#D6DDD5] hover:bg-[#163E4F] hover:text-white border-transparent'
                }`}
              >
                {r === 'ALL' ? 'Semua' : r}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="!bg-[#6A8578] text-white border border-[#466060] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Daftar Akun Pengguna &amp; Status Hak Akses</CardTitle>
          <CardDescription className="text-[#D6DDD5]">
            Hanya Superadmin yang berwenang menetapkan siapa saja yang memiliki hak kelola sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto rounded-2xl border border-[#466060] bg-[#163E4F]/40 shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#163E4F] bg-[#466060] text-xs font-bold uppercase text-white">
                  <th className="py-3.5 px-4 text-white">Pengguna</th>
                  <th className="py-3.5 px-4 text-white">Anggota Terkait</th>
                  <th className="py-3.5 px-4 text-white">Role Sistem</th>
                  <th className="py-3.5 px-4 text-white">Status Konfirmasi</th>
                  <th className="py-3.5 px-4 text-white">Dikonfirmasi Oleh</th>
                  <th className="py-3.5 px-4 text-right text-white">Aksi Superadmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#466060]/50 text-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#D6DDD5]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#4ADE80]" />
                      Memuat data pengurus...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#D6DDD5]">
                      Tidak ada data pengguna yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.role === 'SUPERADMIN';
                    const isBusy = actionLoading === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#466060]/30 transition">
                        {/* Pengguna */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.role === 'SUPERADMIN' && <Crown className="w-4 h-4 text-amber-300" />}
                            {u.username}
                          </div>
                          {u.email && <div className="text-xs text-[#D6DDD5]">{u.email}</div>}
                        </td>

                        {/* Anggota Terkait */}
                        <td className="py-3.5 px-4">
                          {u.member ? (
                            <div>
                              <p className="font-semibold text-white">
                                {u.member.name}
                              </p>
                              <p className="text-xs text-[#D6DDD5]">
                                {u.member.memberNumber} • {u.member.phone || '-'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-[#D6DDD5]/60 italic">
                              Tidak tertaut ke anggota
                            </span>
                          )}
                        </td>

                        {/* Role Sistem */}
                        <td className="py-3.5 px-4">
                          {u.role === 'SUPERADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#163E4F] text-amber-300 border border-amber-400/50">
                              👑 SUPERADMIN
                            </span>
                          ) : u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-[#38BDF8] border border-sky-400/50">
                              🛡️ ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#163E4F] text-[#D6DDD5] border border-[#466060]">
                              👤 MEMBER
                            </span>
                          )}
                        </td>

                        {/* Status Konfirmasi */}
                        <td className="py-3.5 px-4">
                          {u.role === 'SUPERADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Otoritas Utama
                            </span>
                          ) : u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#38BDF8]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pengurus Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4ADE80]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Anggota Biasa
                            </span>
                          )}
                        </td>

                        {/* Dikonfirmasi Oleh */}
                        <td className="py-3.5 px-4 text-xs text-[#D6DDD5]">
                          {u.approvedBy ? (
                            <div>
                              <p className="font-semibold text-white">{u.approvedBy}</p>
                              {u.approvedAt && (
                                <p className="text-[11px] text-[#D6DDD5]/80">
                                  {new Date(u.approvedAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="italic">-</span>
                          )}
                        </td>

                        {/* Aksi Superadmin */}
                        <td className="py-3.5 px-4 text-right">
                          {isSelf ? (
                            <span className="text-xs font-bold text-amber-300 px-3 py-1 bg-[#163E4F] rounded-xl border border-amber-400/40">
                              Akun Pemilik
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              {u.role === 'ADMIN' ? (
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleChangeRole(u, 'MEMBER')}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#163E4F] hover:bg-rose-950/60 text-[#F87171] border border-rose-500/40 transition inline-flex items-center gap-1.5 shadow-xs"
                                  title="Copot jabatan Admin (kembalikan ke Member biasa)"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Copot Admin</span>
                                </button>
                              ) : (
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleChangeRole(u, 'ADMIN')}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#163E4F] hover:bg-emerald-950/60 text-[#4ADE80] border border-emerald-500/40 transition inline-flex items-center gap-1.5 shadow-xs"
                                  title="Angkat menjadi Admin"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Angkat Admin</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
