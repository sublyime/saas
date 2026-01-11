import { query } from './connection';

/**
 * Initialize all database tables
 */
export const initializeTables = async () => {
  // Organizations table
  await query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      subscription_tier VARCHAR(50) NOT NULL DEFAULT 'starter',
      api_quota INTEGER NOT NULL DEFAULT 10000,
      api_usage INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT valid_role CHECK (role IN ('admin', 'analyst', 'viewer'))
    )
  `);

  // API Keys table
  await query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      key_hash VARCHAR(255) NOT NULL UNIQUE,
      last_used_at TIMESTAMP,
      is_revoked BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Incidents table
  await query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      severity VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT valid_severity CHECK (severity IN ('critical', 'high', 'medium', 'low')),
      CONSTRAINT valid_status CHECK (status IN ('open', 'investigating', 'resolved', 'closed'))
    )
  `);

  // Incident Artifacts table
  await query(`
    CREATE TABLE IF NOT EXISTS incident_artifacts (
      id UUID PRIMARY KEY,
      incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
      artifact_type VARCHAR(50) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type VARCHAR(100),
      extracted_text TEXT,
      extracted_metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT valid_artifact_type CHECK (artifact_type IN ('log', 'screenshot', 'pdf', 'error_trace', 'text'))
    )
  `);

  // Resolutions table
  await query(`
    CREATE TABLE IF NOT EXISTS resolutions (
      id UUID PRIMARY KEY,
      incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
      solution_title VARCHAR(500) NOT NULL,
      solution_description TEXT NOT NULL,
      confidence_score DECIMAL(3,2) NOT NULL,
      source VARCHAR(50) NOT NULL,
      implementation_steps JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT valid_source CHECK (source IN ('ai_generated', 'knowledge_base', 'manual')),
      CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
    )
  `);

  // Audit Logs table
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      resource_type VARCHAR(100) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      changes JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      INDEX idx_audit_org_date (organization_id, created_at),
      INDEX idx_audit_user_date (user_id, created_at)
    )
  `);

  // Create indexes for performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_incidents_org_id ON incidents(organization_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_created_by ON incidents(created_by);
    CREATE INDEX IF NOT EXISTS idx_artifacts_incident_id ON incident_artifacts(incident_id);
    CREATE INDEX IF NOT EXISTS idx_resolutions_incident_id ON resolutions(incident_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(organization_id);
  `);
};
