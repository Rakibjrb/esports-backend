import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';
import { UserRole } from '../interfaces/user.interface';

// Extend Express Request interface inline to type req.user cleanly in TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware enforcing valid user authentication sessions.
 * Extracts JWT token from secure cookies or authorization header.
 */
export const authenticateUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    // 1. Extract from HttpOnly cookie named 'token'
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // 2. Fallback to standard Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication failed. No active session token detected.', 'NO_TOKEN_PROVIDED');
    }

    // 3. Verify JWT signature using AuthService
    const decoded = AuthService.verifyToken(token);

    // 4. Attach session identity payload to request object
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticateUser;
