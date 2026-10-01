import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { FinanceController } from '../controllers/finance.controller';

const router = Router();

// Seluruh endpoint finance memerlukan login (autentikasi)
router.use(authenticate);

// 1. GET /api/finance/overview - Summary Cards (MEMBER dan ADMIN dapat melihat)
router.get('/overview', FinanceController.getOverview);

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
