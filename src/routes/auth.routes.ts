import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateUser } from '../middlewares/auth.middleware';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator';

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

// 4. Rotate Access & Refresh Tokens Route
router.post('/refresh-token', AuthController.refreshToken);

// 4. Request Password Reset Link Route
router.post(
  '/forgot-password',
  forgotPasswordValidator,
  validateRequest,
  AuthController.forgotPassword
);

// 5. Reset Password Execution Route
router.post(
  '/reset-password',
  resetPasswordValidator,
  validateRequest,
  AuthController.resetPassword
);

// 6. Authenticated Session Check (Get profile) Route
router.get('/me', authenticateUser, AuthController.getMe);

export default router;
