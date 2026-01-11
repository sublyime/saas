# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Applications                          │
│  (Web Dashboard, Mobile App, Third-party Integrations)              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │  (Rate Limit)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐      ┌────────▼────────┐   ┌─────▼──────┐
   │  Auth   │      │ Incident APIs   │   │ Resolution │
   │ Service │      │  & Controllers  │   │  Service   │
   └────┬────┘      └────────┬────────┘   └──────┬─────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Business Logic │
                    │   (Services)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
   │ Database │      │ File Storage │     │ AI Providers│
   │   Layer  │      │   (Multer)   │     │  (Factory)  │
   └──────────┘      └──────────────┘     └─────────────┘
        │
   ┌────▼──────────┐
   │  PostgreSQL   │
   │   with Audit  │
   │  & Encryption │
   └───────────────┘
```

## Layered Architecture

### 1. Presentation Layer
**Responsibility**: Handle HTTP requests/responses

**Components**:
- Controllers (request handlers)
- Route definitions
- Request/response validation with Zod
- Error formatting

**Example Flow**:
```typescript
// Client sends POST /api/incidents
// Express routes to incidentRoutes.ts
// Router calls incidentController.createIncident()
// Controller validates input with Zod
// Controller calls incidentService.createIncident()
// Controller returns HTTP response (201, 400, etc)
```

### 2. Business Logic Layer
**Responsibility**: Implement core functionality

**Components**:
- Incident service (CRUD, correlation)
- Resolution service (AI integration)
- User service (authentication)
- Artifact service (file handling)
- AI service (provider abstraction)

**Example Flow**:
```typescript
// incidentService.createIncident(data)
// 1. Validate business rules
// 2. Hash sensitive data
// 3. Call database layer
// 4. Log audit trail
// 5. Return incident object
```

### 3. Data Access Layer
**Responsibility**: Database operations

**Components**:
- Connection pool management
- Query execution
- Transaction handling
- Schema initialization

**Example Flow**:
```typescript
// query('INSERT INTO incidents ...')
// 1. Get connection from pool
// 2. Execute parameterized query
// 3. Return result
// 4. Release connection
```

### 4. Infrastructure Layer
**Responsibility**: External services

**Components**:
- PostgreSQL database
- File storage system
- AI provider APIs
- Logging service

## Module Structure

### src/controllers/
```
controllers/
├── authController.ts       # Auth endpoints
├── incidentController.ts   # Incident CRUD
├── artifactController.ts   # File upload
└── resolutionController.ts # AI resolution
```

**Pattern**: Each controller has:
- Request validation with Zod
- Error handling
- Service layer delegation
- Response formatting

### src/services/
```
services/
├── userService.ts          # User CRUD
├── incidentService.ts      # Incident logic
├── artifactService.ts      # File processing
├── resolutionService.ts    # AI integration
└── ai/
    ├── types.ts            # AI interfaces
    ├── index.ts            # Public AI service
    ├── factory.ts          # Provider factory
    └── providers/
        └── implementations.ts
```

**Pattern**: Each service has:
- Business logic
- Database queries
- Error handling
- Logging

### src/middleware/
```
middleware/
├── auth.ts                 # JWT validation
├── apiAuth.ts              # API key validation
├── audit.ts                # Activity logging
└── errorHandler.ts         # Global errors
```

**Pattern**: Middleware chain:
1. auth.ts - Verify JWT token
2. apiAuth.ts - Support API key auth
3. audit.ts - Log request
4. route handler - Process request
5. errorHandler.ts - Handle errors

### src/routes/
```
routes/
├── authRoutes.ts
├── healthRoutes.ts
├── incidentRoutes.ts
└── resolutionRoutes.ts
```

**Pattern**: Each route file:
- Imports controller
- Applies middleware
- Defines REST endpoints
- Uses proper HTTP methods

### src/database/
```
database/
├── connection.ts           # Pool setup
└── schema.ts               # Table definitions
```

**Pattern**:
- connection.ts exports pool instance
- schema.ts called on startup to initialize tables

### src/config/
```
config/
├── index.ts                # Environment config
└── logger.ts               # Pino logger setup
```

**Pattern**:
- Load env vars once at startup
- Validate required variables
- Export singletons

## AI Service Architecture

### Provider Abstraction

```
┌─────────────────────────────────────────┐
│       User Code / Controllers           │
│  calls aiService.generateResolution()   │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │   AIService     │
        │  (public API)   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ AIServiceFactory│
        │ (provider mgmt) │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐   ┌───▼───┐   ┌───▼────┐
│OpenAI │   │Claude │   │ Ollama │
│Provider   │Provider   │Provider│
└───────┘   └───────┘   └────────┘
    │            │            │
    └────────────┼────────────┘
                 │
    ┌────────────▼────────────┐
    │  External AI APIs       │
    │ (HTTP calls via axios)  │
    └─────────────────────────┘
```

### Factory Pattern

```typescript
// 1. At startup
const factory = AIServiceFactory.getInstance();
// Auto-detects configured providers
// Creates instances for each provider
// Stores in registry

// 2. At request time
const aiService = AIService.getInstance();
const resolution = await aiService.generateResolution(data);
// Calls factory.getProvider()
// Gets active provider instance
// Calls provider.generateResolution()
// Returns normalized response

// 3. Provider switching
aiService.setProvider('openai');
// Changes active provider
// Next call uses OpenAI
```

### Provider Interface

```typescript
interface AIProvider {
  // Identify provider
  name: string;
  
  // Check if configured
  isConfigured(): boolean;
  
  // Core operations
  generateText(prompt: string, options?: AIGenerationOptions): Promise<string>;
  
  generateWithContext(
    prompt: string,
    context: Record<string, unknown>,
    options?: AIGenerationOptions
  ): Promise<string>;
  
  generateIncidentResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions
  ): Promise<AIResolutionResponse>;
}
```

All 3 providers implement this interface identically.

## Database Schema

### Multi-Tenant Architecture

```
organizations
├── id (PK, UUID)
├── name
├── created_at

users
├── id (PK, UUID)
├── organization_id (FK)
├── email (unique per org)
├── password_hash
├── role (admin, analyst, viewer)
├── created_at

incidents
├── id (PK, UUID)
├── organization_id (FK)
├── title
├── description
├── severity (low, medium, high, critical)
├── status
├── created_at

artifacts
├── id (PK, UUID)
├── incident_id (FK)
├── file_path
├── file_type (log, error, screenshot, pdf)
├── extracted_text
├── metadata (JSONB)
├── created_at

resolutions
├── id (PK, UUID)
├── incident_id (FK)
├── solution_title
├── solution_description
├── implementation_steps (JSONB)
├── confidence_score
├── source (ai_provider, knowledge_base)
├── ai_model_used
├── created_at

audit_logs
├── id (PK, UUID)
├── organization_id (FK)
├── user_id (FK)
├── action
├── resource_type
├── resource_id
├── changes (JSONB)
├── ip_address
├── user_agent
├── created_at
```

### Key Design Decisions

1. **UUID Primary Keys**: Better than auto-increment for distributed systems
2. **organization_id on all tables**: Enables efficient multi-tenancy
3. **JSONB columns**: Flexible for metadata, arrays, nested data
4. **Audit trail**: Complete history of changes
5. **Indexes**: On frequent query columns (organization_id, user_id, created_at)

## Authentication & Authorization

### Authentication Flow

```
Client Request
  │
  ├─ Has JWT token?
  │  ├─ YES → Verify signature
  │  │        Verify expiration
  │  │        Extract claims
  │  │        Set req.user = decoded token
  │  │        Call next middleware
  │  │
  │  └─ NO → Check API key
  │         Verify API key format
  │         Query database
  │         Set req.user = key owner
  │         Call next middleware
  │
  ├─ If both fail → 401 Unauthorized
  │
  └─ Continue to controller
```

### Authorization (RBAC)

```
Endpoint: DELETE /api/incidents/:id

1. Auth middleware verified user
2. RBAC middleware checks:
   - Is user.role == 'admin'?
   - OR Is user.role == 'analyst' AND requiredRole <= 'analyst'?
   - OR Is user.role == 'viewer' AND requiredRole <= 'viewer'?

3. If authorized → Call controller
   If denied → 403 Forbidden
```

### Role Hierarchy

```
admin: Can do anything
  ├─ Create incidents, artifacts
  ├─ Update incidents
  ├─ Delete incidents
  ├─ Manage users
  ├─ Change AI provider
  ├─ View all incidents
  └─ View audit logs

analyst: Can create and manage data
  ├─ Create incidents
  ├─ Create artifacts
  ├─ Update own incidents
  ├─ Generate AI resolutions
  ├─ View incidents
  └─ Cannot: manage users, change settings

viewer: Read-only access
  ├─ View incidents
  ├─ View artifacts
  ├─ View resolutions
  └─ Cannot: create, update, delete
```

## Security Architecture

### Data Protection

```
User Input
  │
  ├─ Validation (Zod)
  │  Check type, length, format
  │
  ├─ Parameterized Queries
  │  Prevent SQL injection
  │
  ├─ Encryption at Rest
  │  AES-256-GCM for sensitive fields
  │
  └─ HTTPS in Transit
     TLS 1.3+

Result: Defense in depth
```

### Sensitive Fields Encrypted

- passwords (hashed with bcrypt)
- API keys (AES-256-GCM)
- tokens (stored with hash)
- PII (personal data)

## Error Handling

### Error Flow

```
Operation Error
  │
  ├─ Database error?
  │  └─ Wrap in AppError with user-friendly message
  │
  ├─ Validation error?
  │  └─ Return 400 Bad Request with field details
  │
  ├─ Authentication error?
  │  └─ Return 401 Unauthorized
  │
  ├─ Authorization error?
  │  └─ Return 403 Forbidden
  │
  └─ Unexpected error?
     ├─ Log full error details (never sent to client)
     ├─ Send generic 500 response
     └─ Alert operations team
```

### Error Response Format

```json
{
  "error": "User-friendly message",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "req_12345"
}
```

## Scaling Considerations

### Database Scaling

**Connection Pooling**:
```
┌─────────────────┐
│   Node Server   │
│                 │
│  Connection     │
│  Pool (20)      │────────┐
│                 │        │
└─────────────────┘        │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │ Max 100 CLI │
                    └─────────────┘
```

**Optimization**:
- Connection reuse
- Query optimization
- Index usage
- Caching layer

### Application Scaling

**Horizontal Scaling**:
```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
   │ Node 1  │         │ Node 2  │        │ Node 3  │
   │ :3000   │         │ :3001   │        │ :3002   │
   └────┬────┘         └────┬────┘        └────┬────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼──────┐
                    │  PostgreSQL  │
                    │   (shared)   │
                    └──────────────┘
```

**JWT advantages**:
- No session storage needed
- Stateless servers
- Easy to scale horizontally

## Performance Architecture

### Caching Strategy

```
Request
  │
  ├─ Cache hit?
  │  └─ Return cached result (fast)
  │
  └─ Cache miss?
     ├─ Fetch from database
     ├─ Call AI service (if needed)
     ├─ Store in cache with TTL
     └─ Return result
```

**Cache layers**:
1. Redis (distributed cache)
2. In-memory (single node)
3. Database (persistent)

### Pagination

```
GET /api/incidents?page=2&limit=20

Returns:
{
  data: [...20 incidents...],
  total: 500,
  page: 2,
  limit: 20,
  totalPages: 25
}
```

Benefits:
- Smaller responses
- Faster queries
- Better user experience

## Monitoring & Observability

### Logging

```typescript
logger.info('Incident created', { incidentId, organizationId });
logger.error('AI service failed', { error, provider, incidentId });
logger.debug('Database query', { query, duration: '45ms' });
```

**Log Levels**:
- debug: Detailed diagnostic info
- info: General info (startup, requests)
- warn: Warning (deprecated API, slow query)
- error: Errors (failed operation)

### Metrics to Track

- Response times (p50, p95, p99)
- Error rates (by type)
- Database query times
- AI provider costs
- User activity (logins, actions)
- Incident metrics (created, resolved)

### Health Checks

```
GET /api/health
Returns:
{
  status: "healthy",
  uptime: "12h 34m",
  database: "connected",
  services: {
    ai: "connected",
    storage: "available"
  }
}
```

## Deployment Architecture

### Docker Deployment

```
┌────────────────────┐
│   Docker Image     │
├────────────────────┤
│ Node.js Runtime    │
│ Application Code   │
│ Dependencies       │
│ Health Checks      │
└────────────────────┘
        │
        ├─ Port 3000: API
        ├─ Port 9229: Debug
        └─ Mount volumes: config, data
```

### Docker Compose Setup

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://...

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=...
```

### Production Deployment

```
┌─────────────────────────────────┐
│    Load Balancer (ALB/NGinx)    │
└───────────┬──────────────────────┘
            │
   ┌────────┴───────────┬──────────────┐
   │                    │              │
┌──▼──────┐       ┌──────▼──┐    ┌─────▼────┐
│Container│       │Container │    │Container │
│ Instance│       │Instance  │    │Instance  │
└──┬──────┘       └──────┬───┘    └─────┬────┘
   │                    │              │
   └────────────────────┼──────────────┘
                        │
                  ┌─────▼────────┐
                  │  RDS/Cloud   │
                  │ PostgreSQL   │
                  └──────────────┘
```

---

This modular, layered architecture enables:
- **Scalability**: Horizontal and vertical
- **Maintainability**: Clear separation of concerns
- **Security**: Defense in depth
- **Extensibility**: Easy to add providers, features
- **Testability**: Each layer independently testable
