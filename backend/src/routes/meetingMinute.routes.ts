import { Router } from 'express';
import { MeetingMinuteController } from '../controllers/meetingMinute.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Seluruh rute notulensi memerlukan otentikasi login
router.use(authenticate);

// 1. Member & Admin reads
router.get('/', MeetingMinuteController.getAll);
router.get('/latest', MeetingMinuteController.getLatest);
router.get('/:id', MeetingMinuteController.getById);

// 2. Admin-only mutations
router.post('/', requireAdmin, MeetingMinuteController.create);
router.put('/:id', requireAdmin, MeetingMinuteController.update);
router.delete('/:id', requireAdmin, MeetingMinuteController.delete);

export default router;
