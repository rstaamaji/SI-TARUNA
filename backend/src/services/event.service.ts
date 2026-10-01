import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { EventType } from '@prisma/client';

export interface CreateEventDto {
  title: string;
  description?: string;
  eventDate: string | Date;
  location: string;
  type?: EventType;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  eventDate?: string | Date;
  location?: string;
  type?: EventType;
}

export class EventService {
  /**
   * Get all events, sorted by eventDate ascending
   */
  static async getAllEvents() {
    return prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
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
  }

  /**
   * Get single event by ID
   */
  static async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
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

    if (!event) {
      throw new AppError('Kegiatan tidak ditemukan.', 404);
    }

    return event;
  }

  /**
   * Create new event
   */
  static async createEvent(dto: CreateEventDto) {
    if (!dto.title || !dto.eventDate || !dto.location) {
      throw new AppError('Judul, tanggal, dan lokasi kegiatan wajib diisi.', 400);
    }

    const event = await prisma.event.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        eventDate: new Date(dto.eventDate),
        location: dto.location.trim(),
        type: dto.type || EventType.MEETING,
      },
    });

    return event;
  }

  /**
   * Update existing event (e.g. pindah lokasi ke rumah anggota lain, ganti tanggal/jam)
   */
  static async updateEvent(id: string, dto: UpdateEventDto) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Kegiatan yang akan diubah tidak ditemukan.', 404);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description ? dto.description.trim() : null } : {}),
        ...(dto.eventDate ? { eventDate: new Date(dto.eventDate) } : {}),
        ...(dto.location ? { location: dto.location.trim() } : {}),
        ...(dto.type ? { type: dto.type } : {}),
      },
    });

    return updated;
  }

  /**
   * Delete event
   */
  static async deleteEvent(id: string) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Kegiatan yang akan dihapus tidak ditemukan.', 404);
    }

    await prisma.event.delete({ where: { id } });
    return { id, message: 'Kegiatan berhasil dihapus.' };
  }
}
