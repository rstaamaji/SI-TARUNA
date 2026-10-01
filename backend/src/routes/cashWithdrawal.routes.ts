import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { CashWithdrawalController } from '../controllers/cashWithdrawal.controller';

const router = Router();

// Semua endpoint memerlukan login
router.use(authenticate);

// GET /api/withdrawals/summary — Ringkasan total (MEMBER & ADMIN)
// MUST be before /:id to avoid "summary" being treated as id param
router.get('/summary', CashWithdrawalController.getSummary);

// GET /api/withdrawals — Daftar riwayat pengambilan kas (MEMBER & ADMIN)
router.get('/', CashWithdrawalController.getAll);

// GET /api/withdrawals/:id — Detail pengambilan kas (MEMBER & ADMIN)
router.get('/:id', CashWithdrawalController.getById);

// POST /api/withdrawals — Catat pengambilan kas baru (KHUSUS ADMIN)
router.post('/', requireAdmin, CashWithdrawalController.create);

// PUT /api/withdrawals/:id — Ubah catatan pengambilan kas (KHUSUS ADMIN)
router.put('/:id', requireAdmin, CashWithdrawalController.update);

// DELETE /api/withdrawals/:id — Hapus catatan pengambilan kas (KHUSUS ADMIN)
router.delete('/:id', requireAdmin, CashWithdrawalController.delete);

export default router;
