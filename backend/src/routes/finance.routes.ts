import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { FinanceController } from '../controllers/finance.controller';

const router = Router();

// Seluruh endpoint finance memerlukan login (autentikasi)
router.use(authenticate);

// 1. GET /api/finance/overview - Summary Cards (MEMBER dan ADMIN dapat melihat)
router.get('/overview', FinanceController.getOverview);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 11: SPECIFIC INCOME ROUTES (/api/finance/incomes)
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/finance/incomes - Daftar pemasukan kas (MEMBER & ADMIN)
router.get('/incomes', FinanceController.getIncomes);

// GET /api/finance/incomes/:id - Detail pemasukan kas (MEMBER & ADMIN)
router.get('/incomes/:id', FinanceController.getIncomeById);

// POST /api/finance/incomes - Catat pemasukan kas baru (KHUSUS ADMIN)
router.post('/incomes', requireAdmin, FinanceController.createIncome);

// PUT /api/finance/incomes/:id - Ubah data pemasukan kas (KHUSUS ADMIN)
router.put('/incomes/:id', requireAdmin, FinanceController.updateIncome);

// DELETE /api/finance/incomes/:id - Hapus pemasukan kas (KHUSUS ADMIN)
router.delete('/incomes/:id', requireAdmin, FinanceController.deleteIncome);

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
