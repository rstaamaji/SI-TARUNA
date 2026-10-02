import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { FinanceController } from '../controllers/finance.controller';

const router = Router();

// Seluruh endpoint finance memerlukan login (autentikasi)
router.use(authenticate);

// 1. GET /api/finance/overview & /summary - Summary Cards (MEMBER dan ADMIN dapat melihat)
router.get('/overview', FinanceController.getOverview);
router.get('/summary', FinanceController.getOverview);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 11: SPECIFIC INCOME ROUTES (/api/finance/incomes & /income)
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/finance/incomes - Daftar pemasukan kas (MEMBER & ADMIN)
router.get('/incomes', FinanceController.getIncomes);
router.get('/income', FinanceController.getIncomes);

// GET /api/finance/incomes/:id - Detail pemasukan kas (MEMBER & ADMIN)
router.get('/incomes/:id', FinanceController.getIncomeById);
router.get('/income/:id', FinanceController.getIncomeById);

// POST /api/finance/incomes - Catat pemasukan kas baru (KHUSUS ADMIN)
router.post('/incomes', requireAdmin, FinanceController.createIncome);
router.post('/income', requireAdmin, FinanceController.createIncome);

// PUT /api/finance/incomes/:id - Ubah data pemasukan kas (KHUSUS ADMIN)
router.put('/incomes/:id', requireAdmin, FinanceController.updateIncome);
router.put('/income/:id', requireAdmin, FinanceController.updateIncome);

// DELETE /api/finance/incomes/:id - Hapus pemasukan kas (KHUSUS ADMIN)
router.delete('/incomes/:id', requireAdmin, FinanceController.deleteIncome);
router.delete('/income/:id', requireAdmin, FinanceController.deleteIncome);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 12: SPECIFIC EXPENSE ROUTES (/api/finance/expenses & /expense)
// Kategori: kegiatan | konsumsi | perlengkapan | sosial | operasional | lainnya
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/finance/expenses - Daftar pengeluaran kas (MEMBER & ADMIN)
router.get('/expenses', FinanceController.getExpenses);
router.get('/expense', FinanceController.getExpenses);

// GET /api/finance/expenses/:id - Detail pengeluaran kas (MEMBER & ADMIN)
router.get('/expenses/:id', FinanceController.getExpenseById);
router.get('/expense/:id', FinanceController.getExpenseById);

// POST /api/finance/expenses - Catat pengeluaran kas baru (KHUSUS ADMIN)
router.post('/expenses', requireAdmin, FinanceController.createExpense);
router.post('/expense', requireAdmin, FinanceController.createExpense);

// PUT /api/finance/expenses/:id - Ubah data pengeluaran kas (KHUSUS ADMIN)
router.put('/expenses/:id', requireAdmin, FinanceController.updateExpense);
router.put('/expense/:id', requireAdmin, FinanceController.updateExpense);

// DELETE /api/finance/expenses/:id - Hapus pengeluaran kas (KHUSUS ADMIN)
router.delete('/expenses/:id', requireAdmin, FinanceController.deleteExpense);
router.delete('/expense/:id', requireAdmin, FinanceController.deleteExpense);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 14: FINANCIAL REPORTS & EXPORT (/api/finance/reports & /report)
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/finance/reports/csv - Export CSV Laporan Keuangan (MEMBER & ADMIN)
router.get('/reports/csv', FinanceController.exportCSV);
router.get('/report/csv', FinanceController.exportCSV);

// GET /api/finance/reports - Laporan Keuangan Komprehensif (MEMBER & ADMIN)
router.get('/reports', FinanceController.getReport);
router.get('/report', FinanceController.getReport);

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL FINANCE TRANSACTIONS ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/finance - Daftar transaksi dengan filter (MEMBER dan ADMIN dapat melihat)
router.get('/', FinanceController.getAll);

// 3. GET /api/finance/:id - Detail transaksi (MEMBER dan ADMIN dapat melihat)
router.get('/:id', FinanceController.getById);

// 4. POST /api/finance - Tambah transaksi baru (KHUSUS ADMIN)
router.post('/', requireAdmin, FinanceController.create);

// 5. PUT /api/finance/:id - Ubah transaksi (KHUSUS ADMIN)
router.put('/:id', requireAdmin, FinanceController.update);

// 6. DELETE /api/finance/:id - Hapus transaksi (KHUSUS ADMIN)
router.delete('/:id', requireAdmin, FinanceController.delete);

export default router;
