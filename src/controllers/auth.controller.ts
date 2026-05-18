import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendResponse } from '../utils/sendResponse';
import { env } from '../config/env';
import { User } from '../schemas/user.schema';
import { NotFoundError } from '../utils/errors';
import logger from '../config/logger';
import { sendResetPasswordEmail } from '../smtp/mailer';

export class AuthController {
  /**
   * Registers a new player account and sets up their initial wallet balance
   */
  public static register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { username, email, password } = req.body;

      const user = await AuthService.registerUser(username, email, password);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Account registered successfully.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validates credentials and writes a secure HttpOnly JWT session cookie
   */
  public static login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      const { user, token } = await AuthService.loginUser(email, password);

      // Write secure session JWT to HttpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: env.JWT_EXPIRES_IN * 1000, // Convert seconds to milliseconds
      });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Authentication successful. Welcome to ffairdrop!',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            wallet: user.wallet,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves the currently logged in user's profile
   */
  public static getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.findById(req.user!.id);
      if (!user) {
        throw new NotFoundError('User profile not found.', 'USER_NOT_FOUND');
      }

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Active user session profile retrieved successfully.',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            wallet: user.wallet,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clears the session cookie to securely log the user out
   */
  public static logout = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
      });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generates reset token and dispatches secure mock reset instructions.
   * Leverages robust defensive designs to mitigate User Enumeration leaks.
   */
  public static forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      try {
        const rawToken = await AuthService.generatePasswordResetToken(email);
        const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${rawToken}`;

        await sendResetPasswordEmail(email, resetUrl);
      } catch (error) {
        // Suppress NotFoundError to prevent account enumeration leaks, but re-throw database or schema errors
        if (error instanceof NotFoundError) {
          logger.warn(`⚠️ Password reset attempted for non-registered email: ${email}`);
        } else {
          throw error;
        }
      }

      // Always return a neutral 200 OK success message for security
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'If an account is associated with this email, a password reset link has been dispatched.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validates matching token lifecycle and updates user's login password.
   */
  public static resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, password } = req.body;

      await AuthService.resetPassword(token, password);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Password reset successful. You may now log in with your new credentials.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
