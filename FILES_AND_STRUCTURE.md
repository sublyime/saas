# Repository Files & Structure Documentation

Complete reference for all files and directories in the Git repository.

## Root Directory Files

### Configuration Files

| File | Purpose | Type | Status |
|------|---------|------|--------|
| `.gitignore` | Git ignore patterns | Config | ✅ Present |
| `package.json` | Project metadata, dependencies, scripts | Config | ✅ Present |
| `tsconfig.json` | TypeScript compiler configuration | Config | ✅ Present |
| `.env.example` | Environment variable template | Config | ✅ Present |
| `.eslintrc.json` | ESLint configuration | Config | ✅ Present |
| `jest.config.json` | Jest testing configuration | Config | ✅ Present |
| `docker-compose.yml` | Docker development environment | Config | ✅ Present |
| `Dockerfile` | Container image definition | Config | ✅ Present |

### Documentation Files

| File | Purpose | Audience | Status |
|------|---------|----------|--------|
| `README.md` | Project overview, features, quick start | Everyone | ✅ Comprehensive |
| `ARCHITECTURE.md` | System design, layers, patterns | Developers | ✅ Complete |
| `API.md` | API reference, endpoints, examples | Developers, Integrators | ✅ Complete |
| `CONTRIBUTING.md` | Development guidelines, code standards | Contributors | ✅ Complete |
| `SECURITY.md` | Security practices, vulnerability policy | Everyone | ✅ Complete |
| `DEPLOYMENT.md` | Deployment guides for all environments | DevOps, Developers | ✅ Complete |
| `CHANGELOG.md` | Version history, release notes | Everyone | ✅ Complete |
| `LICENSE` | MIT License text | Legal | ✅ Present |
| `QUICK_REFERENCE.md` | 5-minute setup guide | New Users | ✅ Quick Start |
| `AI_SETUP_GUIDE.md` | AI provider setup instructions | Operators | ✅ Complete |
| `AI_INTEGRATION_GUIDE.md` | AI architecture, patterns, monitoring | Developers | ✅ Complete |
| `AI_IMPLEMENTATION_SUMMARY.md` | Feature overview, quick-start | Product Managers | ✅ Complete |

### Example Files

| File | Purpose | Format | Status |
|------|---------|--------|--------|
| `examples.sh` | API usage examples with curl | Bash | ✅ Ready |
| `examples.ts` | Programmatic integration examples | TypeScript | ✅ Ready |

---

## Source Code Directory: src/

### Entry Point

```
src/
└── index.ts (270 lines)
    ├── Express app initialization
    ├── Middleware setup (Helmet, CORS, rate-limit, auth, audit, errors)
    ├── Route registration (auth, health, incidents, resolutions)
    ├── AI service initialization
    └── Server startup with port 3000
```

**Key Exports**: app, server instance, graceful shutdown

---

### Configuration Module: src/config/

```
config/
├── index.ts (150 lines)
│   ├── Environment variable loading
│   ├── Configuration object with sections:
│   │   ├── database: DatabaseURL, pool size
│   │   ├── jwt: secret, expiration
│   │   ├── encryption: key, algorithm
│   │   ├── ai: provider, keys for OpenAI/Anthropic/Ollama
│   │   ├── upload: max size, directory
│   │   ├── cors: allowed origins
│   │   └── rateLimit: window, max requests
│   └── Validation on startup
│
└── logger.ts (50 lines)
    ├── Pino logger configuration
    ├── Pretty-printing for development
    ├── JSON format for production
    └── Log level from NODE_ENV
```

**Key Exports**: config object, logger instance

**Dependencies**: dotenv, pino, process.env

---

### Database Module: src/database/

```
database/
├── connection.ts (80 lines)
│   ├── PostgreSQL pool initialization
│   ├── Connection pooling (default 20 connections)
│   ├── Connection test on startup
│   ├── Query execution wrapper
│   └── Graceful connection cleanup
│
└── schema.ts (200+ lines)
    ├── Table creation SQL
    ├── Tables:
    │   ├── organizations (multi-tenant root)
    │   ├── users (auth + roles)
    │   ├── incidents (problem statements)
    │   ├── artifacts (uploaded files + metadata)
    │   ├── resolutions (AI-generated solutions)
    │   ├── audit_logs (activity tracking)
    │   └── api_keys (programmatic access)
    ├── Indexes on frequently-queried columns
    ├── Foreign key constraints
    └── JSONB columns for flexible data
```

**Key Exports**: query() function, schema initialization

**Dependencies**: pg (PostgreSQL client)

---

### Types Module: src/types/

```
types/
└── index.ts (200+ lines)
    ├── User interface
    │   ├── id: UUID
    │   ├── email: string
    │   ├── password_hash: string
    │   ├── role: 'admin' | 'analyst' | 'viewer'
    │   └── organization_id: UUID
    │
    ├── Incident interface
    │   ├── id, title, description
    │   ├── severity: 'low' | 'medium' | 'high' | 'critical'
    │   ├── status: 'open' | 'in_progress' | 'resolved' | 'closed'
    │   └── timestamps
    │
    ├── Artifact interface
    │   ├── id, incident_id
    │   ├── file_path, file_type
    │   ├── extracted_text
    │   └── metadata: Record<string, unknown>
    │
    ├── Resolution interface
    │   ├── id, incident_id
    │   ├── solution_title, solution_description
    │   ├── implementation_steps: string[]
    │   ├── confidence_score: number
    │   ├── source: 'ai_provider' | 'knowledge_base'
    │   └── ai_model_used: string
    │
    ├── AuditLog interface
    │   ├── id, organization_id, user_id
    │   ├── action, resource_type, resource_id
    │   ├── changes: Record<string, any>
    │   ├── ip_address, user_agent
    │   └── timestamp
    │
    ├── JWT Payload interface
    │   ├── userId, organizationId
    │   ├── role, iat, exp
    │   └── type: 'access' | 'refresh'
    │
    └── API Response interfaces
        ├── PaginatedResponse
        ├── ErrorResponse
        └── HealthCheckResponse
```

**Key Exports**: All TypeScript interfaces for type safety

**Dependencies**: None (pure types)

---

### Utilities Module: src/utils/

```
utils/
└── security.ts (250+ lines)
    ├── JWT operations
    │   ├── generateToken(payload): string
    │   ├── verifyToken(token): payload
    │   └── refreshToken(refreshToken): newToken
    │
    ├── Password hashing
    │   ├── hashPassword(password): Promise<hash>
    │   └── verifyPassword(password, hash): Promise<boolean>
    │
    ├── Encryption
    │   ├── encryptField(value): encrypted
    │   ├── decryptField(encrypted): value
    │   └── AES-256-GCM with HMAC
    │
    ├── API key generation
    │   ├── generateApiKey(): string
    │   └── hashApiKey(key): hash
    │
    ├── Security utilities
    │   ├── generateRandomString(length): string
    │   ├── isStrongPassword(password): boolean
    │   └── validateEmail(email): boolean
    │
    └── CSRF token generation
        └── generateCsrfToken(): token
```

**Key Exports**: All security utility functions

**Dependencies**: jsonwebtoken, bcryptjs, crypto

---

### Middleware Module: src/middleware/

```
middleware/
├── auth.ts (100 lines)
│   ├── JWT verification middleware
    ├── Extract token from Authorization header
    ├── Verify signature and expiration
    ├── Attach user to request
    └── Handle expired/invalid tokens
│
├── apiAuth.ts (80 lines)
│   ├── API key authentication alternative
    ├── Extract key from X-API-Key header
    ├── Hash and verify against database
    ├── Set user context from key owner
    └── Support both JWT and API keys
│
├── audit.ts (120 lines)
│   ├── Log all requests to audit trail
    ├── Capture request metadata
    │   ├── IP address
    │   ├── User agent
    │   ├── Method, path, status code
    │   └── User ID, organization ID
    ├── Capture response status
    ├── Log database with timestamps
    └── Strip sensitive data before logging
│
└── errorHandler.ts (100 lines)
    ├── Global error handling
    ├── Catch Express errors
    ├── Format error responses consistently
    ├── Log errors with context
    ├── Never send sensitive data to client
    ├── 500 for unexpected errors
    └── Specific codes for known errors
```

**Key Exports**: Middleware functions for Express app

**Dependencies**: Express, custom utilities

---

### Controllers Module: src/controllers/

```
controllers/
├── authController.ts (200 lines)
│   ├── signup()
│   │   ├── Validate input (Zod)
│   │   ├── Check email uniqueness
│   │   ├── Hash password with bcrypt
│   │   ├── Create user in database
│   │   ├── Generate JWT token
│   │   └── Return user + token (201)
│   │
│   ├── login()
│   │   ├── Validate credentials format
│   │   ├── Fetch user by email
│   │   ├── Verify password hash
│   │   ├── Generate JWT token
│   │   ├── Update last_login timestamp
│   │   └── Return user + token (200)
│   │
│   └── getCurrentUser()
│       ├── Extract user from request
│       └── Return current user (200)
│
├── incidentController.ts (250 lines)
│   ├── listIncidents()
│   │   ├── Extract pagination params (page, limit)
│   │   ├── Extract filters (severity, status, search)
│   │   ├── Query database with organization_id
│   │   ├── Return paginated results (200)
│   │   └── Support limit 1-100
│   │
│   ├── createIncident()
│   │   ├── Validate input (title, description, severity)
│   │   ├── Create incident in database
│   │   ├── Return created incident (201)
│   │   └── Log audit trail
│   │
│   ├── getIncidentDetails()
│   │   ├── Fetch incident by ID + organization
│   │   ├── Fetch related artifacts
│   │   ├── Fetch related resolutions
│   │   ├── Return complete incident object (200)
│   │   └── Check organization ownership
│   │
│   └── updateIncident()
│       ├── Validate updates (status, description)
│       ├── Update incident in database
│       ├── Track changes for audit
│       ├── Return updated incident (200)
│       └── Require analyst+ role
│
├── artifactController.ts (200 lines)
│   ├── uploadArtifact()
│   │   ├── Validate file (size, type, mime)
│   │   ├── Save file to /uploads/{org}/{incident}/
│   │   ├── Extract text from file (if applicable)
│   │   ├── Store metadata in database
│   │   ├── Return artifact object (201)
│   │   └── Max 50MB per file
│   │
│   ├── listArtifacts()
│   │   ├── Fetch all artifacts for incident
│   │   └── Return artifact list (200)
│   │
│   └── deleteArtifact()
│       ├── Delete file from storage
│       ├── Delete record from database
│       └── Return success (200)
│
└── resolutionController.ts (200 lines)
    ├── generateResolution()
    │   ├── Fetch incident + artifacts
    │   ├── Call aiService.generateResolution()
    │   ├── Store result in database
    │   ├── Return resolution (200)
    │   └── Provider can be overridden
    │
    ├── getAIStatus()
    │   ├── List available providers
    │   ├── Show health status
    │   ├── Return provider list (200)
    │   └── No auth required
    │
    ├── setAIProvider()
    │   ├── Verify admin role
    │   ├── Change active provider
    │   ├── Return confirmation (200)
    │   └── Require admin only
    │
    └── findCorrelatedIncidents()
        ├── Find similar incidents
        ├── Match by severity, title, description
        ├── Return ranked list (200)
        └── Include previous resolutions
```

**Key Exports**: Controller functions

**Dependencies**: Express, services, types, validation (Zod)

---

### Routes Module: src/routes/

```
routes/
├── authRoutes.ts (80 lines)
│   ├── POST /auth/signup
│   ├── POST /auth/login
│   ├── GET /auth/me (requires auth)
│   └── Middleware chain: [validate, controller]
│
├── healthRoutes.ts (30 lines)
│   └── GET /health (no auth required)
│
├── incidentRoutes.ts (120 lines)
│   ├── GET /incidents (auth required)
│   ├── POST /incidents (auth required)
│   ├── GET /incidents/:id (auth required)
│   ├── PATCH /incidents/:id (auth required)
│   ├── POST /incidents/:id/artifacts (auth required)
│   ├── GET /incidents/:id/artifacts (auth required)
│   ├── DELETE /incidents/:id/artifacts/:aid (auth required)
│   └── Middleware: [auth, audit, rbac, validate]
│
└── resolutionRoutes.ts (100 lines)
    ├── POST /resolutions/:id/generate-resolution (auth)
    ├── GET /resolutions/ai/status (auth)
    ├── POST /resolutions/ai/provider (admin only)
    ├── GET /resolutions/:id/correlate (auth)
    └── Middleware: [auth, audit, rbac]
```

**Key Exports**: Express router instances

**Dependencies**: Express, controllers, middleware

---

### Services Module: src/services/

#### User Service
```
services/userService.ts (150 lines)
├── createUser(data): User
│   ├── Hash password
│   ├── Create in database
│   └── Return user object
│
├── getUserById(id, orgId): User
│   ├── Query database
│   └── Verify organization ownership
│
├── updateUser(id, data): User
│   ├── Validate updates
│   ├── Update database
│   └── Return updated user
│
└── deleteUser(id, orgId): void
    ├── Delete from database
    └── Clean up related data
```

#### Incident Service
```
services/incidentService.ts (250 lines)
├── createIncident(data, orgId): Incident
│   ├── Validate input
│   ├── Create in database
│   └── Return incident
│
├── getIncident(id, orgId): Incident
│   ├── Query database
│   └── Verify ownership
│
├── listIncidents(orgId, filters): Incident[]
│   ├── Apply filters (severity, status)
│   ├── Support pagination
│   ├── Support text search
│   └── Return paginated list
│
├── updateIncident(id, data, orgId): Incident
│   ├── Update in database
│   └── Track changes
│
└── correlateIncidents(id, orgId, limit): Incident[]
    ├── Find similar by title
    ├── Match by severity
    ├── Match by description
    └── Return ranked list
```

#### Artifact Service
```
services/artifactService.ts (200 lines)
├── uploadArtifact(incidentId, file, orgId): Artifact
│   ├── Validate file
│   ├── Save to disk
│   ├── Extract text
│   ├── Store metadata
│   └── Return artifact
│
├── getArtifact(id, orgId): Artifact
│   ├── Query database
│   └── Verify access
│
├── listArtifacts(incidentId, orgId): Artifact[]
│   └── Get all artifacts for incident
│
├── deleteArtifact(id, orgId): void
│   ├── Delete file from disk
│   └── Delete database record
│
└── extractText(file, type): string
    ├── Log files: plain text extract
    ├── PDFs: parse with library
    ├── Screenshots: OCR ready
    └── JSON: pretty-print
```

#### Resolution Service
```
services/resolutionService.ts (200 lines)
├── generateAIResolution(incidentId, orgId, provider): Resolution
│   ├── Fetch incident
│   ├── Fetch artifacts
│   ├── Call AIService
│   ├── Store in database
│   └── Return resolution
│
├── getResolution(id, orgId): Resolution
│   ├── Query database
│   └── Verify access
│
├── listResolutions(incidentId): Resolution[]
│   └── Get all for incident
│
└── correlateIncidents(incidentId, orgId, limit): Incident[]
    ├── Find similar incidents
    ├── Get their resolutions
    └── Return with solutions
```

---

### AI Service Module: src/services/ai/

```
ai/
├── types.ts (100 lines)
│   ├── AIProvider interface
│   │   ├── name: string
│   │   ├── isConfigured(): boolean
│   │   ├── generateText(): Promise<string>
│   │   ├── generateWithContext(): Promise<string>
│   │   └── generateIncidentResolution(): Promise<AIResolutionResponse>
│   │
│   ├── AIGenerationOptions
│   │   ├── maxTokens?: number
│   │   ├── temperature?: number
│   │   └── topP?: number
│   │
│   ├── AIResolutionRequest
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── severity: string
│   │   ├── artifacts: Artifact[]
│   │   └── previousResolutions?: Resolution[]
│   │
│   ├── AIResolutionResponse
│   │   ├── solutionTitle: string
│   │   ├── solutionDescription: string
│   │   ├── implementationSteps: string[]
│   │   ├── confidenceScore: number
│   │   └── reasoning: string
│   │
│   └── AIProviderType
│       └── 'openai' | 'anthropic' | 'ollama' | 'custom'
│
├── index.ts (150 lines)
│   ├── AIService class (singleton)
│   ├── Public interface:
│   │   ├── generateResolution(request, options): Promise<AIResolutionResponse>
│   │   ├── generateText(prompt, options): Promise<string>
│   │   ├── generateWithContext(prompt, context, options): Promise<string>
│   │   ├── isConfigured(): boolean
│   │   ├── getActiveProvider(): string
│   │   ├── setProvider(name): void
│   │   └── getAvailableProviders(): string[]
│   │
│   └── getInstance(): AIService
│       └── Singleton pattern
│
├── factory.ts (250 lines)
│   ├── AIServiceFactory class
│   ├── Auto-detects configured providers
│   ├── Manages provider instances
│   ├── Methods:
│   │   ├── registerProvider(name, provider): void
│   │   ├── getProvider(name): AIProvider
│   │   ├── getActiveProvider(): AIProvider
│   │   ├── setActiveProvider(name): void
│   │   ├── getAvailableProviders(): string[]
│   │   └── getInstance(): AIServiceFactory (singleton)
│   │
│   └── Auto-detection logic
│       ├── Check OPENAI_API_KEY → register OpenAI
│       ├── Check ANTHROPIC_API_KEY → register Anthropic
│       ├── Check OLLAMA_BASE_URL → register Ollama
│       └── Set first available as default
│
└── providers/
    └── implementations.ts (600+ lines)
        ├── OpenAIProvider (GPT-4, GPT-3.5)
        │   ├── Calls: https://api.openai.com/v1/chat/completions
        │   ├── Uses axios HTTP client
        │   ├── Models: gpt-4, gpt-4-turbo, gpt-3.5-turbo
        │   ├── Prompts incident + artifacts
        │   ├── Parses JSON response
        │   └── Converts to AIResolutionResponse
        │
        ├── AnthropicProvider (Claude)
        │   ├── Calls: https://api.anthropic.com/v1/messages
        │   ├── Uses axios HTTP client
        │   ├── Models: claude-3-opus, claude-3-sonnet, claude-3-haiku
        │   ├── Uses v1/messages API
        │   ├── Better for long context windows
        │   └── Converts to AIResolutionResponse
        │
        └── OllamaProvider (Local)
            ├── Calls: http://localhost:11434/api/generate
            ├── Uses axios HTTP client
            ├── Models: mistral, llama, neural-chat, etc.
            ├── Completely free and private
            ├── No API keys needed
            ├── Runs locally in Docker
            └── Converts to AIResolutionResponse
```

**Key Exports**: AIService instance, AIProvider interface, types

**Dependencies**: axios, config

---

## Database & Migrations: migrations/

```
migrations/
├── 001_initial_schema.sql (300+ lines)
│   ├── Create organizations table
│   ├── Create users table with roles
│   ├── Create incidents table
│   ├── Create artifacts table
│   ├── Create resolutions table
│   ├── Create audit_logs table
│   ├── Create api_keys table
│   ├── Add indexes on foreign keys
│   ├── Add indexes on frequently-searched columns
│   ├── Add constraints (FK, not null, check)
│   └── Add default values
│
└── runMigrations.ts (100 lines)
    ├── Run SQL from files in order
    ├── Track migration history
    ├── Handle errors gracefully
    ├── Log progress
    └── Called on application startup
```

**Key Concept**: Database versioning, idempotent migrations

---

## Testing Structure: tests/ (Recommended)

Recommended structure (not yet created):

```
tests/
├── unit/
│   ├── controllers/
│   │   ├── authController.test.ts
│   │   ├── incidentController.test.ts
│   │   └── resolutionController.test.ts
│   │
│   ├── services/
│   │   ├── userService.test.ts
│   │   ├── incidentService.test.ts
│   │   └── ai/
│   │       ├── factory.test.ts
│   │       └── providers.test.ts
│   │
│   └── utils/
│       └── security.test.ts
│
├── integration/
│   ├── auth.test.ts
│   ├── incidents.test.ts
│   ├── resolutions.test.ts
│   └── database.test.ts
│
└── fixtures/
    ├── users.json
    ├── incidents.json
    └── artifacts.json
```

---

## File Statistics

### Code Files

| Directory | Files | Lines | Purpose |
|-----------|-------|-------|---------|
| src/ | 18 | 3500+ | Application code |
| src/config | 2 | 200 | Configuration |
| src/database | 2 | 280 | Database setup |
| src/types | 1 | 200+ | TypeScript definitions |
| src/utils | 1 | 250+ | Security utilities |
| src/middleware | 4 | 400 | Express middleware |
| src/controllers | 4 | 850+ | Request handlers |
| src/routes | 4 | 330 | Route definitions |
| src/services | 5 | 950+ | Business logic |
| src/services/ai | 4 | 900+ | AI abstraction layer |
| migrations | 2 | 400+ | Database migrations |
| tests | 0 | 0 | Tests (ready for implementation) |

### Documentation Files

| File | Lines | Purpose |
|------|-------|---------|
| README.md | 290 | Project overview |
| ARCHITECTURE.md | 700+ | System design |
| API.md | 800+ | API reference |
| CONTRIBUTING.md | 500+ | Dev guidelines |
| SECURITY.md | 600+ | Security policy |
| DEPLOYMENT.md | 900+ | Deployment guide |
| CHANGELOG.md | 400+ | Version history |
| LICENSE | 30 | MIT License |
| QUICK_REFERENCE.md | 200+ | Quick start |
| AI_SETUP_GUIDE.md | 300+ | AI setup |
| AI_INTEGRATION_GUIDE.md | 400+ | AI architecture |
| AI_IMPLEMENTATION_SUMMARY.md | 200+ | Feature summary |

### Total Project

```
Total Source Code:      ~3,500 lines of TypeScript
Total Documentation:    ~6,500 lines of markdown
Total Test Framework:   Jest configured, 0 tests (ready)
Total SQL:              ~300 lines of migrations
```

---

## File Naming Conventions

### TypeScript Files

```
Controllers:    *Controller.ts    (authController.ts)
Services:       *Service.ts       (userService.ts)
Middleware:     *.ts              (auth.ts)
Routes:         *Routes.ts        (authRoutes.ts)
Types:          index.ts          (src/types/index.ts)
Utilities:      *.ts              (security.ts)
```

### Configuration Files

```
.env.example    Environment template (committed)
.env            Actual secrets (NOT committed)
.env.*.local    Environment overrides
```

### Documentation Files

```
README.md           Main project overview
ARCHITECTURE.md     Technical architecture
API.md              API documentation
CONTRIBUTING.md     Development guidelines
SECURITY.md         Security policy
DEPLOYMENT.md       Deployment guide
CHANGELOG.md        Version history
LICENSE             Legal license
```

---

## Dependencies Overview

### Production Dependencies

```json
{
  "express": "^4.18.2",
  "pg": "^8.10.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.1.0",
  "zod": "^3.22.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.0",
  "multer": "^1.4.5-lts.1",
  "pino": "^8.16.0",
  "axios": "^1.6.0",
  "@anthropic-ai/sdk": "^0.4.0"
}
```

**Total production dependencies**: ~20 (optimized, minimal)

### Development Dependencies

```json
{
  "typescript": "^5.3.0",
  "@types/node": "^20.10.0",
  "@types/express": "^4.17.21",
  "jest": "^29.7.0",
  "eslint": "^8.54.0",
  "@typescript-eslint/parser": "^6.13.0",
  "@typescript-eslint/eslint-plugin": "^6.13.0"
}
```

**Total dev dependencies**: ~15 (for development and testing)

---

## Git Repository Best Practices

### What to Commit

```
✅ .gitignore               (patterns to ignore)
✅ README.md                (documentation)
✅ CONTRIBUTING.md          (guidelines)
✅ SECURITY.md              (policies)
✅ DEPLOYMENT.md            (guides)
✅ CHANGELOG.md             (version history)
✅ LICENSE                  (license)
✅ package.json             (dependencies - use npm ci to install)
✅ tsconfig.json            (TypeScript config)
✅ .eslintrc.json           (ESLint config)
✅ jest.config.json         (Jest config)
✅ Dockerfile               (container definition)
✅ docker-compose.yml       (dev environment)
✅ .env.example             (template, NO secrets)
✅ src/                     (source code)
✅ migrations/              (database migrations)
```

### What NOT to Commit

```
❌ .env                     (actual secrets)
❌ node_modules/            (generated, use npm install)
❌ dist/                    (compiled, regenerate with npm run build)
❌ coverage/                (test results)
❌ logs/                    (runtime logs)
❌ uploads/                 (user uploaded files)
❌ .vscode/                 (user IDE settings)
❌ .idea/                   (user IDE settings)
❌ *.log                    (log files)
❌ .DS_Store                (macOS system file)
```

---

## Quick Navigation

**For new developers:**
1. Start with [README.md](README.md)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md)
3. Study [src/index.ts](src/index.ts)
4. Explore service layer: [src/services/](src/services/)
5. Check examples: [examples.sh](examples.sh), [examples.ts](examples.ts)

**For operators:**
1. Read [DEPLOYMENT.md](DEPLOYMENT.md)
2. Review [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
3. Check [AI_SETUP_GUIDE.md](AI_SETUP_GUIDE.md)
4. Monitor via [API.md](API.md) health endpoint

**For contributors:**
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md)
3. Check [SECURITY.md](SECURITY.md)
4. Run tests with: `npm test`

**For security review:**
1. Start with [SECURITY.md](SECURITY.md)
2. Review [CONTRIBUTING.md](CONTRIBUTING.md) security section
3. Audit [src/middleware/](src/middleware/)
4. Check [migrations/001_initial_schema.sql](migrations/001_initial_schema.sql)

---

**Last updated**: January 11, 2026
