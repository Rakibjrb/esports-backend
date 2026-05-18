import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendResponse } from '../utils/sendResponse';
import { env } from '../config/env';
import { User } from '../schemas/user.schema';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
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
      const { username, email, password, gameUID } = req.body;

      const user = await AuthService.registerUser(username, email, password, gameUID);

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
   * Validates credentials and writes secure HttpOnly JWT session cookies (Access + Refresh)
   */
  public static login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      const { user, token, refreshToken } = await AuthService.loginUser(email, password);

      // Write secure short-lived Access token to HttpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: env.JWT_ACCESS_EXPIRES_IN * 1000,
      });

      // Write secure long-lived Refresh token to HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: env.JWT_REFRESH_EXPIRES_IN * 1000,
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
   * Clears both session cookies and revokes active refresh token to securely log the user out
   */
  public static logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await User.findOneAndUpdate({ refreshToken: hashedToken }, { $unset: { refreshToken: 1 } });
      }

      res.clearCookie('token', {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
      });

      res.clearCookie('refreshToken', {
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
   * Refreshes the short-lived session access token using a long-lived refresh token.
   * Employs Refresh Token Rotation for optimal security.
   */
  public static refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        throw new UnauthorizedError('Access denied. No refresh token provided.', 'NO_REFRESH_TOKEN');
      }

      // 1. Verify refresh token cryptographic signature
      const decoded = AuthService.verifyRefreshToken(refreshToken);

      // 2. Hash incoming refresh token to match database record
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // 3. Query user by ID and matching hashed refresh token
      const user = await User.findOne({ _id: decoded.userId, refreshToken: hashedToken }).select('+refreshToken');
      if (!user) {
        throw new UnauthorizedError('Session expired or invalid refresh token. Please log in again.', 'TOKEN_EXPIRED');
      }

      // 4. Generate new rotated Access and Refresh tokens
      const newAccessToken = AuthService.signToken(user._id.toString(), user.role);
      const newRefreshToken = AuthService.signRefreshToken(user._id.toString(), user.role);

      // 5. Update database with new rotated refresh token
      user.refreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      await user.save();

      // 6. Write rotated session cookies to client browser
      res.cookie('token', newAccessToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: env.JWT_ACCESS_EXPIRES_IN * 1000,
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: env.JWT_REFRESH_EXPIRES_IN * 1000,
      });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Access token successfully rotated.',
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
