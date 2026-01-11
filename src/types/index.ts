export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'viewer';
  organization_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  api_quota: number;
  api_usage: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Incident {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assigned_to?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface IncidentArtifact {
  id: string;
  incident_id: string;
  artifact_type: 'log' | 'screenshot' | 'pdf' | 'error_trace' | 'text';
  file_path: string;
  file_size: number;
  mime_type: string;
  extracted_text?: string;
  extracted_metadata?: Record<string, any>;
  created_at: Date;
}

export interface Resolution {
  id: string;
  incident_id: string;
  solution_title: string;
  solution_description: string;
  confidence_score: number;
  source: 'ai_generated' | 'knowledge_base' | 'manual';
  implementation_steps?: string[];
  created_at: Date;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_hash: string;
  last_used_at?: Date;
  is_revoked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  sub: string; // user id
  org: string; // organization id
  role: string;
  iat?: number;
  exp?: number;
}
// Express Request extensions
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  organizationId?: string;
  userRole?: string;
}

export interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}