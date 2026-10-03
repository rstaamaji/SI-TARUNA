import { Router } from 'express';
import { JimpitanController } from '../controllers/jimpitan.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Seluruh rute jimpitan memerlukan autentikasi login (Member & Admin)
router.use(authenticate);

// Public / Member & Admin Reads
router.get('/dashboard', JimpitanController.getDashboard);
router.get('/groups', JimpitanController.getGroups);
router.get('/history', JimpitanController.getHistory);
router.get('/:id', JimpitanController.getById);

// Admin-Only Mutations (Create, Update, Delete)
router.post('/', requireAdmin, JimpitanController.create);
router.put('/:id', requireAdmin, JimpitanController.update);
router.delete('/:id', requireAdmin, JimpitanController.delete);

export default router;
