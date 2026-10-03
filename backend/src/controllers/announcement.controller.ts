import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { sendSuccess } from '../utils/response';
import { AnnouncementType } from '@prisma/client';

export class AnnouncementController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, isAttention, search, startDate, endDate, month, year } = req.query;

      const announcements = await AnnouncementService.getAllAnnouncements({
        type: type as AnnouncementType | 'ALL',
        isAttention: isAttention !== undefined ? isAttention === 'true' : undefined,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        month: month ? Number(month) : undefined,
        year: year ? Number(year) : undefined,
      });

      sendSuccess(res, 'Berhasil memuat daftar pengumuman', announcements, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAttention(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await AnnouncementService.getAttentionItems();
      sendSuccess(res, 'Berhasil memuat daftar informasi perhatian / attention', items, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const announcement = await AnnouncementService.getAnnouncementById(id as string);
      sendSuccess(res, 'Berhasil memuat detail pengumuman', announcement, 200);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User unauthenticated');
      }

      const { title, content, type, isAttention, announcementDate, eventDate } = req.body;
      const created = await AnnouncementService.createAnnouncement({
        title,
        content,
        type,
        isAttention,
        announcementDate,
        eventDate,
        createdById: userId,
      });
      sendSuccess(res, 'Pengumuman berhasil diterbitkan', created, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, type, isAttention, announcementDate, eventDate } = req.body;
      const updated = await AnnouncementService.updateAnnouncement(id as string, {
        title,
        content,
        type,
        isAttention,
        announcementDate,
        eventDate,
      });
      sendSuccess(res, 'Pengumuman berhasil diperbarui', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AnnouncementService.deleteAnnouncement(id as string);
      sendSuccess(res, result.message, { id: result.id }, 200);
    } catch (error) {
      next(error);
    }
  }
}

