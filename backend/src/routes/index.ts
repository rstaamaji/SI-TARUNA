import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import memberRoutes from './member.routes';
import memberDashboardRoutes from './memberDashboard.routes';
import eventRoutes from './event.routes';
import announcementRoutes from './announcement.routes';

const router = Router();

// 1. Health check: /api/health
router.use('/', healthRoutes);

// 2. Authentication: /api/auth (login, me)
router.use('/auth', authRoutes);

// 3. Admin Protected Routes: /api/admin & /api/dashboard/admin
router.use('/admin', adminRoutes);
router.use('/dashboard/admin', adminRoutes);

// 4. Member Dashboard: /api/member/dashboard & /api/dashboard/member
router.use('/member/dashboard', memberDashboardRoutes);
router.use('/dashboard/member', memberDashboardRoutes);

// 5. Events / Kegiatan CRUD: /api/events & /api/event
router.use('/events', eventRoutes);
router.use('/event', eventRoutes);

// 6. Announcements / Pengumuman CRUD: /api/announcements & /api/announcement
router.use('/announcements', announcementRoutes);
router.use('/announcement', announcementRoutes);

// 7. Member Management CRUD: /api/members (and /api/member)
router.use('/members', memberRoutes);
router.use('/member', memberRoutes);

export default router;
