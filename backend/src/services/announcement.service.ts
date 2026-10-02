import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { AnnouncementType, Prisma } from '@prisma/client';

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  type?: AnnouncementType;
  isAttention?: boolean;
  announcementDate?: string | Date;
  eventDate?: string | Date | null;
  createdById: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  isAttention?: boolean;
  announcementDate?: string | Date;
  eventDate?: string | Date | null;
}

export interface AnnouncementFilter {
  type?: AnnouncementType | 'ALL';
  isAttention?: boolean;
  search?: string;
}

export class AnnouncementService {
  /**
   * Get all announcements with optional filtering sorted by date descending
   */
  static async getAllAnnouncements(filter?: AnnouncementFilter) {
    const where: Prisma.AnnouncementWhereInput = {};

    if (filter?.type && filter.type !== 'ALL') {
      where.type = filter.type;
    }

    if (filter?.isAttention !== undefined) {
      where.isAttention = filter.isAttention;
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.announcement.findMany({
      where,
      orderBy: [
        { isAttention: 'desc' },
        { announcementDate: 'desc' },
      ],
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
   * Get ATTENTION items: announcements flagged as isAttention=true
   */
  static async getAttentionItems() {
    return prisma.announcement.findMany({
      where: { isAttention: true },
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

    if (!announcement) {
      throw new AppError('Pengumuman tidak ditemukan.', 404);
    }

    return announcement;
  }

  /**
   * Create new announcement (Admin)
   */
  static async createAnnouncement(dto: CreateAnnouncementDto) {
    if (!dto.title || !dto.title.trim()) {
      throw new AppError('Judul pengumuman wajib diisi.', 400);
    }
    if (!dto.content || !dto.content.trim()) {
      throw new AppError('Isi pengumuman wajib diisi.', 400);
    }

    // Validate type if supplied
    let announcementType: AnnouncementType = AnnouncementType.PENGUMUMAN;
    if (dto.type && Object.values(AnnouncementType).includes(dto.type)) {
      announcementType = dto.type;
    }

    const pubDate = dto.announcementDate ? new Date(dto.announcementDate) : new Date();
    const evDate = dto.eventDate ? new Date(dto.eventDate) : null;

    const created = await prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        type: announcementType,
        isAttention: Boolean(dto.isAttention),
        announcementDate: pubDate,
        eventDate: evDate,
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
   * Update announcement (Admin)
   */
  static async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Pengumuman yang akan diubah tidak ditemukan.', 404);
    }

    const data: Prisma.AnnouncementUpdateInput = {};

    if (dto.title !== undefined) {
      if (!dto.title.trim()) {
        throw new AppError('Judul pengumuman tidak boleh kosong.', 400);
      }
      data.title = dto.title.trim();
    }

    if (dto.content !== undefined) {
      if (!dto.content.trim()) {
        throw new AppError('Isi pengumuman tidak boleh kosong.', 400);
      }
      data.content = dto.content.trim();
    }

    if (dto.type !== undefined) {
      if (Object.values(AnnouncementType).includes(dto.type)) {
        data.type = dto.type;
      }
    }

    if (dto.isAttention !== undefined) {
      data.isAttention = Boolean(dto.isAttention);
    }

    if (dto.announcementDate !== undefined) {
      data.announcementDate = dto.announcementDate ? new Date(dto.announcementDate) : new Date();
    }

    if (dto.eventDate !== undefined) {
      data.eventDate = dto.eventDate ? new Date(dto.eventDate) : null;
    }

    const updated = await prisma.announcement.update({
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
   * Delete announcement (Admin)
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

