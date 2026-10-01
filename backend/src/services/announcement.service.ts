import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  eventDate?: string | Date;
  createdById: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  eventDate?: string | Date | null;
}

export class AnnouncementService {
  /**
   * Get all announcements sorted by date descending
   */
  static async getAllAnnouncements() {
    return prisma.announcement.findMany({
      orderBy: { announcementDate: 'desc' },
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
   * Get single announcement
   */
  static async getAnnouncementById(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            member: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!announcement) {
      throw new AppError('Pengumuman tidak ditemukan.', 404);
    }

    return announcement;
  }

  /**
   * Create new announcement
   */
  static async createAnnouncement(dto: CreateAnnouncementDto) {
    if (!dto.title || !dto.content) {
      throw new AppError('Judul dan isi pengumuman wajib diisi.', 400);
    }

    const created = await prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
        createdById: dto.createdById,
      },
      include: {
        createdBy: {
          select: {
            username: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    return created;
  }

  /**
   * Update announcement
   */
  static async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Pengumuman yang akan diubah tidak ditemukan.', 404);
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.content ? { content: dto.content.trim() } : {}),
        ...(dto.eventDate !== undefined
          ? { eventDate: dto.eventDate ? new Date(dto.eventDate) : null }
          : {}),
      },
      include: {
        createdBy: {
          select: {
            username: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete announcement
   */
  static async deleteAnnouncement(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Pengumuman yang akan dihapus tidak ditemukan.', 404);
    }

    await prisma.announcement.delete({ where: { id } });
    return { id, message: 'Pengumuman berhasil dihapus.' };
  }
}
