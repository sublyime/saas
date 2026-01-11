import { Router } from 'express';
import multer from 'multer';
import * as incidentController from '../controllers/incidentController';
import * as artifactController from '../controllers/artifactController';
import { authMiddleware, organizationMiddleware } from '../middleware/auth';
import config from '../config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// All routes require authentication
router.use(authMiddleware, organizationMiddleware);

// Incident routes
router.post('/', incidentController.createIncident);
router.get('/', incidentController.listIncidents);
router.get('/:id', incidentController.getIncident);
router.patch('/:id', incidentController.updateIncident);

// Artifact routes
router.post('/:incidentId/artifacts', upload.single('file'), artifactController.uploadArtifact);
router.get('/:incidentId/artifacts', artifactController.getArtifacts);
router.delete('/artifacts/:artifactId', artifactController.deleteArtifact);

export default router;
