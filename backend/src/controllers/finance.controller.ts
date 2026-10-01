import { Request, Response, NextFunction } from 'express';
import { FinanceService } from '../services/finance.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/appError';

export class FinanceController {
  /**
   * GET /api/finance/overview
   * Ringkasan finansial (TOTAL KAS, TOTAL PEMASUKAN, TOTAL PENGELUARAN, SALDO SAAT INI)
   * Dapat diakses oleh MEMBER dan ADMIN
   */
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;

      const summary = await FinanceService.getSummary({ month, year });
      sendSuccess(res, 'Berhasil memuat ringkasan overview keuangan', summary, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/finance
   * Daftar transaksi kas dengan filter bulan, tahun, dan jenis transaksi
   * Dapat diakses oleh MEMBER dan ADMIN
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const type = (req.query.type as 'INCOME' | 'EXPENSE' | 'ALL') || 'ALL';
      const search = req.query.search as string | undefined;

      const transactions = await FinanceService.getTransactions({
        month,
        year,
        type,
        search,
      });

      sendSuccess(res, 'Berhasil memuat daftar riwayat transaksi kas', transactions, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/finance/:id
   * Detail satu transaksi kas
   * Dapat diakses oleh MEMBER dan ADMIN
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await FinanceService.getTransactionById(id as string);
      sendSuccess(res, 'Berhasil memuat detail transaksi', transaction, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/finance
   * Menambahkan transaksi kas baru (ADMIN ONLY)
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi.', 401);
      }

      const { type, amount, description, transactionDate } = req.body;
      const created = await FinanceService.createTransaction({
        type,
        amount: Number(amount),
        description,
        transactionDate,
        createdById: userId,
      });

      sendSuccess(res, 'Transaksi kas berhasil dicatat', created, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/finance/:id
   * Mengubah transaksi kas (ADMIN ONLY)
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, amount, description, transactionDate } = req.body;

      const updated = await FinanceService.updateTransaction(id as string, {
        type,
        amount: amount !== undefined ? Number(amount) : undefined,
        description,
        transactionDate,
      });

      sendSuccess(res, 'Transaksi kas berhasil diperbarui', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/finance/:id
   * Menghapus transaksi kas (ADMIN ONLY)
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await FinanceService.deleteTransaction(id as string);
      sendSuccess(res, result.message, { id: result.id }, 200);
    } catch (error) {
      next(error);
    }
  }
}
