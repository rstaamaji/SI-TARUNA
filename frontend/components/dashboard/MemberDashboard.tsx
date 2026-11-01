'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  BadgeCheck,
  Building2,
  FileText,
  BookOpen,
  CalendarDays,
  Gift,
  Eye,
  Shovel,
  Info,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Modal } from '@/components/ui/Modal';

export interface CommunityServiceItem {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  dayOfWeek?: string | null;
  time?: string | null;
  location: string;
  equipment?: string;
  status?: string;
}

export interface ArisanSummaryData {
  monthlyFee: number;
  totalPot: number;
  currentCycleMonth: number;
  currentCycleYear: number;
  nextDrawDate: string;
  nextDrawLocation: string;
  recipientName: string;
  recipientNumber?: string;
  memberStatus: string;
  notes?: string;
  recentDraws: {
    id: string;
    month: number;
    year: number;
    drawDate: string | null;
    status: string;
    winnerName: string;
    winnerNumber: string;
  }[];
}

export interface MeetingMinuteItem {
  id: string;
  title: string;
  meetingDate: string;
  dayOfWeek: string | null;
  location: string;
  meetingLeader: string;
  noteTaker: string;
  content: string;
  conclusion: string | null;
  followUp: string | null;
  author: string;
  agendaConnection?: string;
}

export interface MemberDashboardData {
  memberProfile: {
    id: string | null;
    name: string;
    memberNumber: string;
    role: string;
    gender: string;
    address: string;
    status: string;
    joinDate: string;
  };
  communityServiceEvents: CommunityServiceItem[];
  arisanInfo: ArisanSummaryData;
  meetingMinutes: MeetingMinuteItem[];
}

// Fallback data realistis Dusun Tuk Uluh, Desa Sringin, Jumantono
const FALLBACK_DASHBOARD: MemberDashboardData = {
  memberProfile: {
    id: 'm-04',
    name: 'Wahyu Pratama',
    memberNumber: 'KT-SB-004',
    role: 'MEMBER',
    gender: 'MALE',
    address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
    status: 'ACTIVE',
    joinDate: '2023-02-15T00:00:00.000Z',
  },
  communityServiceEvents: [
    {
      id: 'cs-1',
      title: 'Kerja Bakti Bersih Saluran Air & Selokan Dusun',
      description:
        'Pembersihan sedimentasi lumpur saluran air irigasi dusun dan pemotongan rumput liar sepanjang jalan utama Dusun Tuk Uluh guna mengantisipasi genangan musim penghujan. Seluruh pemuda diharapkan hadir membawa alat kerja.',
      eventDate: '2026-10-12T06:30:00.000Z',
      dayOfWeek: 'Minggu',
      time: '06:30 WIB - Selesai',
      location: 'Area Saluran Air & Jalan Utama Dusun Tuk Uluh',
      equipment: 'Cangkul, sabit, karung goni, dan gerobak dorong',
      status: 'UPCOMING',
    },
    {
      id: 'cs-2',
      title: 'Kerja Bakti Pengecatan Gapura & Peremajaan Pos Ronda RT 02',
      description:
        'Pengecatan ulang gapura batas dusun dan perbaikan atap pos kamling RT 02 demi kenyamanan ronda malam dan keamanan lingkungan warga Dusun Tuk Uluh.',
      eventDate: '2026-10-19T07:00:00.000Z',
      dayOfWeek: 'Minggu',
      time: '07:00 WIB',
      location: 'Gapura Utama & Pos Ronda RT 02',
      equipment: 'Kuas, amplas, sapu lidi, ember',
      status: 'UPCOMING',
    },
  ],
  arisanInfo: {
    monthlyFee: 20000,
    totalPot: 500000,
    currentCycleMonth: 10,
    currentCycleYear: 2026,
    nextDrawDate: '2026-10-05T19:30:00.000Z',
    nextDrawLocation: 'Balai Dusun Tuk Uluh',
    recipientName: 'Eko Prasetyo',
    recipientNumber: 'KT-SB-004',
    memberStatus: 'BELUM_DAPAT',
    notes: 'Kocokan putaran ke-9 akan diadakan bersamaan dengan silaturahmi rutin bulanan.',
    recentDraws: [
      {
        id: 'ar-1',
        month: 9,
        year: 2026,
        drawDate: '2026-09-10T19:30:00.000Z',
        status: 'WON',
        winnerName: 'Anggota 3',
        winnerNumber: 'KT-SB-003',
      },
      {
        id: 'ar-2',
        month: 8,
        year: 2026,
        drawDate: '2026-08-10T19:30:00.000Z',
        status: 'WON',
        winnerName: 'Anggota 2',
        winnerNumber: 'KT-SB-002',
      },
      {
        id: 'ar-3',
        month: 7,
        year: 2026,
        drawDate: '2026-07-10T19:30:00.000Z',
        status: 'WON',
        winnerName: 'Rustam Aji',
        winnerNumber: 'KT-SB-001',
      },
    ],
  },
  meetingMinutes: [
    {
      id: 'mm-1',
      title: 'Rapat Pleno: Evaluasi Kas & Kesepakatan Jadwal Kerja Bakti Saluran Air',
      meetingDate: '2026-09-10T19:30:00.000Z',
      dayOfWeek: 'Kamis',
      location: 'Balai Dusun Tuk Uluh, Desa Sringin',
      meetingLeader: 'Rustam Aji (Super Admin)',
      noteTaker: 'Siti Nurhaliza (Sekretaris)',
      content:
        'Rapat pleno membahas transparansi kas bulanan, persiapan kerja bakti lingkungan menyongsong musim hujan, serta pembagian jadwal arisan putaran ke-9. Seluruh pemuda yang hadir menyetujui laporan kas dan menyepakati kerja bakti dilaksanakan serentak.',
      conclusion:
        '1. Laporan keuangan kas disetujui tanpa catatan perbaikan.\n2. Disepakati kerja bakti pembersihan saluran air dilaksanakan pada Minggu, 12 Oktober 2026 pukul 06.30 WIB.\n3. Kas mengalokasikan anggaran konsumsi kerja bakti sebesar Rp 150.000.',
      followUp:
        'Seksi perlengkapan (Sdr. Bambang) mengecek kesiapan cangkul dusun, dan bendahara mengumumkan rincian kas di papan info.',
      author: 'Siti Nurhaliza',
      agendaConnection: 'Berkaitan langsung dengan agenda Kerja Bakti 12 Oktober 2026',
    },
    {
      id: 'mm-2',
      title: 'Rapat Koordinasi: Mekanisme Giliran Arisan & Iuran Pemuda Dusun',
      meetingDate: '2026-08-10T19:30:00.000Z',
      dayOfWeek: 'Senin',
      location: 'Kediaman Sdr. Bambang (RT 01 Dusun Tuk Uluh)',
      meetingLeader: 'Rustam Aji (Super Admin)',
      noteTaker: 'Dewi Lestari',
      content:
        'Koordinasi penetapan batas waktu penyetoran arisan tiap tanggal 10 dan ketentuan tuan rumah tempat pertemuan arisan agar bergilir secara adil antar RT 01, 02, dan 03.',
      conclusion:
        '1. Iuran wajib arisan diserahkan sebelum tanggal 10 tiap bulan.\n2. Putaran arisan berikutnya bertempat di Balai Dusun Tuk Uluh dengan tuan rumah Sdr. Eko Prasetyo.',
      followUp:
        'Penyampaian undangan melalui grup pemuda dan penyiapan kupon arisan.',
      author: 'Dewi Lestari',
      agendaConnection: 'Berkaitan dengan pelaksanaan Arisan Pemuda Oktober 2026',
    },
  ],
};

export const MemberDashboard: React.FC = () => {
  const [data, setData] = useState<MemberDashboardData>(FALLBACK_DASHBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [activeEvent, setActiveEvent] = useState<CommunityServiceItem | null>(null);
  const [activeMinute, setActiveMinute] = useState<MeetingMinuteItem | null>(null);

  const getApiBase = () => {
    return typeof window !== 'undefined' && window.location.hostname
      ? `http://${window.location.hostname}:5000/api`
      : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';
  };

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('si_taruna_token');
  };

  // Load dashboard data from API with fallback
  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/member/dashboard`, { headers });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const raw = json.data;

        // Map events to community service
        const eventsList: CommunityServiceItem[] = Array.isArray(raw.upcomingEvents) && raw.upcomingEvents.length > 0
          ? raw.upcomingEvents.map((e: any) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              eventDate: e.eventDate,
              dayOfWeek: e.dayOfWeek,
              time: e.time,
              location: e.location,
              equipment: e.type === 'COMMUNITY_SERVICE' ? 'Cangkul, sabit, karung sampah dusun' : 'Peralatan gotong royong',
              status: 'UPCOMING',
            }))
          : FALLBACK_DASHBOARD.communityServiceEvents;

        // Map arisan info
        const arisanInfo: ArisanSummaryData = raw.arisanSummary
          ? {
              monthlyFee: raw.arisanSummary.monthlyFee || 20000,
              totalPot: raw.arisanSummary.totalPot || 500000,
              currentCycleMonth: raw.arisanSummary.currentCycleMonth || 10,
              currentCycleYear: raw.arisanSummary.currentCycleYear || 2026,
              nextDrawDate: raw.arisanSummary.nextDrawDate || '2026-10-05T19:30:00.000Z',
              nextDrawLocation: raw.arisanSummary.nextDrawLocation || 'Balai Dusun Tuk Uluh',
              recipientName: raw.arisanSummary.nearestArisan?.recipientName || 'Eko Prasetyo',
              recipientNumber: raw.arisanSummary.nearestArisan?.recipientNumber || 'KT-SB-004',
              memberStatus: raw.arisanSummary.memberStatus || 'BELUM_DAPAT',
              notes: 'Pertemuan arisan rutin dan silaturahmi pemuda dusun.',
              recentDraws: Array.isArray(raw.arisanSummary.recentDraws) ? raw.arisanSummary.recentDraws : FALLBACK_DASHBOARD.arisanInfo.recentDraws,
            }
          : FALLBACK_DASHBOARD.arisanInfo;

        // Map meeting minutes
        const minutesList: MeetingMinuteItem[] = Array.isArray(raw.meetingMinutes) && raw.meetingMinutes.length > 0
          ? raw.meetingMinutes.map((m: any, idx: number) => ({
              id: m.id,
              title: m.title,
              meetingDate: m.meetingDate,
              dayOfWeek: m.dayOfWeek,
              location: m.location,
              meetingLeader: m.meetingLeader,
              noteTaker: m.noteTaker,
              content: m.content,
              conclusion: m.conclusion,
              followUp: m.followUp,
              author: m.author,
              agendaConnection: idx === 0 ? 'Membahas agenda kerja bakti & arisan mendatang' : 'Evaluasi program kerja sebelumnya',
            }))
          : FALLBACK_DASHBOARD.meetingMinutes;

        setData({
          memberProfile: raw.memberProfile || FALLBACK_DASHBOARD.memberProfile,
          communityServiceEvents: eventsList,
          arisanInfo,
          meetingMinutes: minutesList,
        });
      } else {
        setData(FALLBACK_DASHBOARD);
      }
    } catch {
      setData(FALLBACK_DASHBOARD);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER PROFIL ANGGOTA & KARTU SELAMAT DATANG (BAGIAN UTAMA #466060)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#466060] text-white p-6 sm:p-8 rounded-3xl border border-[#163E4F] shadow-lg transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <Logo size={60} showText={false} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D6DDD5]">
                  Dashboard Anggota
                </span>
                <span className="text-[#D6DDD5]/60">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
                  {data.memberProfile.memberNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6A8578] text-white border border-[#163E4F] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {data.memberProfile.status === 'ACTIVE' ? 'Anggota Aktif' : 'Non-Aktif'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Halo, {data.memberProfile.name}! 👋
              </h1>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-[#D6DDD5] flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#D6DDD5]" />
                  {data.memberProfile.address}
                </span>
                <span className="hidden sm:inline text-[#D6DDD5]/60">•</span>
                <span className="inline-flex items-center gap-1 text-[#D6DDD5]">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <Button
              variant="secondary"
              size="sm"
              isLoading={isLoading}
              onClick={fetchDashboard}
              className="bg-[#6A8578] hover:bg-[#163E4F] text-white border-[#163E4F] hover:border-[#6A8578] transition shadow-sm"
            >
              Segarkan Data
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. PENGUMUMAN KEGIATAN: KERJA BAKTI & GOTONG ROYONG WARGA
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="bg-[#466060] text-white p-5 sm:p-6 rounded-3xl border border-[#163E4F] shadow-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#163E4F] text-amber-300 border border-[#6A8578] shadow-sm">
              <Shovel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Pengumuman Kegiatan Kerja Bakti &amp; Gotong Royong
              </h2>
              <p className="text-xs font-semibold text-[#D6DDD5]">
                Jadwal pembersihan lingkungan, saluran air, dan kerja bakti bersama warga pemuda Dusun Tuk Uluh
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
            {data.communityServiceEvents.length} Agenda Terjadwal
          </span>
        </div>

        {data.communityServiceEvents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#6A8578] text-white border border-[#466060] text-center">
            <Info className="w-8 h-8 text-[#D6DDD5] mx-auto mb-2" />
            <p className="font-bold text-sm text-white">Belum ada jadwal kerja bakti baru</p>
            <p className="text-xs text-[#D6DDD5] mt-1">Pengumuman kerja bakti berikutnya akan segera diumumkan di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.communityServiceEvents.map((event) => (
              <div
                key={event.id}
                className="p-5 rounded-3xl bg-[#6A8578] text-white border border-[#466060] hover:border-amber-300 shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#466060] border border-[#163E4F] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide block">
                        {event.dayOfWeek || 'Hari Pelaksanaan'}
                      </span>
                      <span className="text-sm font-black text-white">
                        {formatDateIndo(event.eventDate)}
                      </span>
                    </div>
                    {event.time && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#163E4F] text-amber-300 border border-[#6A8578] shrink-0">
                        {event.time}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#163E4F] text-amber-300 border border-[#6A8578]">
                        KERJA BAKTI
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {event.title}
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#D6DDD5]">
                    <p className="inline-flex items-center gap-1.5 font-semibold text-white">
                      <MapPin className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                      <span>{event.location}</span>
                    </p>
                    {event.description && (
                      <p className="leading-relaxed line-clamp-3 text-[#D6DDD5]">
                        {event.description}
                      </p>
                    )}
                    {event.equipment && (
                      <div className="p-2.5 rounded-xl bg-[#466060] border border-[#163E4F] text-[11px] text-[#D6DDD5]">
                        <strong className="text-amber-300 block mb-0.5">Alat yang dibawa:</strong>
                        <span>{event.equipment}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#466060] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#D6DDD5]/80">
                    Wajib Hadir Pemuda Dusun
                  </span>
                  <button
                    onClick={() => setActiveEvent(event)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#163E4F] hover:bg-[#466060] text-white font-bold transition inline-flex items-center gap-1.5 border border-[#6A8578] shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-300" />
                    <span>Rincian Kegiatan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. PENGUMUMAN & INFORMASI ARISAN PEMUDA
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="bg-[#466060] text-white p-5 sm:p-6 rounded-3xl border border-[#163E4F] shadow-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#163E4F] text-amber-300 border border-[#6A8578] shadow-sm">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Pengumuman &amp; Informasi Arisan Pemuda
              </h2>
              <p className="text-xs font-semibold text-[#D6DDD5]">
                Jadwal putaran terdekat, lokasi pertemuan tuan rumah, dan rekapitulasi penarikan arisan
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#163E4F] text-amber-300 border border-[#6A8578]">
            Putaran Bulan ke-{data.arisanInfo.currentCycleMonth} ({data.arisanInfo.currentCycleYear})
          </span>
        </div>

        {/* Kartu Utama Arisan Terdekat */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#6A8578] text-white border border-[#466060] shadow-md relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Info Kiri: Tuan Rumah, Tanggal, Tempat */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#466060] text-white border border-[#163E4F]">
                  <Gift className="w-3.5 h-3.5 mr-1 inline text-amber-300" />
                  Arisan Periode Oktober 2026
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-amber-300 border border-[#6A8578]">
                  Menunggu Undian
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#466060] text-[#D6DDD5] border border-[#163E4F]">
                  {data.arisanInfo.memberStatus.includes('SUDAH') ? 'Status: Sudah Menang' : 'Status: Belum Menang'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-[#D6DDD5] uppercase tracking-wider block">
                  Penerima / Tuan Rumah Arisan Putaran Ini:
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-tight flex items-center gap-2.5 flex-wrap">
                  <span>{data.arisanInfo.recipientName}</span>
                  {data.arisanInfo.recipientNumber && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#163E4F] text-amber-300 border border-[#6A8578]">
                      {data.arisanInfo.recipientNumber}
                    </span>
                  )}
                </h3>
              </div>

              {/* Grid Tanggal & Tempat Pertemuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2 border-t border-[#466060]">
                <div className="flex items-center gap-2.5 text-white p-2.5 rounded-2xl bg-[#466060] border border-[#163E4F]">
                  <div className="p-2 rounded-xl bg-[#163E4F] text-amber-300 shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#D6DDD5] block font-medium">Tanggal Pertemuan Arisan:</span>
                    <strong className="text-white font-bold">
                      {formatDateIndo(data.arisanInfo.nextDrawDate)} (19:30 WIB)
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white p-2.5 rounded-2xl bg-[#466060] border border-[#163E4F]">
                  <div className="p-2 rounded-xl bg-[#163E4F] text-rose-300 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#D6DDD5] block font-medium">Tempat Pertemuan:</span>
                    <strong className="text-white font-bold">
                      {data.arisanInfo.nextDrawLocation}
                    </strong>
                  </div>
                </div>
              </div>

              {data.arisanInfo.notes && (
                <p className="text-xs text-[#D6DDD5] italic">
                  Catatan: {data.arisanInfo.notes}
                </p>
              )}
            </div>

            {/* Kolom Kanan: Total Dana Tarikan & Rincian Iuran */}
            <div className="p-5 rounded-2xl bg-[#466060] text-white border border-[#163E4F] flex flex-col justify-between gap-4 shrink-0 lg:w-72 shadow-md">
              <div>
                <span className="text-[11px] font-bold text-[#D6DDD5] uppercase tracking-wider block">
                  Total Dana Arisan / Putaran
                </span>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {formatRupiah(data.arisanInfo.totalPot)}
                </div>
                <span className="text-xs text-[#D6DDD5] block mt-1">
                  Iuran bulanan wajib: <strong>{formatRupiah(data.arisanInfo.monthlyFee)} / anggota</strong>
                </span>
                <span className="text-[11px] text-[#D6DDD5]/80 block mt-0.5">
                  Batas setor: Sebelum tanggal 10 tiap bulan
                </span>
              </div>

              <div className="pt-3 border-t border-[#163E4F]">
                <span className="text-[11px] font-bold text-amber-300 block mb-1.5 uppercase tracking-wide">
                  Pemenang Putaran Sebelumnya:
                </span>
                <div className="space-y-1 text-xs">
                  {data.arisanInfo.recentDraws.slice(0, 2).map((draw) => (
                    <div key={draw.id} className="flex items-center justify-between text-[#D6DDD5]">
                      <span>Bulan {draw.month}/{draw.year}:</span>
                      <strong className="text-white">{draw.winnerName}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. NOTULENSI HASIL RAPAT YANG TELAH DIBAHAS / TERKAIT AGENDA BERIKUTNYA
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="bg-[#466060] text-white p-5 sm:p-6 rounded-3xl border border-[#163E4F] shadow-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#163E4F] text-cyan-300 border border-[#6A8578] shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Notulensi &amp; Hasil Keputusan Rapat Pleno
              </h2>
              <p className="text-xs font-semibold text-[#D6DDD5]">
                Catatan resmi keputusan musyawarah rapat hari sebelumnya dan tindak lanjut rencana kegiatan berikutnya
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
            {data.meetingMinutes.length} Catatan Resmi
          </span>
        </div>

        {data.meetingMinutes.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#6A8578] text-white border border-[#466060] text-center">
            <FileText className="w-8 h-8 text-[#D6DDD5] mx-auto mb-2" />
            <p className="font-bold text-sm text-white">Belum ada dokumen notulensi rapat</p>
            <p className="text-xs text-[#D6DDD5] mt-1">Dokumen hasil rapat resmi akan ditampilkan di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.meetingMinutes.map((minute) => (
              <div
                key={minute.id}
                className="p-5 rounded-3xl bg-[#6A8578] text-white border border-[#466060] hover:border-cyan-300 shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#466060] text-white border border-[#163E4F]">
                      {minute.dayOfWeek || 'Rapat Pleno'}
                    </span>
                    <span className="text-xs font-semibold text-[#D6DDD5] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#D6DDD5]" />
                      {formatDateIndo(minute.meetingDate)}
                    </span>
                  </div>

                  {minute.agendaConnection && (
                    <span className="inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#163E4F] text-amber-300 border border-[#6A8578]">
                      📌 {minute.agendaConnection}
                    </span>
                  )}

                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {minute.title}
                  </h3>

                  <div className="p-3 rounded-2xl bg-[#466060] border border-[#163E4F] space-y-1.5 text-xs text-[#D6DDD5]">
                    <div className="flex items-center justify-between gap-2">
                      <span>Pimpinan Rapat: <strong className="text-white">{minute.meetingLeader}</strong></span>
                      <span>Notulis: <strong className="text-white">{minute.noteTaker}</strong></span>
                    </div>
                    <div className="text-[11px] text-[#D6DDD5]/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-300 shrink-0" />
                      <span>{minute.location}</span>
                    </div>
                  </div>

                  {minute.conclusion && (
                    <div className="p-3 rounded-2xl bg-[#163E4F]/70 border border-[#6A8578]/50 text-xs text-[#D6DDD5]">
                      <span className="font-bold flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wider text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hasil Keputusan / Kesepakatan:
                      </span>
                      <p className="line-clamp-2 leading-relaxed text-[#D6DDD5] whitespace-pre-line">
                        {minute.conclusion}
                      </p>
                    </div>
                  )}

                  {minute.followUp && (
                    <div className="p-2.5 rounded-xl bg-[#466060] border border-[#163E4F] text-[11px] text-[#D6DDD5]">
                      <strong className="text-amber-300 block mb-0.5">Tindak Lanjut Agenda Berikutnya:</strong>
                      <p className="line-clamp-2 text-[#D6DDD5] leading-relaxed">
                        {minute.followUp}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#466060] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#D6DDD5]/80">
                    Dokumen Sah Pleno Pemuda
                  </span>
                  <button
                    onClick={() => setActiveMinute(minute)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#163E4F] hover:bg-[#466060] text-white font-bold transition inline-flex items-center gap-1.5 border border-[#6A8578] shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Buka Notulensi Lengkap</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL DETAIL KEGIATAN KERJA BAKTI
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeEvent && (
        <Modal
          isOpen={!!activeEvent}
          onClose={() => setActiveEvent(null)}
          title={
            <div className="flex items-center gap-2">
              <Shovel className="w-5 h-5 text-amber-300" />
              <span className="text-base font-black text-white">Rincian Kegiatan Kerja Bakti</span>
            </div>
          }
          size="lg"
        >
          <div className="space-y-4 text-white">
            <div className="p-4 rounded-2xl bg-[#466060] border border-[#163E4F] space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-amber-300 border border-[#6A8578]">
                  KERJA BAKTI
                </span>
                {activeEvent.time && (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#163E4F] text-white border border-[#6A8578]">
                    Waktu: {activeEvent.time}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-white leading-snug">
                {activeEvent.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#D6DDD5]">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>{activeEvent.dayOfWeek || 'Hari'}, {formatDateIndo(activeEvent.eventDate)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#163E4F] border border-[#466060] flex items-center gap-2.5 text-xs text-white">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-[#D6DDD5]/80 block">Lokasi Kumpul &amp; Pelaksanaan:</span>
                <strong className="text-sm text-white">{activeEvent.location}</strong>
              </div>
            </div>

            {activeEvent.description && (
              <div className="p-4 rounded-2xl bg-[#466060]/70 border border-[#163E4F] text-xs text-[#D6DDD5] leading-relaxed whitespace-pre-line">
                <span className="font-bold text-white block mb-1 text-xs uppercase tracking-wider">Keterangan Kegiatan:</span>
                {activeEvent.description}
              </div>
            )}

            {activeEvent.equipment && (
              <div className="p-3.5 rounded-2xl bg-[#163E4F] border border-[#6A8578] text-xs text-white">
                <span className="font-bold text-amber-300 block mb-1 uppercase tracking-wider text-[11px]">
                  Peralatan yang Perlu Dibawa:
                </span>
                <p className="text-[#D6DDD5]">{activeEvent.equipment}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#D6DDD5] pt-2 border-t border-[#466060]">
              <span>Diharapkan Seluruh Pemuda Hadir Tepat Waktu</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveEvent(null)}
                className="bg-[#163E4F] hover:bg-[#6A8578] text-white border-[#6A8578]"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL DETAIL NOTULENSI LENGKAP
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeMinute && (
        <Modal
          isOpen={!!activeMinute}
          onClose={() => setActiveMinute(null)}
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-300" />
              <span className="text-base font-black text-white">Dokumen Notulensi Rapat Pleno</span>
            </div>
          }
          size="xl"
        >
          <div className="space-y-4 text-white">
            <div className="p-4 rounded-2xl bg-[#466060] border border-[#163E4F] space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163E4F] text-[#D6DDD5] border border-[#6A8578]">
                  {activeMinute.dayOfWeek || 'Rapat Pleno'}
                </span>
                <span className="text-xs text-[#D6DDD5]">
                  Tanggal: {formatDateIndo(activeMinute.meetingDate)}
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-snug">
                {activeMinute.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#D6DDD5]">
                <MapPin className="w-3.5 h-3.5 text-rose-300" />
                <span>Lokasi: {activeMinute.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#163E4F] p-3.5 rounded-2xl border border-[#466060] text-[#D6DDD5]">
              <div>
                <span className="text-[#D6DDD5]/70 block">Pimpinan Rapat:</span>
                <strong className="text-white text-sm">{activeMinute.meetingLeader}</strong>
              </div>
              <div>
                <span className="text-[#D6DDD5]/70 block">Notulis / Pencatat:</span>
                <strong className="text-white text-sm">{activeMinute.noteTaker}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white block">
                Isi Pembahasan Musyawarah:
              </span>
              <div className="p-4 rounded-2xl bg-[#466060] border border-[#163E4F] text-xs text-[#D6DDD5] leading-relaxed whitespace-pre-line">
                {activeMinute.content}
              </div>
            </div>

            {activeMinute.conclusion && (
              <div className="p-4 rounded-2xl bg-[#163E4F] border border-[#6A8578] text-xs text-[#D6DDD5] space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-emerald-300 uppercase tracking-wider text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Hasil Kesimpulan &amp; Keputusan Rapat:
                </span>
                <p className="leading-relaxed whitespace-pre-line text-[#D6DDD5]">
                  {activeMinute.conclusion}
                </p>
              </div>
            )}

            {activeMinute.followUp && (
              <div className="p-3.5 rounded-2xl bg-[#466060] border border-[#163E4F] text-xs text-[#D6DDD5] space-y-1">
                <span className="font-bold text-amber-300 block uppercase tracking-wider text-[11px]">
                  Rencana Tindak Lanjut Terkait Agenda Berikutnya:
                </span>
                <p className="leading-relaxed text-[#D6DDD5]">
                  {activeMinute.followUp}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#D6DDD5] pt-2 border-t border-[#466060]">
              <span>Arsip Sah Sekretariat Karang Taruna</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveMinute(null)}
                className="bg-[#163E4F] hover:bg-[#6A8578] text-white border-[#6A8578]"
              >
                Tutup Dokumen
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
