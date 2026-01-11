# API Reference

Complete API documentation for the Enterprise Multimodal Incident Resolution Platform.

## Base URL
```
http://localhost:3000/api
```

## Authentication

### JWT Token (Recommended)

1. **Signup**
   ```
   POST /auth/signup
   ```
   
2. **Login to get token**
   ```
   POST /auth/login
   ```
   
3. **Include in requests**
   ```
   Authorization: Bearer <token>
   ```

### API Key Authentication

1. **Generate API key**
   - Admin creates key via UI or endpoint
   
2. **Include in requests**
   ```
   X-API-Key: <api-key>
   ```

## Error Responses

### Standard Error Format

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "req_abc123"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Unexpected error |

---

## Authentication Endpoints

### Signup
Create a new user account.

**Request**
```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@#",
  "full_name": "John Doe",
  "organization_id": "org_uuid_here"
}
```

**Response**
```json
{
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "analyst",
    "organization_id": "org_uuid",
    "created_at": "2026-01-11T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Status Codes**
- 201: User created successfully
- 400: Invalid input or email exists
- 409: Email already registered

---

### Login
Authenticate and receive JWT token.

**Request**
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@#"
}
```

**Response**
```json
{
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "role": "analyst",
    "organization_id": "org_uuid",
    "last_login": "2026-01-11T10:15:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Status Codes**
- 200: Login successful
- 400: Invalid email or password
- 401: Credentials don't match

---

### Get Current User
Get authenticated user information.

**Request**
```
GET /auth/me
Authorization: Bearer <token>
```

**Response**
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "analyst",
  "organization_id": "org_uuid",
  "created_at": "2026-01-11T10:00:00Z",
  "last_login": "2026-01-11T10:15:00Z"
}
```

**Status Codes**
- 200: Success
- 401: Not authenticated

---

## Incident Endpoints

### List Incidents
Get incidents for your organization.

**Request**
```
GET /incidents?page=1&limit=20&severity=high&status=open
Authorization: Bearer <token>
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| severity | string | Filter by severity: low, medium, high, critical |
| status | string | Filter by status: open, in_progress, resolved, closed |
| search | string | Search in title and description |

**Response**
```json
{
  "data": [
    {
      "id": "incident_uuid",
      "title": "API timeout errors",
      "description": "Users reporting 504 gateway timeout",
      "severity": "high",
      "status": "open",
      "created_at": "2026-01-11T10:00:00Z",
      "updated_at": "2026-01-11T10:30:00Z",
      "created_by": "user_uuid",
      "organization_id": "org_uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Status Codes**
- 200: Success
- 401: Not authenticated

---

### Create Incident
Create a new incident.

**Request**
```
POST /incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Database connection pool exhausted",
  "description": "Production database hitting connection limit during peak hours",
  "severity": "critical"
}
```

**Response**
```json
{
  "id": "incident_uuid",
  "title": "Database connection pool exhausted",
  "description": "Production database hitting connection limit during peak hours",
  "severity": "critical",
  "status": "open",
  "created_at": "2026-01-11T10:00:00Z",
  "organization_id": "org_uuid"
}
```

**Status Codes**
- 201: Incident created
- 400: Invalid input
- 401: Not authenticated

---

### Get Incident Details
Fetch full incident information including artifacts and resolutions.

**Request**
```
GET /incidents/:id
Authorization: Bearer <token>
```

**Response**
```json
{
  "incident": {
    "id": "incident_uuid",
    "title": "API timeout errors",
    "description": "Users reporting 504 gateway timeout",
    "severity": "high",
    "status": "open",
    "created_at": "2026-01-11T10:00:00Z",
    "organization_id": "org_uuid"
  },
  "artifacts": [
    {
      "id": "artifact_uuid",
      "filename": "error.log",
      "type": "log",
      "uploaded_at": "2026-01-11T10:05:00Z",
      "extracted_text": "Error: ECONNREFUSED 127.0.0.1:5432..."
    }
  ],
  "resolutions": [
    {
      "id": "resolution_uuid",
      "solution_title": "Increase connection pool size",
      "confidence_score": 0.92,
      "created_at": "2026-01-11T10:30:00Z"
    }
  ]
}
```

**Status Codes**
- 200: Success
- 401: Not authenticated
- 404: Incident not found

---

### Update Incident
Update incident status or details.

**Request**
```
PATCH /incidents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "description": "Updated description"
}
```

**Response**
```json
{
  "id": "incident_uuid",
  "title": "API timeout errors",
  "status": "in_progress",
  "description": "Updated description",
  "updated_at": "2026-01-11T10:45:00Z"
}
```

**Status Codes**
- 200: Updated successfully
- 400: Invalid input
- 401: Not authenticated
- 403: Permission denied
- 404: Incident not found

---

## Artifact Endpoints

### Upload Artifact
Upload log file, screenshot, PDF, or error trace.

**Request**
```
POST /incidents/:id/artifacts
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file data>
type: log  # or error, screenshot, pdf
```

**Response**
```json
{
  "id": "artifact_uuid",
  "incident_id": "incident_uuid",
  "filename": "application.log",
  "type": "log",
  "size": 1024000,
  "uploaded_at": "2026-01-11T10:05:00Z",
  "extracted_text": "2026-01-11 10:00:00 ERROR: Connection refused...",
  "metadata": {
    "lines": 2500,
    "duration": "2 hours"
  }
}
```

**Status Codes**
- 201: File uploaded
- 400: Invalid file type or size >50MB
- 401: Not authenticated
- 404: Incident not found

---

### List Incident Artifacts
Get all files attached to incident.

**Request**
```
GET /incidents/:id/artifacts
Authorization: Bearer <token>
```

**Response**
```json
{
  "artifacts": [
    {
      "id": "artifact_uuid",
      "filename": "error.log",
      "type": "log",
      "size": 512000,
      "uploaded_at": "2026-01-11T10:05:00Z"
    }
  ]
}
```

**Status Codes**
- 200: Success
- 401: Not authenticated
- 404: Incident not found

---

### Delete Artifact
Remove an uploaded file.

**Request**
```
DELETE /incidents/:id/artifacts/:artifact-id
Authorization: Bearer <token>
```

**Response**
```json
{
  "message": "Artifact deleted successfully"
}
```

**Status Codes**
- 200: Deleted
- 401: Not authenticated
- 403: Permission denied
- 404: Artifact not found

---

## Resolution Endpoints

### Generate AI Resolution
Create AI-powered resolution for an incident.

**Request**
```
POST /resolutions/:id/generate-resolution
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "openai"  # optional override
}
```

**Response**
```json
{
  "id": "resolution_uuid",
  "incident_id": "incident_uuid",
  "solution_title": "Scale database connection pool",
  "solution_description": "Increase PostgreSQL max_connections setting and connection pool size in application",
  "implementation_steps": [
    "Backup PostgreSQL configuration",
    "Edit postgresql.conf and increase max_connections to 200",
    "Restart PostgreSQL service",
    "Update application pool size to 100",
    "Deploy updated application"
  ],
  "confidence_score": 0.92,
  "source": "openai",
  "ai_model_used": "gpt-4-turbo",
  "created_at": "2026-01-11T10:30:00Z"
}
```

**Status Codes**
- 200: Resolution generated
- 400: No artifacts attached or invalid input
- 401: Not authenticated
- 503: AI service unavailable

---

### Get AI Status
Check available AI providers and current selection.

**Request**
```
GET /resolutions/ai/status
Authorization: Bearer <token>
```

**Response**
```json
{
  "active_provider": "openai",
  "available_providers": [
    {
      "name": "openai",
      "configured": true,
      "model": "gpt-4-turbo",
      "healthy": true
    },
    {
      "name": "anthropic",
      "configured": false,
      "healthy": false,
      "reason": "ANTHROPIC_API_KEY not set"
    },
    {
      "name": "ollama",
      "configured": true,
      "model": "mistral",
      "healthy": true
    }
  ]
}
```

**Status Codes**
- 200: Success
- 401: Not authenticated

---

### Set AI Provider
Change active AI provider (Admin only).

**Request**
```
POST /resolutions/ai/provider
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "provider": "ollama"
}
```

**Response**
```json
{
  "message": "AI provider changed to ollama",
  "active_provider": "ollama",
  "model": "mistral"
}
```

**Status Codes**
- 200: Provider changed
- 400: Invalid provider
- 401: Not authenticated
- 403: Requires admin role
- 503: Provider not available

---

### Find Correlated Incidents
Find similar incidents to help with resolution.

**Request**
```
GET /resolutions/:id/correlate?limit=5
Authorization: Bearer <token>
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max similar incidents to return (default: 5) |

**Response**
```json
{
  "query_incident": {
    "id": "incident_uuid",
    "title": "API timeout errors"
  },
  "correlated_incidents": [
    {
      "id": "similar_incident_uuid",
      "title": "Gateway timeout during peak hours",
      "similarity_score": 0.85,
      "severity": "high",
      "status": "resolved",
      "resolution": {
        "solution_title": "Increase API server instances",
        "confidence_score": 0.88
      }
    }
  ]
}
```

**Status Codes**
- 200: Success
- 401: Not authenticated
- 404: Incident not found

---

## Health & System Endpoints

### Health Check
Check system status.

**Request**
```
GET /health
```

**Response**
```json
{
  "status": "healthy",
  "uptime": "12h 34m 22s",
  "timestamp": "2026-01-11T10:00:00Z",
  "services": {
    "database": {
      "status": "connected",
      "latency": "2ms"
    },
    "ai_providers": {
      "openai": "available",
      "anthropic": "available",
      "ollama": "available"
    }
  }
}
```

**Status Codes**
- 200: All systems healthy
- 503: One or more systems down

---

## Rate Limiting

All endpoints are rate-limited:

**Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**Limits**
- Anonymous: 10 requests per 15 minutes
- Authenticated: 100 requests per 15 minutes
- Admin: 1000 requests per 15 minutes

**Response When Limited**
```
HTTP 429 Too Many Requests

{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30
}
```

---

## Pagination

List endpoints support pagination:

**Query Parameters**
```
?page=1&limit=20
```

**Response**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

---

## Examples

### Complete Flow: Create and Resolve Incident

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass"}' \
  | jq -r '.token')

# 2. Create incident
INCIDENT=$(curl -X POST http://localhost:3000/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database errors",
    "severity": "critical"
  }')

INCIDENT_ID=$(echo $INCIDENT | jq -r '.id')

# 3. Upload artifact
curl -X POST http://localhost:3000/api/incidents/$INCIDENT_ID/artifacts \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@error.log"

# 4. Generate resolution
RESOLUTION=$(curl -X POST http://localhost:3000/api/resolutions/$INCIDENT_ID/generate-resolution \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}')

echo $RESOLUTION | jq '.'
```

### Find Similar Incidents

```bash
SIMILAR=$(curl -X GET "http://localhost:3000/api/resolutions/$INCIDENT_ID/correlate?limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo $SIMILAR | jq '.correlated_incidents[] | {title, similarity_score, status}'
```

---

## SDKs & Libraries

### JavaScript/TypeScript
```typescript
import { IncidentResolverAPI } from '@example/incident-resolver-sdk';

const client = new IncidentResolverAPI({
  baseURL: 'http://localhost:3000/api',
  token: 'your-token'
});

const resolution = await client.resolutions.generate(incidentId);
```

### Python
```python
from incident_resolver import Client

client = Client(
    base_url='http://localhost:3000/api',
    token='your-token'
)

resolution = client.resolutions.generate(incident_id)
```

---

## Webhooks (Future)

Webhooks will support real-time incident and resolution updates:

```json
{
  "event": "incident.created",
  "data": {
    "id": "incident_uuid",
    "title": "API timeout errors"
  },
  "timestamp": "2026-01-11T10:00:00Z"
}
```

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Incident CRUD operations
- Multimodal artifact upload
- AI-powered resolution generation
- Incident correlation
- JWT & API key authentication
- RBAC authorization
- Rate limiting
- Audit logging

### v1.1.0 (Planned)
- Slack/Teams integration
- Webhook support
- Advanced analytics
- Custom provider templates
- Batch operations

---

For more information, see [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
