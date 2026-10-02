import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Seluruh rute event memerlukan login
router.use(authenticate);

// Public / Member reads
router.get('/', EventController.getAll);
router.get('/upcoming', EventController.getUpcoming);
router.get('/:id', EventController.getById);

// Admin-only mutations (Create, Update, Delete)
router.post('/', requireAdmin, EventController.create);
router.put('/:id', requireAdmin, EventController.update);
router.delete('/:id', requireAdmin, EventController.delete);

export default router;
