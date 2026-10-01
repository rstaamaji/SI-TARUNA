import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { TransactionType } from '@prisma/client';

// ─── DTOs ────────────────────────────────────────────────────────────────────
export interface CashWithdrawalFilter {
  month?: number;
  year?: number;
  search?: string;
}

export interface CreateCashWithdrawalDTO {
  withdrawerName: string;   // Nama pengambil (wajib)
  memberId?: string;         // Link ke Member (opsional)
  amount: number;            // Jumlah (> 0)
  withdrawalDate?: string;   // ISO string, default now()
  purpose: string;           // Keperluan
  description?: string;      // Keterangan tambahan
  createdById: string;       // ID admin yang mencatat
}

export interface UpdateCashWithdrawalDTO {
  withdrawerName?: string;
  memberId?: string | null;
  amount?: number;
  withdrawalDate?: string;
  purpose?: string;
  description?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a safe return shape from a CashWithdrawal+includes record */
function mapWithdrawal(w: any) {
  return {
    id: w.id,
    withdrawerName: w.withdrawerName,
    memberId: w.memberId || null,
    memberName: w.member?.name || null,
    amount: Number(w.amount),
    withdrawalDate: w.withdrawalDate.toISOString(),
    purpose: w.purpose,
    description: w.description || null,
    financeTransactionId: w.financeTransactionId || null,
    creatorName: w.createdBy?.member?.name || w.createdBy?.username || 'Admin',
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

const INCLUDE_FULL = {
  member: { select: { name: true } },
  createdBy: { select: { username: true, member: { select: { name: true } } } },
};

// ─── Service ─────────────────────────────────────────────────────────────────
export class CashWithdrawalService {

  /**
   * READ: Daftar riwayat pengambilan kas
   * Dapat difilter per bulan, tahun, atau nama pengambil.
   */
  static async getWithdrawals(filter: CashWithdrawalFilter = {}) {
    const where: any = {};

    if (filter.search?.trim()) {
      where.OR = [
        { withdrawerName: { contains: filter.search.trim(), mode: 'insensitive' } },
        { purpose:        { contains: filter.search.trim(), mode: 'insensitive' } },
        { description:    { contains: filter.search.trim(), mode: 'insensitive' } },
      ];
    }

    if (filter.year && filter.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1);
      const endDate   = new Date(filter.year, filter.month, 0, 23, 59, 59, 999);
      where.withdrawalDate = { gte: startDate, lte: endDate };
    } else if (filter.year) {
      const startDate = new Date(filter.year, 0, 1);
      const endDate   = new Date(filter.year, 11, 31, 23, 59, 59, 999);
      where.withdrawalDate = { gte: startDate, lte: endDate };
    }

    const records = await prisma.cashWithdrawal.findMany({
      where,
      orderBy: { withdrawalDate: 'desc' },
      include: INCLUDE_FULL,
    });

    return records.map(mapWithdrawal);
  }

  /**
   * READ: Detail satu catatan pengambilan kas
   */
  static async getWithdrawalById(id: string) {
    const record = await prisma.cashWithdrawal.findUnique({
      where: { id },
      include: INCLUDE_FULL,
    });
    if (!record) throw new AppError('Catatan pengambilan kas tidak ditemukan.', 404);
    return mapWithdrawal(record);
  }

  /**
   * CREATE: Catat pengambilan kas baru (ADMIN ONLY)
   *
   * ANTI DOUBLE-COUNT PATTERN:
   * 1. Buat CashWithdrawal
   * 2. Buat satu FinanceTransaction EXPENSE yang ditautkan ke CashWithdrawal
   * 3. Update CashWithdrawal.financeTransactionId → selesai
   * Saldo otomatis berkurang via FinanceTransaction.
   */
  static async createWithdrawal(data: CreateCashWithdrawalDTO) {
    if (!data.withdrawerName || data.withdrawerName.trim().length === 0) {
      throw new AppError('Nama pengambil kas wajib diisi.', 400);
    }
    if (data.amount === undefined || data.amount === null || isNaN(data.amount) || data.amount <= 0) {
      throw new AppError('Jumlah pengambilan harus lebih besar dari 0.', 400);
    }
    if (!data.purpose || data.purpose.trim().length === 0) {
      throw new AppError('Keperluan pengambilan kas wajib diisi.', 400);
    }
    if (!data.createdById) {
      throw new AppError('ID admin pencatat wajib disertakan.', 400);
    }

    // Validate memberId if provided
    if (data.memberId) {
      const member = await prisma.member.findUnique({ where: { id: data.memberId } });
      if (!member) throw new AppError('Anggota tidak ditemukan.', 404);
    }

    const txDate = data.withdrawalDate ? new Date(data.withdrawalDate) : new Date();
    const expenseDescription = `[Pengambilan Kas] ${data.withdrawerName.trim()} — ${data.purpose.trim()}`;

    // Atomic: buat withdrawal + expense transaction sekaligus
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat FinanceTransaction EXPENSE
      const finTx = await tx.financeTransaction.create({
        data: {
          type: TransactionType.EXPENSE,
          amount: data.amount,
          description: expenseDescription,
          category: 'Pengambilan Kas',
          transactionDate: txDate,
          createdById: data.createdById,
        },
      });

      // 2. Buat CashWithdrawal yang tautkan ke finTx
      const withdrawal = await tx.cashWithdrawal.create({
        data: {
          withdrawerName:      data.withdrawerName.trim(),
          memberId:            data.memberId || null,
          amount:              data.amount,
          withdrawalDate:      txDate,
          purpose:             data.purpose.trim(),
          description:         data.description?.trim() || null,
          financeTransactionId: finTx.id,
          createdById:         data.createdById,
        },
        include: INCLUDE_FULL,
      });

      return withdrawal;
    });

    return mapWithdrawal(result);
  }

  /**
   * UPDATE: Ubah catatan pengambilan kas (ADMIN ONLY)
   *
   * ANTI DOUBLE-COUNT: Jika amount/date/purpose berubah, linked FinanceTransaction
   * ikut diperbarui — bukan dibuat ulang.
   */
  static async updateWithdrawal(id: string, data: UpdateCashWithdrawalDTO) {
    const existing = await prisma.cashWithdrawal.findUnique({ where: { id } });
    if (!existing) throw new AppError('Catatan pengambilan kas tidak ditemukan.', 404);

    if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
      throw new AppError('Jumlah pengambilan harus lebih besar dari 0.', 400);
    }
    if (data.memberId) {
      const member = await prisma.member.findUnique({ where: { id: data.memberId } });
      if (!member) throw new AppError('Anggota tidak ditemukan.', 404);
    }

    const newAmount          = data.amount         !== undefined ? data.amount : Number(existing.amount);
    const newDate            = data.withdrawalDate  ? new Date(data.withdrawalDate) : existing.withdrawalDate;
    const newWithdrawerName  = data.withdrawerName?.trim() || existing.withdrawerName;
    const newPurpose         = data.purpose?.trim() || existing.purpose;
    const newExpenseDesc     = `[Pengambilan Kas] ${newWithdrawerName} — ${newPurpose}`;

    const result = await prisma.$transaction(async (tx) => {
      // Update linked FinanceTransaction jika ada (ANTI DOUBLE-COUNT)
      if (existing.financeTransactionId) {
        await tx.financeTransaction.update({
          where: { id: existing.financeTransactionId },
          data: {
            amount:          newAmount,
            description:     newExpenseDesc,
            transactionDate: newDate,
          },
        });
      }

      // Update CashWithdrawal
      const updated = await tx.cashWithdrawal.update({
        where: { id },
        data: {
          withdrawerName: newWithdrawerName,
          memberId:       data.memberId !== undefined ? (data.memberId || null) : existing.memberId,
          amount:         newAmount,
          withdrawalDate: newDate,
          purpose:        newPurpose,
          description:    data.description !== undefined ? (data.description?.trim() || null) : existing.description,
        },
        include: INCLUDE_FULL,
      });

      return updated;
    });

    return mapWithdrawal(result);
  }

  /**
   * DELETE: Hapus catatan pengambilan kas (ADMIN ONLY)
   *
   * ANTI DOUBLE-COUNT: Menghapus linked FinanceTransaction juga, sehingga
   * saldo kas otomatis bertambah kembali (pengeluaran dibatalkan).
   */
  static async deleteWithdrawal(id: string) {
    const existing = await prisma.cashWithdrawal.findUnique({ where: { id } });
    if (!existing) throw new AppError('Catatan pengambilan kas tidak ditemukan.', 404);

    await prisma.$transaction(async (tx) => {
      // 1. Hapus CashWithdrawal dulu (agar FK constraint tidak komplain)
      await tx.cashWithdrawal.delete({ where: { id } });

      // 2. Hapus linked FinanceTransaction (saldo kas bertambah kembali)
      if (existing.financeTransactionId) {
        await tx.financeTransaction.delete({ where: { id: existing.financeTransactionId } });
      }
    });

    return { id, message: 'Catatan pengambilan kas berhasil dihapus. Saldo kas telah dipulihkan.' };
  }

  /**
   * READ: Ringkasan total pengambilan kas (total, bulan ini, dll)
   */
  static async getSummary(filter: CashWithdrawalFilter = {}) {
    const where: any = {};
    if (filter.year && filter.month) {
      where.withdrawalDate = {
        gte: new Date(filter.year, filter.month - 1, 1),
        lte: new Date(filter.year, filter.month, 0, 23, 59, 59, 999),
      };
    } else if (filter.year) {
      where.withdrawalDate = {
        gte: new Date(filter.year, 0, 1),
        lte: new Date(filter.year, 11, 31, 23, 59, 59, 999),
      };
    }

    const [totalAgg, currentMonthAgg, count] = await Promise.all([
      prisma.cashWithdrawal.aggregate({ _sum: { amount: true } }),
      prisma.cashWithdrawal.aggregate({
        _sum: { amount: true },
        where: {
          withdrawalDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
          },
        },
      }),
      prisma.cashWithdrawal.count(),
    ]);

    return {
      totalWithdrawn:       Number(totalAgg._sum.amount || 0),
      totalWithdrawnMonth:  Number(currentMonthAgg._sum.amount || 0),
      totalCount:           count,
    };
  }
}
