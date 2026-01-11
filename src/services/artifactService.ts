import { query } from '../database/connection';
import { IncidentArtifact } from '../types';
import { generateId } from '../utils/security';
import { logger } from '../config/logger';
import fs from 'fs/promises';

/**
 * Create incident artifact record
 */
export const createArtifact = async (
  incidentId: string,
  artifactType: 'log' | 'screenshot' | 'pdf' | 'error_trace' | 'text',
  filePath: string,
  fileSize: number,
  mimeType: string,
  extractedText?: string,
  extractedMetadata?: Record<string, any>
): Promise<IncidentArtifact> => {
  const artifactId = generateId();

  const result = await query(
    `INSERT INTO incident_artifacts (
      id, incident_id, artifact_type, file_path, file_size, mime_type,
      extracted_text, extracted_metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *`,
    [
      artifactId,
      incidentId,
      artifactType,
      filePath,
      fileSize,
      mimeType,
      extractedText || null,
      JSON.stringify(extractedMetadata || {}),
    ]
  );

  logger.info(`Artifact created for incident: ${incidentId}`);
  return result.rows[0];
};

/**
 * Get artifacts for an incident
 */
export const getIncidentArtifacts = async (
  incidentId: string
): Promise<IncidentArtifact[]> => {
  const result = await query(
    `SELECT * FROM incident_artifacts WHERE incident_id = $1 ORDER BY created_at DESC`,
    [incidentId]
  );

  return result.rows;
};

/**
 * Extract text from artifact (placeholder for actual extraction)
 */
export const extractTextFromArtifact = async (
  filePath: string,
  mimeType: string
): Promise<{ text: string; metadata: Record<string, any> }> => {
  try {
    // For logs and text files, read directly
    if (mimeType.includes('text') || mimeType.includes('log')) {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        text: content,
        metadata: {
          extractedAt: new Date().toISOString(),
          method: 'text_read',
        },
      };
    }

    // PDF extraction would use a library like pdfparse
    // Screenshot OCR would use tesseract or cloud vision
    // For now, return placeholder
    return {
      text: '[Extraction requires specialized processing]',
      metadata: {
        mimeType,
        extractedAt: new Date().toISOString(),
        method: 'placeholder',
      },
    };
  } catch (error) {
    logger.error(`Error extracting text from artifact: ${filePath}`, error);
    throw error;
  }
};

/**
 * Delete artifact
 */
export const deleteArtifact = async (artifactId: string): Promise<void> => {
  // Get artifact details first
  const result = await query(
    'SELECT file_path FROM incident_artifacts WHERE id = $1',
    [artifactId]
  );

  if (result.rows.length > 0) {
    const filePath = result.rows[0].file_path;

    // Delete file from storage
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Could not delete file: ${filePath}`, error);
    }
  }

  // Delete database record
  await query('DELETE FROM incident_artifacts WHERE id = $1', [artifactId]);

  logger.info(`Artifact deleted: ${artifactId}`);
};
