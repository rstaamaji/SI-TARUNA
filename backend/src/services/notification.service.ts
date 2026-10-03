import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

export interface BroadcastNotificationDto {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
  excludeUserId?: string;
}

export class NotificationService {
  /**
   * Menghasilkan notifikasi pengingat otomatis (Kegiatan mendekat, Arisan mendekat, Rapat mendekat, Kerja bakti mendekat, Informasi penting)
   * Berjalan saat user mengambil notifikasi agar selalu up-to-date tanpa duplikasi
   */
  static async syncApproachingNotifications(userId: string): Promise<void> {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Pengumuman Penting / ATTENTION yang belum lewat
    const attentionAnnouncements = await prisma.announcement.findMany({
      where: {
        isAttention: true,
        createdAt: { gte: fourteenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    for (const ann of attentionAnnouncements) {
      const title = `[PENTING] ${ann.title}`;
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title,
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            title,
            message:
              ann.content.length > 120
                ? `${ann.content.substring(0, 117)}...`
                : ann.content,
            type: NotificationType.ATTENTION,
            link: '/dashboard/pengumuman',
            isRead: false,
          },
        });
      }
    }

    // 2. Kegiatan Mendekat (Event dalam kurun waktu 7 hari ke depan)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsIndo = [
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

    for (const ev of upcomingEvents) {
      const d = new Date(ev.eventDate);
      const dayName = ev.dayOfWeek || daysIndo[d.getDay()];
      const dateStr = `${dayName}, ${d.getDate()} ${monthsIndo[d.getMonth()]} ${d.getFullYear()}`;
      const timeStr = ev.time ? `pukul ${ev.time}` : '';

      let notifType: NotificationType = NotificationType.EVENT;
      let titlePrefix = 'Kegiatan Mendekat';

      if (ev.type === 'COMMUNITY_SERVICE') {
        notifType = NotificationType.KERJA_BAKTI;
        titlePrefix = 'Kerja Bakti Mendekat';
      } else if (ev.type === 'MEETING') {
        notifType = NotificationType.RAPAT;
        titlePrefix = 'Rapat Mendekat';
      }

      const title = `${titlePrefix}: ${ev.title}`;

      // Hindari duplikasi jika sudah pernah dibuat untuk event ini
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title,
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            title,
            message: `${ev.title} akan diselenggarakan pada ${dateStr} ${timeStr} bertempat di ${ev.location}.`,
            type: notifType,
            link: '/dashboard/kegiatan',
            isRead: false,
          },
        });
      }
    }

    // 3. Arisan Mendekat
    const upcomingArisans = await prisma.arisan.findMany({
      where: {
        drawDate: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
      include: {
        member: true,
      },
      take: 2,
    });

    for (const arisan of upcomingArisans) {
      const monthName = monthsIndo[arisan.month - 1] || `Bulan ${arisan.month}`;
      const title = `Arisan Mendekat: Putaran ${monthName} ${arisan.year}`;

      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title,
        },
      });

      if (!existing) {
        const d = arisan.drawDate ? new Date(arisan.drawDate) : null;
        const dateStr = d
          ? `${d.getDate()} ${monthsIndo[d.getMonth()]} ${d.getFullYear()}`
          : 'tanggal terdekat';

        const winnerStr = arisan.member
          ? `dengan penerima ${arisan.member.name}`
          : 'putaran pengundian giliran warga';

        await prisma.notification.create({
          data: {
            userId,
            title,
            message: `Pertemuan arisan periode ${monthName} ${arisan.year} ${winnerStr} dilaksanakan pada ${dateStr} di ${arisan.location || 'Balai Dusun Tuk Uluh'}.`,
            type: NotificationType.ARISAN,
            link: '/dashboard/arisan',
            isRead: false,
          },
        });
      }
    }
  }

  /**
   * Mengambil semua notifikasi milik user dengan filter & pagination
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    // Jalankan sinkronisasi pengingat otomatis terlebih dahulu
    try {
      await this.syncApproachingNotifications(userId);
    } catch (err) {
      console.error('Error syncing approaching notifications:', err);
    }

    const where: any = { userId };

    if (options?.unreadOnly) {
      where.isRead = false;
    }

    if (options?.type && options.type !== 'ALL') {
      where.type = options.type;
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        link: n.link || '/dashboard',
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unreadCount,
    };
  }

  /**
   * Mengambil jumlah notifikasi yang belum dibaca (Unread Count)
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      await this.syncApproachingNotifications(userId);
    } catch {
      // ignore sync errors for fast count
    }
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Menandai satu notifikasi sudah dibaca
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new AppError('Notifikasi tidak ditemukan', 404);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      notification: updated,
      unreadCount,
    };
  }

  /**
   * Menandai seluruh notifikasi user sebagai sudah dibaca
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return {
      count: result.count,
      unreadCount: 0,
      message: `${result.count} notifikasi telah ditandai sebagai sudah dibaca`,
    };
  }

  /**
   * Menghapus satu notifikasi
   */
  static async deleteNotification(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new AppError('Notifikasi tidak ditemukan', 404);
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      message: 'Notifikasi berhasil dihapus',
      unreadCount,
    };
  }

  /**
   * Membuat notifikasi untuk satu user spesifik
   */
  static async createNotification(dto: CreateNotificationDto) {
    return prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.INFO,
        link: dto.link || null,
        isRead: false,
      },
    });
  }

  /**
   * Broadcast notifikasi ke seluruh user / anggota terdaftar
   * Digunakan saat Admin membuat Pengumuman baru atau Informasi Penting
   */
  static async broadcastNotification(dto: BroadcastNotificationDto) {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    if (users.length === 0) return { count: 0, message: 'Tidak ada pengguna terdaftar' };

    const targetUsers = dto.excludeUserId
      ? users.filter((u) => u.id !== dto.excludeUserId)
      : users;

    const notifData = targetUsers.map((u) => ({
      userId: u.id,
      title: dto.title,
      message: dto.message,
      type: dto.type || NotificationType.ANNOUNCEMENT,
      link: dto.link || '/dashboard/pengumuman',
      isRead: false,
    }));

    const result = await prisma.notification.createMany({
      data: notifData,
    });

    return {
      count: result.count,
      message: `Notifikasi berhasil dikirimkan ke ${result.count} akun pengguna.`,
    };
  }
}
