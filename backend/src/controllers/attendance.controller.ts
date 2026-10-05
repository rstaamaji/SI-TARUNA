import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/appError';

export class AttendanceController {
  /**
   * GET /api/attendance & GET /api/attendance/records
   * Mendapatkan seluruh catatan absensi dengan filter (nama, kegiatan, status, tanggal)
   * Dilengkapi paginasi untuk dataset besar
   */
  static async getAllRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        memberName,
        search,
        eventId,
        eventTitle,
        status,
        startDate,
        endDate,
        date,
        page,
        limit,
      } = req.query;

      const result = await AttendanceService.getAllAttendanceRecords({
        memberName: memberName as string,
        search: search as string,
        eventId: eventId as string,
        eventTitle: eventTitle as string,
        status: status as any,
        startDate: startDate as string,
        endDate: endDate as string,
        date: date as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      sendSuccess(res, 'Berhasil memuat catatan absensi', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/events
   * Daftar kegiatan beserta statistik kehadiran
   */
  static async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await AttendanceService.getEventsWithStats();
      sendSuccess(res, 'Berhasil memuat daftar kegiatan dan statistik absensi', events, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/events/:eventId
   * Lembar absensi seluruh anggota untuk satu kegiatan
   */
  static async getEventSheet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const sheet = await AttendanceService.getEventAttendanceSheet(eventId as string);
      sendSuccess(res, 'Berhasil memuat lembar absensi kegiatan', sheet, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/events/:eventId
   * Simpan / perbarui status absensi seluruh anggota (Admin only)
   */
  static async saveAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const { attendances } = req.body;

      const result = await AttendanceService.saveEventAttendance(eventId as string, {
        attendances,
      });

      sendSuccess(res, 'Absensi anggota berhasil disimpan', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/my-history
   * Riwayat absensi pribadi anggota yang sedang login (Member & Admin)
   */
  static async getMyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi.', 401);
      }

      const history = await AttendanceService.getMyAttendanceHistory(userId);
      sendSuccess(res, 'Berhasil memuat riwayat absensi pribadi', history, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/members/:memberId
   * Riwayat absensi anggota tertentu (Admin)
   */
  static async getMemberHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const history = await AttendanceService.getMemberAttendanceHistory(memberId as string);
      sendSuccess(res, 'Berhasil memuat riwayat absensi anggota', history, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/events
   * Buat kegiatan baru langsung dari halaman absensi (Admin only)
   */
  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, eventDate, location, type } = req.body;
      const created = await AttendanceService.createEvent({
        title,
        description,
        eventDate,
        location,
        type,
      });
      sendSuccess(res, 'Kegiatan baru berhasil dibuat', created, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/statistics
   * Statistik keaktifan seluruh anggota (Admin only)
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AttendanceService.getMemberActivityStatistics();
      sendSuccess(res, 'Berhasil memuat statistik keaktifan anggota', stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/recap
   * Rekap absensi seluruh anggota dalam 1 periode (MEMBER & ADMIN)
   */
  static async getRecap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, month, year, limit, type, search } = req.query;

      const recap = await AttendanceService.getAttendanceRecap({
        startDate: startDate as string,
        endDate: endDate as string,
        month: month ? Number(month) : undefined,
        year: year ? Number(year) : undefined,
        limit: limit ? Number(limit) : undefined,
        type: type as string,
        search: search as string,
      });

      sendSuccess(res, 'Berhasil memuat rekap absensi periode', recap, 200);
    } catch (error) {
      next(error);
    }
  }
}
