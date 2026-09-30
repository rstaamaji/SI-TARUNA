import { Gender, MemberStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';

export interface MemberFilterOptions {
  search?: string;
  status?: MemberStatus;
  gender?: Gender;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'memberNumber' | 'createdAt' | 'joinDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMemberInput {
  name: string;
  gender: Gender;
  phone?: string | null;
  address: string;
  status?: MemberStatus;
  memberNumber?: string;
  joinDate?: string;
}

export interface UpdateMemberInput {
  name?: string;
  gender?: Gender;
  phone?: string | null;
  address?: string;
  status?: MemberStatus;
  memberNumber?: string;
  joinDate?: string;
}

export class MemberService {
  /**
   * Mengambil daftar anggota dengan filter, pencarian, dan paginasi
   */
  static async getAllMembers(options: MemberFilterOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {};

    // 1. Filter status
    if (options.status) {
      where.status = options.status;
    }

    // 2. Filter jenis kelamin
    if (options.gender) {
      where.gender = options.gender;
    }

    // 3. Search query: mencari di nama, nomor anggota, nomor HP, atau alamat
    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { memberNumber: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sortBy = options.sortBy || 'memberNumber';
    const sortOrder = options.sortOrder || 'asc';

    const [total, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          _count: {
            select: {
              attendances: true,
              arisans: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      members,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Mengambil detail anggota berdasarkan ID
   */
  static async getMemberById(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            attendances: true,
            arisans: true,
            cashWithdrawals: true,
          },
        },
      },
    });

    if (!member) {
      throw new AppError('Data anggota tidak ditemukan', 404);
    }

    return member;
  }

  /**
   * Menghasilkan nomor anggota baru berurutan otomatis (misal: KT-SB-026)
   */
  static async generateMemberNumber(): Promise<string> {
    const latestMember = await prisma.member.findFirst({
      orderBy: { memberNumber: 'desc' },
      select: { memberNumber: true },
    });

    if (!latestMember || !latestMember.memberNumber) {
      return 'KT-SB-001';
    }

    // Ambil angka dari format KT-SB-XXX
    const match = latestMember.memberNumber.match(/KT-SB-(\d+)/);
    if (match && match[1]) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `KT-SB-${String(nextNum).padStart(3, '0')}`;
    }

    const count = await prisma.member.count();
    return `KT-SB-${String(count + 1).padStart(3, '0')}`;
  }

  /**
   * Menambahkan anggota baru
   */
  static async createMember(data: CreateMemberInput) {
    let memberNumber = data.memberNumber?.trim();

    if (!memberNumber) {
      memberNumber = await this.generateMemberNumber();
    } else {
      // Cek apakah nomor anggota sudah digunakan
      const existing = await prisma.member.findUnique({
        where: { memberNumber },
      });
      if (existing) {
        throw new AppError(`Nomor anggota '${memberNumber}' sudah terdaftar di sistem`, 409);
      }
    }

    const joinDate = data.joinDate ? new Date(data.joinDate) : new Date();

    const newMember = await prisma.member.create({
      data: {
        memberNumber,
        name: data.name.trim(),
        gender: data.gender,
        phone: data.phone?.trim() || null,
        address: data.address.trim(),
        status: data.status || MemberStatus.ACTIVE,
        joinDate,
      },
    });

    return newMember;
  }

  /**
   * Mengubah data anggota
   */
  static async updateMember(id: string, data: UpdateMemberInput) {
    const existing = await prisma.member.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Data anggota tidak ditemukan', 404);
    }

    // Jika nomor anggota diubah, periksa duplikasi
    if (data.memberNumber && data.memberNumber !== existing.memberNumber) {
      const duplicate = await prisma.member.findUnique({
        where: { memberNumber: data.memberNumber },
      });
      if (duplicate) {
        throw new AppError(`Nomor anggota '${data.memberNumber}' sudah digunakan`, 409);
      }
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.gender && { gender: data.gender }),
        ...(data.phone !== undefined && { phone: data.phone ? data.phone.trim() : null }),
        ...(data.address && { address: data.address.trim() }),
        ...(data.status && { status: data.status }),
        ...(data.memberNumber && { memberNumber: data.memberNumber.trim() }),
        ...(data.joinDate && { joinDate: new Date(data.joinDate) }),
      },
    });

    return updated;
  }

  /**
   * Mengubah status aktif / nonaktif anggota
   */
  static async updateMemberStatus(id: string, status: MemberStatus) {
    const existing = await prisma.member.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Data anggota tidak ditemukan', 404);
    }

    const updated = await prisma.member.update({
      where: { id },
      data: { status },
    });

    return updated;
  }

  /**
   * Menghapus anggota (atau menonaktifkan jika memiliki relasi historis)
   */
  static async deleteMember(id: string) {
    const existing = await prisma.member.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: true,
            arisans: true,
            cashWithdrawals: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Data anggota tidak ditemukan', 404);
    }

    // Jika memiliki riwayat transaksi/absensi/arisan, nonaktifkan agar integritas data historis terjaga
    const hasHistory =
      existing._count.attendances > 0 ||
      existing._count.arisans > 0 ||
      existing._count.cashWithdrawals > 0;

    if (hasHistory) {
      const deactivated = await prisma.member.update({
        where: { id },
        data: { status: MemberStatus.INACTIVE },
      });

      return {
        action: 'DEACTIVATED',
        message: 'Anggota memiliki riwayat historis (kehadiran/arisan), sehingga statusnya dinonaktifkan (INACTIVE) demi integritas data.',
        member: deactivated,
      };
    }

    // Jika belum memiliki relasi historis, hapus permanen
    await prisma.member.delete({
      where: { id },
    });

    return {
      action: 'DELETED',
      message: 'Data anggota berhasil dihapus secara permanen dari sistem.',
      member: existing,
    };
  }
}
