import { Router } from 'express';
import { MemberDashboardController } from '../controllers/memberDashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Semua rute dashboard member membutuhkan autentikasi
router.use(authenticate);

// 1. GET /api/member/dashboard - Mengambil data ringkasan dashboard member
router.get('/', MemberDashboardController.getDashboard);

// 2. PATCH /api/member/dashboard/notifications/:id/read - Tandai notifikasi dibaca
router.patch('/notifications/:id/read', MemberDashboardController.markNotificationRead);

// 3. POST /api/member/dashboard/notifications/read-all - Tandai semua dibaca
router.post('/notifications/read-all', MemberDashboardController.markAllNotificationsRead);

export default router;
