import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateUser } from '../middlewares/auth.middleware';
import { registerValidator, loginValidator } from '../validators/auth.validator';

const router = Router();

// 1. Account Registration Route
router.post(
  '/register',
  registerValidator,
  validateRequest,
  AuthController.register
);

// 2. Authentication Login Route
router.post(
  '/login',
  loginValidator,
  validateRequest,
  AuthController.login
);

// 3. User Session Logout Route
router.post('/logout', AuthController.logout);

// 4. Authenticated Session Check (Get profile) Route
router.get('/me', authenticateUser, AuthController.getMe);

export default router;
