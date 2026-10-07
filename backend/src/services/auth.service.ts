import prisma from '../utils/prisma';
import { PasswordUtil } from '../utils/password';
import { JwtUtil } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { Prisma } from '@prisma/client';

export class AuthService {
  public static async login(username: string, plainPassword: string) {
    const trimmedInput = username.trim();

    // Cek alias antara "Rustam Aji" dan "rustaamaji"
    const isRustamAlias =
      trimmedInput.toLowerCase() === 'rustam aji' ||
      trimmedInput.toLowerCase() === 'rustaamaji' ||
      trimmedInput.toLowerCase() === 'rustamaji';

    const candidates = await prisma.user.findMany({
      where: {
        OR: [
          { username: { equals: trimmedInput, mode: Prisma.QueryMode.insensitive } },
          { email: { equals: trimmedInput, mode: Prisma.QueryMode.insensitive } },
          { member: { name: { equals: trimmedInput, mode: Prisma.QueryMode.insensitive } } },
          ...(isRustamAlias
            ? [
                { username: { equals: 'Rustam Aji', mode: Prisma.QueryMode.insensitive } },
                { username: { equals: 'rustaamaji', mode: Prisma.QueryMode.insensitive } },
              ]
            : []),
        ],
      },
      include: {
        member: {
          select: {
            id: true,
            memberNumber: true,
            name: true,
            phone: true,
            address: true,
            status: true,
          },
        },
      },
    });

    if (!candidates || candidates.length === 0) {
      throw new AppError('Kredensial tidak valid: Username atau password salah.', 401);
    }

    // Cari kandidat yang password-nya cocok
    let user: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      const isMatch = await PasswordUtil.compare(plainPassword, candidate.password);
      if (isMatch) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      throw new AppError('Kredensial tidak valid: Username atau password salah.', 401);
    }

    // Pengecekan status role:
    // Jika mantan admin dicopot atau status admin dinonaktifkan oleh Superadmin,
    // akun TIDAK DIBLOKIR, melainkan otomatis dapat login sebagai role MEMBER biasa (tanpa fitur CRUD admin).
    let effectiveRole = user.role;
    let effectiveApproved = user.isApproved;

    if (user.role === 'ADMIN' && !user.isApproved) {
      effectiveRole = 'MEMBER';
      effectiveApproved = true;
      // Sinkronkan ke database agar status role kembali konsisten sebagai MEMBER
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'MEMBER', isApproved: true },
        });
      } catch (syncErr) {
        console.warn('Gagal sinkronisasi role mantan admin ke MEMBER:', syncErr);
      }
    }

    // Jika profil member belum tertaut langsung, cari berdasarkan nama atau username
    let memberData = user.member;
    if (!memberData) {
      const searchName =
        user.role === 'SUPERADMIN' || user.username.toLowerCase() === 'rustaamaji'
          ? 'Rustam Aji'
          : user.username;

      memberData = await prisma.member.findFirst({
        where: { name: { equals: searchName, mode: 'insensitive' } },
        select: {
          id: true,
          memberNumber: true,
          name: true,
          phone: true,
          address: true,
          status: true,
        },
      });
    }

    const token = JwtUtil.sign({
      id: user.id,
      username: user.username,
      role: effectiveRole,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: effectiveRole,
        isApproved: effectiveApproved,
        member: memberData,
      },
    };
  }

  public static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isApproved: true,
        approvedBy: true,
        approvedAt: true,
        createdAt: true,
        member: {
          select: {
            id: true,
            memberNumber: true,
            name: true,
            gender: true,
            phone: true,
            address: true,
            joinDate: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    return user;
  }
}
