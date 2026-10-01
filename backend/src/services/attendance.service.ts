import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { AttendanceStatus, EventType } from '@prisma/client';

export interface AttendanceInputItem {
  memberId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  notes?: string;
}

export interface SaveEventAttendanceDto {
  attendances: AttendanceInputItem[];
}

export interface CreateEventDto {
  title: string;
  description?: string;
  eventDate: string | Date;
  location: string;
  type?: EventType;
}

export class AttendanceService {
  /**
   * 1. Get all events with attendance statistics
   * Used by Admin to pick an event for attendance recording
   */
  static async getEventsWithStats() {
    const totalActiveMembers = await prisma.member.count({
      where: { status: 'ACTIVE' },
    });

    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'desc' },
      include: {
        attendances: {
          select: {
            id: true,
            status: true,
            memberId: true,
          },
        },
      },
    });

    return events.map((event) => {
      const presentCount = event.attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
      const absentCount = event.attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
      const excusedCount = event.attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length;
      const recordedCount = event.attendances.length;
      const attendanceRate = recordedCount > 0 ? Math.round((presentCount / recordedCount) * 100) : 0;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate.toISOString(),
        location: event.location,
        type: event.type,
        stats: {
          totalMembers: totalActiveMembers,
          recordedCount,
          presentCount,
          absentCount,
          excusedCount,
          attendanceRate,
        },
      };
    });
  }

  /**
   * 2. Get full attendance sheet for a specific event
   * Includes all active members and their current status (or default PRESENT)
   */
  static async getEventAttendanceSheet(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Kegiatan / Event tidak ditemukan.', 404);
    }

    // Get all active members sorted by name
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { memberNumber: 'asc' },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        gender: true,
        phone: true,
      },
    });

    // Get existing attendances for this event
    const existingAttendances = await prisma.attendance.findMany({
      where: { eventId },
    });

    const attendanceMap = new Map<string, (typeof existingAttendances)[0]>();
    existingAttendances.forEach((a) => attendanceMap.set(a.memberId, a));

    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    const memberAttendances = members.map((member) => {
      const recorded = attendanceMap.get(member.id);
      const isRecorded = !!recorded;
      const status: 'PRESENT' | 'ABSENT' | 'EXCUSED' = recorded ? (recorded.status as any) : 'PRESENT';
      const notes = recorded?.notes || '';

      if (isRecorded) {
        if (status === 'PRESENT') presentCount++;
        else if (status === 'ABSENT') absentCount++;
        else if (status === 'EXCUSED') excusedCount++;
      }

      return {
        memberId: member.id,
        memberNumber: member.memberNumber,
        name: member.name,
        gender: member.gender,
        phone: member.phone,
        status,
        notes,
        isRecorded,
        attendanceId: recorded?.id || null,
      };
    });

    const recordedCount = existingAttendances.length;
    const attendanceRate = recordedCount > 0 ? Math.round((presentCount / recordedCount) * 100) : 0;

    return {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate.toISOString(),
        location: event.location,
        type: event.type,
      },
      stats: {
        totalMembers: members.length,
        recordedCount,
        presentCount,
        absentCount,
        excusedCount,
        attendanceRate,
      },
      attendances: memberAttendances,
    };
  }

  /**
   * 3. Save / Bulk Update Attendance for an Event (ADMIN ONLY)
   */
  static async saveEventAttendance(eventId: string, data: SaveEventAttendanceDto) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Kegiatan / Event tidak ditemukan.', 404);
    }

    if (!Array.isArray(data.attendances) || data.attendances.length === 0) {
      throw new AppError('Data absensi anggota tidak boleh kosong.', 400);
    }

    // Upsert each member's attendance within a transaction
    await prisma.$transaction(
      data.attendances.map((item) =>
        prisma.attendance.upsert({
          where: {
            memberId_eventId: {
              memberId: item.memberId,
              eventId,
            },
          },
          update: {
            status: item.status as AttendanceStatus,
            notes: item.notes?.trim() || null,
          },
          create: {
            memberId: item.memberId,
            eventId,
            status: item.status as AttendanceStatus,
            notes: item.notes?.trim() || null,
          },
        })
      )
    );

    // Return updated summary
    return this.getEventAttendanceSheet(eventId);
  }

  /**
   * 4. Get member's personal attendance history
   */
  static async getMemberAttendanceHistory(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        gender: true,
        status: true,
        joinDate: true,
      },
    });

    if (!member) {
      throw new AppError('Anggota tidak ditemukan.', 404);
    }

    const attendances = await prisma.attendance.findMany({
      where: { memberId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            location: true,
            type: true,
          },
        },
      },
      orderBy: {
        event: {
          eventDate: 'desc',
        },
      },
    });

    const presentCount = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const absentCount = attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    const excusedCount = attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length;
    const totalEvents = attendances.length;
    const attendanceRate = totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0;

    return {
      member,
      stats: {
        totalEvents,
        presentCount,
        absentCount,
        excusedCount,
        attendanceRate,
      },
      history: attendances.map((a) => ({
        attendanceId: a.id,
        eventId: a.event.id,
        eventTitle: a.event.title,
        description: a.event.description,
        eventDate: a.event.eventDate.toISOString(),
        location: a.event.location,
        eventType: a.event.type,
        status: a.status,
        notes: a.notes || null,
        recordedAt: a.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * 5. Get personal attendance history for currently logged in User
   */
  static async getMyAttendanceHistory(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
      },
    });

    if (!user || !user.member) {
      throw new AppError('Profil anggota tidak terhubung dengan akun ini.', 404);
    }

    return this.getMemberAttendanceHistory(user.member.id);
  }

  /**
   * 7. Get aggregated activity statistics for ALL members (Admin only)
   * Used for Module 16: Member Activity Statistics
   */
  static async getMemberActivityStatistics() {
    // Total events ever held
    const totalEvents = await prisma.event.count();

    // Include inactive members so the report preserves each member's history.
    const members = await prisma.member.findMany({
      orderBy: { memberNumber: 'asc' },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        gender: true,
        phone: true,
        joinDate: true,
        attendances: {
          select: {
            status: true,
            event: {
              select: {
                id: true,
                title: true,
                eventDate: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Per-member stats
    const memberStats = members.map((member) => {
      const totalAttended = member.attendances.length;
      const presentCount = member.attendances.filter(
        (a) => a.status === AttendanceStatus.PRESENT
      ).length;
      const absentCount = member.attendances.filter(
        (a) => a.status === AttendanceStatus.ABSENT
      ).length;
      const excusedCount = member.attendances.filter(
        (a) => a.status === AttendanceStatus.EXCUSED
      ).length;
      const attendanceRate =
        totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0;

      return {
        memberId: member.id,
        memberNumber: member.memberNumber,
        name: member.name,
        gender: member.gender,
        joinDate: member.joinDate?.toISOString() || null,
        stats: {
          totalEvents,
          totalRecorded: totalAttended,
          presentCount,
          absentCount,
          excusedCount,
          attendanceRate,
        },
      };
    });

    // Rank by attendance count; use the member name only to keep ties stable.
    const ranked = [...memberStats].sort((a, b) => {
      if (b.stats.presentCount !== a.stats.presentCount) {
        return b.stats.presentCount - a.stats.presentCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Overall summary
    const totalPresent = memberStats.reduce((s, m) => s + m.stats.presentCount, 0);
    const totalAbsent = memberStats.reduce((s, m) => s + m.stats.absentCount, 0);
    const totalExcused = memberStats.reduce((s, m) => s + m.stats.excusedCount, 0);
    const totalAttendanceOpportunities = totalEvents * members.length;
    const overallRate = totalAttendanceOpportunities > 0
      ? Math.round((totalPresent / totalAttendanceOpportunities) * 100)
      : 0;

    // Monthly chart data: include empty months in the last six calendar months.
    const now = new Date();
    const chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const chartEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const recentAttendances = await prisma.attendance.findMany({
      where: {
        event: {
          eventDate: { gte: chartStart, lt: chartEnd },
        },
      },
      include: {
        event: { select: { eventDate: true } },
      },
    });

    // Group by month
    const monthMap = new Map<string, { hadir: number; izin: number; tidakHadir: number }>();
    for (let offset = 0; offset < 6; offset += 1) {
      const monthDate = new Date(chartStart.getFullYear(), chartStart.getMonth() + offset, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, { hadir: 0, izin: 0, tidakHadir: 0 });
    }
    recentAttendances.forEach((a) => {
      const d = new Date(a.event.eventDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { hadir: 0, izin: 0, tidakHadir: 0 });
      }
      const entry = monthMap.get(key)!;
      if (a.status === AttendanceStatus.PRESENT) entry.hadir++;
      else if (a.status === AttendanceStatus.EXCUSED) entry.izin++;
      else if (a.status === AttendanceStatus.ABSENT) entry.tidakHadir++;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const chartData = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        return {
          month: `${monthNames[parseInt(month) - 1]} ${year}`,
          hadir: val.hadir,
          izin: val.izin,
          tidakHadir: val.tidakHadir,
        };
      });

    return {
      summary: {
        totalEvents,
        totalMembers: members.length,
        totalPresent,
        totalAbsent,
        totalExcused,
        overallRate,
      },
      ranking: ranked,
      chartData,
    };
  }

  /**
   * 6. Quick create event (Admin)
   */
  static async createEvent(data: CreateEventDto) {
    if (!data.title || data.title.trim().length === 0) {
      throw new AppError('Judul kegiatan wajib diisi.', 400);
    }
    if (!data.location || data.location.trim().length === 0) {
      throw new AppError('Lokasi kegiatan wajib diisi.', 400);
    }
    if (!data.eventDate) {
      throw new AppError('Tanggal kegiatan wajib diisi.', 400);
    }

    const event = await prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        eventDate: new Date(data.eventDate),
        location: data.location.trim(),
        type: data.type || EventType.MEETING,
      },
    });

    return event;
  }
}
