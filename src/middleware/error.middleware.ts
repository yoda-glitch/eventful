import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn({ message: err.message, statusCode: err.statusCode });
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  logger.error({ message: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
};
