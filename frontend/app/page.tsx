'use client';

import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Logo } from '@/components/ui/Logo';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ThemeToggle } from '@/components/theme/ThemeProvider';

interface CurrentUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  username: string;
  token?: string;
}

export default function UnifiedMainPage() {
  const toast = useToast();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real backend login request with fallback
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const user: CurrentUser = {
          id: json.data.user.id,
          name: json.data.user.member?.name || json.data.user.username,
          role: json.data.user.role,
          username: json.data.user.username,
          token: json.data.token,
        };
        setCurrentUser(user);
        toast.success(`Berhasil masuk sebagai ${user.role}!`);
      } else {
        const errMsg = json.message || 'Username atau password salah.';
        setLoginError(errMsg);
        toast.error(errMsg);
      }
    } catch {
      // Local fallback if backend temporarily unreachable
      const trimmedUser = usernameInput.trim().toLowerCase();
      if (trimmedUser === 'admin' && passwordInput === 'admin123') {
        const user: CurrentUser = {
          id: 'admin-id',
          name: 'Rustam Aji',
          role: 'ADMIN',
          username: 'admin',
        };
        setCurrentUser(user);
        toast.success('Login sebagai ADMIN (Sesi Lokal)');
      } else if (trimmedUser === 'member' && passwordInput === 'member123') {
        const user: CurrentUser = {
          id: 'member-id',
          name: 'Anggota 2',
          role: 'MEMBER',
          username: 'member',
        };
        setCurrentUser(user);
        toast.success('Login sebagai MEMBER (Sesi Lokal)');
      } else {
        setLoginError('Kredensial tidak valid');
        toast.error('Gagal masuk');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast.info('Anda telah keluar dari sistem.');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TAMPILAN HALAMAN LOGIN (JIKA BELUM TERAUTENTIKASI)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors">
        {/* Navbar Ringkas */}
        <header className="border-b border-taruna-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <Logo size={40} />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 hidden sm:inline">
              Sistem Informasi Karang Taruna
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Box Login */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-taruna-yellow-50 dark:bg-slate-800 text-taruna-yellow-700 dark:text-taruna-yellow-400 mb-1">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-taruna-dark dark:text-white tracking-tight">
                Masuk ke SI-TARUNA
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Karang Taruna Setya Bakti — Tuk Uluh, Sringin, Jumantono
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                type="text"
                placeholder="Masukkan username (admin / member)"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />

              <Input
                label="Kata Sandi"
                type="password"
                placeholder="Masukkan password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center text-sm font-bold py-2.5"
                isLoading={isLoggingIn}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Masuk ke Dashboard
              </Button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div className="pt-4 border-t border-taruna-border dark:border-slate-800 text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                Akun Demo Cepat:
              </p>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput('admin');
                    setPasswordInput('admin123');
                  }}
                  className="p-2.5 rounded-xl border border-taruna-yellow-200 dark:border-taruna-yellow-800/40 bg-taruna-yellow-50 dark:bg-taruna-yellow-950/30 hover:bg-taruna-yellow-100 dark:hover:bg-taruna-yellow-900/40 text-left transition flex flex-col group"
                >
                  <span className="text-xs font-bold text-taruna-yellow-900 dark:text-taruna-yellow-300 flex items-center justify-between">
                    Akun ADMIN
                    <ShieldCheck className="w-3.5 h-3.5 text-taruna-red-600 dark:text-red-400" />
                  </span>
                  <span className="text-[11px] text-taruna-yellow-700 dark:text-taruna-yellow-400 font-mono mt-0.5">
                    admin / admin123
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput('member');
                    setPasswordInput('member123');
                  }}
                  className="p-2.5 rounded-xl border border-taruna-border dark:border-slate-800 bg-taruna-surface dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition flex flex-col group"
                >
                  <span className="text-xs font-bold text-taruna-dark dark:text-slate-200 flex items-center justify-between">
                    Akun MEMBER
                    <User className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                    member / member123
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-gray-500 dark:text-slate-500 border-t border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900">
          &copy; {new Date().getFullYear()} Karang Taruna Setya Bakti | Tuk Uluh, Sringin, Jumantono.
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TAMPILAN DASHBOARD RESMI DENGAN ROLE-BASED ACCESS CONTROL (RBAC)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation - Otomatis menyaring menu khusus ADMIN dari MEMBER */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notificationCount={3}
        userRole={currentUser.role}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          user={{
            name: currentUser.name,
            role: currentUser.role,
          }}
          notificationCount={3}
        />

        {/* Sesi Pengguna Bar */}
        <div className="bg-gradient-to-r from-taruna-yellow-500 to-amber-600 dark:from-taruna-yellow-600 dark:to-amber-700 text-white px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold flex-wrap">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span>
              Sesi Aktif: <strong>{currentUser.name}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900 text-taruna-dark dark:text-white">
              Peran: {currentUser.role}
            </span>
            <span className="hidden md:inline text-white/80">
              — Dusun Tuk Uluh, Sringin, Jumantono
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar ke Login
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {currentUser.role === 'MEMBER' ? (
            <MemberDashboard />
          ) : (
            <AdminDashboard />
          )}
        </main>
      </div>
    </div>
  );
}
