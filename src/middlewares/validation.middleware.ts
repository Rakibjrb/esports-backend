import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Capture express-validator rule failures.
 * Converts validation errors into structured objects and routes to global error handlers.
 */
export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
    }));

    const error: any = new Error('Input validation check failed.');
    error.name = 'ValidationError';
    error.errors = formattedErrors;
    return next(error);
  }
  next();
};

export default validateRequest;
