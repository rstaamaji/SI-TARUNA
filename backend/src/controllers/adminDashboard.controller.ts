import { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from '../services/adminDashboard.service';
import { sendSuccess } from '../utils/response';

export class AdminDashboardController {
  /**
   * GET /api/admin/dashboard
   * Mengambil data overview organisasi lengkap untuk Admin Dashboard
   */
  static async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminDashboardService.getDashboardOverview();
      sendSuccess(res, 'Berhasil memuat ringkasan overview Admin Dashboard', data, 200);
    } catch (error) {
      next(error);
    }
  }
}
