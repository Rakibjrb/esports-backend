import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { UserRole } from '../interfaces/user.interface';

/**
 * Middleware restricting route access to specific defined roles.
 * Must be executed AFTER the authenticateUser middleware.
 *
 * @param allowedRoles Array of UserRoles permitted to access the route
 */
export const authorizeRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new ForbiddenError(
          'Access denied. User identity is not verified.',
          'AUTHENTICATION_REQUIRED'
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Your role "${req.user.role}" is not authorized to access this resource.`,
          'ROLE_UNAUTHORIZED'
        )
      );
    }

    next();
  };
};

export default authorizeRoles;
