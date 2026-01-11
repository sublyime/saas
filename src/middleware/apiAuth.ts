import { Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import { verifyApiKey } from '../utils/security';
import { logger } from '../config/logger';

/**
 * API Key authentication middleware
 */
export const apiKeyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }

    // Find the API key in database
    const result = await query(
      `SELECT api_keys.*, organizations.id as org_id FROM api_keys 
       INNER JOIN organizations ON api_keys.organization_id = organizations.id
       WHERE api_keys.is_revoked = false
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const keyRecord = result.rows[0];

    if (!verifyApiKey(apiKey, keyRecord.key_hash)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [keyRecord.id]
    );

    req.organizationId = keyRecord.org_id;
    next();
  } catch (error) {
    logger.error('API key auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
