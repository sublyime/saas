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
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = payload;
    req.userId = payload.sub;
    req.organizationId = payload.org;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Role-based access control middleware
 */
export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Organization context middleware
 */
export const organizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.organizationId) {
    return res.status(401).json({ error: 'Organization context not found' });
  }

  next();
};
