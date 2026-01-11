import { Request, Response } from 'express';
import { MulterRequest } from '../types';
import * as artifactService from '../services/artifactService';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

/**
 * Upload artifact to incident
 */
export const uploadArtifact = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.organizationId || !req.file) {
      res.status(400).json({ error: 'File and incident ID required' });
      return;
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      res.status(400).json({ error: 'Incident ID required' });
      return;
    }

    // Generate safe filename
    const fileExt = path.extname(req.file.originalname);
    const safeFilename = `${uuidv4()}${fileExt}`;
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, req.organizationId, incidentId, safeFilename);

    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });

    // Move file
    await fs.writeFile(filePath, req.file.buffer);

    // Determine artifact type
    let artifactType: 'log' | 'screenshot' | 'pdf' | 'error_trace' | 'text' = 'text';
    if (req.file.mimetype.includes('pdf')) {
      artifactType = 'pdf';
    } else if (req.file.mimetype.includes('image')) {
      artifactType = 'screenshot';
    } else if (req.file.originalname.includes('error') || req.file.originalname.includes('trace')) {
      artifactType = 'error_trace';
    } else if (req.file.originalname.includes('log')) {
      artifactType = 'log';
    }

    // Extract text content
    let extractedText: string | undefined;
    try {
      const extraction = await artifactService.extractTextFromArtifact(
        filePath,
        req.file.mimetype
      );
      extractedText = extraction.text;
    } catch (error) {
      logger.warn(`Could not extract text from artifact: ${safeFilename}`, error);
    }

    // Create artifact record
    const artifact = await artifactService.createArtifact(
      incidentId,
      artifactType,
      filePath,
      req.file.size,
      req.file.mimetype,
      extractedText,
      {
        originalFilename: req.file.originalname,
        uploadedAt: new Date().toISOString(),
      }
    );

    res.status(201).json(artifact);
  } catch (error) {
    logger.error('Upload artifact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get incident artifacts
 */
export const getArtifacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { incidentId } = req.params;

    if (!incidentId) {
      res.status(400).json({ error: 'Incident ID required' });
      return;
    }

    const artifacts = await artifactService.getIncidentArtifacts(incidentId);

    res.json({ artifacts, total: artifacts.length });
  } catch (error) {
    logger.error('Get artifacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete artifact
 */
export const deleteArtifact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { artifactId } = req.params;

    if (!artifactId) {
      res.status(400).json({ error: 'Artifact ID required' });
      return;
    }

    await artifactService.deleteArtifact(artifactId);

    res.json({ message: 'Artifact deleted successfully' });
  } catch (error) {
    logger.error('Delete artifact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
