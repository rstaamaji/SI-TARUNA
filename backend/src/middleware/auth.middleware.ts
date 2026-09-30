import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { JwtUtil, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import prisma from '../utils/prisma';

// Extend Express Request type to include authenticated user
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  memberId?: string;
  memberName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware: authenticate
 * Memverifikasi token JWT dari header Authorization: Bearer <token>
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.', [], 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: TokenPayload = JwtUtil.verify(token);

    // Ambil data user terkini dari database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'Autentikasi gagal: Akun pengguna tidak ditemukan di sistem.', [], 401);
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      memberId: user.member?.id,
      memberName: user.member?.name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Sesi Anda telah kedaluwarsa. Silakan login kembali.', [], 401);
      return;
    }
    sendError(res, 'Token autentikasi tidak valid atau telah dimanipulasi.', [], 401);
    return;
  }
};

/**
 * Middleware: requireAdmin
 * Memastikan pengguna yang mengakses adalah ADMIN.
 * Member atau pengguna tanpa hak akses akan langsung ditolak dengan HTTP 403 Forbidden.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Akses ditolak: Anda belum terautentikasi.', [], 401);
    return;
  }

  if (req.user.role !== Role.ADMIN) {
    sendError(
      res,
      'Akses Terlarang (403 Forbidden): Fitur management ini hanya dapat diakses oleh ADMIN Karang Taruna.',
      [{ requiredRole: Role.ADMIN, currentRole: req.user.role }],
      403
    );
    return;
  }

  next();
};

/**
 * Middleware: requireMember
 * Memastikan pengguna yang mengakses adalah pengguna terautentikasi (MEMBER atau ADMIN).
 */
export const requireMember = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Akses ditolak: Anda harus login untuk melihat data ini.', [], 401);
    return;
  }

  // Baik MEMBER maupun ADMIN memiliki izin melihat data umum member
  next();
};

/**
 * Helper fleksibel untuk pengecekan kombinasi role
 */
export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Akses ditolak: Anda belum terautentikasi.', [], 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        `Akses Terlarang (403 Forbidden): Peran '${req.user.role}' tidak memiliki izin untuk tindakan ini.`,
        [{ allowedRoles: roles, userRole: req.user.role }],
        403
      );
      return;
    }

    next();
  };
};
