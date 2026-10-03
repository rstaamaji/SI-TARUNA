import cron, { ScheduledTask } from 'node-cron';
import prisma from '../utils/prisma';
import { NotificationType, EventType } from '@prisma/client';
import { emitToUser } from '../socket';

const MONTH_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAYS_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatDateIndo(date: Date): string {
  const dayName = DAYS_INDO[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth() + 1];
  const year = date.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

export interface ReminderResult {
  processedAt: string;
  checkedEventsCount: number;
  checkedArisansCount: number;
  createdNotificationsCount: number;
  details: {
    title: string;
    milestone: string;
    targetUserCount: number;
  }[];
}

export class ReminderService {
  private static cronTask: ScheduledTask | null = null;

  /**
   * Menghitung selisih hari penuh (midnight to midnight) antara tanggal event dan tanggal hari ini
   */
  public static calculateDaysDifference(eventDate: Date, today: Date): number {
    const eventMidnight = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    ).getTime();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();

    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((eventMidnight - todayMidnight) / msPerDay);
  }

  /**
   * Mengecek dan membuat reminder otomatis untuk Event dan Arisan
   * Mendukung milestone:
   * - Kerja Bakti: H-3 dan H-1
   * - Rapat: H-1 (dan H-3)
   * - Arisan: H-1 (dan H-3)
   * - Kegiatan Lainnya: H-3 dan H-1
   *
   * ANTI DUPLICATE:
   * Dicek secara ketat di database berdasarkan (userId, title).
   * Notifikasi dicatat ke database dan dikirim realtime via Socket.IO.
   */
  public static async checkAndCreateReminders(customDate?: Date): Promise<ReminderResult> {
    const today = customDate || new Date();
    console.log(`⏰ [ReminderService] Memulai pengecekan reminder otomatis untuk tanggal: ${today.toISOString()}`);

    // Ambil seluruh akun pengguna aktif
    const users = await prisma.user.findMany({
      select: { id: true, username: true },
    });

    if (users.length === 0) {
      console.log('⚠️ [ReminderService] Tidak ada akun pengguna terdaftar.');
      return {
        processedAt: today.toISOString(),
        checkedEventsCount: 0,
        checkedArisansCount: 0,
        createdNotificationsCount: 0,
        details: [],
      };
    }

    let createdCount = 0;
    const details: { title: string; milestone: string; targetUserCount: number }[] = [];

    // ── 1. REMINDER EVENT (Kerja Bakti, Rapat, Kegiatan) ─────────────────────
    // Ambil event dalam rentang 4 hari ke depan (mencakup H-3, H-2, H-1, Hari-H)
    const upcomingEvents = await prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
    });

    for (const ev of upcomingEvents) {
      const evDate = new Date(ev.eventDate);
      const daysDiff = this.calculateDaysDifference(evDate, today);

      // Tentukan apakah event ini adalah Kerja Bakti, Rapat, atau Kegiatan Umum
      const isKerjaBakti =
        ev.type === EventType.COMMUNITY_SERVICE ||
        ev.title.toLowerCase().includes('kerja bakti') ||
        ev.title.toLowerCase().includes('gotong royong');

      const isRapat =
        ev.type === EventType.MEETING ||
        ev.title.toLowerCase().includes('rapat') ||
        ev.title.toLowerCase().includes('pleno') ||
        ev.title.toLowerCase().includes('koordinasi');

      let milestone: 'H-3' | 'H-1' | null = null;

      if (isKerjaBakti) {
        // Aturan Kerja Bakti: H-3 dan H-1
        if (daysDiff === 3) milestone = 'H-3';
        else if (daysDiff === 1) milestone = 'H-1';
      } else if (isRapat) {
        // Aturan Rapat: H-1 (juga antisipasi H-3)
        if (daysDiff === 1) milestone = 'H-1';
        else if (daysDiff === 3) milestone = 'H-3';
      } else {
        // Kegiatan Karang Taruna Lainnya: H-3 dan H-1
        if (daysDiff === 3) milestone = 'H-3';
        else if (daysDiff === 1) milestone = 'H-1';
      }

      if (!milestone) continue;

      // Bangun pesan notifikasi
      let title = '';
      let message = '';
      let notifType: NotificationType = NotificationType.EVENT;

      const dateFormatted = formatDateIndo(evDate);
      const timeStr = ev.time ? `pukul ${ev.time}` : 'pagi hari';

      if (isKerjaBakti) {
        notifType = NotificationType.KERJA_BAKTI;
        if (milestone === 'H-3') {
          title = `[Pengingat H-3] Kerja Bakti: ${ev.title}`;
          message = `3 hari lagi! Kerja bakti "${ev.title}" akan dilaksanakan pada ${dateFormatted} di ${ev.location}. Mari siapkan peralatan dan semangat gotong royong.`;
        } else {
          title = `[Pengingat H-1] Kerja Bakti: ${ev.title}`;
          message = `Besok! Kerja bakti "${ev.title}" akan dilaksanakan pada ${dateFormatted} ${timeStr} di ${ev.location}. Diharapkan kehadiran seluruh pemuda dusun.`;
        }
      } else if (isRapat) {
        notifType = NotificationType.RAPAT;
        if (milestone === 'H-3') {
          title = `[Pengingat H-3] Rapat: ${ev.title}`;
          message = `3 hari lagi! Rapat "${ev.title}" dijadwalkan pada ${dateFormatted} di ${ev.location}.`;
        } else {
          title = `[Pengingat H-1] Rapat: ${ev.title}`;
          message = `Besok! Rapat "${ev.title}" akan diselenggarakan pada ${dateFormatted} ${timeStr} di ${ev.location}. Dimohon hadir tepat waktu.`;
        }
      } else {
        notifType = NotificationType.EVENT;
        if (milestone === 'H-3') {
          title = `[Pengingat H-3] Kegiatan: ${ev.title}`;
          message = `3 hari lagi! Kegiatan "${ev.title}" pada ${dateFormatted} di ${ev.location}.`;
        } else {
          title = `[Pengingat H-1] Kegiatan: ${ev.title}`;
          message = `Besok! Kegiatan "${ev.title}" akan berlangsung pada ${dateFormatted} ${timeStr} di ${ev.location}.`;
        }
      }

      // Distribusikan ke seluruh user dengan PENGECEKAN DUPLIKASI KETAT
      let usersTargeted = 0;
      for (const u of users) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: u.id,
            title,
          },
        });

        if (existing) {
          // SUDAH PERNAH DIBUAT -> Lewati (Anti Duplicate)
          continue;
        }

        const createdNotif = await prisma.notification.create({
          data: {
            userId: u.id,
            title,
            message,
            type: notifType,
            link: '/dashboard/kegiatan',
            isRead: false,
          },
        });

        // Kirimkan notifikasi realtime via Socket.IO
        try {
          emitToUser(u.id, 'notification:new', {
            id: createdNotif.id,
            title: createdNotif.title,
            message: createdNotif.message,
            type: createdNotif.type,
            link: createdNotif.link,
            isRead: false,
            createdAt: createdNotif.createdAt.toISOString(),
          });
        } catch (err) {
          console.warn('Socket emit reminder error:', err);
        }

        createdCount++;
        usersTargeted++;
      }

      if (usersTargeted > 0) {
        details.push({
          title,
          milestone,
          targetUserCount: usersTargeted,
        });
      }
    }

    // ── 2. REMINDER ARISAN (H-1) ─────────────────────────────────────────────
    const upcomingArisans = await prisma.arisan.findMany({
      where: {
        drawDate: { not: null },
      },
      include: {
        member: true,
      },
      orderBy: { drawDate: 'asc' },
    });

    for (const arisan of upcomingArisans) {
      if (!arisan.drawDate) continue;

      const drawDate = new Date(arisan.drawDate);
      const daysDiff = this.calculateDaysDifference(drawDate, today);

      let milestone: 'H-3' | 'H-1' | null = null;
      // Aturan Arisan: H-1 (dan H-3)
      if (daysDiff === 1) milestone = 'H-1';
      else if (daysDiff === 3) milestone = 'H-3';

      if (!milestone) continue;

      const monthName = MONTH_NAMES[arisan.month] || `Bulan ${arisan.month}`;
      const title =
        milestone === 'H-1'
          ? `[Pengingat H-1] Arisan: Putaran ${monthName} ${arisan.year}`
          : `[Pengingat H-3] Arisan: Putaran ${monthName} ${arisan.year}`;

      const dateFormatted = formatDateIndo(drawDate);
      const location = arisan.location || 'Balai Dusun Tuk Uluh';

      const winnerStr = arisan.member
        ? `dengan penerima ${arisan.member.name}`
        : 'putaran pengundian giliran warga';

      const message =
        milestone === 'H-1'
          ? `Besok! Pertemuan arisan Karang Taruna periode ${monthName} ${arisan.year} ${winnerStr} dilaksanakan pada ${dateFormatted} di ${location}. Pastikan iuran telah disiapkan.`
          : `3 hari lagi! Pertemuan arisan Karang Taruna periode ${monthName} ${arisan.year} ${winnerStr} pada ${dateFormatted} di ${location}.`;

      let usersTargeted = 0;
      for (const u of users) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: u.id,
            title,
          },
        });

        if (existing) {
          // SUDAH PERNAH DIBUAT -> Lewati (Anti Duplicate)
          continue;
        }

        const createdNotif = await prisma.notification.create({
          data: {
            userId: u.id,
            title,
            message,
            type: NotificationType.ARISAN,
            link: '/dashboard/arisan',
            isRead: false,
          },
        });

        // Kirimkan notifikasi realtime via Socket.IO
        try {
          emitToUser(u.id, 'notification:new', {
            id: createdNotif.id,
            title: createdNotif.title,
            message: createdNotif.message,
            type: createdNotif.type,
            link: createdNotif.link,
            isRead: false,
            createdAt: createdNotif.createdAt.toISOString(),
          });
        } catch (err) {
          console.warn('Socket emit arisan reminder error:', err);
        }

        createdCount++;
        usersTargeted++;
      }

      if (usersTargeted > 0) {
        details.push({
          title,
          milestone,
          targetUserCount: usersTargeted,
        });
      }
    }

    console.log(
      `✅ [ReminderService] Selesai: ${createdCount} notifikasi reminder berhasil diterbitkan ke database.`
    );

    return {
      processedAt: today.toISOString(),
      checkedEventsCount: upcomingEvents.length,
      checkedArisansCount: upcomingArisans.length,
      createdNotificationsCount: createdCount,
      details,
    };
  }

  /**
   * Menjalankan cron scheduler di background backend
   * - Setiap hari pukul 07:00 pagi WIB (0 7 * * *)
   * - Setiap 1 jam sekali untuk mengecek agenda baru (0 * * * *)
   * - Satu kali saat server baru menyala (startup)
   */
  public static startScheduler(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    if (this.cronTask) {
      console.log('ℹ️ [ReminderService] Scheduler sudah berjalan.');
      return;
    }

    console.log('🚀 [ReminderService] Mengaktifkan cron scheduler reminder otomatis...');

    // Jadwal berjalan setiap jam pada menit ke-0
    this.cronTask = cron.schedule('0 * * * *', async () => {
      try {
        console.log('🕒 [ReminderService] Menjalankan pengecekan reminder rutin (hourly)...');
        await this.checkAndCreateReminders();
      } catch (err) {
        console.error('❌ [ReminderService] Kesalahan saat menjalankan reminder scheduler:', err);
      }
    });

    // Pengecekan otomatis saat backend pertama kali start (setelah delay 5 detik)
    setTimeout(async () => {
      try {
        console.log('🚀 [ReminderService] Pengecekan awal saat startup backend...');
        await this.checkAndCreateReminders();
      } catch (err) {
        console.error('❌ [ReminderService] Kesalahan saat startup reminder check:', err);
      }
    }, 5000);
  }

  /**
   * Menghentikan cron scheduler
   */
  public static stopScheduler(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      console.log('🛑 [ReminderService] Scheduler dihentikan.');
    }
  }
}
