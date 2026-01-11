import { Request, Response } from 'express';
import * as resolutionService from '../services/resolutionService';
import * as incidentService from '../services/incidentService';
import { aiService } from '../services/ai';
import { logger } from '../config/logger';
import { z } from 'zod';

const generateResolutionSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'ollama']).optional(),
});

const correlateIncidentsSchema = z.object({
  limit: z.number().min(1).max(20).optional(),
});

/**
 * Generate AI-powered resolution for incident
 */
export const generateResolution = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.organizationId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const validated = generateResolutionSchema.parse(req.body);

    // Verify incident exists
    const incident = await incidentService.findIncidentById(id, req.organizationId);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Check if AI is configured
    if (!aiService.isConfigured()) {
      res.status(503).json({
        error: 'AI service not configured',
        message: 'No AI provider has been configured. Please set up OpenAI, Anthropic, or Ollama.',
        availableProviders: aiService.getAvailableProviders(),
      });
      return;
    }

    const resolution = await resolutionService.generateAIResolution(
      id,
      req.organizationId,
      validated.provider
    );

    res.status(201).json(resolution);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    logger.error('Generate resolution error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get AI provider status
 */
export const getAIStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const activeProvider = aiService.getActiveProvider();
    const availableProviders = aiService.getAvailableProviders();

    res.json({
      configured: aiService.isConfigured(),
      activeProvider,
      availableProviders,
      documentation: {
        openai: 'https://platform.openai.com/docs',
        anthropic: 'https://docs.anthropic.com',
        ollama: 'https://github.com/jmorganca/ollama',
      },
    });
  } catch (error) {
    logger.error('Get AI status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Set active AI provider
 */
export const setAIProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.organizationId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const schema = z.object({
      provider: z.enum(['openai', 'anthropic', 'ollama']),
    });

    const validated = schema.parse(req.body);

    // Only admins can change AI provider settings
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can change AI provider' });
      return;
    }

    aiService.setProvider(validated.provider);

    const activeProvider = aiService.getActiveProvider();

    res.json({
      message: `AI provider changed to ${validated.provider}`,
      activeProvider,
      configured: activeProvider.configured,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    logger.error('Set AI provider error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Find correlated incidents
 */
export const findCorrelatedIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.organizationId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const validated = correlateIncidentsSchema.parse(req.query);

    // Verify incident exists
    const incident = await incidentService.findIncidentById(id, req.organizationId);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const correlatedIncidents = await resolutionService.correlateIncidents(
      req.organizationId,
      id,
      validated.limit || 5
    );

    res.json({
      targetIncident: id,
      correlatedCount: correlatedIncidents.length,
      incidents: correlatedIncidents,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    logger.error('Find correlated incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
