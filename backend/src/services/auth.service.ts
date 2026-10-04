import prisma from '../utils/prisma';
import { PasswordUtil } from '../utils/password';
import { JwtUtil } from '../utils/jwt';
import { AppError } from '../utils/appError';

export class AuthService {
  public static async login(username: string, plainPassword: string) {
    const trimmedInput = username.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: trimmedInput, mode: 'insensitive' } },
          { email: { equals: trimmedInput, mode: 'insensitive' } },
          { member: { name: { equals: trimmedInput, mode: 'insensitive' } } },
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

    if (!user) {
      throw new AppError('Kredensial tidak valid: Username atau password salah.', 401);
    }

    const isMatch = await PasswordUtil.compare(plainPassword, user.password);
    if (!isMatch) {
      throw new AppError('Kredensial tidak valid: Username atau password salah.', 401);
    }

    // Pengecekan konfirmasi Superadmin untuk role ADMIN
    if (user.role === 'ADMIN' && !user.isApproved) {
      throw new AppError(
        'Akun admin ini belum dikonfirmasi atau dinonaktifkan oleh Superadmin. Akses masuk ditolak.',
        403
      );
    }

    const token = JwtUtil.sign({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        member: user.member,
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
