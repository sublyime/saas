import { query } from '../database/connection';
import { IncidentArtifact } from '../types';
import { generateId } from '../utils/security';
import { logger } from '../config/logger';
import { aiService } from './ai';
import { AIResolutionRequest } from './ai/types';

/**
 * Generate AI-powered incident resolution
 */
export const generateAIResolution = async (
  incidentId: string,
  organizationId: string,
  aiProvider?: string
) => {
  try {
    // Get incident details
    const incidentResult = await query(
      'SELECT * FROM incidents WHERE id = $1 AND organization_id = $2',
      [incidentId, organizationId]
    );

    if (incidentResult.rows.length === 0) {
      throw new Error('Incident not found');
    }

    const incident = incidentResult.rows[0];

    // Get all artifacts for the incident
    const artifactsResult = await query(
      'SELECT extracted_text FROM incident_artifacts WHERE incident_id = $1',
      [incidentId]
    );

    const artifactTexts = artifactsResult.rows
      .filter((a) => a.extracted_text)
      .map((a) => a.extracted_text);

    // Get previous resolutions
    const previousResult = await query(
      'SELECT solution_description FROM resolutions WHERE incident_id = $1 ORDER BY created_at DESC LIMIT 3',
      [incidentId]
    );

    const previousResolutions = previousResult.rows.map((r) => r.solution_description);

    // Prepare request for AI service
    const aiRequest: AIResolutionRequest = {
      incidentTitle: incident.title,
      incidentDescription: incident.description,
      artifactTexts: artifactTexts.length > 0 ? artifactTexts : ['No artifacts uploaded'],
      previousResolutions: previousResolutions.length > 0 ? previousResolutions : undefined,
      context: {
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.created_at,
      },
    };

    // Generate resolution using configured AI provider
    const resolution = await aiService.generateResolution(aiRequest, {
      provider: aiProvider,
      temperature: 0.5,
      maxTokens: 2000,
    });

    // Store resolution in database
    const resolutionId = generateId();

    await query(
      `INSERT INTO resolutions (
        id, incident_id, solution_title, solution_description, 
        confidence_score, source, implementation_steps, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'ai_generated', $6, NOW())`,
      [
        resolutionId,
        incidentId,
        resolution.solutionTitle,
        resolution.solutionDescription,
        resolution.confidenceScore,
        JSON.stringify(resolution.implementationSteps),
      ]
    );

    logger.info(`AI resolution generated for incident: ${incidentId}`);

    return {
      id: resolutionId,
      incidentId,
      solutionTitle: resolution.solutionTitle,
      solutionDescription: resolution.solutionDescription,
      confidenceScore: resolution.confidenceScore,
      source: 'ai_generated',
      implementationSteps: resolution.implementationSteps,
      reasoning: resolution.reasoning,
      relatedErrors: resolution.relatedErrors,
      preventionSteps: resolution.preventionSteps,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('AI resolution generation failed:', error);
    throw error;
  }
};

/**
 * Correlate incidents based on multimodal data similarity
 */
export const correlateIncidents = async (
  organizationId: string,
  incidentId: string,
  limit = 5
) => {
  try {
    // Get target incident
    const targetResult = await query(
      'SELECT * FROM incidents WHERE id = $1 AND organization_id = $2',
      [incidentId, organizationId]
    );

    if (targetResult.rows.length === 0) {
      throw new Error('Incident not found');
    }

    const targetIncident = targetResult.rows[0];

    // Get other open/investigating incidents
    const similarResult = await query(
      `SELECT i.*, COUNT(DISTINCT ia.id) as artifact_count
      FROM incidents i
      LEFT JOIN incident_artifacts ia ON i.id = ia.incident_id
      WHERE i.organization_id = $1 
        AND i.id != $2
        AND i.status IN ('open', 'investigating')
        AND (
          i.severity = $3 
          OR i.title ILIKE $4
          OR i.description ILIKE $5
        )
      GROUP BY i.id
      ORDER BY artifact_count DESC, i.created_at DESC
      LIMIT $6`,
      [
        organizationId,
        incidentId,
        targetIncident.severity,
        `%${targetIncident.title.split(' ')[0]}%`,
        `%${targetIncident.description.split(' ')[0]}%`,
        limit,
      ]
    );

    return similarResult.rows;
  } catch (error) {
    logger.error('Incident correlation failed:', error);
    throw error;
  }
};
