import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AttendanceController } from '../controllers/attendance.controller';

const router = Router();

// Semua endpoint absensi memerlukan login
router.use(authenticate);

// 0. GET /api/attendance & /records - Pencarian dan filter catatan absensi (nama, kegiatan, status, tanggal)
router.get('/', AttendanceController.getAllRecords);
router.get('/records', AttendanceController.getAllRecords);

// 0.5. GET /api/attendance/recap - Rekap absensi seluruh anggota dalam 1 periode (MEMBER & ADMIN)
router.get('/recap', AttendanceController.getRecap);

// 1. GET /api/attendance/my-history & /history - Riwayat absensi pribadi pengguna login (MEMBER & ADMIN)
router.get('/my-history', AttendanceController.getMyHistory);
router.get('/history', AttendanceController.getMyHistory);

// 2. GET /api/attendance/statistics & /stats - Statistik keaktifan seluruh anggota (KHUSUS ADMIN)
router.get('/statistics', requireAdmin, AttendanceController.getStatistics);
router.get('/stats', requireAdmin, AttendanceController.getStatistics);

// 3. GET /api/attendance/events - Daftar kegiatan dengan ringkasan kehadiran (MEMBER & ADMIN)
router.get('/events', AttendanceController.getEvents);
router.get('/event', AttendanceController.getEvents);

// 3. POST /api/attendance/events - Buat kegiatan baru cepat (KHUSUS ADMIN)
router.post('/events', requireAdmin, AttendanceController.createEvent);
router.post('/event', requireAdmin, AttendanceController.createEvent);

// 4. GET /api/attendance/events/:eventId - Lembar absensi anggota kegiatan (MEMBER & ADMIN)
router.get('/events/:eventId', AttendanceController.getEventSheet);
router.get('/event/:eventId', AttendanceController.getEventSheet);

// 5. POST /api/attendance/events/:eventId - Simpan status kehadiran anggota (KHUSUS ADMIN)
router.post('/events/:eventId', requireAdmin, AttendanceController.saveAttendance);
router.post('/event/:eventId', requireAdmin, AttendanceController.saveAttendance);

// 6. GET /api/attendance/members/:memberId - Riwayat absensi anggota tertentu (KHUSUS ADMIN)
router.get('/members/:memberId', requireAdmin, AttendanceController.getMemberHistory);
router.get('/member/:memberId', requireAdmin, AttendanceController.getMemberHistory);

export default router;
