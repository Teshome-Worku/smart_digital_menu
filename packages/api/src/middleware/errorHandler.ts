import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';

/** Global error handler middleware — must be registered last */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Log unexpected errors in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Unhandled Error]', err);
  }

  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
