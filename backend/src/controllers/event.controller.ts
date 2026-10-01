import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { sendSuccess } from '../utils/response';

export class EventController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await EventService.getAllEvents();
      sendSuccess(res, 'Berhasil memuat daftar kegiatan', events, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await EventService.getEventById(id as string);
      sendSuccess(res, 'Berhasil memuat detail kegiatan', event, 200);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, eventDate, location, type } = req.body;
      const created = await EventService.createEvent({
        title,
        description,
        eventDate,
        location,
        type,
      });
      sendSuccess(res, 'Kegiatan berhasil ditambahkan', created, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, eventDate, location, type } = req.body;
      const updated = await EventService.updateEvent(id as string, {
        title,
        description,
        eventDate,
        location,
        type,
      });
      sendSuccess(res, 'Kegiatan berhasil diperbarui', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await EventService.deleteEvent(id as string);
      sendSuccess(res, result.message, { id: result.id }, 200);
    } catch (error) {
      next(error);
    }
  }
}
