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
      const source = req.query.source as string | undefined;
      const search = req.query.search as string | undefined;

      const transactions = await FinanceService.getTransactions({
        month,
        year,
        type,
        source,
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

      const { type, amount, description, source, transactionDate } = req.body;
      const created = await FinanceService.createTransaction({
        type,
        amount: Number(amount),
        description,
        source,
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
      const { type, amount, description, source, transactionDate } = req.body;

      const updated = await FinanceService.updateTransaction(id as string, {
        type,
        amount: amount !== undefined ? Number(amount) : undefined,
        description,
        source,
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

  // ─────────────────────────────────────────────────────────────────────────────
  // MODULE 11: INCOME MANAGEMENT SPECIFIC CONTROLLERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/finance/incomes
   * READ: Mendapatkan daftar seluruh pemasukan kas (MEMBER & ADMIN)
   */
  static async getIncomes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const source = req.query.source as string | undefined;
      const search = req.query.search as string | undefined;

      const incomes = await FinanceService.getIncomes({
        month,
        year,
        source,
        search,
      });

      sendSuccess(res, 'Berhasil memuat daftar pemasukan kas', incomes, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/finance/incomes/:id
   * READ: Mendapatkan detail pemasukan kas berdasarkan ID (MEMBER & ADMIN)
   */
  static async getIncomeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const income = await FinanceService.getIncomeById(id as string);
      sendSuccess(res, 'Berhasil memuat detail pemasukan kas', income, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/finance/incomes
   * CREATE: Mencatat pemasukan kas baru (KHUSUS ADMIN)
   * Validasi: amount > 0, source, description, transactionDate
   */
  static async createIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Pengguna tidak terautentikasi.', 401);
      }

      const { amount, source, description, transactionDate } = req.body;
      const created = await FinanceService.createIncome({
        amount: Number(amount),
        source,
        description,
        transactionDate,
        createdById: userId,
      });

      sendSuccess(res, 'Pemasukan kas berhasil dicatat', created, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/finance/incomes/:id
   * UPDATE: Memperbarui data pemasukan kas (KHUSUS ADMIN)
   */
  static async updateIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, source, description, transactionDate } = req.body;

      const updated = await FinanceService.updateIncome(id as string, {
        amount: amount !== undefined ? Number(amount) : undefined,
        source,
        description,
        transactionDate,
      });

      sendSuccess(res, 'Pemasukan kas berhasil diperbarui', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/finance/incomes/:id
   * DELETE: Menghapus pemasukan kas (KHUSUS ADMIN)
   */
  static async deleteIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await FinanceService.deleteIncome(id as string);
      sendSuccess(res, 'Pemasukan kas berhasil dihapus', { id: result.id }, 200);
    } catch (error) {
      next(error);
    }
  }
}
