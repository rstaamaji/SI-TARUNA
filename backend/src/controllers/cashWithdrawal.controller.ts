import { Request, Response, NextFunction } from 'express';
import { CashWithdrawalService } from '../services/cashWithdrawal.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/appError';

export class CashWithdrawalController {

  /**
   * GET /api/withdrawals
   * READ: Daftar riwayat pengambilan kas (MEMBER & ADMIN dapat melihat)
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month  = req.query.month  ? Number(req.query.month)  : undefined;
      const year   = req.query.year   ? Number(req.query.year)   : undefined;
      const search = req.query.search as string | undefined;

      const data = await CashWithdrawalService.getWithdrawals({ month, year, search });
      sendSuccess(res, 'Berhasil memuat riwayat pengambilan kas', data, 200);
    } catch (error) { next(error); }
  }

  /**
   * GET /api/withdrawals/summary
   * READ: Ringkasan total pengambilan kas
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year  = req.query.year  ? Number(req.query.year)  : undefined;
      const data  = await CashWithdrawalService.getSummary({ month, year });
      sendSuccess(res, 'Berhasil memuat ringkasan pengambilan kas', data, 200);
    } catch (error) { next(error); }
  }

  /**
   * GET /api/withdrawals/:id
   * READ: Detail catatan pengambilan kas (MEMBER & ADMIN)
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await CashWithdrawalService.getWithdrawalById(id as string);
      sendSuccess(res, 'Berhasil memuat detail pengambilan kas', data, 200);
    } catch (error) { next(error); }
  }

  /**
   * POST /api/withdrawals
   * CREATE: Catat pengambilan kas baru (KHUSUS ADMIN)
   * Auto-creates linked FinanceTransaction EXPENSE → no double count.
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Pengguna tidak terautentikasi.', 401);

      const { withdrawerName, memberId, amount, withdrawalDate, purpose, description } = req.body;

      const data = await CashWithdrawalService.createWithdrawal({
        withdrawerName,
        memberId:      memberId || undefined,
        amount:        Number(amount),
        withdrawalDate,
        purpose,
        description,
        createdById:   userId,
      });

      sendSuccess(res, 'Pengambilan kas berhasil dicatat. Saldo kas otomatis berkurang.', data, 201);
    } catch (error) { next(error); }
  }

  /**
   * PUT /api/withdrawals/:id
   * UPDATE: Ubah catatan pengambilan kas (KHUSUS ADMIN)
   * Linked FinanceTransaction ikut diperbarui → no double count.
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { withdrawerName, memberId, amount, withdrawalDate, purpose, description } = req.body;

      const data = await CashWithdrawalService.updateWithdrawal(id as string, {
        withdrawerName,
        memberId:      memberId !== undefined ? (memberId || null) : undefined,
        amount:        amount !== undefined ? Number(amount) : undefined,
        withdrawalDate,
        purpose,
        description,
      });

      sendSuccess(res, 'Catatan pengambilan kas berhasil diperbarui. Saldo dikalkulasi ulang.', data, 200);
    } catch (error) { next(error); }
  }

  /**
   * DELETE /api/withdrawals/:id
   * DELETE: Hapus catatan pengambilan kas (KHUSUS ADMIN)
   * Linked FinanceTransaction ikut dihapus → saldo kas dipulihkan.
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await CashWithdrawalService.deleteWithdrawal(id as string);
      sendSuccess(res, result.message, { id: result.id }, 200);
    } catch (error) { next(error); }
  }
}
