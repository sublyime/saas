import { query } from '../database/connection';
import { Incident, Resolution } from '../types';
import { generateId } from '../utils/security';
import { logger } from '../config/logger';

/**
 * Create an incident
 */
export const createIncident = async (
  organizationId: string,
  title: string,
  description: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  createdBy: string
): Promise<Incident> => {
  const incidentId = generateId();

  const result = await query(
    `INSERT INTO incidents (
      id, organization_id, title, description, severity, status, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, 'open', $6, NOW(), NOW())
    RETURNING *`,
    [incidentId, organizationId, title, description, severity, createdBy]
  );

  logger.info(`Incident created: ${incidentId}`);
  return result.rows[0];
};

/**
 * Find incident by ID
 */
export const findIncidentById = async (
  incidentId: string,
  organizationId: string
): Promise<Incident | null> => {
  const result = await query(
    `SELECT * FROM incidents 
    WHERE id = $1 AND organization_id = $2`,
    [incidentId, organizationId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * List incidents for organization
 */
export const listIncidents = async (
  organizationId: string,
  filters: {
    status?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ incidents: Incident[]; total: number }> => {
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  let whereClause = 'WHERE organization_id = $1';
  const params: any[] = [organizationId];

  if (filters.status) {
    whereClause += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters.severity) {
    whereClause += ` AND severity = $${params.length + 1}`;
    params.push(filters.severity);
  }

  const incidentsResult = await query(
    `SELECT * FROM incidents ${whereClause} 
    ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) as total FROM incidents ${whereClause}`,
    params
  );

  return {
    incidents: incidentsResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
};

/**
 * Update incident
 */
export const updateIncident = async (
  incidentId: string,
  organizationId: string,
  updates: Partial<Incident>
): Promise<Incident> => {
  const allowedFields = ['title', 'description', 'severity', 'status', 'assigned_to'];
  const updateFields = Object.keys(updates).filter(
    (key) => allowedFields.includes(key) && updates[key as keyof Incident] !== undefined
  );

  if (updateFields.length === 0) {
    return findIncidentById(incidentId, organizationId) as Promise<Incident>;
  }

  const setClauses = updateFields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(', ');

  const values: (string | number | boolean | null | undefined)[] = updateFields.map((field) => {
    const value = updates[field as keyof Incident];
    // Convert Date to ISO string if necessary
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
  values.push(incidentId);
  values.push(organizationId);

  const result = await query(
    `UPDATE incidents SET ${setClauses}, updated_at = NOW()
    WHERE id = $${updateFields.length + 1} AND organization_id = $${updateFields.length + 2}
    RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Incident not found');
  }

  logger.info(`Incident updated: ${incidentId}`);
  return result.rows[0];
};

/**
 * Create a resolution for an incident
 */
export const createResolution = async (
  incidentId: string,
  solutionTitle: string,
  solutionDescription: string,
  confidenceScore: number,
  source: 'ai_generated' | 'knowledge_base' | 'manual',
  implementationSteps?: string[]
): Promise<Resolution> => {
  const resolutionId = generateId();

  const result = await query(
    `INSERT INTO resolutions (
      id, incident_id, solution_title, solution_description, 
      confidence_score, source, implementation_steps, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *`,
    [
      resolutionId,
      incidentId,
      solutionTitle,
      solutionDescription,
      confidenceScore,
      source,
      JSON.stringify(implementationSteps || []),
    ]
  );

  logger.info(`Resolution created for incident: ${incidentId}`);
  return result.rows[0];
};

/**
 * Get resolutions for an incident
 */
export const getIncidentResolutions = async (
  incidentId: string
): Promise<Resolution[]> => {
  const result = await query(
    `SELECT * FROM resolutions WHERE incident_id = $1 ORDER BY confidence_score DESC`,
    [incidentId]
  );

  return result.rows;
};
