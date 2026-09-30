import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

// Health check endpoint mounted at /api/health
router.use('/', healthRoutes);

export default router;
