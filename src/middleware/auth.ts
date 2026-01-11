import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/security';
import { logger } from '../config/logger';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      organizationId?: string;
      userId?: string;
    }
  }
}

/**
 * Authentication middleware
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = payload;
    req.userId = payload.sub;
    req.organizationId = payload.org;

    return next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};

/**
 * Role-based access control middleware
 */
export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    return next();
  };
};

/**
 * Organization context middleware
 */
export const organizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.organizationId) {
    res.status(401).json({ error: 'Organization context not found' });
    return;
  }

  next();
};
