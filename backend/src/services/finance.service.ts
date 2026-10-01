import prisma from '../utils/prisma';
import { TransactionType } from '@prisma/client';
import { AppError } from '../utils/appError';

export interface FinanceFilter {
  month?: number; // 1 - 12
  year?: number;  // e.g. 2026
  type?: 'INCOME' | 'EXPENSE' | 'ALL';
  search?: string;
}

export interface CreateTransactionDTO {
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate?: string;
  createdById: string;
}

export interface UpdateTransactionDTO {
  type?: TransactionType;
  amount?: number;
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

    if (filter.search && filter.search.trim()) {
      where.description = {
        contains: filter.search.trim(),
        mode: 'insensitive',
      };
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
      transactionDate: transaction.transactionDate.toISOString(),
      creatorName: transaction.createdBy.member?.name || transaction.createdBy.username,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }

  /**
   * Create new finance transaction (ADMIN ONLY)
   */
  static async createTransaction(data: CreateTransactionDTO) {
    if (!data.description || data.description.trim().length === 0) {
      throw new AppError('Keterangan transaksi wajib diisi.', 400);
    }
    if (!data.amount || data.amount <= 0) {
      throw new AppError('Nominal transaksi harus lebih besar dari 0.', 400);
    }

    const transaction = await prisma.financeTransaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description.trim(),
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

    if (data.amount !== undefined && data.amount <= 0) {
      throw new AppError('Nominal transaksi harus lebih besar dari 0.', 400);
    }

    const updated = await prisma.financeTransaction.update({
      where: { id },
      data: {
        type: data.type !== undefined ? data.type : existing.type,
        amount: data.amount !== undefined ? data.amount : existing.amount,
        description: data.description !== undefined ? data.description.trim() : existing.description,
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
}
