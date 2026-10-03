import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { ArisanStatus } from '@prisma/client';

export interface CreateArisanDto {
  month: number;
  year: number;
  memberId?: string | null;
  drawDate?: string | Date | null;
  location?: string | null;
  status?: ArisanStatus | string;
  notes?: string | null;
  amount?: number | string | null;
}

export interface UpdateArisanDto {
  month?: number;
  year?: number;
  memberId?: string | null;
  drawDate?: string | Date | null;
  location?: string | null;
  status?: ArisanStatus | string;
  notes?: string | null;
  amount?: number | string | null;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function getMonthNameIndo(monthNum: number): string {
  return MONTH_NAMES[monthNum - 1] || `Bulan ${monthNum}`;
}

export function normalizeArisanStatus(rawStatus?: ArisanStatus | string): ArisanStatus {
  if (!rawStatus) return ArisanStatus.PENDING;
  const upper = String(rawStatus).toUpperCase().trim();
  if (upper === 'UPCOMING') return ArisanStatus.UPCOMING;
  if (upper === 'WON') return ArisanStatus.WON;
  if (upper === 'PAID') return ArisanStatus.PAID;
  if (upper === 'PENDING') return ArisanStatus.PENDING;
  return ArisanStatus.PENDING;
}

export class ArisanService {
  /**
   * Helper to format arisan response record with computed fields
   */
  private static formatArisanRecord(item: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isUpcoming = item.status === ArisanStatus.UPCOMING;
    let daysRemaining: number | null = null;
    let timingLabel = '';

    if (item.drawDate) {
      const d = new Date(item.drawDate);
      const dPure = new Date(item.drawDate);
      dPure.setHours(0, 0, 0, 0);
      const diffMs = dPure.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays;

      // Jika hari ini mendekati tanggal arisan (misal: <= 14 hari kedepan dan belum lewat/won/paid), berikan status UPCOMING
      if (item.status === ArisanStatus.PENDING && diffDays >= 0 && diffDays <= 14) {
        isUpcoming = true;
      }

      if (diffDays === 0) {
        timingLabel = 'HARI INI';
      } else if (diffDays === 1) {
        timingLabel = 'BESOK';
      } else if (diffDays > 1 && diffDays <= 7) {
        timingLabel = `${diffDays} Hari Lagi`;
      } else if (diffDays > 7) {
        timingLabel = `${diffDays} Hari Lagi`;
      } else {
        timingLabel = 'Selesai';
      }
    }

    const computedStatus = (item.status === ArisanStatus.PENDING && isUpcoming)
      ? ArisanStatus.UPCOMING
      : item.status;

    return {
      id: item.id,
      month: item.month,
      monthName: getMonthNameIndo(item.month),
      year: item.year,
      periodLabel: `Arisan ${getMonthNameIndo(item.month)} ${item.year}`,
      memberId: item.memberId,
      recipientName: item.member?.name || (item.status === ArisanStatus.WON || item.status === ArisanStatus.PAID ? 'Belum Tercatat' : 'Belum Ditentukan'),
      recipientNumber: item.member?.memberNumber || null,
      recipientPhone: item.member?.phone || null,
      recipientAddress: item.member?.address || null,
      member: item.member
        ? {
            id: item.member.id,
            name: item.member.name,
            memberNumber: item.member.memberNumber,
            phone: item.member.phone,
            address: item.member.address,
            gender: item.member.gender,
          }
        : null,
      drawDate: item.drawDate ? item.drawDate.toISOString() : null,
      location: item.location || 'Balai Dusun Tuk Uluh',
      status: computedStatus,
      rawStatus: item.status,
      notes: item.notes,
      amount: item.amount ? Number(item.amount) : 500000,
      daysRemaining,
      timingLabel,
      isUpcoming,
      createdAt: item.createdAt ? item.createdAt.toISOString() : null,
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
    };
  }

  /**
   * Get all arisan records with optional filters
   */
  static async getAllArisans(filters?: {
    year?: number;
    month?: number;
    status?: string;
    memberId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.year) {
      where.year = Number(filters.year);
    }
    if (filters?.month) {
      where.month = Number(filters.month);
    }
    if (filters?.memberId) {
      where.memberId = filters.memberId;
    }
    if (filters?.status && filters.status !== 'ALL') {
      where.status = normalizeArisanStatus(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { location: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { member: { name: { contains: q, mode: 'insensitive' } } },
        { member: { memberNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const items = await prisma.arisan.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { drawDate: 'desc' },
      ],
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    return items.map((it) => this.formatArisanRecord(it));
  }

  /**
   * Get Arisan Terdekat (Nearest Upcoming Arisan)
   * Mengambil arisan yang akan datang, mendekati tanggal arisan dengan status UPCOMING
   */
  static async getNearestUpcoming() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cari arisan mendatang dengan tanggal >= hari ini
    const upcomingList = await prisma.arisan.findMany({
      where: {
        OR: [
          { status: ArisanStatus.UPCOMING },
          {
            drawDate: { gte: today },
            status: { in: [ArisanStatus.PENDING, ArisanStatus.UPCOMING] },
          },
        ],
      },
      orderBy: [
        { drawDate: 'asc' },
        { year: 'asc' },
        { month: 'asc' },
      ],
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
      take: 1,
    });

    if (upcomingList.length > 0) {
      return this.formatArisanRecord(upcomingList[0]);
    }

    // 2. Fallback: Cari arisan bulan ini atau arisan terbaru yang belum selesai
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const currentCycle = await prisma.arisan.findFirst({
      where: {
        year: currentYear,
        month: currentMonth,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    if (currentCycle) {
      return this.formatArisanRecord(currentCycle);
    }

    // 3. Fallback: Ambil jadwal arisan terakhir
    const latest = await prisma.arisan.findFirst({
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    if (latest) {
      return this.formatArisanRecord(latest);
    }

    return null;
  }

  /**
   * Get History Arisan (Daftar arisan yang telah terlaksana dan pemenang sebelumnya)
   */
  static async getHistory(limit = 20) {
    const history = await prisma.arisan.findMany({
      where: {
        status: { in: [ArisanStatus.WON, ArisanStatus.PAID] },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { drawDate: 'desc' },
      ],
      take: limit,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    return history.map((it) => this.formatArisanRecord(it));
  }

  /**
   * Get Arisan by ID
   */
  static async getById(id: string) {
    const item = await prisma.arisan.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    if (!item) {
      throw new AppError('Data arisan tidak ditemukan.', 404);
    }

    return this.formatArisanRecord(item);
  }

  /**
   * Create new arisan schedule (Admin Only)
   */
  static async createArisan(dto: CreateArisanDto) {
    if (!dto.month || !dto.year) {
      throw new AppError('Bulan dan tahun arisan wajib diisi.', 400);
    }

    if (dto.month < 1 || dto.month > 12) {
      throw new AppError('Bulan harus di antara 1 sampai 12.', 400);
    }

    // If memberId provided, verify member exists
    let memberName = '';
    if (dto.memberId) {
      const member = await prisma.member.findUnique({ where: { id: dto.memberId } });
      if (!member) {
        throw new AppError('Anggota penerima arisan tidak ditemukan.', 404);
      }
      memberName = member.name;
    }

    let parsedDate: Date | null = null;
    if (dto.drawDate) {
      parsedDate = new Date(dto.drawDate);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError('Format tanggal arisan tidak valid.', 400);
      }
    } else {
      // Default to 1st of the specified month/year at 19:30
      parsedDate = new Date(dto.year, dto.month - 1, 1, 19, 30, 0);
    }

    // Default status computation
    let initialStatus = normalizeArisanStatus(dto.status);
    if (!dto.status) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffMs = parsedDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (dto.memberId) {
        initialStatus = ArisanStatus.WON;
      } else if (diffDays >= 0 && diffDays <= 14) {
        initialStatus = ArisanStatus.UPCOMING;
      } else {
        initialStatus = ArisanStatus.PENDING;
      }
    }

    // Default location: If winner assigned and location not given, e.g. "Rumah [Nama Anggota]"
    let location = dto.location?.trim() || 'Balai Dusun Tuk Uluh';
    if (!dto.location && memberName) {
      location = `Rumah ${memberName}`;
    }

    const created = await prisma.arisan.create({
      data: {
        month: Number(dto.month),
        year: Number(dto.year),
        memberId: dto.memberId || null,
        drawDate: parsedDate,
        location,
        status: initialStatus,
        notes: dto.notes?.trim() || null,
        amount: dto.amount ? Number(dto.amount) : 500000,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    return this.formatArisanRecord(created);
  }

  /**
   * Update arisan (Admin Only)
   */
  static async updateArisan(id: string, dto: UpdateArisanDto) {
    const existing = await prisma.arisan.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Data arisan yang akan diubah tidak ditemukan.', 404);
    }

    let memberName = '';
    if (dto.memberId) {
      const member = await prisma.member.findUnique({ where: { id: dto.memberId } });
      if (!member) {
        throw new AppError('Anggota penerima arisan tidak ditemukan.', 404);
      }
      memberName = member.name;
    }

    let parsedDate: Date | undefined;
    if (dto.drawDate !== undefined) {
      if (dto.drawDate) {
        parsedDate = new Date(dto.drawDate);
        if (isNaN(parsedDate.getTime())) {
          throw new AppError('Format tanggal arisan tidak valid.', 400);
        }
      }
    }

    let location = dto.location !== undefined ? dto.location?.trim() || null : undefined;
    if (location === undefined && memberName && !existing.location?.includes(memberName)) {
      location = `Rumah ${memberName}`;
    }

    const updated = await prisma.arisan.update({
      where: { id },
      data: {
        ...(dto.month !== undefined ? { month: Number(dto.month) } : {}),
        ...(dto.year !== undefined ? { year: Number(dto.year) } : {}),
        ...(dto.memberId !== undefined ? { memberId: dto.memberId || null } : {}),
        ...(dto.drawDate !== undefined ? { drawDate: parsedDate || null } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(dto.status !== undefined ? { status: normalizeArisanStatus(dto.status) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ? dto.notes.trim() : null } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount ? Number(dto.amount) : null } : {}),
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    return this.formatArisanRecord(updated);
  }

  /**
   * Determine member recipient / winner for specific arisan (Admin Only)
   */
  static async determineWinner(id: string, memberId: string, location?: string, notes?: string) {
    const existing = await prisma.arisan.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Data arisan tidak ditemukan.', 404);
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new AppError('Anggota penerima arisan tidak ditemukan.', 404);
    }

    const loc = location?.trim() || `Rumah ${member.name}`;

    const updated = await prisma.arisan.update({
      where: { id },
      data: {
        memberId: member.id,
        location: loc,
        status: ArisanStatus.WON,
        ...(notes !== undefined ? { notes: notes.trim() } : {}),
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            gender: true,
          },
        },
      },
    });

    return this.formatArisanRecord(updated);
  }

  /**
   * Delete arisan record (Admin Only)
   */
  static async deleteArisan(id: string) {
    const existing = await prisma.arisan.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Data arisan yang akan dihapus tidak ditemukan.', 404);
    }

    await prisma.arisan.delete({ where: { id } });
    return { id, message: 'Data arisan berhasil dihapus.' };
  }

  /**
   * Get list of members with win status for arisan cycle
   */
  static async getMembersForCycle(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const [members, arisansInYear] = await Promise.all([
      prisma.member.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { memberNumber: 'asc' },
        select: {
          id: true,
          name: true,
          memberNumber: true,
          phone: true,
          address: true,
        },
      }),
      prisma.arisan.findMany({
        where: {
          year: targetYear,
          status: { in: [ArisanStatus.WON, ArisanStatus.PAID] },
          memberId: { not: null },
        },
        select: {
          memberId: true,
          month: true,
          year: true,
          status: true,
        },
      }),
    ]);

    const wonMap = new Map<string, { month: number; year: number; status: string }>();
    arisansInYear.forEach((a) => {
      if (a.memberId) {
        wonMap.set(a.memberId, { month: a.month, year: a.year, status: a.status });
      }
    });

    return members.map((m) => {
      const winInfo = wonMap.get(m.id);
      return {
        ...m,
        hasWon: !!winInfo,
        winMonth: winInfo ? winInfo.month : null,
        winMonthName: winInfo ? getMonthNameIndo(winInfo.month) : null,
        winYear: winInfo ? winInfo.year : null,
      };
    });
  }
}
