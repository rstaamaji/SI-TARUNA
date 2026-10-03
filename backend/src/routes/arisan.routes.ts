import { Router } from 'express';
import { ArisanController } from '../controllers/arisan.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Seluruh rute arisan memerlukan login (Anggota maupun Pengurus)
router.use(authenticate);

// Public / Member Reads
router.get('/', ArisanController.getAll);
router.get('/upcoming', ArisanController.getUpcoming);
router.get('/history', ArisanController.getHistory);
router.get('/members', ArisanController.getMembers);
router.get('/:id', ArisanController.getById);

// Admin-Only Mutations
router.post('/', requireAdmin, ArisanController.create);
router.put('/:id', requireAdmin, ArisanController.update);
router.post('/:id/winner', requireAdmin, ArisanController.determineWinner);
router.delete('/:id', requireAdmin, ArisanController.delete);

export default router;
