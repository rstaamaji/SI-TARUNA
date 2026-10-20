import prisma from '../utils/prisma';
import { PasswordUtil } from '../utils/password';
import { JwtUtil } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { Prisma, Role } from '@prisma/client';

export class AuthService {
  public static async login(username: string, plainPassword: string) {
    const trimmedInput = username.trim();

    if (!trimmedInput || !plainPassword) {
      throw new AppError('Kredensial tidak valid: Username dan password wajib diisi.', 400);
    }

    // Cek alias antara "Rustam Aji" dan "rustaamaji"
    const isRustamAlias =
      trimmedInput.toLowerCase() === 'rustam aji' ||
      trimmedInput.toLowerCase() === 'rustaamaji' ||
      trimmedInput.toLowerCase() === 'rustamaji';

    const isAdminUser = trimmedInput.toLowerCase() === 'admin';

    let candidates = await prisma.user.findMany({
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
          ...(isAdminUser
            ? [{ username: { equals: 'admin', mode: Prisma.QueryMode.insensitive } }]
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
      // Coba cari dari tabel Member jika nama member diinput
      const member = await prisma.member.findFirst({
        where: { name: { equals: trimmedInput, mode: Prisma.QueryMode.insensitive } },
        include: { user: true },
      });
      if (member?.user) {
        candidates = [
          {
            ...member.user,
            member: {
              id: member.id,
              memberNumber: member.memberNumber,
              name: member.name,
              phone: member.phone,
              address: member.address,
              status: member.status,
            },
          },
        ];
      }
    }

    if (!candidates || candidates.length === 0) {
      throw new AppError('Kredensial tidak valid: Username atau password salah.', 401);
    }

    // Tentukan role berdasarkan password:
    // 1. Password 'superadmin' -> SUPERADMIN (hanya untuk rustaamaji / Rustam Aji)
    // 2. Password 'admin' -> ADMIN (untuk username 'admin' atau nama pengurus/member)
    // 3. Password 'TukuluhJaya' (password dahulu) -> MEMBER (untuk semua member termasuk Rustam Aji)
    // 4. Password tersimpan di DB (fallback pengecekan bcrypt)
    let effectiveRole: Role | null = null;
    let targetUser: (typeof candidates)[number] | null = null;

    if (plainPassword === 'superadmin') {
      if (isRustamAlias || candidates.some((c) => c.role === 'SUPERADMIN')) {
        effectiveRole = 'SUPERADMIN';
        targetUser =
          candidates.find((c) => c.username.toLowerCase() === 'rustaamaji') ||
          candidates.find((c) => c.role === 'SUPERADMIN') ||
          candidates[0];
      } else {
        throw new AppError('Kredensial tidak valid: Hak akses Superadmin ditolak.', 401);
      }
    } else if (plainPassword === 'admin') {
      effectiveRole = 'ADMIN';
      targetUser =
        candidates.find((c) => c.username.toLowerCase() === 'admin') ||
        candidates.find((c) => c.username.toLowerCase() !== 'rustaamaji') ||
        candidates[0];
    } else if (plainPassword === 'TukuluhJaya') {
      effectiveRole = 'MEMBER';
      targetUser =
        candidates.find((c) => c.username.toLowerCase() === 'rustam aji') ||
        candidates.find((c) => c.username.toLowerCase() !== 'rustaamaji' && c.username.toLowerCase() !== 'admin') ||
        candidates[0];
    } else {
      // Pengecekan password kustom di database via bcrypt
      for (const candidate of candidates) {
        const isMatch = await PasswordUtil.compare(plainPassword, candidate.password);
        if (isMatch) {
          targetUser = candidate;
          effectiveRole = candidate.role;
          break;
        }
      }
    }

    if (!targetUser || !effectiveRole) {
      throw new AppError('Kredensial tidak valid: Username atau password salah.', 401);
    }

    let effectiveApproved = targetUser.isApproved;

    // Jika profil member belum tertaut langsung, cari berdasarkan nama atau username
    let memberData = targetUser.member;
    if (!memberData) {
      const searchName =
        effectiveRole === 'SUPERADMIN' || targetUser.username.toLowerCase() === 'rustaamaji'
          ? 'Rustam Aji'
          : targetUser.username;

      memberData = await prisma.member.findFirst({
        where: { name: { equals: searchName, mode: Prisma.QueryMode.insensitive } },
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
      id: targetUser.id,
      username: targetUser.username,
      role: effectiveRole,
    });

    return {
      token,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        role: effectiveRole,
        isApproved: effectiveApproved,
        member: memberData,
      },
    };
  }

  public static async getMe(userId: string, sessionRole?: Role) {
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

    return {
      ...user,
      role: sessionRole || user.role,
    };
  }
}
