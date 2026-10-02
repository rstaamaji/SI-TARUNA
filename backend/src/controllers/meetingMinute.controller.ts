import { Request, Response, NextFunction } from 'express';
import { MeetingMinuteService } from '../services/meetingMinute.service';
import { sendSuccess } from '../utils/response';

export class MeetingMinuteController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query;
      const minutes = await MeetingMinuteService.getAllMeetingMinutes(search as string);
      sendSuccess(res, 'Berhasil memuat daftar notulensi rapat', minutes, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const minute = await MeetingMinuteService.getLatestMeetingMinute();
      sendSuccess(res, 'Berhasil memuat notulensi rapat terbaru', minute, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const minute = await MeetingMinuteService.getMeetingMinuteById(id as string);
      sendSuccess(res, 'Berhasil memuat detail notulensi rapat', minute, 200);
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

      const {
        meetingDate,
        dayOfWeek,
        title,
        location,
        meetingLeader,
        noteTaker,
        content,
        conclusion,
        followUp,
      } = req.body;

      const created = await MeetingMinuteService.createMeetingMinute({
        meetingDate,
        dayOfWeek,
        title,
        location,
        meetingLeader,
        noteTaker,
        content,
        conclusion,
        followUp,
        createdById: userId,
      });

      sendSuccess(res, 'Notulensi rapat berhasil disimpan', created, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const {
        meetingDate,
        dayOfWeek,
        title,
        location,
        meetingLeader,
        noteTaker,
        content,
        conclusion,
        followUp,
      } = req.body;

      const updated = await MeetingMinuteService.updateMeetingMinute(id as string, {
        meetingDate,
        dayOfWeek,
        title,
        location,
        meetingLeader,
        noteTaker,
        content,
        conclusion,
        followUp,
      });

      sendSuccess(res, 'Notulensi rapat berhasil diperbarui', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await MeetingMinuteService.deleteMeetingMinute(id as string);
      sendSuccess(res, result.message, { id: result.id }, 200);
    } catch (error) {
      next(error);
    }
  }
}
