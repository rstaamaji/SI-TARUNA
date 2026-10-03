import { Request, Response, NextFunction } from 'express';
import { ArisanService } from '../services/arisan.service';
import { sendSuccess } from '../utils/response';

export class ArisanController {
  /**
   * GET /api/arisan
   * Mendapatkan seluruh jadwal & data arisan
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { year, month, status, memberId, search } = req.query;
      const data = await ArisanService.getAllArisans({
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        status: status as string,
        memberId: memberId as string,
        search: search as string,
      });
      sendSuccess(res, 'Berhasil memuat daftar arisan', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/arisan/upcoming
   * Mendapatkan data "Arisan Terdekat" dengan status UPCOMING jika mendekati tanggal arisan
   */
  static async getUpcoming(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nearest = await ArisanService.getNearestUpcoming();
      sendSuccess(res, 'Berhasil memuat data arisan terdekat', nearest, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/arisan/history
   * Mendapatkan histori arisan (penerima/pemenang sebelumnya)
   */
  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const history = await ArisanService.getHistory(limit);
      sendSuccess(res, 'Berhasil memuat riwayat/history arisan', history, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/arisan/members
   * Mendapatkan daftar anggota dan status kemenangan arisan pada tahun berjalan
   */
  static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const members = await ArisanService.getMembersForCycle(year);
      sendSuccess(res, 'Berhasil memuat daftar anggota arisan', members, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/arisan/:id
   * Mendapatkan detail arisan berdasarkan ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await ArisanService.getById(id as string);
      sendSuccess(res, 'Berhasil memuat detail arisan', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/arisan
   * Membuat jadwal arisan baru (Admin Only)
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year, memberId, drawDate, location, status, notes, amount } = req.body;
      const created = await ArisanService.createArisan({
        month,
        year,
        memberId,
        drawDate,
        location,
        status,
        notes,
        amount,
      });
      sendSuccess(res, 'Jadwal arisan berhasil dibuat', created, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/arisan/:id
   * Memperbarui jadwal atau penerima arisan (Admin Only)
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { month, year, memberId, drawDate, location, status, notes, amount } = req.body;
      const updated = await ArisanService.updateArisan(id as string, {
        month,
        year,
        memberId,
        drawDate,
        location,
        status,
        notes,
        amount,
      });
      sendSuccess(res, 'Data arisan berhasil diperbarui', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/arisan/:id/winner
   * Menetapkan pemenang/penerima arisan (Admin Only)
   */
  static async determineWinner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { memberId, location, notes } = req.body;
      const result = await ArisanService.determineWinner(id as string, memberId, location, notes);
      sendSuccess(res, 'Penerima arisan berhasil ditentukan', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/arisan/:id
   * Menghapus jadwal arisan (Admin Only)
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ArisanService.deleteArisan(id as string);
      sendSuccess(res, result.message, { id }, 200);
    } catch (error) {
      next(error);
    }
  }
}
