import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin, requireMember } from '../middleware/auth.middleware';
import { MemberController } from '../controllers/member.controller';
import { validateRequest } from '../validators/common.validator';
import {
  createMemberSchema,
  updateMemberSchema,
  getMemberByIdSchema,
  memberQuerySchema,
  toggleStatusSchema,
} from '../validators/member.validator';
import { sendSuccess } from '../utils/response';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITY ROUTE (MODULE 06 RBAC)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/view-data', authenticate, requireMember, (req: Request, res: Response) => {
  sendSuccess(
    res,
    'Otorisasi Berhasil: Akses data anggota diizinkan.',
    {
      currentUser: req.user,
      accessibleViews: [
        'VIEW_DASHBOARD',
        'VIEW_MEMBERS',
        'VIEW_PROFILE',
        'VIEW_CASH_INFO',
        'VIEW_ATTENDANCE_HISTORY',
        'VIEW_ANNOUNCEMENTS',
        'VIEW_MEETING_MINUTES',
        'VIEW_EVENTS',
        'VIEW_ARISAN',
      ],
      timestamp: new Date().toISOString(),
    },
    200
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER MANAGEMENT CRUD (MODULE 07)
// ─────────────────────────────────────────────────────────────────────────────

// 0. MEMBER PROFILE (MODULE 26) - Akses dan ubah data profil pribadi anggota
router.get('/profile', authenticate, MemberController.getProfile);
router.get('/profile/me', authenticate, MemberController.getProfile);
router.put('/profile', authenticate, MemberController.updateProfile);
router.put('/profile/me', authenticate, MemberController.updateProfile);

// 1. GET /api/members - Seluruh pengguna terautentikasi dapat melihat daftar anggota
router.get(
  '/',
  authenticate,
  validateRequest(memberQuerySchema),
  MemberController.getAll
);

// 2. GET /api/members/:id - Melihat detail satu anggota
router.get(
  '/:id',
  authenticate,
  validateRequest(getMemberByIdSchema),
  MemberController.getById
);

// 3. POST /api/members - Menambahkan anggota baru (ADMIN ONLY)
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createMemberSchema),
  MemberController.create
);

// 4. PUT /api/members/:id - Mengubah data anggota (ADMIN ONLY)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateMemberSchema),
  MemberController.update
);

// 5. PATCH /api/members/:id/status - Mengubah status aktif/nonaktif (ADMIN ONLY)
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  validateRequest(toggleStatusSchema),
  MemberController.updateStatus
);

// 6. DELETE /api/members/:id - Menghapus / Nonaktifkan anggota (ADMIN ONLY)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(getMemberByIdSchema),
  MemberController.delete
);

export default router;
