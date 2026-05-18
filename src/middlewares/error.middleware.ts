import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';
import env from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected server error occurred.';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  }

  // Handle Mongoose duplicate key error (SEC-002 compound index catch)
  if ((err as any).code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY_ERROR';
    message = 'A resource with these details already exists.';
    details = (err as any).keyValue;
  }

  // Handle general validation or parsing failures
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_FAILED';
    message = err.message;
    details = (err as any).errors;
  }

  // Log error using Winston
  if (statusCode >= 500) {
    logger.error(`💥 Critical Server Error [${req.method} ${req.url}]:`, err);
  } else {
    logger.warn(`⚠️ Client Exception [${req.method} ${req.url}] (${statusCode}): ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
};

export default errorHandler;
