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

export default router;
