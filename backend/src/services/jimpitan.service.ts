import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';

export interface CreateJimpitanDto {
  groupId: string;
  month: number;
  year: number;
  amount: number;
  notes?: string | null;
  inputDate?: string | Date | null;
}

export interface UpdateJimpitanDto {
  groupId?: string;
  month?: number;
  year?: number;
  amount?: number;
  notes?: string | null;
  inputDate?: string | Date | null;
}

const MONTH_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export class JimpitanService {
  /**
   * Pastikan ke-7 Kelompok Jimpitan Dusun Tuk Uluh tersedia di database
   */
  static async ensureDefaultGroups() {
    const defaultGroups = [
      { groupNumber: 1, name: 'Kelompok 1 (RT 01 Dusun Tuk Uluh Barat)' },
      { groupNumber: 2, name: 'Kelompok 2 (RT 01 Dusun Tuk Uluh Timur)' },
      { groupNumber: 3, name: 'Kelompok 3 (RT 02 Dusun Tuk Uluh Utara)' },
      { groupNumber: 4, name: 'Kelompok 4 (RT 02 Dusun Tuk Uluh Selatan)' },
      { groupNumber: 5, name: 'Kelompok 5 (RT 03 Dusun Tuk Uluh Krajan)' },
      { groupNumber: 6, name: 'Kelompok 6 (RT 03 Dusun Tuk Uluh Wetan)' },
      { groupNumber: 7, name: 'Kelompok 7 (Dusun Tuk Uluh Perbatasan)' },
    ];

    for (const g of defaultGroups) {
      await prisma.jimpitanGroup.upsert({
        where: { groupNumber: g.groupNumber },
        update: {},
        create: g,
      });
    }
  }

  /**
   * Mengambil semua kelompok jimpitan (Kelompok 1 s/d 7)
   */
  static async getGroups() {
    await this.ensureDefaultGroups();
    return prisma.jimpitanGroup.findMany({
      orderBy: { groupNumber: 'asc' },
    });
  }

  /**
   * Mengambil data dashboard jimpitan untuk bulan & tahun tertentu
   * Menampilkan:
   * - Kelompok 1: Rp xxx s/d Kelompok 7: Rp xxx
   * - TOTAL JIMPITAN BULAN INI: Rp xxx
   * - Chart perbandingan kontribusi setiap kelompok
   * - Tren bulanan
   */
  static async getDashboard(monthParam?: number, yearParam?: number) {
    await this.ensureDefaultGroups();

    const now = new Date();
    // Default ke Oktober 2026 atau bulan kalender berjalan
    const year = yearParam ? Number(yearParam) : 2026;
    const month = monthParam ? Number(monthParam) : (now.getFullYear() === 2026 ? now.getMonth() + 1 : 10);

    const periodName = `${MONTH_NAMES[month] || 'Bulan ' + month} ${year}`;

    // 1. Ambil seluruh 7 kelompok
    const groups = await prisma.jimpitanGroup.findMany({
      orderBy: { groupNumber: 'asc' },
    });

    // 2. Ambil seluruh record jimpitan pada periode (month, year) yang dipilih
    const records = await prisma.jimpitanRecord.findMany({
      where: {
        month,
        year,
      },
      include: {
        group: true,
      },
    });

    const recordMap = new Map<string, typeof records[0]>();
    records.forEach((r) => {
      recordMap.set(r.groupId, r);
    });

    // 3. Bangun data spesifik untuk Kelompok 1 s/d Kelompok 7
    let totalJimpitanBulanIni = 0;
    let completedGroupsCount = 0;

    const groupItems = groups.map((grp) => {
      const rec = recordMap.get(grp.id);
      const amount = rec ? Number(rec.amount) : 0;
      totalJimpitanBulanIni += amount;

      if (rec) {
        completedGroupsCount++;
      }

      return {
        groupId: grp.id,
        groupNumber: grp.groupNumber,
        groupName: grp.name,
        shortName: `Kelompok ${grp.groupNumber}`,
        amount,
        formattedAmount: `Rp ${amount.toLocaleString('id-ID')}`,
        notes: rec ? rec.notes : null,
        inputDate: rec ? (rec.inputDate ? rec.inputDate.toISOString() : rec.createdAt.toISOString()) : null,
        recordId: rec ? rec.id : null,
        status: rec ? ('RECORDED' as const) : ('PENDING' as const),
      };
    });

    // 4. Perbandingan Kontribusi Setiap Kelompok untuk Chart
    const contributionChart = groupItems.map((item) => {
      const percentage =
        totalJimpitanBulanIni > 0
          ? Math.round((item.amount / totalJimpitanBulanIni) * 1000) / 10
          : 0;

      return {
        groupNumber: item.groupNumber,
        groupName: item.groupName,
        shortName: item.shortName,
        amount: item.amount,
        percentage,
        formattedAmount: item.formattedAmount,
        status: item.status,
      };
    });

    // 5. Tren Bulanan (Riwayat 6 Bulan Terakhir untuk Perbandingan)
    const recentAllRecords = await prisma.jimpitanRecord.findMany({
      where: {
        year: { in: [year, year - 1] },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    const monthlyAggregate = new Map<string, { month: number; year: number; total: number; count: number }>();
    recentAllRecords.forEach((r) => {
      const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
      const existing = monthlyAggregate.get(key) || {
        month: r.month,
        year: r.year,
        total: 0,
        count: 0,
      };
      existing.total += Number(r.amount);
      existing.count += 1;
      monthlyAggregate.set(key, existing);
    });

    const monthlyTrends = Array.from(monthlyAggregate.entries())
      .map(([key, val]) => ({
        key,
        month: val.month,
        year: val.year,
        periodName: `${MONTH_NAMES[val.month]} ${val.year}`,
        totalAmount: val.total,
        formattedTotal: `Rp ${val.total.toLocaleString('id-ID')}`,
        recordsCount: val.count,
      }))
      .slice(-6);

    return {
      period: {
        month,
        year,
        periodName,
      },
      totalJimpitanBulanIni,
      formattedTotalJimpitan: `Rp ${totalJimpitanBulanIni.toLocaleString('id-ID')}`,
      totalGroups: groups.length,
      completedGroupsCount,
      pendingGroupsCount: groups.length - completedGroupsCount,
      groups: groupItems,
      contributionChart,
      monthlyTrends,
    };
  }

  /**
   * Mengambil riwayat catatan jimpitan per bulan / filter
   */
  static async getHistory(filters?: {
    year?: number;
    month?: number;
    groupId?: string;
  }) {
    const where: any = {};
    if (filters?.year) where.year = Number(filters.year);
    if (filters?.month) where.month = Number(filters.month);
    if (filters?.groupId) where.groupId = filters.groupId;

    const records = await prisma.jimpitanRecord.findMany({
      where,
      include: {
        group: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { group: { groupNumber: 'asc' } },
      ],
    });

    // Grouping by Month & Year for structured display
    const groupedMap = new Map<
      string,
      {
        month: number;
        year: number;
        periodName: string;
        totalAmount: number;
        records: any[];
      }
    >();

    records.forEach((r) => {
      const key = `${r.year}-${r.month}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          month: r.month,
          year: r.year,
          periodName: `${MONTH_NAMES[r.month]} ${r.year}`,
          totalAmount: 0,
          records: [],
        });
      }
      const groupData = groupedMap.get(key)!;
      const amt = Number(r.amount);
      groupData.totalAmount += amt;
      groupData.records.push({
        id: r.id,
        groupId: r.groupId,
        groupNumber: r.group.groupNumber,
        groupName: r.group.name,
        amount: amt,
        formattedAmount: `Rp ${amt.toLocaleString('id-ID')}`,
        notes: r.notes,
        inputDate: r.inputDate ? r.inputDate.toISOString() : r.createdAt.toISOString(),
      });
    });

    const monthlyHistory = Array.from(groupedMap.values()).map((h) => ({
      ...h,
      formattedTotal: `Rp ${h.totalAmount.toLocaleString('id-ID')}`,
    }));

    const totalOverall = records.reduce((acc, r) => acc + Number(r.amount), 0);

    return {
      totalRecords: records.length,
      totalOverall,
      formattedTotalOverall: `Rp ${totalOverall.toLocaleString('id-ID')}`,
      records: records.map((r) => ({
        id: r.id,
        groupId: r.groupId,
        groupNumber: r.group.groupNumber,
        groupName: r.group.name,
        month: r.month,
        year: r.year,
        periodName: `${MONTH_NAMES[r.month]} ${r.year}`,
        amount: Number(r.amount),
        formattedAmount: `Rp ${Number(r.amount).toLocaleString('id-ID')}`,
        notes: r.notes,
        inputDate: r.inputDate ? r.inputDate.toISOString() : r.createdAt.toISOString(),
      })),
      monthlyHistory,
    };
  }

  /**
   * Ambil record jimpitan berdasarkan ID
   */
  static async getById(id: string) {
    const record = await prisma.jimpitanRecord.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!record) {
      throw new AppError('Data jimpitan tidak ditemukan', 404);
    }
    return {
      id: record.id,
      groupId: record.groupId,
      groupNumber: record.group.groupNumber,
      groupName: record.group.name,
      month: record.month,
      year: record.year,
      periodName: `${MONTH_NAMES[record.month]} ${record.year}`,
      amount: Number(record.amount),
      notes: record.notes,
      inputDate: record.inputDate ? record.inputDate.toISOString() : record.createdAt.toISOString(),
    };
  }

  /**
   * Menambah data jimpitan baru
   * VALIDASI KUNCI:
   * Tidak boleh ada dua record untuk kelompok yang sama pada bulan dan tahun yang sama.
   */
  static async createRecord(dto: CreateJimpitanDto) {
    const { groupId, month, year, amount, notes, inputDate } = dto;

    if (!groupId) {
      throw new AppError('Kelompok jimpitan wajib dipilih', 400);
    }
    if (!month || month < 1 || month > 12) {
      throw new AppError('Bulan tidak valid (1-12)', 400);
    }
    if (!year || year < 2020 || year > 2050) {
      throw new AppError('Tahun tidak valid', 400);
    }
    if (amount === undefined || amount === null || Number(amount) < 0) {
      throw new AppError('Total uang jimpitan wajib diisi dan tidak boleh negatif', 400);
    }

    // Pastikan kelompok ada
    const group = await prisma.jimpitanGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new AppError('Kelompok yang dipilih tidak ditemukan', 404);
    }

    // ATURAN: Setiap kelompok melakukan input satu kali setiap bulan
    // Periksa apakah sudah ada record untuk kelompok ini pada bulan & tahun tersebut
    const existing = await prisma.jimpitanRecord.findUnique({
      where: {
        groupId_month_year: {
          groupId,
          month: Number(month),
          year: Number(year),
        },
      },
    });

    if (existing) {
      throw new AppError(
        `Kelompok ${group.groupNumber} (${group.name}) sudah memiliki catatan jimpitan pada bulan ${MONTH_NAMES[month]} ${year}. Setiap kelompok hanya dapat melakukan input satu kali setiap bulan.`,
        400
      );
    }

    const parsedDate = inputDate ? new Date(inputDate) : new Date();

    const created = await prisma.jimpitanRecord.create({
      data: {
        groupId,
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        notes: notes || null,
        inputDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      },
      include: {
        group: true,
      },
    });

    return {
      id: created.id,
      groupId: created.groupId,
      groupNumber: created.group.groupNumber,
      groupName: created.group.name,
      month: created.month,
      year: created.year,
      periodName: `${MONTH_NAMES[created.month]} ${created.year}`,
      amount: Number(created.amount),
      notes: created.notes,
      inputDate: created.inputDate.toISOString(),
    };
  }

  /**
   * Mengubah data jimpitan
   * Tetap mematuhi aturan unik [groupId, month, year]
   */
  static async updateRecord(id: string, dto: UpdateJimpitanDto) {
    const existing = await prisma.jimpitanRecord.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!existing) {
      throw new AppError('Data jimpitan tidak ditemukan', 404);
    }

    const targetGroupId = dto.groupId || existing.groupId;
    const targetMonth = dto.month !== undefined ? Number(dto.month) : existing.month;
    const targetYear = dto.year !== undefined ? Number(dto.year) : existing.year;

    // Jika kelompok, bulan, atau tahun diubah, pastikan tidak bentrok dengan record lain
    if (
      targetGroupId !== existing.groupId ||
      targetMonth !== existing.month ||
      targetYear !== existing.year
    ) {
      const conflict = await prisma.jimpitanRecord.findUnique({
        where: {
          groupId_month_year: {
            groupId: targetGroupId,
            month: targetMonth,
            year: targetYear,
          },
        },
      });

      if (conflict && conflict.id !== id) {
        const group = await prisma.jimpitanGroup.findUnique({ where: { id: targetGroupId } });
        throw new AppError(
          `Data jimpitan untuk ${group?.name || 'kelompok ini'} pada bulan ${MONTH_NAMES[targetMonth]} ${targetYear} sudah ada. Tidak boleh ada duplikasi input.`,
          400
        );
      }
    }

    const updateData: any = {};
    if (dto.groupId) updateData.groupId = dto.groupId;
    if (dto.month !== undefined) updateData.month = Number(dto.month);
    if (dto.year !== undefined) updateData.year = Number(dto.year);
    if (dto.amount !== undefined) {
      if (Number(dto.amount) < 0) {
        throw new AppError('Total uang jimpitan tidak boleh negatif', 400);
      }
      updateData.amount = Number(dto.amount);
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.inputDate) {
      const parsed = new Date(dto.inputDate);
      if (!isNaN(parsed.getTime())) {
        updateData.inputDate = parsed;
      }
    }

    const updated = await prisma.jimpitanRecord.update({
      where: { id },
      data: updateData,
      include: { group: true },
    });

    return {
      id: updated.id,
      groupId: updated.groupId,
      groupNumber: updated.group.groupNumber,
      groupName: updated.group.name,
      month: updated.month,
      year: updated.year,
      periodName: `${MONTH_NAMES[updated.month]} ${updated.year}`,
      amount: Number(updated.amount),
      notes: updated.notes,
      inputDate: updated.inputDate.toISOString(),
    };
  }

  /**
   * Menghapus data jimpitan
   */
  static async deleteRecord(id: string) {
    const existing = await prisma.jimpitanRecord.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!existing) {
      throw new AppError('Data jimpitan tidak ditemukan', 404);
    }

    await prisma.jimpitanRecord.delete({
      where: { id },
    });

    return {
      message: `Catatan jimpitan ${existing.group.name} untuk periode ${MONTH_NAMES[existing.month]} ${existing.year} berhasil dihapus`,
      id,
    };
  }
}
