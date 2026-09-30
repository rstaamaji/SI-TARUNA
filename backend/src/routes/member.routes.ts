import { Router, Request, Response } from 'express';
import { authenticate, requireMember } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';

const router = Router();

// Endpoint khusus pengguna terotentikasi (MEMBER & ADMIN)
router.use(authenticate, requireMember);

/**
 * GET /api/member/view-data
 * Endpoint MEMBER: Hanya dapat melihat data yang diizinkan untuk anggota.
 */
router.get('/view-data', (req: Request, res: Response) => {
  sendSuccess(
    res,
    'Otorisasi Berhasil: Akses data anggota diizinkan.',
    {
      currentUser: req.user,
      accessibleViews: [
        'VIEW_DASHBOARD',
        'VIEW_PROFILE',
        'VIEW_CASH_INFO',
        'VIEW_ATTENDANCE_HISTORY',
        'VIEW_ANNOUNCEMENTS',
        'VIEW_MEETING_MINUTES',
        'VIEW_EVENTS',
        'VIEW_ARISAN',
        'VIEW_JIMPITAN',
      ],
      timestamp: new Date().toISOString(),
    },
    200
  );
});

export default router;
