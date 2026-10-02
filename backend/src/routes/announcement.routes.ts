import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Seluruh rute pengumuman memerlukan login
router.use(authenticate);

// Member / Public reads
router.get('/', AnnouncementController.getAll);
router.get('/attention', AnnouncementController.getAttention);
router.get('/:id', AnnouncementController.getById);

// Admin-only mutations (Create, Update, Delete)
router.post('/', requireAdmin, AnnouncementController.create);
router.put('/:id', requireAdmin, AnnouncementController.update);
router.delete('/:id', requireAdmin, AnnouncementController.delete);

export default router;
