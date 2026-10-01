import prisma from '../utils/prisma';
import { TransactionType } from '@prisma/client';
import { AppError } from '../utils/appError';

export interface FinanceFilter {
  startDate?: string;
  endDate?: string;
  month?: number; // 1 - 12
  year?: number;  // e.g. 2026
  type?: 'INCOME' | 'EXPENSE' | 'ALL';
  source?: string;
  category?: string;
  search?: string;
}

export interface CreateTransactionDTO {
  type: TransactionType;
  amount: number;
  description: string;
  source?: string;
  category?: string;
  transactionDate?: string;
  createdById: string;
}

export interface UpdateTransactionDTO {
  type?: TransactionType;
  amount?: number;
  description?: string;
  source?: string;
  category?: string;
  transactionDate?: string;
}

export interface CreateIncomeDTO {
  amount: number;
  source: string; // 'iuran anggota' | 'donasi' | 'kegiatan' | 'lainnya'
  description: string;
  transactionDate?: string;
  createdById: string;
}

export interface UpdateIncomeDTO {
  amount?: number;
  source?: string;
  description?: string;
  transactionDate?: string;
}

// MODULE 12: Expense DTOs
export interface CreateExpenseDTO {
  amount: number;
  category: string; // 'kegiatan' | 'konsumsi' | 'perlengkapan' | 'sosial' | 'operasional' | 'lainnya'
  description: string;
  transactionDate?: string;
  createdById: string;
}

export interface UpdateExpenseDTO {
  amount?: number;
  category?: string;
  description?: string;
  transactionDate?: string;
}

export class FinanceService {
  /**
   * Get financial summary cards (TOTAL KAS, TOTAL PEMASUKAN, TOTAL PENGELUARAN, SALDO SAAT INI)
   * Formula: saldo = total pemasukan - total pengeluaran
   */
  static async getSummary(filter?: { month?: number; year?: number; startDate?: string; endDate?: string }) {
    // 1. Calculate overall TOTAL KAS across all time
    const allTransactions = await prisma.financeTransaction.findMany();
    const overallIncome = allTransactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const overallExpense = allTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const totalKas = overallIncome - overallExpense;

    // 2. Calculate filtered or current period metrics
    let filteredTransactions = allTransactions;

    if (filter?.startDate && filter?.endDate) {
      const s = new Date(filter.startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(filter.endDate);
      e.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter((t) => {
        const d = new Date(t.transactionDate);
        return d >= s && d <= e;
      });
    } else if (filter?.startDate) {
      const s = new Date(filter.startDate);
      s.setHours(0, 0, 0, 0);
      filteredTransactions = filteredTransactions.filter((t) => {
        const d = new Date(t.transactionDate);
        return d >= s;
      });
    } else if (filter?.endDate) {
      const e = new Date(filter.endDate);
      e.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter((t) => {
        const d = new Date(t.transactionDate);
        return d <= e;
      });
    } else {
      if (filter?.year) {
        filteredTransactions = filteredTransactions.filter((t) => {
          const d = new Date(t.transactionDate);
          return d.getFullYear() === filter.year;
        });
      }
      if (filter?.month) {
        filteredTransactions = filteredTransactions.filter((t) => {
          const d = new Date(t.transactionDate);
          return d.getMonth() + 1 === filter.month;
        });
      }
    }

    const totalPemasukan = filteredTransactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalPengeluaran = filteredTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // Formula saldo: saldo = total pemasukan - total pengeluaran
    const saldoSaatIni = totalPemasukan - totalPengeluaran;

    return {
      totalKas,           // Akumulasi total kas organisasi
      totalPemasukan,     // Total pemasukan (sesuai filter periode)
      totalPengeluaran,   // Total pengeluaran (sesuai filter periode)
      saldoSaatIni,       // saldo = total pemasukan - total pengeluaran
      formula: 'saldo = total pemasukan - total pengeluaran',
      filterApplied: {
        startDate: filter?.startDate || null,
        endDate: filter?.endDate || null,
        month: filter?.month || null,
        year: filter?.year || null,
      },
    };
  }

  /**
   * Get filtered list of financial transactions
   */
  static async getTransactions(filter: FinanceFilter) {
    const where: any = {};

    if (filter.type && filter.type !== 'ALL') {
      where.type = filter.type as TransactionType;
    }

    if (filter.source && filter.source !== 'ALL') {
      where.source = {
        contains: filter.source.trim(),
        mode: 'insensitive',
      };
    }

    if (filter.category && filter.category !== 'ALL') {
      where.category = {
        contains: filter.category.trim(),
        mode: 'insensitive',
      };
    }

    if (filter.search && filter.search.trim()) {
      where.OR = [
        {
          description: {
            contains: filter.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          source: {
            contains: filter.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          category: {
            contains: filter.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    // Date range filtering
    if (filter.startDate && filter.endDate) {
      const s = new Date(filter.startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(filter.endDate);
      e.setHours(23, 59, 59, 999);
      where.transactionDate = {
        gte: s,
        lte: e,
      };
    } else if (filter.startDate) {
      const s = new Date(filter.startDate);
      s.setHours(0, 0, 0, 0);
      where.transactionDate = {
        gte: s,
      };
    } else if (filter.endDate) {
      const e = new Date(filter.endDate);
      e.setHours(23, 59, 59, 999);
      where.transactionDate = {
        lte: e,
      };
    } else if (filter.year && filter.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1);
      const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59, 999);
      where.transactionDate = {
        gte: startDate,
        lte: endDate,
      };
    } else if (filter.year) {
      const startDate = new Date(filter.year, 0, 1);
      const endDate = new Date(filter.year, 11, 31, 23, 59, 59, 999);
      where.transactionDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await prisma.financeTransaction.findMany({
      where,
      orderBy: {
        transactionDate: 'desc',
      },
      include: {
        createdBy: {
          select: {
            username: true,
            member: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      type: t.type, // INCOME / EXPENSE
      amount: Number(t.amount),
      description: t.description,
      source: t.source || 'Lainnya',
      category: t.category || 'Lainnya',
      transactionDate: t.transactionDate.toISOString(),
      creatorName: t.createdBy.member?.name || t.createdBy.username,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  }

  /**
   * Get transaction detail by ID
   */
  static async getTransactionById(id: string) {
    const transaction = await prisma.financeTransaction.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            username: true,
            member: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaksi kas tidak ditemukan.', 404);
    }

    return {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description,
      source: transaction.source || 'Lainnya',
      category: transaction.category || 'Lainnya',
      transactionDate: transaction.transactionDate.toISOString(),
      creatorName: transaction.createdBy.member?.name || transaction.createdBy.username,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }

  /**
   * Create new finance transaction (ADMIN ONLY)
   * Validasi jumlah harus lebih besar dari 0
   */
  static async createTransaction(data: CreateTransactionDTO) {
    if (!data.description || data.description.trim().length === 0) {
      throw new AppError('Keterangan transaksi wajib diisi.', 400);
    }
    if (data.amount === undefined || data.amount === null || isNaN(data.amount) || data.amount <= 0) {
      throw new AppError('Jumlah transaksi harus lebih besar dari 0.', 400);
    }

    const transaction = await prisma.financeTransaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description.trim(),
        source: data.source ? data.source.trim() : 'Lainnya',
        category: data.category ? data.category.trim() : 'Lainnya',
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: {
            username: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    return {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description,
      source: transaction.source || 'Lainnya',
      category: transaction.category || 'Lainnya',
      transactionDate: transaction.transactionDate.toISOString(),
      creatorName: transaction.createdBy.member?.name || transaction.createdBy.username,
      createdAt: transaction.createdAt.toISOString(),
    };
  }

  /**
   * Update finance transaction (ADMIN ONLY)
   */
  static async updateTransaction(id: string, data: UpdateTransactionDTO) {
    const existing = await prisma.financeTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Transaksi kas tidak ditemukan.', 404);
    }

    const linkedWithdrawal = await prisma.cashWithdrawal.findUnique({
      where: { financeTransactionId: id },
      select: { id: true },
    });
    if (linkedWithdrawal) {
      throw new AppError('Pengeluaran ini dikelola melalui catatan pengambilan kas.', 400);
    }

    if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
      throw new AppError('Jumlah transaksi harus lebih besar dari 0.', 400);
    }

    const updated = await prisma.financeTransaction.update({
      where: { id },
      data: {
        type: data.type !== undefined ? data.type : existing.type,
        amount: data.amount !== undefined ? data.amount : existing.amount,
        description: data.description !== undefined ? data.description.trim() : existing.description,
        source: data.source !== undefined ? data.source.trim() : existing.source,
        category: data.category !== undefined ? data.category.trim() : existing.category,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : existing.transactionDate,
      },
      include: {
        createdBy: {
          select: {
            username: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    return {
      id: updated.id,
      type: updated.type,
      amount: Number(updated.amount),
      description: updated.description,
      source: updated.source || 'Lainnya',
      category: updated.category || 'Lainnya',
      transactionDate: updated.transactionDate.toISOString(),
      creatorName: updated.createdBy.member?.name || updated.createdBy.username,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Delete finance transaction (ADMIN ONLY)
   */
  static async deleteTransaction(id: string) {
    const existing = await prisma.financeTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Transaksi kas tidak ditemukan.', 404);
    }

    const linkedWithdrawal = await prisma.cashWithdrawal.findUnique({
      where: { financeTransactionId: id },
      select: { id: true },
    });
    if (linkedWithdrawal) {
      throw new AppError('Pengeluaran ini dikelola melalui catatan pengambilan kas.', 400);
    }

    await prisma.financeTransaction.delete({ where: { id } });
    return {
      id,
      message: 'Transaksi kas berhasil dihapus.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODULE 11: SPECIFIC INCOME MANAGEMENT METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * READ: Get list of incomes only
   */
  static async getIncomes(filter: Omit<FinanceFilter, 'type'>) {
    return this.getTransactions({
      ...filter,
      type: 'INCOME',
    });
  }

  /**
   * READ: Get single income by ID
   */
  static async getIncomeById(id: string) {
    const tx = await this.getTransactionById(id);
    if (tx.type !== TransactionType.INCOME) {
      throw new AppError('Data yang diminta bukan transaksi pemasukan.', 400);
    }
    return tx;
  }

  /**
   * CREATE: Record new income (ADMIN ONLY)
   * Validasi jumlah harus lebih besar dari 0
   */
  static async createIncome(data: CreateIncomeDTO) {
    if (data.amount === undefined || data.amount === null || isNaN(data.amount) || data.amount <= 0) {
      throw new AppError('Jumlah pemasukan harus lebih besar dari 0.', 400);
    }
    if (!data.source || data.source.trim().length === 0) {
      throw new AppError('Sumber pemasukan wajib diisi.', 400);
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new AppError('Keterangan pemasukan wajib diisi.', 400);
    }

    return this.createTransaction({
      type: TransactionType.INCOME,
      amount: data.amount,
      source: data.source.trim(),
      description: data.description.trim(),
      transactionDate: data.transactionDate,
      createdById: data.createdById,
    });
  }

  /**
   * UPDATE: Modify income (ADMIN ONLY)
   * Validasi jumlah harus lebih besar dari 0
   */
  static async updateIncome(id: string, data: UpdateIncomeDTO) {
    const existing = await prisma.financeTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Data pemasukan tidak ditemukan.', 404);
    }
    if (existing.type !== TransactionType.INCOME) {
      throw new AppError('Transaksi ini bukan transaksi pemasukan.', 400);
    }

    if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
      throw new AppError('Jumlah pemasukan harus lebih besar dari 0.', 400);
    }

    return this.updateTransaction(id, {
      type: TransactionType.INCOME,
      amount: data.amount,
      source: data.source,
      description: data.description,
      transactionDate: data.transactionDate,
    });
  }

  /**
   * DELETE: Remove income (ADMIN ONLY)
   */
  static async deleteIncome(id: string) {
    const existing = await prisma.financeTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Data pemasukan tidak ditemukan.', 404);
    }
    if (existing.type !== TransactionType.INCOME) {
      throw new AppError('Transaksi ini bukan transaksi pemasukan.', 400);
    }

    return this.deleteTransaction(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODULE 12: EXPENSE MANAGEMENT METHODS
  // Kategori: kegiatan | konsumsi | perlengkapan | sosial | operasional | lainnya
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * READ: Get list of expenses with optional category/month/year/search filter
   */
  static async getExpenses(filter: Omit<FinanceFilter, 'type'>) {
    return this.getTransactions({
      ...filter,
      type: 'EXPENSE',
    });
  }

  /**
   * READ: Get single expense by ID (validates it is EXPENSE type)
   */
  static async getExpenseById(id: string) {
    const tx = await this.getTransactionById(id);
    if (tx.type !== TransactionType.EXPENSE) {
      throw new AppError('Data yang diminta bukan transaksi pengeluaran.', 400);
    }
    return tx;
  }

  /**
   * CREATE: Record new expense (ADMIN ONLY)
   * Validasi: amount > 0, category wajib, description wajib
   */
  static async createExpense(data: CreateExpenseDTO) {
    if (data.amount === undefined || data.amount === null || isNaN(data.amount) || data.amount <= 0) {
      throw new AppError('Jumlah pengeluaran harus lebih besar dari 0.', 400);
    }
    if (!data.category || data.category.trim().length === 0) {
      throw new AppError('Kategori pengeluaran wajib diisi.', 400);
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new AppError('Keterangan pengeluaran wajib diisi.', 400);
    }

    return this.createTransaction({
      type: TransactionType.EXPENSE,
      amount: data.amount,
      category: data.category.trim(),
      description: data.description.trim(),
      transactionDate: data.transactionDate,
      createdById: data.createdById,
    });
  }

  /**
   * UPDATE: Modify expense (ADMIN ONLY)
   * Validasi: amount > 0 jika diubah
   */
  static async updateExpense(id: string, data: UpdateExpenseDTO) {
    const existing = await prisma.financeTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Data pengeluaran tidak ditemukan.', 404);
    }
    if (existing.type !== TransactionType.EXPENSE) {
      throw new AppError('Transaksi ini bukan transaksi pengeluaran.', 400);
    }

    if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
      throw new AppError('Jumlah pengeluaran harus lebih besar dari 0.', 400);
    }

    return this.updateTransaction(id, {
      type: TransactionType.EXPENSE,
      amount: data.amount,
      category: data.category,
      description: data.description,
      transactionDate: data.transactionDate,
    });
  }

  /**
   * DELETE: Remove expense (ADMIN ONLY)
   * Saldo otomatis bertambah kembali setelah pengeluaran dihapus
   */
  static async deleteExpense(id: string) {
    const existing = await prisma.financeTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Data pengeluaran tidak ditemukan.', 404);
    }
    if (existing.type !== TransactionType.EXPENSE) {
      throw new AppError('Transaksi ini bukan transaksi pengeluaran.', 400);
    }

    return this.deleteTransaction(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODULE 14: FINANCIAL REPORTS & EXPORT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate comprehensive financial report for transparency and auditing
   */
  static async getFinancialReport(filter: {
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    type?: 'INCOME' | 'EXPENSE' | 'ALL';
  }) {
    let startPeriodDate: Date | null = null;
    let endPeriodDate: Date | null = null;
    let periodLabel = 'Semua Waktu';

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    if (filter.startDate && filter.endDate) {
      startPeriodDate = new Date(filter.startDate);
      startPeriodDate.setHours(0, 0, 0, 0);
      endPeriodDate = new Date(filter.endDate);
      endPeriodDate.setHours(23, 59, 59, 999);
      periodLabel = `${startPeriodDate.toLocaleDateString('id-ID')} s/d ${endPeriodDate.toLocaleDateString('id-ID')}`;
    } else if (filter.startDate) {
      startPeriodDate = new Date(filter.startDate);
      startPeriodDate.setHours(0, 0, 0, 0);
      periodLabel = `Mulai ${startPeriodDate.toLocaleDateString('id-ID')}`;
    } else if (filter.endDate) {
      endPeriodDate = new Date(filter.endDate);
      endPeriodDate.setHours(23, 59, 59, 999);
      periodLabel = `Sampai ${endPeriodDate.toLocaleDateString('id-ID')}`;
    } else if (filter.year && filter.month) {
      startPeriodDate = new Date(filter.year, filter.month - 1, 1);
      endPeriodDate = new Date(filter.year, filter.month, 0, 23, 59, 59, 999);
      periodLabel = `${monthNames[filter.month - 1]} ${filter.year}`;
    } else if (filter.year) {
      startPeriodDate = new Date(filter.year, 0, 1);
      endPeriodDate = new Date(filter.year, 11, 31, 23, 59, 59, 999);
      periodLabel = `Tahun ${filter.year}`;
    } else if (filter.month) {
      const curYear = new Date().getFullYear();
      startPeriodDate = new Date(curYear, filter.month - 1, 1);
      endPeriodDate = new Date(curYear, filter.month, 0, 23, 59, 59, 999);
      periodLabel = `${monthNames[filter.month - 1]} ${curYear}`;
    }

    // 1. Calculate Saldo Awal (cumulative net balance before startPeriodDate)
    let saldoAwal = 0;
    if (startPeriodDate) {
      const priorTransactions = await prisma.financeTransaction.findMany({
        where: {
          transactionDate: { lt: startPeriodDate },
        },
        select: { type: true, amount: true },
      });
      const priorIncome = priorTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const priorExpense = priorTransactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      saldoAwal = priorIncome - priorExpense;
    }

    // 2. Fetch period transactions
    const where: any = {};
    if (startPeriodDate && endPeriodDate) {
      where.transactionDate = { gte: startPeriodDate, lte: endPeriodDate };
    } else if (startPeriodDate) {
      where.transactionDate = { gte: startPeriodDate };
    } else if (endPeriodDate) {
      where.transactionDate = { lte: endPeriodDate };
    }

    if (filter.type && filter.type !== 'ALL') {
      where.type = filter.type as TransactionType;
    }

    const rawTransactions = await prisma.financeTransaction.findMany({
      where,
      orderBy: { transactionDate: 'asc' }, // chronological order for running balance
      include: {
        createdBy: {
          select: {
            username: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    let currentBalance = saldoAwal;
    const mappedTransactions = rawTransactions.map((t) => {
      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) {
        currentBalance += amount;
      } else {
        currentBalance -= amount;
      }

      return {
        id: t.id,
        type: t.type as 'INCOME' | 'EXPENSE',
        amount,
        source: t.source || 'Lainnya',
        category: t.category || 'Lainnya',
        description: t.description,
        transactionDate: t.transactionDate.toISOString(),
        creatorName: t.createdBy.member?.name || t.createdBy.username,
        runningBalance: currentBalance,
      };
    });

    const totalPemasukan = rawTransactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPengeluaran = rawTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const saldo = totalPemasukan - totalPengeluaran;
    const saldoAkhir = currentBalance;
    const jumlahTransaksi = rawTransactions.length;

    // 3. Build monthly breakdown (all 12 months for target year)
    const targetYear = filter.year || (startPeriodDate ? startPeriodDate.getFullYear() : new Date().getFullYear());
    const monthlyBreakdown = monthNames.map((name, idx) => {
      const mNum = idx + 1;
      const mTx = rawTransactions.filter((t) => {
        const d = new Date(t.transactionDate);
        return d.getFullYear() === targetYear && d.getMonth() + 1 === mNum;
      });
      const inc = mTx.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + Number(t.amount), 0);
      const exp = mTx.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + Number(t.amount), 0);
      return {
        month: name.slice(0, 3), // Jan, Feb, Mar...
        monthFullName: name,
        monthNum: mNum,
        pemasukan: inc,
        pengeluaran: exp,
        saldo: inc - exp,
      };
    });

    // 4. Chart data
    const isSingleMonthOrShort = (filter.month && filter.year) || (startPeriodDate && endPeriodDate && (endPeriodDate.getTime() - startPeriodDate.getTime()) <= 32 * 24 * 3600 * 1000);

    let chartData: Array<{ period: string; pemasukan: number; pengeluaran: number; saldo: number }> = [];

    if (isSingleMonthOrShort && mappedTransactions.length > 0) {
      const dayMap = new Map<string, { pemasukan: number; pengeluaran: number }>();
      mappedTransactions.forEach((t) => {
        const dateKey = t.transactionDate.split('T')[0];
        const existing = dayMap.get(dateKey) || { pemasukan: 0, pengeluaran: 0 };
        if (t.type === 'INCOME') existing.pemasukan += t.amount;
        else existing.pengeluaran += t.amount;
        dayMap.set(dateKey, existing);
      });

      chartData = Array.from(dayMap.entries()).map(([dateStr, vals]) => {
        const d = new Date(dateStr);
        return {
          period: `${d.getDate()} ${monthNames[d.getMonth()].slice(0, 3)}`,
          pemasukan: vals.pemasukan,
          pengeluaran: vals.pengeluaran,
          saldo: vals.pemasukan - vals.pengeluaran,
        };
      });
    } else {
      chartData = monthlyBreakdown.map((m) => ({
        period: m.month,
        pemasukan: m.pemasukan,
        pengeluaran: m.pengeluaran,
        saldo: m.saldo,
      }));
    }

    // 5. Category breakdown (expenses)
    const catMap = new Map<string, { amount: number; count: number }>();
    rawTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((t) => {
        const cat = t.category || 'Lainnya';
        const cur = catMap.get(cat) || { amount: 0, count: 0 };
        cur.amount += Number(t.amount);
        cur.count += 1;
        catMap.set(cat, cur);
      });

    const categoryBreakdown = Array.from(catMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      percentage: totalPengeluaran > 0 ? Math.round((data.amount / totalPengeluaran) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // 6. Source breakdown (incomes)
    const srcMap = new Map<string, { amount: number; count: number }>();
    rawTransactions
      .filter((t) => t.type === TransactionType.INCOME)
      .forEach((t) => {
        const src = t.source || 'Lainnya';
        const cur = srcMap.get(src) || { amount: 0, count: 0 };
        cur.amount += Number(t.amount);
        cur.count += 1;
        srcMap.set(src, cur);
      });

    const sourceBreakdown = Array.from(srcMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      percentage: totalPemasukan > 0 ? Math.round((data.amount / totalPemasukan) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      summary: {
        totalPemasukan,
        totalPengeluaran,
        saldo,
        jumlahTransaksi,
        saldoAwal,
        saldoAkhir,
      },
      filter: {
        startDate: filter.startDate || null,
        endDate: filter.endDate || null,
        month: filter.month || null,
        year: filter.year || null,
        type: filter.type || 'ALL',
        periodLabel,
      },
      chartData,
      monthlyBreakdown,
      categoryBreakdown,
      sourceBreakdown,
      transactions: mappedTransactions.reverse(), // most recent first for table view
    };
  }

  /**
   * Generate CSV format string from FinancialReportData
   */
  static generateCSV(report: any): string {
    const lines: string[] = [];

    // Header metadata
    lines.push('"LAPORAN KEUANGAN KARANG TARUNA SETYA BAKTI"');
    lines.push(`"Periode","${report.filter.periodLabel}"`);
    lines.push(`"Total Pemasukan","Rp ${Number(report.summary.totalPemasukan).toLocaleString('id-ID')}"`);
    lines.push(`"Total Pengeluaran","Rp ${Number(report.summary.totalPengeluaran).toLocaleString('id-ID')}"`);
    lines.push(`"Saldo Periode","Rp ${Number(report.summary.saldo).toLocaleString('id-ID')}"`);
    lines.push(`"Saldo Awal","Rp ${Number(report.summary.saldoAwal).toLocaleString('id-ID')}"`);
    lines.push(`"Saldo Akhir","Rp ${Number(report.summary.saldoAkhir).toLocaleString('id-ID')}"`);
    lines.push(`"Jumlah Transaksi","${report.summary.jumlahTransaksi}"`);
    lines.push(`"Tanggal Unduh","${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}"`);
    lines.push('');

    // Table Header
    lines.push('"No","Tanggal","Jenis","Kategori/Sumber","Keterangan","Pemasukan (Rp)","Pengeluaran (Rp)","Saldo Berjalan (Rp)","Dicatat Oleh"');

    // Chronological order for CSV
    const chronological = [...report.transactions].reverse();
    chronological.forEach((t: any, idx: number) => {
      const dateStr = new Date(t.transactionDate).toLocaleDateString('id-ID');
      const catOrSrc = t.type === 'INCOME' ? t.source : t.category;
      const desc = String(t.description || '').replace(/"/g, '""');
      const inc = t.type === 'INCOME' ? t.amount : 0;
      const exp = t.type === 'EXPENSE' ? t.amount : 0;
      lines.push(
        `"${idx + 1}","${dateStr}","${t.type}","${catOrSrc}","${desc}","${inc}","${exp}","${t.runningBalance}","${t.creatorName}"`
      );
    });

    return '\uFEFF' + lines.join('\r\n'); // UTF-8 BOM for Excel
  }
}
