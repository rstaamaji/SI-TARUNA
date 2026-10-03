import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/appError';

export class NotificationController {
  /**
   * GET /api/notifications
   * Mengambil daftar notifikasi milik pengguna login
   */
  static async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi', 401);
      }

      const { unreadOnly, type, limit, offset } = req.query;

      const data = await NotificationService.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        type: type as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      sendSuccess(res, 'Berhasil memuat daftar notifikasi', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Mengambil jumlah notifikasi yang belum dibaca
   */
  static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi', 401);
      }

      const count = await NotificationService.getUnreadCount(userId);
      sendSuccess(res, 'Berhasil memuat jumlah unread notifikasi', { unreadCount: count }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Menandai satu notifikasi sebagai sudah dibaca
   */
  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi', 401);
      }

      const id = req.params.id as string;
      const result = await NotificationService.markAsRead(userId, id);
      sendSuccess(res, 'Notifikasi telah ditandai sebagai dibaca', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/read-all
   * Menandai semua notifikasi pengguna sebagai sudah dibaca
   */
  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi', 401);
      }

      const result = await NotificationService.markAllAsRead(userId);
      sendSuccess(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Menghapus satu notifikasi milik pengguna
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi', 401);
      }

      const id = req.params.id as string;
      const result = await NotificationService.deleteNotification(userId, id);
      sendSuccess(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/broadcast
   * Broadcast notifikasi manual ke seluruh anggota (Admin Only)
   */
  static async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, message, type, link } = req.body;
      if (!title || !message) {
        throw new AppError('Judul dan pesan notifikasi wajib diisi', 400);
      }

      const result = await NotificationService.broadcastNotification({
        title,
        message,
        type,
        link,
      });

      sendSuccess(res, result.message || 'Notifikasi berhasil dikirim', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/run-reminders
   * Menjalankan pengecekan dan pembuatan reminder otomatis (Admin atau manual trigger)
   */
  static async runReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testDate } = req.body;
      const targetDate = testDate ? new Date(testDate) : undefined;
      const result = await ReminderService.checkAndCreateReminders(targetDate);
      sendSuccess(
        res,
        `Pengecekan reminder selesai. ${result.createdNotificationsCount} notifikasi reminder berhasil diterbitkan.`,
        result,
        200
      );
    } catch (error) {
      next(error);
    }
  }
}
