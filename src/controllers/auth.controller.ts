import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendResponse } from '../utils/sendResponse';
import { env } from '../config/env';
import { User } from '../schemas/user.schema';
import { NotFoundError } from '../utils/errors';

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
}

export default AuthController;
