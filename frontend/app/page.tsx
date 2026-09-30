import React from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  CalendarCheck,
  Bell,
  CalendarDays,
  Coins,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function HomePage() {
  const features = [
    {
      icon: <Wallet className="w-6 h-6 text-taruna-yellow-600" />,
      title: 'Transparansi Keuangan',
      desc: 'Pencatatan kas masuk, kas keluar, dan penarikan kas secara terbuka dan akuntabel.',
    },
    {
      icon: <CalendarCheck className="w-6 h-6 text-taruna-red-600" />,
      title: 'Presensi & Keaktifan',
      desc: 'Mencatat kehadiran anggota dalam pertemuan rutin, rapat, dan kegiatan bersama.',
    },
    {
      icon: <Bell className="w-6 h-6 text-taruna-yellow-600" />,
      title: 'Pengumuman & Notulensi',
      desc: 'Akses cepat informasi resmi organisasi, surat edaran, dan hasil keputusan rapat.',
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-taruna-red-600" />,
      title: 'Jadwal & Arisan',
      desc: 'Kalender agenda kerja bakti, pertemuan bulanan, serta pengundian arisan anggota.',
    },
    {
      icon: <Coins className="w-6 h-6 text-taruna-yellow-600" />,
      title: 'Jimpitan Kelompok',
      desc: 'Rekapitulasi iuran jimpitan per kelompok/RT secara rapi dan tercatat transparan.',
    },
    {
      icon: <Users className="w-6 h-6 text-taruna-red-600" />,
      title: 'Database Anggota',
      desc: 'Pendataan terpusat seluruh pemuda dan pemudi Karang Taruna Springin.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header / Navbar */}
      <header className="border-b border-taruna-border sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-taruna-dark hover:text-taruna-yellow-700 transition"
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-taruna-yellow-500 hover:bg-taruna-yellow-600 active:bg-taruna-yellow-700 rounded-lg shadow-sm transition"
            >
              Portal Anggota
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-taruna-yellow-50/50 to-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-taruna-yellow-100 text-taruna-yellow-800 text-xs font-semibold mb-6 border border-taruna-yellow-200">
                <Sparkles className="w-3.5 h-3.5 text-taruna-red-600" />
                Sistem Informasi Digital Karang Taruna Springin - Jumantono
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-taruna-dark tracking-tight leading-tight">
                Satu Platform Terpadu Untuk{' '}
                <span className="text-taruna-yellow-600">Transparansi</span> &amp;{' '}
                <span className="text-taruna-red-600">Kolaborasi</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
                Mendukung kemajuan organisasi pemuda Karang Taruna Springin, Kecamatan Jumantono.
                Mulai dari laporan kas transparan, presensi kegiatan, agenda arisan, hingga jimpitan kelompok.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-taruna-red-600 hover:bg-taruna-red-700 rounded-xl shadow-md transition"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Masuk ke Sistem
                </Link>
                <a
                  href="#fitur"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-taruna-dark bg-taruna-surface hover:bg-gray-100 border border-taruna-border rounded-xl transition"
                >
                  Lihat Fitur Organisasi
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="fitur" className="py-16 bg-taruna-surface border-y border-taruna-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-taruna-dark tracking-tight">
                Fitur Utama SI-TARUNA
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Dirancang khusus untuk memenuhi tata kelola organisasi pemuda yang rapi, transparan, dan modern.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-taruna-border hover:border-taruna-yellow-300 shadow-sm hover:shadow transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-taruna-surface flex items-center justify-center mb-4 border border-taruna-border group-hover:scale-105 transition">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-taruna-dark group-hover:text-taruna-yellow-700 transition">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-taruna-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <Logo size={36} />
          <p className="text-xs sm:text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SI-TARUNA Karang Taruna Springin - Jumantono. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
