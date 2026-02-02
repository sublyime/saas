import { Router } from 'express';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API version endpoint
 */
router.get('/version', (_req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Incident Resolver SaaS',
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
