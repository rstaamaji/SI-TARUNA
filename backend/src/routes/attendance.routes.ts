import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AttendanceController } from '../controllers/attendance.controller';

const router = Router();

// Semua endpoint absensi memerlukan login
router.use(authenticate);

// 1. GET /api/attendance/my-history - Riwayat absensi pribadi pengguna login (MEMBER & ADMIN)
router.get('/my-history', AttendanceController.getMyHistory);

// 2. GET /api/attendance/events - Daftar kegiatan dengan ringkasan kehadiran (MEMBER & ADMIN)
router.get('/events', AttendanceController.getEvents);

// 3. POST /api/attendance/events - Buat kegiatan baru cepat (KHUSUS ADMIN)
router.post('/events', requireAdmin, AttendanceController.createEvent);

// 4. GET /api/attendance/events/:eventId - Lembar absensi anggota kegiatan (MEMBER & ADMIN)
router.get('/events/:eventId', AttendanceController.getEventSheet);

// 5. POST /api/attendance/events/:eventId - Simpan status kehadiran anggota (KHUSUS ADMIN)
router.post('/events/:eventId', requireAdmin, AttendanceController.saveAttendance);

// 6. GET /api/attendance/members/:memberId - Riwayat absensi anggota tertentu (KHUSUS ADMIN)
router.get('/members/:memberId', requireAdmin, AttendanceController.getMemberHistory);

export default router;
