import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { EventType } from '@prisma/client';

export interface CreateEventDto {
  title: string;
  description?: string;
  eventDate: string | Date;
  dayOfWeek?: string;
  time?: string;
  location: string;
  type?: EventType | string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  eventDate?: string | Date;
  dayOfWeek?: string;
  time?: string;
  location?: string;
  type?: EventType | string;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function deriveIndoDay(date: Date): string {
  return INDO_DAYS[date.getDay()] || 'Minggu';
}

export function deriveIndoTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} WIB`;
}

export function normalizeEventType(rawType?: EventType | string): EventType {
  if (!rawType) return EventType.MEETING;
  const upper = String(rawType).toUpperCase().replace(/\s+/g, '_');
  if (upper === 'RAPAT' || upper === 'MEETING') return EventType.MEETING;
  if (upper === 'KERJA_BAKTI' || upper === 'COMMUNITY_SERVICE') return EventType.COMMUNITY_SERVICE;
  if (upper === 'ARISAN') return EventType.ARISAN;
  if (upper === 'SOSIAL' || upper === 'KEGIATAN_SOSIAL' || upper === 'SOCIAL') return EventType.SOCIAL;
  if (upper === 'TARUNA' || upper === 'KEGIATAN_KARANG_TARUNA' || upper === 'SPORTS') return EventType.TARUNA;
  if (Object.values(EventType).includes(upper as EventType)) {
    return upper as EventType;
  }
  return EventType.OTHER;
}

export class EventService {
  /**
   * Helper to ensure dayOfWeek and time are never null in response
   */
  private static formatEventRecord(ev: any) {
    const d = new Date(ev.eventDate);
    return {
      ...ev,
      dayOfWeek: ev.dayOfWeek || deriveIndoDay(d),
      time: ev.time || deriveIndoTime(d),
    };
  }

  /**
   * Get all events, sorted by eventDate ascending (or filtered)
   */
  static async getAllEvents(filters?: {
    search?: string;
    type?: string;
    month?: number;
    year?: number;
  }) {
    const whereClause: any = {};

    if (filters?.search && filters.search.trim()) {
      whereClause.OR = [
        { title: { contains: filters.search.trim(), mode: 'insensitive' } },
        { location: { contains: filters.search.trim(), mode: 'insensitive' } },
        { description: { contains: filters.search.trim(), mode: 'insensitive' } },
      ];
    }

    if (filters?.type && filters.type !== 'ALL') {
      whereClause.type = normalizeEventType(filters.type);
    }

    if (filters?.year) {
      const year = Number(filters.year);
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      whereClause.eventDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    if (filters?.month && filters?.year) {
      const year = Number(filters.year);
      const month = Number(filters.month) - 1;
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      whereClause.eventDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
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

    return events.map((ev) => this.formatEventRecord(ev));
  }

  /**
   * Get upcoming events (Kegiatan Terdekat) sorted by eventDate asc
   */
  static async getUpcomingEvents(limit = 10) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let upcoming = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: startOfToday,
        },
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
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

    // If no future events exist yet, fallback to all events ordered by date asc
    if (upcoming.length === 0) {
      upcoming = await prisma.event.findMany({
        orderBy: { eventDate: 'asc' },
        take: limit,
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

    return upcoming.map((ev) => this.formatEventRecord(ev));
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

    return this.formatEventRecord(event);
  }

  /**
   * Create new event
   */
  static async createEvent(dto: CreateEventDto) {
    if (!dto.title || !dto.eventDate || !dto.location) {
      throw new AppError('Nama kegiatan, tanggal, dan lokasi wajib diisi.', 400);
    }

    const parsedDate = new Date(dto.eventDate);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError('Format tanggal kegiatan tidak valid.', 400);
    }

    const dayOfWeek = dto.dayOfWeek?.trim() || deriveIndoDay(parsedDate);
    const time = dto.time?.trim() || deriveIndoTime(parsedDate);
    const eventType = normalizeEventType(dto.type);

    const event = await prisma.event.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        eventDate: parsedDate,
        dayOfWeek,
        time,
        location: dto.location.trim(),
        type: eventType,
      },
    });

    return this.formatEventRecord(event);
  }

  /**
   * Update existing event
   */
  static async updateEvent(id: string, dto: UpdateEventDto) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Kegiatan yang akan diubah tidak ditemukan.', 404);
    }

    let parsedDate: Date | undefined;
    if (dto.eventDate) {
      parsedDate = new Date(dto.eventDate);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError('Format tanggal kegiatan tidak valid.', 400);
      }
    }

    const dateForDerivation = parsedDate || existing.eventDate;
    const dayOfWeek = dto.dayOfWeek !== undefined
      ? (dto.dayOfWeek.trim() || deriveIndoDay(dateForDerivation))
      : (parsedDate ? deriveIndoDay(parsedDate) : existing.dayOfWeek);

    const time = dto.time !== undefined
      ? (dto.time.trim() || deriveIndoTime(dateForDerivation))
      : (parsedDate ? deriveIndoTime(parsedDate) : existing.time);

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description ? dto.description.trim() : null } : {}),
        ...(parsedDate ? { eventDate: parsedDate } : {}),
        dayOfWeek,
        time,
        ...(dto.location !== undefined ? { location: dto.location.trim() } : {}),
        ...(dto.type !== undefined ? { type: normalizeEventType(dto.type) } : {}),
      },
    });

    return this.formatEventRecord(updated);
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
