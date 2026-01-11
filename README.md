# Enterprise Multimodal Incident Resolution Platform

Modern SaaS platform for automated incident resolution using multimodal data ingestion, AI-powered analysis, and enterprise-grade security.

## Features

- **Multimodal Incident Ingestion**: Upload logs, error traces, screenshots, PDFs, and text documents
- **AI-Agnostic Resolution Engine**: Use OpenAI, Anthropic, Ollama, or any custom LLM
- **Enterprise Authentication**: JWT-based auth with RBAC (Admin, Analyst, Viewer)
- **PostgreSQL Backend**: Scalable, reliable data persistence with audit logging
- **Security First**: Helmet security headers, bcrypt password hashing, AES-256 encryption, CORS protection
- **Rate Limiting**: Configurable request throttling per organization
- **API-Key Authentication**: For programmatic access
- **Audit Trails**: Complete logging of all user actions
- **Incident Correlation**: Find similar incidents using multimodal data
- **AI Provider Flexibility**: Switch between LLM providers at runtime

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16+
- **Auth**: JWT + bcryptjs
- **Security**: Helmet, CORS, Rate-Limit
- **File Processing**: Multer, Sharp
- **Validation**: Zod
- **Logging**: Pino

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone and Setup**
```bash
npm install
cp .env.example .env
```

2. **Configure Environment**
Edit `.env` with your local database credentials:
```
DATABASE_URL=postgresql://user:password@localhost:5432/incident_resolver
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

3. **Initialize Database**
```bash
npm run migrate
```

5. **Configure AI Provider** (Optional)

Choose one:

**Option A: Ollama (Local LLM - Recommended for Development)**
```bash
# Install Ollama from https://ollama.ai
ollama pull mistral
# Then set in .env:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
AI_PROVIDER=ollama
```

**Option B: OpenAI (GPT-4)**
```bash
# Get API key from https://platform.openai.com
# Set in .env:
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
AI_PROVIDER=openai
```

**Option C: Anthropic (Claude)**
```bash
# Get API key from https://console.anthropic.com
# Set in .env:
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
AI_PROVIDER=anthropic
```

6. **Start Development Server**
```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Docker Deployment

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile

### Incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents` - List incidents (with filters)
- `GET /api/incidents/:id` - Get incident details
- `PATCH /api/incidents/:id` - Update incident

### Artifacts
- `POST /api/incidents/:incidentId/artifacts` - Upload artifact
- `GET /api/incidents/:incidentId/artifacts` - List artifacts
- `DELETE /api/artifacts/:artifactId` - Delete artifact

### AI-Powered Resolutions
- `POST /api/resolutions/:id/generate-resolution` - Generate AI resolution
- `GET /api/resolutions/:id/correlate` - Find correlated incidents
- `GET /api/resolutions/ai/status` - AI provider status
- `POST /api/resolutions/ai/provider` - Change active AI provider (admin only)

### Health
- `GET /api/health` - Health check
- `GET /api/version` - API version

## Authentication

### JWT Bearer Token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.example.com/api/auth/me
```

### API Key
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://api.example.com/api/incidents
```

## Security Practices

✅ **Implemented**
- HTTPS enforced (production)
- Helmet security headers
- JWT token-based auth
- bcryptjs password hashing (12 rounds)
- AES-256-GCM encryption for sensitive data
- CORS protection
- Rate limiting per IP
- Audit logging for all modifications
- SQL parameterized queries (no injection)
- Input validation (Zod schemas)
- Secure file upload handling

✅ **Recommended in Production**
- Enable TLS certificates
- Use managed secrets (AWS Secrets Manager, Azure Key Vault)
- Implement WAF rules
- Enable database encryption at rest
- Use connection pooling with SSL
- Implement API gateway with authentication
- Enable CloudTrail/audit logging
- Regular security scanning with OWASP ZAP

## Scaling Considerations

- **Horizontal**: Use load balancer (ALB/NLB) with multiple app instances
- **Database**: Connection pooling configured (default: 20 connections)
- **File Storage**: Move uploads to S3/Azure Blob for production
- **Caching**: Add Redis for session management and caching
- **Background Jobs**: Use Bullmq for async operations (AI processing)

## Project Structure

```
src/
├── config/          # Configuration and logging
├── database/        # PostgreSQL connection and schema
├── middleware/      # Express middleware (auth, errors, audit)
├── services/        # Business logic
├── controllers/     # Request handlers
├── routes/          # API route definitions
├── types/           # TypeScript interfaces
└── utils/           # Security utilities
migrations/         # Database migration scripts
```

## x] Multimodal file ingestion
- [x] AI-agnostic resolution generation
- [x] Real-time incident correlation
- [ ] Advanced text extraction (OCR, PDF parsing)
- [ ] Slack/Teams integration
- [ ] Knowledge base matching
- [ ] Custom SLA management
- [ ] Dashboard and analytics
- [ ] Mobile app

## AI Provider Setup

The platform supports three AI providers out-of-the-box, with support for custom providers:

| Provider | Setup Time | Cost | Best For |
|----------|-----------|------|----------|
| **Ollama** | 5 min | Free | Development, privacy-focused |
| **OpenAI** | 2 min | $0.03-0.30 per incident | Production, best quality |
| **Anthropic** | 2 min | $3-15 per 1M tokens | Production, long contexts |

See **[AI_SETUP_GUIDE.md](./AI_SETUP_GUIDE.md)** for detailed provider configuration.

## Example: Generate AI Resolution

```bash
# 1. Create incident
curl -X POST http://localhost:3000/api/incidents \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pod stuck terminating",
    "description": "Kubernetes pod unable to terminate gracefully",
    "severity": "high"
  }'

# 2. Upload logs
curl -X POST http://localhost:3000/api/incidents/:id/artifacts \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@error.log"

# 3. Generate resolution using configured AI
curl -X POST http://localhost:3000/api/resolutions/:id/generate-resolution \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama"}'

# Response includes implementation steps and confidence score
```

See **[examples.sh](./examples.sh)** for more examples.ck

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

## Database Schema

Key tables:
- `organizations` - Multi-tenant isolation
- `users` - User accounts with RBAC
- `incidents` - Core incident records
- `incident_artifacts` - Uploaded files and data
- `resolutions` - AI-generated or manual solutions
- `audit_logs` - Complete audit trail
- `api_keys` - Programmatic access tokens

## Roadmap

- [ ] AI model integration (GPT-4 Turbo, Claude)
- [ ] Advanced text extraction (OCR, PDF parsing)
- [ ] Real-time incident correlation
- [ ] Slack/Teams integration
- [ ] Knowledge base matching
- [ ] Custom SLA management
- [ ] Dashboard and analytics
- [ ] Mobile app

## Support & Contributing

This is a reference implementation for enterprise SaaS development. Key patterns include:
- Modular architecture for easy feature addition
- Comprehensive error handling
- Enterprise security by default
- Audit trail for compliance
- Multi-tenant isolation

## License

MIT
