import prisma from '../utils/prisma';
import { TransactionType } from '@prisma/client';
import { AppError } from '../utils/appError';

export interface FinanceFilter {
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
  static async getSummary(filter?: { month?: number; year?: number }) {
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

    // Date range filtering by month and year
    if (filter.year && filter.month) {
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
}
