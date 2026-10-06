'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-taruna-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Organization Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <Logo size={42} showText={false} href="/dashboard" />
              <div>
                <h3 className="text-base font-black tracking-tight text-taruna-dark dark:text-white">
                  SI-TARUNA
                </h3>
                <p className="text-xs font-semibold text-taruna-yellow-600 dark:text-taruna-yellow-400">
                  Sistem Informasi Karang Taruna
                </p>
                <p className="text-xs font-bold text-taruna-red-600 dark:text-red-400">
                  Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-md pt-1">
              Platform tata kelola dan administrasi terpadu pemuda-pemudi Karang Taruna: transparansi kas keuangan, rekapitulasi kehadiran kegiatan, pengundian arisan warga, serta distribusi pengumuman warga secara realtime.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Aktif &amp; Terverifikasi Aman</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          {/* Quick Navigations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">
              Layanan Utama
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-600 dark:text-slate-300 hover:text-taruna-yellow-600 dark:hover:text-taruna-yellow-400 transition"
                >
                  Dashboard Ringkasan
                </Link>
              </li>
              <li>
                <Link
                  href="/finance"
                  className="text-gray-600 dark:text-slate-300 hover:text-taruna-yellow-600 dark:hover:text-taruna-yellow-400 transition"
                >
                  Transparansi Keuangan Kas
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/kegiatan"
                  className="text-gray-600 dark:text-slate-300 hover:text-taruna-yellow-600 dark:hover:text-taruna-yellow-400 transition"
                >
                  Agenda &amp; Jadwal Kegiatan
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/arisan"
                  className="text-gray-600 dark:text-slate-300 hover:text-taruna-yellow-600 dark:hover:text-taruna-yellow-400 transition"
                >
                  Jadwal &amp; Riwayat Arisan
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/absensi"
                  className="text-gray-600 dark:text-slate-300 hover:text-taruna-yellow-600 dark:hover:text-taruna-yellow-400 transition"
                >
                  Presensi &amp; Kegiatan Warga
                </Link>
              </li>
            </ul>
          </div>

          {/* Information & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">
              Informasi &amp; Kontak
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-slate-300">
              <li className="flex flex-col">
                <span className="text-[11px] text-gray-400 dark:text-slate-500">Sekretariat:</span>
                <span className="font-medium">Balai Dusun Tuk Uluh</span>
                <span>Desa Sringin, Kec. Jumantono</span>
              </li>
              <li className="flex flex-col pt-1">
                <span className="text-[11px] text-gray-400 dark:text-slate-500">Tahun Kepengurusan:</span>
                <span className="font-semibold text-taruna-dark dark:text-white">2026 - 2029</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-taruna-border/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-slate-400">
          <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-taruna-dark dark:text-white">SI-TARUNA</span>
            <span>&bull;</span>
            <span className="font-medium text-taruna-red-600 dark:text-red-400">
              Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Hak Cipta &copy; {currentYear}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500">
            <span>Dibangun dengan dedikasi untuk kemajuan pemuda</span>
            <Heart className="w-3.5 h-3.5 text-taruna-red-500 fill-taruna-red-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
