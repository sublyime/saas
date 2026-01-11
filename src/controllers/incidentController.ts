import { Request, Response } from 'express';
import * as incidentService from '../services/incidentService';
import * as artifactService from '../services/artifactService';
import { logger } from '../config/logger';
import { z } from 'zod';

const createIncidentSchema = z.object({
  title: z.string().min(5).max(500),
  description: z.string().min(10),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
});

const updateIncidentSchema = z.object({
  title: z.string().min(5).max(500).optional(),
  description: z.string().min(10).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  assigned_to: z.string().uuid().optional(),
});

/**
 * Create incident
 */
export const createIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.organizationId || !req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const validated = createIncidentSchema.parse(req.body);

    const incident = await incidentService.createIncident(
      req.organizationId,
      validated.title,
      validated.description,
      validated.severity,
      req.userId
    );

    res.status(201).json(incident);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    logger.error('Create incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get incident
 */
export const getIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.organizationId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const incident = await incidentService.findIncidentById(id, req.organizationId);

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Get artifacts and resolutions
    const artifacts = await artifactService.getIncidentArtifacts(id);
    const resolutions = await incidentService.getIncidentResolutions(id);

    res.json({
      ...incident,
      artifacts,
      resolutions,
    });
  } catch (error) {
    logger.error('Get incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List incidents
 */
export const listIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.organizationId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { status, severity, limit = '50', offset = '0' } = req.query;

    const { incidents, total } = await incidentService.listIncidents(
      req.organizationId,
      {
        status: status as string,
        severity: severity as string,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      }
    );

    res.json({
      incidents,
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (error) {
    logger.error('List incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update incident
 */
export const updateIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.organizationId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const validated = updateIncidentSchema.parse(req.body);

    const incident = await incidentService.updateIncident(
      id,
      req.organizationId,
      validated
    );

    res.json(incident);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    if (error.message === 'Incident not found') {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    logger.error('Update incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
