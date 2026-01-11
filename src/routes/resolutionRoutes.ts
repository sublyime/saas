import { Router } from 'express';
import * as resolutionController from '../controllers/resolutionController';
import { authMiddleware, organizationMiddleware, rbacMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware, organizationMiddleware);

// AI-powered resolution generation
router.post('/:id/generate-resolution', resolutionController.generateResolution);

// Find incidents correlated by error/symptoms
router.get('/:id/correlate', resolutionController.findCorrelatedIncidents);

// AI status and provider management
router.get('/ai/status', resolutionController.getAIStatus);
router.post('/ai/provider', rbacMiddleware(['admin']), resolutionController.setAIProvider);

export default router;
