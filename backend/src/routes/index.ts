import { Router, Request, Response, NextFunction } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import memberRoutes from './member.routes';
import memberDashboardRoutes from './memberDashboard.routes';
import eventRoutes from './event.routes';
import announcementRoutes from './announcement.routes';
import financeRoutes from './finance.routes';
import cashWithdrawalRoutes from './cashWithdrawal.routes';
import attendanceRoutes from './attendance.routes';
import meetingMinuteRoutes from './meetingMinute.routes';
import arisanRoutes from './arisan.routes';
import notificationRoutes from './notification.routes';
import settingRoutes from './setting.routes';
import { authenticate } from '../middleware/auth.middleware';
import { AdminDashboardController } from '../controllers/adminDashboard.controller';
import { MemberDashboardController } from '../controllers/memberDashboard.controller';

const router = Router();

// 1. Health check: /api/health
router.use('/', healthRoutes);

// 2. Authentication: /api/auth (login, me)
router.use('/auth', authRoutes);

// 3. General Dashboard: /api/dashboard (Role-based smart dispatcher)
router.get('/dashboard', authenticate, (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPERADMIN') {
    return AdminDashboardController.getOverview(req, res, next);
  }
  return MemberDashboardController.getDashboard(req, res, next);
});

// 4. Admin Protected Routes: /api/admin & /api/dashboard/admin
router.use('/admin', adminRoutes);
router.use('/dashboard/admin', adminRoutes);

// 5. Member Dashboard: /api/member/dashboard & /api/dashboard/member
router.use('/member/dashboard', memberDashboardRoutes);
router.use('/dashboard/member', memberDashboardRoutes);

// 6. Events / Kegiatan CRUD: /api/events, /api/event, /api/kegiatan, /api/agenda
router.use('/events', eventRoutes);
router.use('/event', eventRoutes);
router.use('/kegiatan', eventRoutes);
router.use('/agenda', eventRoutes);

// 7. Announcements / Pengumuman CRUD: /api/announcements, /api/announcement, /api/pengumuman
router.use('/announcements', announcementRoutes);
router.use('/announcement', announcementRoutes);
router.use('/pengumuman', announcementRoutes);

// 8. Member Management CRUD: /api/members, /api/member, /api/anggota, /api/profile, /api/profil
router.use('/members', memberRoutes);
router.use('/member', memberRoutes);
router.use('/anggota', memberRoutes);
router.use('/profile', memberRoutes);
router.use('/profil', memberRoutes);

// 9. Financial Transparency (Module 10-14): /api/finance, /api/finances, /api/keuangan, /api/reports
router.use('/finance', financeRoutes);
router.use('/finances', financeRoutes);
router.use('/keuangan', financeRoutes);
router.use('/reports', financeRoutes);
router.use('/report', financeRoutes);

// 10. Cash Withdrawal Records (Module 13): /api/withdrawals & /api/finance/withdrawals
router.use('/withdrawals', cashWithdrawalRoutes);
router.use('/withdrawal', cashWithdrawalRoutes);
router.use('/finance/withdrawals', cashWithdrawalRoutes);
router.use('/finance/withdrawal', cashWithdrawalRoutes);

// 11. Attendance Management & Statistics (Module 15-16): /api/attendance, /api/absensi, /api/statistics
router.use('/attendance', attendanceRoutes);
router.use('/absensi', attendanceRoutes);
router.use('/presensi', attendanceRoutes);
router.use('/statistics', attendanceRoutes);
router.use('/stats', attendanceRoutes);

// 12. Meeting Minutes / Notulensi Rapat (Module 18): /api/meeting-minutes, /api/notulensi, /api/minutes
router.use('/meeting-minutes', meetingMinuteRoutes);
router.use('/meeting-minute', meetingMinuteRoutes);
router.use('/notulensi', meetingMinuteRoutes);
router.use('/minutes', meetingMinuteRoutes);
router.use('/minute', meetingMinuteRoutes);

// 13. Arisan Management (Module 20): /api/arisan, /api/arisans
router.use('/arisan', arisanRoutes);
router.use('/arisans', arisanRoutes);

// 14. Notification System (Module 22): /api/notifications, /api/notifikasi
router.use('/notifications', notificationRoutes);
router.use('/notifikasi', notificationRoutes);

// 16. Admin Settings & Organization Configuration (Module 27): /api/settings, /api/pengaturan, /api/organization
router.use('/settings', settingRoutes);
router.use('/setting', settingRoutes);
router.use('/pengaturan', settingRoutes);
router.use('/organization', settingRoutes);
router.use('/organisasi', settingRoutes);

export default router;

