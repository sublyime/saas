import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', error);

  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const response = {
    error: message,
    ...(
      !isProduction && {
        stack: error.stack,
        details: error,
      }
    ),
  };

  res.status(status).json(response);
};

/**
 * 404 handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
};
