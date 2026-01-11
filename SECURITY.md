# Security Policy

## Overview

This document outlines the security practices, vulnerability policies, and recommendations for the Enterprise Multimodal Incident Resolution Platform.

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Zero Trust**: Verify every request and access attempt
3. **Least Privilege**: Users get minimum permissions needed
4. **Encryption Everywhere**: Data in transit and at rest
5. **Audit Trail**: Log all security-relevant events
6. **Regular Updates**: Keep dependencies current

## Data Protection

### Data Classification

| Level | Examples | Protection |
|-------|----------|-----------|
| Public | API status, documentation | None required |
| Internal | Organization info, user count | Access control |
| Confidential | User data, incident details | Encryption + access control |
| Restricted | API keys, passwords, tokens | Encryption + strict access control |

### Encryption at Rest

**Sensitive fields** are encrypted with AES-256-GCM:

```typescript
// Encrypted fields
- api_keys: Stored encrypted, returned to user once only
- passwords: Hashed with bcrypt (12 rounds), never stored plaintext
- auth_tokens: Hashed, only hash stored in database
- PII: Email, phone numbers encrypted if applicable
- artifact_text: Optional encryption for sensitive logs
```

**Encryption Key Management**:
```
ENCRYPTION_KEY (32 bytes hex)
├─ Generated once at setup
├─ Stored securely (AWS Secrets Manager or similar)
├─ Rotated annually
├─ Never committed to git
└─ Different per environment
```

### Encryption in Transit

**HTTPS/TLS**:
- TLS 1.3+ required in production
- Self-signed certificates allowed in development
- Certificate pinning optional for critical clients

**Configuration**:
```typescript
// In production
const app = express();
// Behind HTTPS-terminating load balancer
// HSTS header set automatically by Helmet
```

## Authentication & Authorization

### Authentication Methods

#### JWT (JSON Web Tokens)
```
User login → Verify credentials → Generate JWT
└─ Claims: userId, organizationId, role, iat, exp
└─ Signed with HS256 algorithm
└─ Expires in 24 hours
└─ Refreshable within 30 days
```

**Token Format**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Keys
```
Admin creates key → Share with developer → Include in requests
└─ Format: sk_[organization]_[randomstring]
└─ Stored as hash in database
└─ Can be revoked immediately
└─ Associated with permissions & rate limits
```

**Key Format**:
```
X-API-Key: sk_org_12345_abcdefghijk...
```

### Authorization (RBAC)

**Role Hierarchy**:
```
Admin (can do anything)
├─ Manage users
├─ Change settings (AI provider, rate limits)
├─ Delete incidents/artifacts
├─ View all incidents
└─ View audit logs

Analyst (create and manage data)
├─ Create incidents
├─ Create artifacts
├─ Generate resolutions
├─ View own incidents
└─ Update own incidents

Viewer (read-only)
├─ View incidents
├─ View artifacts
└─ View resolutions
```

**Permission Checks**:
```typescript
// Every sensitive endpoint checks:
if (user.role !== 'admin' && endpoint.requiredRole > user.role) {
  return 403 Forbidden;
}
```

### Password Security

**Requirements**:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Hashing**:
```typescript
// bcryptjs with 12 rounds
// ~250ms hashing time
// Resistant to GPU attacks
```

**Stored Fields**:
```
NOT STORED: password (ever)
STORED: password_hash (bcrypt)
NOT STORED: token (ever)
STORED: token_hash (SHA256)
```

## Network Security

### CORS (Cross-Origin Resource Sharing)

**Configuration**:
```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  optionsSuccessStatus: 200
};
```

**Prevents**:
- Requests from unauthorized origins
- Credential leakage
- XSS attacks via CORS

### Rate Limiting

**Per-IP Limiting**:
```
100 requests per 15 minutes per IP
├─ Prevents brute force attacks
├─ Prevents DDoS attacks
└─ Allows normal users through
```

**Per-User Limiting** (future):
```
Authenticated users get higher limits
Admin users get highest limits
```

**Configuration**:
```
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100     # 100 requests
```

### Input Validation

**All endpoints validate input** with Zod:

```typescript
const schema = z.object({
  email: z.string().email(),
  title: z.string().min(1).max(255),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

const validated = schema.parse(req.body); // throws if invalid
```

**Validation protects against**:
- SQL injection (parameterized queries + validation)
- XSS (Zod validation + output encoding)
- Type confusion attacks
- Buffer overflows

### SQL Injection Prevention

**Parameterized Queries**:
```typescript
// ✅ SAFE: Parameter binding
const result = await query(
  'SELECT * FROM users WHERE id = $1 AND org_id = $2',
  [userId, organizationId]
);

// ❌ UNSAFE: String interpolation
const result = await query(`SELECT * FROM users WHERE id = ${userId}`);
```

**All queries** in the codebase are parameterized.

## HTTP Headers Security

**Helmet.js** sets security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

**What each protects**:
- HSTS: Forces HTTPS
- nosniff: Prevents MIME sniffing
- DENY: Prevents clickjacking
- XSS-Protection: Old browser XSS defense
- CSP: Controls resource loading
- Referrer: Controls referer header

## File Upload Security

### Size Limits

```
Maximum file size: 50 MB
├─ Prevents disk space exhaustion
├─ Configurable via UPLOAD_MAX_SIZE
└─ Enforced in middleware
```

### File Type Validation

```
Allowed types:
├─ .log (text/plain)
├─ .txt (text/plain)
├─ .json (application/json)
├─ .pdf (application/pdf)
├─ .png (image/png)
├─ .jpg (image/jpeg)
└─ .gz (application/gzip)
```

**Validation**:
```typescript
// Check MIME type
// Check file extension
// Check file magic bytes
// Reject suspicious files
```

### Storage Security

**File Storage**:
```
/uploads/{organizationId}/{incidentId}/{filename}
└─ Organized by organization (multi-tenant isolation)
└─ Files not executable
└─ Stored outside web root
└─ Served via controlled API endpoint (not directly)
```

**Access Control**:
```typescript
// User can only access their organization's files
// Admin can access any files
// Viewer role can only read, not delete
```

## Audit Logging

**What's Logged**:
```
✅ User logins (success & failure)
✅ API key usage
✅ Incident creation/updates
✅ File uploads
✅ Resolution generation
✅ Settings changes
✅ Permission denied events
✅ Rate limit exceeded events
```

**What's NOT Logged**:
```
❌ Passwords (never)
❌ API keys (stored as hash only)
❌ Tokens (never)
❌ Credit card numbers
```

**Audit Log Format**:
```json
{
  "id": "audit_uuid",
  "timestamp": "2026-01-11T10:00:00Z",
  "user_id": "user_uuid",
  "organization_id": "org_uuid",
  "action": "incident.created",
  "resource_type": "incident",
  "resource_id": "incident_uuid",
  "changes": {
    "title": "API errors",
    "severity": "high"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "success"
}
```

**Retention**:
```
Keep audit logs for 2 years minimum
├─ For SOC2 compliance
├─ For incident investigation
├─ Archivable after 90 days
└─ Encrypted when archived
```

## Vulnerability Management

### Dependency Updates

**Weekly Audit**:
```bash
npm audit
# Checks for known vulnerabilities in dependencies
```

**Security Updates**:
```bash
npm audit fix
# Automatically fixes compatible vulnerabilities
```

**Process**:
```
1. npm audit identifies vulnerability
2. Update to patched version (if available)
3. Run full test suite
4. Merge to main, deploy to production
5. Document in CHANGELOG.md
```

### Reporting Vulnerabilities

**Do NOT post vulnerabilities publicly.**

**Instead, email**: security@example.com

**Include**:
```
1. Vulnerability description
2. Affected component/version
3. Reproduction steps
4. Potential impact
5. Suggested fix (optional)
```

**Response Timeline**:
```
1-2 hours: Acknowledge receipt
24 hours: Begin investigation
5-7 days: Patch release (if applicable)
30 days: Public disclosure
```

## Environment Security

### Environment Variables

**Never commit secrets to git**:
```
✅ DO commit: .env.example (template with dummy values)
❌ DON'T commit: .env (actual secrets)
```

**.env.example**:
```
DATABASE_URL=postgresql://user:password@localhost:5432/incident_resolver
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
OPENAI_API_KEY=sk-...  # leave empty
```

### Secrets Management

**Production Deployment**:
```
Store secrets in:
├─ AWS Secrets Manager (AWS deployments)
├─ Azure Key Vault (Azure deployments)
├─ Hashicorp Vault (on-premise)
├─ 1Password/Bitwarden (smaller deployments)
└─ Environment variables (if no secrets manager)

Never hardcode!
```

## Database Security

### Access Control

**PostgreSQL User Permissions**:
```sql
-- Application user (limited permissions)
CREATE USER app_user WITH PASSWORD '...';
GRANT SELECT, INSERT, UPDATE, DELETE ON incidents TO app_user;
GRANT SELECT, INSERT, UPDATE ON users TO app_user;

-- Admin user (full permissions)
CREATE USER admin_user WITH PASSWORD '...';
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_user;
```

### Connection Security

**SSL/TLS Connection**:
```
postgresql://user:password@host:5432/dbname?sslmode=require
└─ sslmode=require in production
└─ Encrypts all data in transit
└─ Validates server certificate
```

### Query Security

All queries use parameterized statements:
```typescript
// ✅ Safe
const users = await query(
  'SELECT * FROM users WHERE organization_id = $1',
  [organizationId]
);

// ❌ Never do this
const users = await query(
  `SELECT * FROM users WHERE organization_id = '${organizationId}'`
);
```

## API Security

### Request Validation

**Input Validation**:
```typescript
- Type checking (Zod)
- Length limits
- Format validation
- Enum validation
- Range checking
```

**All requests** must pass validation before processing.

### Response Security

**No Sensitive Data in Responses**:
```json
// ❌ NEVER return this
{
  "user": {
    "password_hash": "...",
    "api_key": "sk_..."
  }
}

// ✅ Return this
{
  "user": {
    "id": "user_uuid",
    "email": "user@example.com"
  },
  "api_key": "sk_..."  // Only on creation, show once
}
```

### Error Messages

**Don't leak information**:
```typescript
// ❌ Too specific (leaks info)
throw new Error('User with email user@example.com not found');

// ✅ Generic (secure)
throw new Error('Invalid email or password');
```

## Compliance

### Standards Implemented

| Standard | Coverage |
|----------|----------|
| OWASP Top 10 | Addresses all 10 items |
| PCI DSS | If handling payment data |
| GDPR | User data protection |
| SOC 2 | Audit logging, access control |
| HIPAA | If handling health data |

### GDPR Compliance

- **Right to Access**: Users can request their data
- **Right to Delete**: Users can request account deletion
- **Data Portability**: Users can export their data
- **Consent**: Explicit consent for data collection
- **Privacy Policy**: Required and provided

### Data Residency

```
Configurable database location
├─ US East (default)
├─ EU West (GDPR compliance)
├─ Asia Pacific
└─ Custom locations

Users' data stays in selected region
```

## Deployment Security

### Production Checklist

Before deploying to production:

```
☐ All dependencies updated and audited
☐ Secrets stored in secrets manager
☐ HTTPS/TLS enabled
☐ CORS configured correctly
☐ Rate limiting enabled
☐ WAF rules deployed
☐ Monitoring and alerting configured
☐ Backup strategy in place
☐ Incident response plan ready
☐ DDoS protection enabled
☐ Database backups encrypted
☐ Audit logging enabled
☐ Security headers verified
☐ Penetration testing completed
```

### Monitoring

**Security Monitoring**:
```
1. Failed login attempts
2. Rate limit exceeded events
3. Permission denied errors
4. Unusual database queries
5. Large file uploads
6. API key usage
7. Settings changes
8. Backup verification
```

## Incident Response

### Security Incident Process

```
1. DETECT
   └─ Monitor logs, alerts
   
2. CONTAIN
   ├─ Take affected systems offline
   ├─ Preserve evidence
   └─ Notify team leads
   
3. ERADICATE
   ├─ Identify root cause
   ├─ Patch vulnerability
   └─ Remove backdoors
   
4. RECOVER
   ├─ Restore from backups
   ├─ Verify integrity
   └─ Return to operation
   
5. LEARN
   ├─ Post-mortem analysis
   ├─ Update procedures
   └─ Improve defenses
```

### Communication

**In case of security incident**:
1. Notify affected users immediately
2. Post status updates (at least hourly)
3. Provide remediation steps
4. Offer monitoring services
5. Follow up after resolution

## Best Practices for Users

### For Administrators

```
1. Use strong, unique passwords
2. Enable 2FA (when available)
3. Rotate API keys regularly
4. Review audit logs monthly
5. Keep dependencies updated
6. Monitor resource usage
7. Backup database regularly
8. Test backup restoration
```

### For Developers

```
1. Never log sensitive data
2. Validate all inputs
3. Use parameterized queries
4. Keep dependencies updated
5. Review security advisories
6. Follow principle of least privilege
7. Use HTTPS everywhere
8. Hash passwords with bcrypt
```

### For Users

```
1. Use strong, unique passwords
2. Don't share API keys
3. Log out from unused sessions
4. Report suspicious activity
5. Keep software updated
6. Use HTTPS when accessing
7. Verify HTTPS in browser
8. Report vulnerabilities responsibly
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-11 | Initial security policy |

## Contact

Security questions or reports:
- Email: security@example.com
- Issue tracker: GitHub (private security advisory)
- PGP: [Public key available on request]

---

**Last updated**: January 11, 2026
