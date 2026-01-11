import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { query } from '../database/connection';
import { generateId } from '../utils/security';

/**
 * Audit logging middleware
 */
export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    // Log audit trail for sensitive operations
    if (
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) &&
      req.organizationId &&
      res.statusCode < 400
    ) {
      const logAudit = async () => {
        try {
          await query(
            `INSERT INTO audit_logs (
              id, organization_id, user_id, action, resource_type, 
              resource_id, ip_address, user_agent, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
              generateId(),
              req.organizationId,
              req.userId || null,
              `${req.method} ${req.path}`,
              req.path.split('/')[2] || 'unknown',
              req.path,
              req.ip || req.socket.remoteAddress,
              req.get('user-agent') || '',
            ]
          );
        } catch (error) {
          logger.error('Audit logging error:', error);
        }
      };

      logAudit();
    }

    return originalJson.call(this, data);
  };

  next();
};
