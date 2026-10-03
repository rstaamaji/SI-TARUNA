import { Request, Response, NextFunction } from 'express';
import { JimpitanService } from '../services/jimpitan.service';
import { sendSuccess } from '../utils/response';

export class JimpitanController {
  /**
   * GET /api/jimpitan/dashboard
   * Mendapatkan data Dashboard Jimpitan:
   * - Kelompok 1 s/d 7: Rp xxx
   * - TOTAL JIMPITAN BULAN INI: Rp xxx
   * - Chart perbandingan kontribusi
   * - Tren bulanan
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year } = req.query;
      const dashboard = await JimpitanService.getDashboard(
        month ? Number(month) : undefined,
        year ? Number(year) : undefined
      );
      sendSuccess(res, 'Berhasil memuat data dashboard jimpitan', dashboard, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jimpitan/groups
   * Mendapatkan daftar ke-7 Kelompok Jimpitan
   */
  static async getGroups(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const groups = await JimpitanService.getGroups();
      sendSuccess(res, 'Berhasil memuat kelompok jimpitan', groups, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jimpitan/history
   * Mendapatkan riwayat catatan jimpitan per bulan / filter
   */
  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { year, month, groupId } = req.query;
      const history = await JimpitanService.getHistory({
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        groupId: groupId as string,
      });
      sendSuccess(res, 'Berhasil memuat history jimpitan', history, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jimpitan/:id
   * Mendapatkan detail record jimpitan
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const record = await JimpitanService.getById(id);
      sendSuccess(res, 'Berhasil memuat detail jimpitan', record, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/jimpitan
   * Menambah data jimpitan baru (ADMIN)
   * Memvalidasi aturan: 1 input per kelompok per bulan
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId, month, year, amount, notes, inputDate } = req.body;
      const record = await JimpitanService.createRecord({
        groupId,
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        notes,
        inputDate,
      });
      sendSuccess(res, 'Catatan jimpitan berhasil ditambahkan', record, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/jimpitan/:id
   * Mengubah data jimpitan (ADMIN)
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { groupId, month, year, amount, notes, inputDate } = req.body;
      const record = await JimpitanService.updateRecord(id, {
        groupId,
        month: month !== undefined ? Number(month) : undefined,
        year: year !== undefined ? Number(year) : undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        notes,
        inputDate,
      });
      sendSuccess(res, 'Catatan jimpitan berhasil diperbarui', record, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/jimpitan/:id
   * Menghapus data jimpitan (ADMIN)
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await JimpitanService.deleteRecord(id);
      sendSuccess(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
