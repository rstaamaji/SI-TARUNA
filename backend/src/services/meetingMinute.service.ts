import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { Prisma } from '@prisma/client';

export interface CreateMeetingMinuteDto {
  meetingDate: string | Date;
  dayOfWeek?: string;
  title: string;
  location?: string;
  meetingLeader?: string;
  noteTaker?: string;
  content: string;
  conclusion?: string;
  followUp?: string;
  createdById: string;
}

export interface UpdateMeetingMinuteDto {
  meetingDate?: string | Date;
  dayOfWeek?: string;
  title?: string;
  location?: string;
  meetingLeader?: string;
  noteTaker?: string;
  content?: string;
  conclusion?: string;
  followUp?: string;
}

export class MeetingMinuteService {
  /**
   * Derive day of week in Indonesian if not provided
   */
  private static deriveDayOfWeek(date: Date): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()] || 'Senin';
  }

  /**
   * Get all meeting minutes with optional search
   */
  static async getAllMeetingMinutes(search?: string) {
    const where: Prisma.MeetingMinuteWhereInput = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { meetingLeader: { contains: q, mode: 'insensitive' } },
        { noteTaker: { contains: q, mode: 'insensitive' } },
        { conclusion: { contains: q, mode: 'insensitive' } },
        { followUp: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.meetingMinute.findMany({
      where,
      orderBy: { meetingDate: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
            member: {
              select: {
                id: true,
                name: true,
                memberNumber: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get latest meeting minute (for dashboard)
   */
  static async getLatestMeetingMinute() {
    return prisma.meetingMinute.findFirst({
      orderBy: { meetingDate: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
            member: {
              select: {
                id: true,
                name: true,
                memberNumber: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get meeting minute by ID
   */
  static async getMeetingMinuteById(id: string) {
    const minute = await prisma.meetingMinute.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
            member: {
              select: {
                id: true,
                name: true,
                memberNumber: true,
              },
            },
          },
        },
      },
    });

    if (!minute) {
      throw new AppError('Notulensi rapat tidak ditemukan.', 404);
    }

    return minute;
  }

  /**
   * Create meeting minute (ADMIN ONLY)
   */
  static async createMeetingMinute(dto: CreateMeetingMinuteDto) {
    if (!dto.title || !dto.title.trim()) {
      throw new AppError('Judul rapat wajib diisi.', 400);
    }
    if (!dto.content || !dto.content.trim()) {
      throw new AppError('Isi notulensi rapat wajib diisi.', 400);
    }
    if (!dto.meetingDate) {
      throw new AppError('Tanggal rapat wajib diisi.', 400);
    }

    const meetingDate = new Date(dto.meetingDate);
    if (isNaN(meetingDate.getTime())) {
      throw new AppError('Format tanggal rapat tidak valid.', 400);
    }

    const dayOfWeek = dto.dayOfWeek?.trim() || this.deriveDayOfWeek(meetingDate);

    const created = await prisma.meetingMinute.create({
      data: {
        meetingDate,
        dayOfWeek,
        title: dto.title.trim(),
        location: dto.location?.trim() || 'Balai Dusun Tuk Uluh',
        meetingLeader: dto.meetingLeader?.trim() || 'Super Admin',
        noteTaker: dto.noteTaker?.trim() || 'Sekretaris',
        content: dto.content.trim(),
        conclusion: dto.conclusion?.trim() || null,
        followUp: dto.followUp?.trim() || null,
        createdById: dto.createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
            member: {
              select: {
                id: true,
                name: true,
                memberNumber: true,
              },
            },
          },
        },
      },
    });

    return created;
  }

  /**
   * Update meeting minute (ADMIN ONLY)
   */
  static async updateMeetingMinute(id: string, dto: UpdateMeetingMinuteDto) {
    const existing = await prisma.meetingMinute.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Notulensi rapat yang akan diubah tidak ditemukan.', 404);
    }

    const data: Prisma.MeetingMinuteUpdateInput = {};

    if (dto.title !== undefined) {
      if (!dto.title.trim()) {
        throw new AppError('Judul rapat tidak boleh kosong.', 400);
      }
      data.title = dto.title.trim();
    }

    if (dto.content !== undefined) {
      if (!dto.content.trim()) {
        throw new AppError('Isi notulensi rapat tidak boleh kosong.', 400);
      }
      data.content = dto.content.trim();
    }

    if (dto.meetingDate !== undefined) {
      const d = new Date(dto.meetingDate);
      if (isNaN(d.getTime())) {
        throw new AppError('Format tanggal rapat tidak valid.', 400);
      }
      data.meetingDate = d;
      if (!dto.dayOfWeek) {
        data.dayOfWeek = this.deriveDayOfWeek(d);
      }
    }

    if (dto.dayOfWeek !== undefined) {
      data.dayOfWeek = dto.dayOfWeek.trim();
    }

    if (dto.location !== undefined) {
      data.location = dto.location.trim();
    }

    if (dto.meetingLeader !== undefined) {
      data.meetingLeader = dto.meetingLeader.trim();
    }

    if (dto.noteTaker !== undefined) {
      data.noteTaker = dto.noteTaker.trim();
    }

    if (dto.conclusion !== undefined) {
      data.conclusion = dto.conclusion.trim() || null;
    }

    if (dto.followUp !== undefined) {
      data.followUp = dto.followUp.trim() || null;
    }

    const updated = await prisma.meetingMinute.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
            member: {
              select: {
                id: true,
                name: true,
                memberNumber: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete meeting minute (ADMIN ONLY)
   */
  static async deleteMeetingMinute(id: string) {
    const existing = await prisma.meetingMinute.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Notulensi rapat yang akan dihapus tidak ditemukan.', 404);
    }

    await prisma.meetingMinute.delete({ where: { id } });
    return { id, message: 'Notulensi rapat berhasil dihapus.' };
  }
}
