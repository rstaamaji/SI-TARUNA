'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#466060] bg-[#163E4F] text-white print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Organization Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <Logo size={42} showText={false} href="/dashboard" />
              <div>
                <h3 className="text-base font-black tracking-tight text-white">
                  SI-TARUNA
                </h3>
                <p className="text-xs font-semibold text-[#FDE047]">
                  Sistem Informasi Karang Taruna
                </p>
                <p className="text-xs font-bold text-[#38BDF8]">
                  Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono
                </p>
              </div>
            </div>
            <p className="text-xs text-[#D6DDD5] leading-relaxed max-w-md pt-1 font-medium">
              Platform tata kelola dan administrasi terpadu pemuda-pemudi Karang Taruna: transparansi kas keuangan, rekapitulasi kehadiran kegiatan, pengundian arisan warga, serta distribusi pengumuman warga secara realtime.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#466060] border border-[#6A8578] text-[11px] font-semibold text-[#4ADE80]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              <span>Sistem Aktif &amp; Terverifikasi Aman</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
            </div>
          </div>

          {/* Quick Navigations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Layanan Utama
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dashboard"
                  className="text-[#D6DDD5] hover:text-white transition font-medium"
                >
                  Dashboard Ringkasan
                </Link>
              </li>
              <li>
                <Link
                  href="/finance"
                  className="text-[#D6DDD5] hover:text-white transition font-medium"
                >
                  Transparansi Keuangan Kas
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/kegiatan"
                  className="text-[#D6DDD5] hover:text-white transition font-medium"
                >
                  Agenda &amp; Jadwal Kegiatan
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/arisan"
                  className="text-[#D6DDD5] hover:text-white transition font-medium"
                >
                  Jadwal &amp; Riwayat Arisan
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/absensi"
                  className="text-[#D6DDD5] hover:text-white transition font-medium"
                >
                  Presensi &amp; Kegiatan Warga
                </Link>
              </li>
            </ul>
          </div>

          {/* Information & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Informasi &amp; Kontak
            </h4>
            <ul className="space-y-2 text-xs text-[#D6DDD5]">
              <li className="flex flex-col">
                <span className="text-[11px] text-[#D6DDD5]/80 font-medium">Sekretariat:</span>
                <span className="font-semibold text-white">Balai Dusun Tuk Uluh</span>
                <span>Desa Sringin, Kec. Jumantono</span>
              </li>
              <li className="flex flex-col pt-1">
                <span className="text-[11px] text-[#D6DDD5]/80 font-medium">Tahun Kepengurusan:</span>
                <span className="font-bold text-white">2026 - 2029</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#466060] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D6DDD5]">
          <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-white">SI-TARUNA</span>
            <span>&bull;</span>
            <span className="font-semibold text-[#FDE047]">
              Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Hak Cipta &copy; {currentYear}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#D6DDD5]">
            <span>Dibangun dengan dedikasi untuk kemajuan pemuda</span>
            <Heart className="w-3.5 h-3.5 text-[#F87171] fill-[#F87171] inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
