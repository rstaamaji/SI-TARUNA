import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import memberRoutes from './member.routes';

const router = Router();

// 1. Health check: /api/health
router.use('/', healthRoutes);

// 2. Authentication: /api/auth (login, me)
router.use('/auth', authRoutes);

// 3. Admin Protected Routes: /api/admin
router.use('/admin', adminRoutes);

// 4. Member Management CRUD: /api/members (and /api/member)
router.use('/members', memberRoutes);
router.use('/member', memberRoutes);

export default router;
