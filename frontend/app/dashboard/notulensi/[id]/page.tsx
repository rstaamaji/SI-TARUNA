'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileText,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Printer,
  Copy,
  Check,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';
import { getStoredUser, isUserAdmin, UserRole } from '@/lib/auth';

interface MeetingMinuteDetail {
  id: string;
  meetingDate: string;
  dayOfWeek: string | null;
  title: string;
  location: string;
  meetingLeader: string;
  noteTaker: string;
  content: string;
  conclusion: string | null;
  followUp: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id?: string;
    username: string;
    role?: string;
    member?: {
      id?: string;
      name: string;
      memberNumber?: string;
    } | null;
  };
}

export default function NotulensiDetailPage() {
  const params = useParams();
  const toast = useToast();
  const minuteId = params?.id as string;

  // Layout & Auth
  const [userRole, setUserRole] = useState<UserRole>('MEMBER');

  // Data state
  const [minute, setMinute] = useState<MeetingMinuteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

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

  // Fetch detail
  const fetchDetail = useCallback(async () => {
    if (!minuteId) return;
    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('si_taruna_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/meeting-minutes/${minuteId}`, { headers });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setMinute(json.data);
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [minuteId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const formatDateIndo = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!minute) return;
    const summaryText = `*NOTULENSI RAPAT KARANG TARUNA SETYA BAKTI*
Judul: ${minute.title}
Hari/Tanggal: ${minute.dayOfWeek || ''}, ${formatDateIndo(minute.meetingDate)}
Tempat: ${minute.location}
Pimpinan: ${minute.meetingLeader}
Notulis: ${minute.noteTaker}

*ISI NOTULENSI:*
${minute.content}

*KESIMPULAN:*
${minute.conclusion || '-'}

*TINDAK LANJUT:*
${minute.followUp || '-'}`;

    navigator.clipboard.writeText(summaryText);
    setIsCopied(true);
    toast.success('Ringkasan notulensi berhasil disalin ke clipboard');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6 print:max-w-none">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOOLBAR / NAVIGATION BAR (Hidden on print)
      ───────────────────────────────────────────────────────────────────────────── */}
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-taruna-border dark:border-slate-800 shadow-xs">
            <Link
              href="/dashboard/notulensi"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-taruna-dark dark:hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Notulensi
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                onClick={handleCopySummary}
              >
                {isCopied ? 'Tersalin!' : 'Salin Ringkasan'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
              >
                Cetak / Simpan PDF
              </Button>

              {isAdmin && (
                <Link href="/dashboard/notulensi">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    leftIcon={<Pencil className="w-4 h-4" />}
                  >
                    Kelola di Daftar
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              2. OFFICIAL DOCUMENT CONTAINER
          ───────────────────────────────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-md w-2/3" />
              <div className="h-20 bg-gray-200 dark:bg-slate-800 rounded-md w-full" />
              <div className="h-40 bg-gray-200 dark:bg-slate-800 rounded-md w-full" />
            </div>
          ) : !minute ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="font-bold text-base text-taruna-dark dark:text-white">
                Dokumen notulensi tidak ditemukan
              </p>
              <Link href="/dashboard/notulensi">
                <Button variant="outline" size="sm">
                  Kembali ke Daftar Notulensi
                </Button>
              </Link>
            </div>
          ) : (
            <article className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 shadow-md space-y-8 print:shadow-none print:border-none print:p-4">
              {/* Kop Dokumen Resmi */}
              <div className="flex items-center gap-5 pb-6 border-b-2 border-gray-200 dark:border-slate-800 print:border-black">
                <Logo size={64} showText={false} />
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-taruna-yellow-700 dark:text-taruna-yellow-400 print:text-black">
                    Pemerintah Desa Sringin • Dusun Tuk Uluh
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-taruna-dark dark:text-white uppercase tracking-tight print:text-black">
                    Karang Taruna Setya Bakti
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 print:text-black">
                    RT 01, 02, 03 / RW 01, Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono, Kabupaten Karanganyar
                  </p>
                </div>
              </div>

              {/* Title & Metadata Box */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary" size="sm">
                    NOTULENSI RESMI
                  </Badge>
                  <span className="text-xs text-gray-400">
                    ID: {minute.id.slice(0, 8)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-taruna-dark dark:text-white tracking-tight leading-snug print:text-black">
                  {minute.title}
                </h1>

                {/* Structured Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-taruna-surface dark:bg-slate-800/60 border border-taruna-border/60 dark:border-slate-700/60 print:border print:border-gray-300">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                      Hari &amp; Tanggal:
                    </span>
                    <strong className="text-xs sm:text-sm text-taruna-dark dark:text-slate-200 block print:text-black">
                      {minute.dayOfWeek || ''}, {formatDateIndo(minute.meetingDate)}
                    </strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                      Tempat:
                    </span>
                    <strong className="text-xs sm:text-sm text-taruna-dark dark:text-slate-200 block print:text-black">
                      {minute.location}
                    </strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                      Pimpinan Rapat:
                    </span>
                    <strong className="text-xs sm:text-sm text-taruna-dark dark:text-slate-200 block print:text-black">
                      {minute.meetingLeader}
                    </strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                      Notulis:
                    </span>
                    <strong className="text-xs sm:text-sm text-taruna-dark dark:text-slate-200 block print:text-black">
                      {minute.noteTaker}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────────────────────
                  SECTION 1: ISI NOTULENSI
              ───────────────────────────────────────────────────────────────────────────── */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2 print:text-black">
                  <FileText className="w-4 h-4" />
                  1. Rincian &amp; Jalannya Rapat
                </h3>
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-taruna-border/80 dark:border-slate-800 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-slate-200 whitespace-pre-line font-serif print:text-black print:p-0 print:border-none">
                  {minute.content}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────────────────────
                  SECTION 2: KESIMPULAN RAPAT
              ───────────────────────────────────────────────────────────────────────────── */}
              {minute.conclusion && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2 print:text-black">
                    <CheckCircle2 className="w-4 h-4" />
                    2. Kesimpulan &amp; Keputusan Rapat
                  </h3>
                  <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900/40 text-sm leading-relaxed text-emerald-950 dark:text-emerald-200 whitespace-pre-line print:text-black print:border print:border-gray-400">
                    {minute.conclusion}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────────────────────
                  SECTION 3: TINDAK LANJUT / ACTION ITEMS
              ───────────────────────────────────────────────────────────────────────────── */}
              {minute.followUp && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-taruna-yellow-700 dark:text-taruna-yellow-400 flex items-center gap-2 print:text-black">
                    <Clock className="w-4 h-4" />
                    3. Tindak Lanjut &amp; Rencana Aksi (Action Items)
                  </h3>
                  <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/40 text-sm leading-relaxed text-amber-950 dark:text-amber-200 whitespace-pre-line print:text-black print:border print:border-gray-400">
                    {minute.followUp}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────────────────────
                  SECTION 4: TANDA TANGAN & PENGESAHAN
              ───────────────────────────────────────────────────────────────────────────── */}
              <div className="pt-8 border-t-2 border-gray-200 dark:border-slate-800 print:border-black">
                <div className="flex justify-between items-start text-center text-xs text-gray-600 dark:text-slate-300 print:text-black">
                  <div className="space-y-16 w-52">
                    <p>
                      Mengetahui,<br />
                      <strong>Pimpinan Rapat</strong>
                    </p>
                    <div>
                      <p className="font-bold underline text-taruna-dark dark:text-white print:text-black">
                        {minute.meetingLeader}
                      </p>
                      <p className="text-[11px] text-gray-400 print:text-black">Karang Taruna Setya Bakti</p>
                    </div>
                  </div>

                  <div className="space-y-16 w-52">
                    <p>
                      Tuk Uluh, {formatDateIndo(minute.meetingDate)}<br />
                      <strong>Notulis Rapat</strong>
                    </p>
                    <div>
                      <p className="font-bold underline text-taruna-dark dark:text-white print:text-black">
                        {minute.noteTaker}
                      </p>
                      <p className="text-[11px] text-gray-400 print:text-black">Sekretariat Setya Bakti</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}
    </div>
  );
}
