import { Gender, MemberStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import bcrypt from 'bcrypt';

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

  /**
   * Mengambil data profil lengkap anggota (Module 26: Member Profile)
   * Menyajikan:
   * - Data Diri (Nama, Nomor Anggota, Nomor HP, Alamat, Tanggal Bergabung, Status)
   * - Statistik Keaktifan (Total Kegiatan, Hadir, Izin, Tidak Hadir, Persentase Kehadiran)
   * - Riwayat Absensi
   * - Notifikasi
   */
  static async getMemberProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
      },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    let member = user.member;

    // Jika user belum terhubung ke member, cari berdasarkan kecocokan nama/username
    if (!member) {
      member = await prisma.member.findFirst({
        where: {
          OR: [
            { name: { contains: user.username, mode: 'insensitive' } },
            { phone: user.username },
          ],
        },
      });

      // Hubungkan jika ditemukan
      if (member && !member.userId) {
        member = await prisma.member.update({
          where: { id: member.id },
          data: { userId: user.id },
        });
      }
    }

    // Jika masih belum ada data member (misal Admin murni), sediakan entitas representasi
    if (!member) {
      member = await prisma.member.create({
        data: {
          userId: user.id,
          memberNumber: user.role === 'ADMIN' ? 'ADMIN-001' : `MBR-${user.id.slice(0, 6).toUpperCase()}`,
          name: user.username,
          gender: 'MALE',
          phone: '081234567890',
          address: 'Dusun Tuk Uluh, Desa Sringin, Karanganyar',
          joinDate: user.createdAt,
          status: 'ACTIVE',
        },
      });
    }

    // 1. Ambil Statistik Keaktifan Absensi
    const totalEventsInSystem = await prisma.event.count();

    const attendances = await prisma.attendance.findMany({
      where: { memberId: member.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
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

    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const excusedCount = attendances.filter((a) => a.status === 'EXCUSED').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const totalEvents = Math.max(totalEventsInSystem, attendances.length);
    const attendanceRate = totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0;

    // 2. Ambil Notifikasi Anggota
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      member: {
        id: member.id,
        memberNumber: member.memberNumber,
        name: member.name,
        gender: member.gender,
        phone: member.phone,
        address: member.address,
        joinDate: member.joinDate.toISOString(),
        status: member.status,
      },
      stats: {
        totalEvents,
        presentCount,
        excusedCount,
        absentCount,
        attendanceRate,
      },
      attendances: attendances.map((a) => ({
        id: a.id,
        status: a.status,
        notes: a.notes,
        updatedAt: a.updatedAt.toISOString(),
        event: {
          id: a.event.id,
          title: a.event.title,
          eventDate: a.event.eventDate.toISOString(),
          location: a.event.location,
          type: a.event.type,
        },
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        link: n.link,
      })),
    };
  }

  /**
   * Mengubah profil anggota secara mandiri (Module 26)
   * ATURAN KEAMANAN:
   * - Jangan izinkan member mengubah role
   * - Member tidak dapat mengubah memberNumber, status, atau joinDate
   * - Field yang diizinkan diubah: name, phone, address, gender, email, password
   */
  static async updateMemberProfile(userId: string, input: any) {
    // SECURITY CHECK: Larang keras perubahan role oleh member
    if (input.role !== undefined) {
      throw new AppError('Perubahan role akun tidak diizinkan. Role hanya dapat dikelola oleh Administrator.', 403);
    }
    if (input.memberNumber !== undefined || input.status !== undefined || input.joinDate !== undefined) {
      throw new AppError('Nomor anggota, status, dan tanggal bergabung tidak dapat diubah secara mandiri.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { member: true },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    let member = user.member;
    if (!member) {
      const matched = await prisma.member.findFirst({
        where: {
          OR: [
            { name: { contains: user.username, mode: 'insensitive' } },
            { phone: user.username },
          ],
        },
      });
      if (matched) {
        member = await prisma.member.update({
          where: { id: matched.id },
          data: { userId: user.id },
        });
      } else {
        member = await prisma.member.create({
          data: {
            userId: user.id,
            memberNumber: user.role === 'ADMIN' ? 'ADMIN-001' : `MBR-${user.id.slice(0, 6).toUpperCase()}`,
            name: input.name?.trim() || user.username,
            gender: input.gender || 'MALE',
            phone: input.phone?.trim() || null,
            address: input.address?.trim() || 'Dusun Tuk Uluh, Desa Sringin',
            status: 'ACTIVE',
          },
        });
      }
    }

    // 1. Update Password User jika diminta
    if (input.newPassword && input.newPassword.trim()) {
      if (!input.currentPassword) {
        throw new AppError('Kata sandi saat ini (current password) wajib dimasukkan untuk mengganti kata sandi.', 400);
      }
      const isMatch = await bcrypt.compare(input.currentPassword, user.password);
      if (!isMatch) {
        throw new AppError('Kata sandi saat ini tidak cocok.', 400);
      }
      if (input.newPassword.trim().length < 6) {
        throw new AppError('Kata sandi baru minimal 6 karakter.', 400);
      }
      const hashedPassword = await bcrypt.hash(input.newPassword.trim(), 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    // 2. Update Email User jika diminta
    if (input.email && input.email.trim() && input.email.trim() !== user.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: input.email.trim(),
          id: { not: user.id },
        },
      });
      if (emailTaken) {
        throw new AppError('Email tersebut sudah digunakan oleh akun lain.', 400);
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { email: input.email.trim() },
      });
    }

    // 3. Update Member Data yang diizinkan (Nama, Phone, Address, Gender)
    const memberUpdateData: Prisma.MemberUpdateInput = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new AppError('Nama lengkap tidak boleh kosong.', 400);
      memberUpdateData.name = input.name.trim();
    }
    if (input.phone !== undefined) {
      memberUpdateData.phone = input.phone ? input.phone.trim() : null;
    }
    if (input.address !== undefined) {
      if (!input.address.trim()) throw new AppError('Alamat tidak boleh kosong.', 400);
      memberUpdateData.address = input.address.trim();
    }
    if (input.gender !== undefined) {
      if (input.gender === 'MALE' || input.gender === 'FEMALE') {
        memberUpdateData.gender = input.gender;
      }
    }

    if (Object.keys(memberUpdateData).length > 0) {
      await prisma.member.update({
        where: { id: member.id },
        data: memberUpdateData,
      });
    }

    return this.getMemberProfile(userId);
  }
}
