import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../validators/common.validator';
import { loginBodySchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', validateRequest({ body: loginBodySchema }), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
