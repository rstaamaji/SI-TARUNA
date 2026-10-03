import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Seluruh rute notifikasi memerlukan login
router.use(authenticate);

// Member & Admin: Melihat notifikasi dan mengubah status baca
router.get('/', NotificationController.getMyNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markRead);
router.post('/read-all', NotificationController.markAllRead);
router.delete('/:id', NotificationController.delete);

// Admin-Only: Broadcast notifikasi custom ke seluruh pengguna
router.post('/broadcast', requireAdmin, NotificationController.broadcast);

export default router;
