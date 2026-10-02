import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: 'accent' | 'warning' | 'primary' | 'info';
  dueDate?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export class MemberDashboardService {
  /**
   * Get full dashboard overview for MEMBER
   */
  async getDashboardData(userId: string) {
    // 1. Fetch user & member profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
      },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan.', 404);
    }

    // 2. Member & Active Counts
    const [totalMembers, activeMembers, inactiveMembers] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
    ]);

    // 3. Saldo Kas Organisasi (Income - Expense)
    const transactions = await prisma.financeTransaction.findMany();
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const cashBalance = totalIncome - totalExpense;

    // 4. Pengumuman Terbaru
    const rawAnnouncements = await prisma.announcement.findMany({
      orderBy: [
        { isAttention: 'desc' },
        { announcementDate: 'desc' },
      ],
      take: 6,
      include: {
        createdBy: {
          select: {
            username: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    const announcements = rawAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      isAttention: a.isAttention,
      date: a.announcementDate.toISOString(),
      eventDate: a.eventDate ? a.eventDate.toISOString() : null,
      author: a.createdBy.member?.name || a.createdBy.username,
    }));

    // 5. Kegiatan Terdekat
    const rawEvents = await prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
      take: 4,
      include: {
        attendances: user.member
          ? {
              where: { memberId: user.member.id },
            }
          : false,
      },
    });

    const upcomingEvents = rawEvents.map((e) => {
      const myAttendance = e.attendances && e.attendances.length > 0 ? e.attendances[0].status : null;
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        eventDate: e.eventDate.toISOString(),
        location: e.location,
        type: e.type,
        myAttendance,
      };
    });

    // 6. Jadwal Arisan
    const arisans = await prisma.arisan.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
          },
        },
      },
    });

    let memberArisanStatus = 'BELUM_DAPAT';
    if (user.member) {
      const wonArisan = arisans.find(
        (a) => a.memberId === user.member!.id && a.status === 'WON'
      );
      if (wonArisan) {
        memberArisanStatus = `SUDAH_MENANG_BULAN_${wonArisan.month}_${wonArisan.year}`;
      }
    }

    // Find upcoming arisan or meeting event if exists to get dynamic rotated home location
    const arisanEvent = rawEvents.find(
      (e) =>
        e.title.toLowerCase().includes('arisan') ||
        e.type === 'MEETING'
    );
    const nextDrawLocation = arisanEvent ? arisanEvent.location : 'Balai Dusun Tuk Uluh';
    const nextDrawDate = arisanEvent ? arisanEvent.eventDate.toISOString() : '2026-10-05T19:30:00.000Z';

    const arisanSummary = {
      monthlyFee: 20000,
      totalPot: 500000,
      currentCycleMonth: 10,
      currentCycleYear: 2026,
      nextDrawDate,
      nextDrawLocation,
      memberStatus: memberArisanStatus,
      recentDraws: arisans.map((a) => ({
        id: a.id,
        month: a.month,
        year: a.year,
        drawDate: a.drawDate ? a.drawDate.toISOString() : null,
        status: a.status,
        winnerName: a.member.name,
        winnerNumber: a.member.memberNumber,
      })),
    };

    // 7. Status Absensi Pribadi
    let personalAttendance = {
      totalAttended: 0,
      totalEvents: 0,
      attendancePercentage: 100,
      lastStatus: 'PRESENT',
      history: [] as any[],
    };

    if (user.member) {
      const memberAttendances = await prisma.attendance.findMany({
        where: { memberId: user.member.id },
        include: {
          event: true,
        },
        orderBy: {
          event: {
            eventDate: 'desc',
          },
        },
        take: 6,
      });

      const totalEvents = memberAttendances.length;
      const attendedCount = memberAttendances.filter(
        (a) => a.status === 'PRESENT'
      ).length;
      const percentage =
        totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 100;

      personalAttendance = {
        totalAttended: attendedCount,
        totalEvents,
        attendancePercentage: percentage,
        lastStatus: memberAttendances[0]?.status || 'PRESENT',
        history: memberAttendances.map((a) => ({
          id: a.id,
          eventId: a.eventId,
          eventTitle: a.event.title,
          eventDate: a.event.eventDate.toISOString(),
          status: a.status,
          notes: a.notes,
        })),
      };
    }

    // 8. Rekap Jimpitan Terbaru
    const recentJimpitans = await prisma.jimpitanRecord.findMany({
      where: { year: 2026, month: 10 },
      include: {
        group: true,
      },
      orderBy: {
        group: {
          groupNumber: 'asc',
        },
      },
    });

    const totalJimpitanThisMonth = recentJimpitans.reduce(
      (acc, j) => acc + Number(j.amount),
      0
    );

    const jimpitanSummary = {
      month: 10,
      year: 2026,
      periodName: 'Oktober 2026',
      totalCollected: totalJimpitanThisMonth,
      targetAmount: 1000000,
      groupsCount: 7,
      groups: recentJimpitans.map((j) => ({
        id: j.id,
        groupId: j.groupId,
        groupNumber: j.group.groupNumber,
        groupName: j.group.name,
        amount: Number(j.amount),
        notes: j.notes,
      })),
    };

    // 9. Notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

    // 10. "Attention / Informasi Penting" Section Items (Dynamic based on Announcements & Events)
    const attentionItems: AttentionItem[] = [];

    // Prioritas 1: Pengumuman bertanda ATTENTION / Pengumuman Teratas dari Admin
    const attentionAnns = announcements.filter((a) => a.isAttention);
    const topAnns = attentionAnns.length > 0 ? attentionAnns.slice(0, 2) : announcements.slice(0, 1);

    topAnns.forEach((topAnn) => {
      let badgeLabel = 'ATTENTION';
      let variant: AttentionItem['badgeVariant'] = 'accent';

      if (topAnn.type === 'RAPAT') {
        badgeLabel = 'RAPAT PENTING';
        variant = 'primary';
      } else if (topAnn.type === 'KERJA_BAKTI') {
        badgeLabel = 'KERJA BAKTI';
        variant = 'warning';
      } else if (topAnn.type === 'ARISAN') {
        badgeLabel = 'ARISAN PEMUDA';
        variant = 'warning';
      } else if (topAnn.type === 'INFORMASI') {
        badgeLabel = 'INFORMASI PENTING';
        variant = 'info';
      } else if (topAnn.type === 'PENGUMUMAN') {
        badgeLabel = 'PENGUMUMAN PENTING';
        variant = 'accent';
      }

      attentionItems.push({
        id: `att-ann-${topAnn.id}`,
        title: topAnn.title,
        description: topAnn.content,
        badge: badgeLabel,
        badgeVariant: variant,
        dueDate: topAnn.eventDate
          ? new Date(topAnn.eventDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : undefined,
        actionLabel: 'Lihat Pengumuman',
        actionUrl: '/dashboard/pengumuman',
      });
    });

    // Prioritas 2: Agenda Terdekat / Arisan dengan lokasi bergilir
    if (arisanEvent) {
      attentionItems.push({
        id: `att-ev-${arisanEvent.id}`,
        title: arisanEvent.title,
        description: `Diharapkan hadir tepat waktu di ${arisanEvent.location}. Mohon seluruh pemuda hadir sesuai jadwal.`,
        badge: 'AGENDA BERGILIR',
        badgeVariant: 'warning',
        dueDate:
          new Date(arisanEvent.eventDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WIB',
        actionLabel: 'Konfirmasi Hadir',
        actionUrl: '#kegiatan-section',
      });
    } else {
      attentionItems.push({
        id: 'att-2',
        title: 'Pertemuan Rutin & Kocokan Arisan Pemuda',
        description:
          'Diharapkan hadir tepat waktu pada Minggu malam di Balai Dusun Tuk Uluh pukul 19:30 WIB. Undian arisan putaran ke-9 akan dikocok.',
        badge: 'KEGIATAN UTAMA',
        badgeVariant: 'warning',
        dueDate: '05 Oktober 2026, 19:30 WIB',
        actionLabel: 'Konfirmasi Hadir',
        actionUrl: '#kegiatan-section',
      });
    }

    // Prioritas 3: Iuran Kas Bulanan
    attentionItems.push({
      id: 'att-kas',
      title: 'Batas Penyetoran Iuran Kas Wajib Oktober 2026',
      description:
        'Iuran kas pemuda sebesar Rp 10.000 wajib dilunasi kepada Bendahara Setya Bakti paling lambat tanggal 10 Oktober 2026.',
      badge: 'PENTING - KAS',
      badgeVariant: 'accent',
      dueDate: '10 Oktober 2026',
      actionLabel: 'Konfirmasi Bendahara',
      actionUrl: 'https://wa.me/6281234567801?text=Halo%20Bendahara%20Setya%20Bakti,%20saya%20ingin%20konfirmasi%20iuran%20kas',
    });

    // 11. Notulensi Rapat Terbaru
    const rawMinute = await prisma.meetingMinute.findFirst({
      orderBy: { meetingDate: 'desc' },
      include: {
        createdBy: {
          select: {
            username: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    const latestMeetingMinute = rawMinute
      ? {
          id: rawMinute.id,
          title: rawMinute.title,
          meetingDate: rawMinute.meetingDate.toISOString(),
          dayOfWeek: rawMinute.dayOfWeek,
          location: rawMinute.location,
          meetingLeader: rawMinute.meetingLeader,
          noteTaker: rawMinute.noteTaker,
          content: rawMinute.content,
          conclusion: rawMinute.conclusion,
          followUp: rawMinute.followUp,
          author: rawMinute.createdBy.member?.name || rawMinute.createdBy.username,
        }
      : null;

    return {
      memberProfile: {
        id: user.member?.id || null,
        name: user.member?.name || user.username,
        memberNumber: user.member?.memberNumber || 'ANGGOTA',
        role: user.role,
        gender: user.member?.gender || 'MALE',
        address: user.member?.address || 'Dusun Tuk Uluh, Desa Sringin',
        status: user.member?.status || 'ACTIVE',
        joinDate: user.member?.joinDate || user.createdAt,
      },
      stats: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        totalCashBalance: cashBalance,
        totalJimpitanMonth: totalJimpitanThisMonth,
      },
      attentionItems,
      announcements,
      upcomingEvents,
      arisanSummary,
      personalAttendance,
      jimpitanSummary,
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadNotificationsCount,
      latestMeetingMinute,
    };
  }

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new AppError('Notifikasi tidak ditemukan.', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const memberDashboardService = new MemberDashboardService();
