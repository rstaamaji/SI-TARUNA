import { Request, Response, NextFunction } from 'express';
import { memberDashboardService } from '../services/memberDashboard.service';
import { sendSuccess } from '../utils/response';

export class MemberDashboardController {
  /**
   * GET /api/member/dashboard
   * Mendapatkan seluruh ringkasan data dashboard khusus MEMBER
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User unauthenticated');
      }

      const data = await memberDashboardService.getDashboardData(userId);
      sendSuccess(res, 'Berhasil memuat data dashboard anggota', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/member/dashboard/notifications/:id/read
   * Menandai notifikasi sebagai sudah dibaca
   */
  static async markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new Error('User unauthenticated');
      }

      const updated = await memberDashboardService.markNotificationAsRead(userId, id as string);
      sendSuccess(res, 'Notifikasi telah ditandai dibaca', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/member/dashboard/notifications/read-all
   * Menandai semua notifikasi pengguna sebagai sudah dibaca
   */
  static async markAllNotificationsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User unauthenticated');
      }

      const result = await memberDashboardService.markAllNotificationsAsRead(userId);
      sendSuccess(res, 'Semua notifikasi telah ditandai dibaca', result, 200);
    } catch (error) {
      next(error);
    }
  }
}
