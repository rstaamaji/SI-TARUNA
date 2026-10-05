import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';
import { AdminDashboardController } from '../controllers/adminDashboard.controller';

import { SecurityAuditService } from '../services/securityAudit.service';

const router = Router();

// Seluruh endpoint di bawah ini WAJIB lolos authenticate dan requireAdmin
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/dashboard
 * Endpoint ringkasan overview organisasi untuk Admin Dashboard
 */
router.get('/', AdminDashboardController.getOverview);
router.get('/dashboard', AdminDashboardController.getOverview);
router.get('/overview', AdminDashboardController.getOverview);

/**
 * GET /api/admin/security-audit
 * Audit Keamanan Sistem SI-TARUNA (Module 28)
 */
router.get('/security-audit', async (_req: Request, res: Response) => {
  const auditReport = await SecurityAuditService.runComprehensiveAudit();
  sendSuccess(res, 'Audit keamanan aplikasi berhasil dijalankan', auditReport, 200);
});

/**
 * GET /api/admin/management-data
 * Endpoint khusus ADMIN: Menguji bahwa MEMBER benar-benar diblokir di backend.
 */
router.get('/management-data', (req: Request, res: Response) => {
  sendSuccess(
    res,
    'Otorisasi Berhasil: Anda memiliki hak akses penuh sebagai ADMIN.',
    {
      adminUser: req.user,
      managementFeatures: [
        'MANAGE_MEMBERS',
        'MANAGE_FINANCE',
        'MANAGE_WITHDRAWALS',
        'MANAGE_ATTENDANCE',
        'MANAGE_ANNOUNCEMENTS',
        'MANAGE_MEETING_MINUTES',
        'MANAGE_EVENTS',
        'MANAGE_ARISAN',
        'MANAGE_JIMPITAN',
      ],
      timestamp: new Date().toISOString(),
    },
    200
  );
});

/**
 * Superadmin Exclusive Endpoints: Kelola Pengurus Karang Taruna
 */
import { requireSuperAdmin } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

// GET /api/admin/pengurus (Daftar semua pengguna & status pengurus)
router.get('/pengurus', requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isApproved: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            phone: true,
            address: true,
            status: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });
    sendSuccess(res, 'Daftar pengguna dan status pengurus berhasil diambil', users, 200);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengurus', error: err.message });
  }
});

// PATCH /api/admin/pengurus/:id/approve (Konfirmasi / Revoke akses pengurus)
router.patch('/pengurus/:id/approve', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { isApproved } = req.body;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }
    if (targetUser.role === 'SUPERADMIN') {
      return res.status(400).json({ success: false, message: 'Status Superadmin tidak dapat diubah' });
    }

    const newStatus = typeof isApproved === 'boolean' ? isApproved : !targetUser.isApproved;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        isApproved: newStatus,
        approvedBy: req.user?.username || 'rustaamaji',
        approvedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        role: true,
        isApproved: true,
        approvedBy: true,
        approvedAt: true,
      },
    });

    sendSuccess(
      res,
      `Status akun pengurus ${updated.username} berhasil ${newStatus ? 'dikonfirmasi & diaktifkan' : 'dinonaktifkan / dicabut'}`,
      updated,
      200
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pengurus', error: err.message });
  }
});

// PATCH /api/admin/pengurus/:id/role (Promote to ADMIN / Demote to MEMBER)
router.patch('/pengurus/:id/role', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { role } = req.body;
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return res.status(400).json({ success: false, message: 'Role harus ADMIN atau MEMBER' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }
    if (targetUser.role === 'SUPERADMIN') {
      return res.status(400).json({ success: false, message: 'Akun Superadmin tidak dapat diubah rolenya' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role,
        isApproved: role === 'ADMIN' ? true : targetUser.isApproved,
        approvedBy: req.user?.username || 'rustaamaji',
        approvedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        role: true,
        isApproved: true,
        approvedBy: true,
        approvedAt: true,
      },
    });

    sendSuccess(
      res,
      `Role akun ${updated.username} berhasil diubah menjadi ${role === 'ADMIN' ? 'Pengurus (ADMIN)' : 'Anggota (MEMBER)'}`,
      updated,
      200
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengubah role pengurus', error: err.message });
  }
});

export default router;
