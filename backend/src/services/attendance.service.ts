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
