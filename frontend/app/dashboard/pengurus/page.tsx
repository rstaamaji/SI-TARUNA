'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#466060] text-white p-6 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Link
              href="/dashboard"
              className="text-xs text-taruna-yellow-600 dark:text-taruna-yellow-400 font-bold hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-gray-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              👑 OTORITAS SUPERADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight">
            Kelola Otorisasi Pengurus
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
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
          >
            {isLoading ? 'Memuat...' : 'Muat Ulang'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-t-4 border-t-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Superadmin
              </p>
              <p className="text-2xl font-black text-taruna-dark dark:text-white mt-1">
                {totalSuperAdmin} Akun
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              <Crown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Pengurus Aktif (ADMIN)
              </p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {totalAdminActive} Pengurus
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Anggota Biasa (MEMBER)
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {totalMembers} Anggota
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <Input
              placeholder="Cari nama, username, atau no anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Filter Role:</span>
            {(['ALL', 'SUPERADMIN', 'ADMIN', 'MEMBER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterRole === r
                    ? 'bg-taruna-yellow-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {r === 'ALL' ? 'Semua' : r}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Akun Pengguna &amp; Status Hak Akses</CardTitle>
          <CardDescription>
            Hanya Superadmin yang berwenang menetapkan siapa saja yang memiliki hak kelola sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-taruna-border dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 text-xs font-bold uppercase text-gray-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Anggota Terkait</th>
                  <th className="py-3.5 px-4">Role Sistem</th>
                  <th className="py-3.5 px-4">Status Konfirmasi</th>
                  <th className="py-3.5 px-4">Dikonfirmasi Oleh</th>
                  <th className="py-3.5 px-4 text-right">Aksi Superadmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taruna-border dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-taruna-yellow-500" />
                      Memuat data pengurus...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-slate-500">
                      Tidak ada data pengguna yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.role === 'SUPERADMIN';
                    const isBusy = actionLoading === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                        {/* Pengguna */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-taruna-dark dark:text-white flex items-center gap-1.5">
                            {u.role === 'SUPERADMIN' && <Crown className="w-4 h-4 text-amber-500" />}
                            {u.username}
                          </div>
                          {u.email && <div className="text-xs text-gray-400 dark:text-slate-500">{u.email}</div>}
                        </td>

                        {/* Anggota Terkait */}
                        <td className="py-3.5 px-4">
                          {u.member ? (
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-slate-200">
                                {u.member.name}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                {u.member.memberNumber} • {u.member.phone || '-'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-slate-500 italic">
                              Tidak tertaut ke anggota
                            </span>
                          )}
                        </td>

                        {/* Role Sistem */}
                        <td className="py-3.5 px-4">
                          {u.role === 'SUPERADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              👑 SUPERADMIN
                            </span>
                          ) : u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                              🛡️ ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                              👤 MEMBER
                            </span>
                          )}
                        </td>

                        {/* Status Konfirmasi */}
                        <td className="py-3.5 px-4">
                          {u.role === 'SUPERADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Otoritas Utama
                            </span>
                          ) : u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pengurus Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Anggota Biasa
                            </span>
                          )}
                        </td>

                        {/* Dikonfirmasi Oleh */}
                        <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-slate-400">
                          {u.approvedBy ? (
                            <div>
                              <p className="font-semibold text-gray-700 dark:text-slate-300">{u.approvedBy}</p>
                              {u.approvedAt && (
                                <p className="text-[11px] text-gray-400">
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
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                              Akun Pemilik
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              {u.role === 'ADMIN' ? (
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleChangeRole(u, 'MEMBER')}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800 transition inline-flex items-center gap-1.5 shadow-xs"
                                  title="Copot jabatan Admin (kembalikan ke Member biasa)"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Copot Admin</span>
                                </button>
                              ) : (
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleChangeRole(u, 'ADMIN')}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition inline-flex items-center gap-1.5"
                                  title="Angkat anggota ini menjadi Pengurus (Admin)"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
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
