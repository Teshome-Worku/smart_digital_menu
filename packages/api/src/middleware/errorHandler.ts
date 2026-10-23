import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';

/** Global error handler middleware — must be registered last */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Log unexpected errors on the server for diagnostics (without leaking to client)
  console.error('[Unhandled Server Error]:', err.message || err);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
