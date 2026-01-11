# Deployment Guide

Complete guide for deploying the Enterprise Multimodal Incident Resolution Platform to development, staging, and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Production Hardening](#production-hardening)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

```
Node.js:      v20.0.0 or higher
npm:          v10.0.0 or higher
PostgreSQL:   v15+ (or managed PostgreSQL)
Docker:       v24+ (for containerized deployment)
Git:          Any recent version
```

### Required Knowledge

- Basic Node.js/TypeScript
- PostgreSQL basics
- Docker containers (if using Docker)
- Your cloud provider (AWS/Azure/GCP)
- Environment variable management

### Accounts Required

```
✓ PostgreSQL database (local or cloud)
✓ AI Provider(s): OpenAI, Anthropic, or Ollama
✓ Cloud provider (AWS/Azure/GCP) - optional
✓ Git repository (GitHub/GitLab)
✓ Container registry (ECR/ACR/GCR) - optional
```

---

## Local Development

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/incident-resolver.git
cd incident-resolver

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### 2. Configure Environment

Edit `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/incident_resolver

# Authentication
JWT_SECRET=your-random-secret-key-here
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef01234567

# AI Provider (choose one)
AI_PROVIDER=ollama  # or openai, anthropic
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Optional: AI Provider Keys
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### 3. Start PostgreSQL

#### Option A: Docker

```bash
# Using docker-compose
docker-compose up postgres

# Or standalone Docker
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=incident_resolver \
  -p 5432:5432 \
  postgres:16
```

#### Option B: Local Installation

```bash
# macOS
brew install postgresql
brew services start postgresql

# Linux
sudo apt-get install postgresql
sudo systemctl start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

### 4. Initialize Database

```bash
# Run migrations
npm run migrate

# Or manually
psql postgresql://user:password@localhost:5432/incident_resolver < migrations/001_initial_schema.sql
```

### 5. Start Development Server

```bash
# Start in development mode
npm run dev

# Server runs on http://localhost:3000
# Auto-reloads on file changes
```

### 6. Verify Setup

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "database": "connected"
#   }
# }
```

---

## Docker Deployment

### Build Docker Image

```bash
# Build image
docker build -t incident-resolver:latest .

# Or with specific version
docker build -t incident-resolver:v1.0.0 .

# List images
docker images | grep incident-resolver
```

### Run Container Locally

```bash
# Run with environment file
docker run \
  --env-file .env.local \
  -p 3000:3000 \
  --link postgres \
  incident-resolver:latest

# Or using Docker Compose
docker-compose up api
```

### Docker Compose Setup

**Development**:
```bash
# Start all services
docker-compose up

# Or specific service
docker-compose up -d api postgres

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

**Production** (see Production Hardening below)

### Health Check

```bash
# From host
curl http://localhost:3000/api/health

# From another container
docker exec incident-resolver curl http://localhost:3000/api/health
```

---

## Cloud Deployment

### AWS Deployment

#### Using ECS (Recommended)

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name incident-resolver

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag incident-resolver:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/incident-resolver:latest
docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/incident-resolver:latest
```

2. **Create RDS PostgreSQL**
```bash
aws rds create-db-instance \
  --db-instance-identifier incident-resolver-prod \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password [STRONG-PASSWORD] \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 30 \
  --enable-cloudwatch-logs-exports postgresql
```

3. **Create ECS Cluster & Task**
```bash
# Create cluster
aws ecs create-cluster --cluster-name incident-resolver-prod

# Create task definition (use task-definition.json)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster incident-resolver-prod \
  --service-name incident-resolver-api \
  --task-definition incident-resolver:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

4. **Setup Load Balancer**
```bash
aws elbv2 create-load-balancer \
  --name incident-resolver-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# Create target group
aws elbv2 create-target-group \
  --name incident-resolver-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx
```

#### Using Elastic Beanstalk

```bash
# Initialize Elastic Beanstalk
eb init -p "Node.js 20 running on 64bit Amazon Linux 2" incident-resolver

# Create environment
eb create incident-resolver-prod

# Deploy
eb deploy

# View status
eb status

# View logs
eb logs
```

### Azure Deployment

#### Using Container Instances

```bash
# Create resource group
az group create --name incident-resolver-prod --location eastus

# Create container registry
az acr create --resource-group incident-resolver-prod \
  --name incidentresolverregistry \
  --sku Basic

# Build and push image
az acr build --registry incidentresolverregistry \
  --image incident-resolver:latest .

# Create Azure Database for PostgreSQL
az postgres server create \
  --resource-group incident-resolver-prod \
  --name incident-resolver-db \
  --location eastus \
  --admin-user pgadmin \
  --admin-password [STRONG-PASSWORD] \
  --sku-name B_Gen5_1 \
  --storage-size 51200

# Deploy container instance
az container create \
  --resource-group incident-resolver-prod \
  --name incident-resolver-app \
  --image incidentresolverregistry.azurecr.io/incident-resolver:latest \
  --cpu 2 --memory 4 \
  --registry-login-server incidentresolverregistry.azurecr.io \
  --registry-username [username] \
  --registry-password [password] \
  --ports 3000 \
  --environment-variables \
    DATABASE_URL="postgresql://pgadmin:password@incident-resolver-db.postgres.database.azure.com:5432/incidentresolver" \
    AI_PROVIDER="openai"
```

#### Using App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name incident-resolver-plan \
  --resource-group incident-resolver-prod \
  --sku B2 --is-linux

# Create web app
az webapp create \
  --resource-group incident-resolver-prod \
  --plan incident-resolver-plan \
  --name incident-resolver-app \
  --runtime "NODE|20-lts"

# Configure deployment from Git
az webapp deployment source config-zip \
  --resource-group incident-resolver-prod \
  --name incident-resolver-app \
  --src app.zip
```

### Google Cloud Deployment

#### Using Cloud Run

```bash
# Build image (uses Cloud Build)
gcloud builds submit --tag gcr.io/[PROJECT-ID]/incident-resolver

# Deploy to Cloud Run
gcloud run deploy incident-resolver \
  --image gcr.io/[PROJECT-ID]/incident-resolver \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://..." \
  --memory 1Gi \
  --cpu 1
```

#### Using Compute Engine

```bash
# Create VM instance
gcloud compute instances create incident-resolver-vm \
  --zone us-central1-a \
  --machine-type e2-medium \
  --image-family debian-11 \
  --image-project debian-cloud

# SSH into VM
gcloud compute ssh incident-resolver-vm --zone us-central1-a

# Install Node.js and dependencies on VM
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql-client

# Clone and deploy
git clone https://github.com/your-org/incident-resolver.git
cd incident-resolver
npm install
npm run build
npm start
```

---

## Production Hardening

### Environment Configuration

**production .env**:
```bash
# Database (use managed service)
DATABASE_URL=postgresql://user:password@managed-db.example.com:5432/incident_resolver?sslmode=require

# Security (use strong random values)
JWT_SECRET=[32+ character random string]
ENCRYPTION_KEY=[64 hex character random string]

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# AI Provider (choose one)
AI_PROVIDER=openai
OPENAI_API_KEY=[secure API key from secrets manager]

# Security Headers
ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
UPLOAD_MAX_SIZE=52428800  # 50MB
UPLOAD_DIR=/var/data/uploads  # Persistent volume

# Logging
LOG_LEVEL=info
SENTRY_DSN=[optional error tracking]
```

### Database Hardening

**Create restricted application user**:
```sql
-- Create limited user
CREATE USER app_user WITH PASSWORD '[strong-random-password]';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE incident_resolver TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Revoke public schema permissions
REVOKE ALL ON DATABASE incident_resolver FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/certificate.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/certificate.key';

-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;

SELECT pg_reload_conf();
```

### HTTPS/TLS Setup

**Using Let's Encrypt with certbot**:
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Request certificate
sudo certbot certonly --standalone -d app.example.com

# Configure nginx as reverse proxy
sudo nano /etc/nginx/sites-available/incident-resolver
```

**nginx configuration**:
```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### WAF Configuration

**Using AWS WAF**:
```bash
# Create WAF rules
aws wafv2 create-ip-set \
  --name ip-whitelist \
  --scope REGIONAL \
  --ip-address-version IPV4 \
  --addresses ["203.0.113.0/24"]

# Apply to Load Balancer
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:... \
  --resource-arn arn:aws:elasticloadbalancing:...
```

### Secrets Management

**AWS Secrets Manager**:
```bash
# Store database password
aws secretsmanager create-secret \
  --name incident-resolver/db-password \
  --secret-string '{"username":"app_user","password":"secure_password"}'

# Retrieve in application
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager();
const secret = await client.getSecretValue({
  SecretId: 'incident-resolver/db-password'
});
const credentials = JSON.parse(secret.SecretString);
```

### DDoS Protection

**Using Cloudflare**:
1. Update DNS to point to Cloudflare
2. Enable DDoS protection (Zone Level)
3. Configure WAF rules
4. Setup rate limiting rules
5. Enable Page Rules for caching

**Using AWS Shield**:
```bash
# Enable Shield Advanced
aws shield subscribe --subscription

# Create IP set for blocking
aws wafv2 create-ip-set \
  --name ddos-blacklist \
  --scope REGIONAL \
  --ip-address-version IPV4
```

---

## Monitoring & Logging

### Application Logging

**Configuration**:
```typescript
// src/config/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: process.env.NODE_ENV !== 'production'
    }
  }
});
```

**Log Levels**:
```
debug   - Detailed diagnostic info (development only)
info    - General info (startup, requests)
warn    - Warnings (deprecated APIs, slow queries)
error   - Errors (failed operations)
fatal   - Fatal errors (server crash)
```

### Centralized Logging

**Using ELK Stack (Elasticsearch, Logstash, Kibana)**:

```yaml
# docker-compose.yml additions
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data

logstash:
  image: docker.elastic.co/logstash/logstash:8.0.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

**Using AWS CloudWatch**:
```bash
# Install CloudWatch agent
npm install aws-sdk aws-log-driver

# Configure logging
const CloudWatchLogger = require('aws-log-driver');
const logger = new CloudWatchLogger({
  logGroupName: '/aws/lambda/incident-resolver',
  logStreamName: 'api'
});
```

### Error Tracking

**Using Sentry**:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Capture errors automatically
app.use(Sentry.Handlers.errorHandler());
```

### Performance Monitoring

**Key Metrics to Track**:

```
1. Response Time
   ├─ P50 (median)
   ├─ P95 (95th percentile)
   └─ P99 (99th percentile)

2. Error Rate
   ├─ Errors per second
   ├─ By endpoint
   └─ By error type

3. Database
   ├─ Query duration
   ├─ Connection pool usage
   └─ Slow query count

4. AI Service
   ├─ Generation time
   ├─ API costs
   └─ Provider latency
```

**Using DataDog**:
```bash
npm install dd-trace

export DD_TRACE_ENABLED=true
npm start
```

---

## Backup & Recovery

### Database Backups

**Automated PostgreSQL Backups**:

```bash
# Create backup script
#!/bin/bash
DB_USER="postgres"
DB_NAME="incident_resolver"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump \
  -h localhost \
  -U $DB_USER \
  $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep last 30 backups
find $BACKUP_DIR -type f -mtime +30 -delete
```

**Cron Schedule**:
```
# Daily at 2 AM
0 2 * * * /backup-script.sh

# Weekly full backup (Sunday at 3 AM)
0 3 * * 0 /full-backup-script.sh
```

**Using AWS RDS Automated Backups**:
```bash
# Enable automated backups (7-35 days retention)
aws rds modify-db-instance \
  --db-instance-identifier incident-resolver-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "02:00-03:00"
```

### File Storage Backups

**Using S3 Sync**:
```bash
#!/bin/bash
# Sync uploads to S3
aws s3 sync /var/data/uploads s3://incident-resolver-backups/uploads \
  --delete \
  --storage-class STANDARD_IA  # Cheaper storage
```

### Backup Verification

**Regular Restore Testing**:
```bash
# Monthly restore test (staging)
pg_restore -d incident_resolver_test backup_latest.sql.gz

# Verify data integrity
psql -d incident_resolver_test -c "SELECT COUNT(*) FROM incidents;"
```

### Disaster Recovery Plan

**RTO/RPO Targets**:
```
Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 1 hour
```

**Recovery Procedure**:
```
1. Detect outage (monitoring alert)
2. Activate disaster recovery (0-15 min)
3. Restore from latest backup (0-1 hour)
4. Restore file storage from S3 (0-30 min)
5. Run smoke tests (10-15 min)
6. Switch DNS to recovered system (5 min)
7. Monitor for issues (1 hour)
8. Post-mortem within 24 hours
```

---

## Troubleshooting

### Common Issues

#### PostgreSQL Connection Failed

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check DATABASE_URL format
# postgresql://user:password@host:5432/database

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### AI Service Unreachable

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:11434`

**Solution**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check AI provider configuration
curl http://localhost:3000/api/resolutions/ai/status

# Restart service
docker restart ollama
# OR
ollama serve
```

#### High Memory Usage

**Problem**: Node process using excessive memory

**Solution**:
```bash
# Monitor memory
node --max-old-space-size=2048 src/index.ts

# Check for memory leaks
npm install --save-dev clinic
clinic doctor -- npm start

# Optimize database queries (add indexes)
CREATE INDEX idx_incidents_org_created 
ON incidents(organization_id, created_at);
```

#### Slow API Responses

**Problem**: Requests taking >5 seconds

**Solution**:
```bash
# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  # Log queries > 1 second
SELECT pg_reload_conf();

# Check slow queries
tail -f /var/log/postgresql/postgresql.log | grep "duration:"

# Add indexes for frequently queried columns
CREATE INDEX idx_incidents_org_status 
ON incidents(organization_id, status);

# Implement caching for repeated queries
```

#### Rate Limiting Too Strict

**Problem**: Legitimate users getting 429 responses

**Solution**:
```bash
# Adjust rate limiting
RATE_LIMIT_MAX_REQUESTS=200    # Increase from 100
RATE_LIMIT_WINDOW_MS=1800000   # 30 minutes instead of 15

# Or implement per-user limits (future)
```

### Debugging

**Enable Debug Logging**:
```bash
# .env
LOG_LEVEL=debug
DEBUG=incident-resolver:*

npm run dev
```

**Health Check Endpoint**:
```bash
curl http://localhost:3000/api/health | jq '.'
```

**Database Diagnostics**:
```bash
# Connection pool status
psql $DATABASE_URL -c "SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;"

# Table sizes
psql $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## Rollback Procedure

**If deployment fails**:

```bash
# 1. Identify last good version
git log --oneline | head -5

# 2. Revert code changes
git revert [bad-commit]
git push

# 3. Rebuild and redeploy
docker build -t incident-resolver:latest .
docker push incident-resolver:latest

# 4. Restart services
docker-compose restart api

# 5. Verify
curl http://localhost:3000/api/health

# 6. Restore database (if needed)
pg_restore -d incident_resolver backup_good.sql.gz

# 7. Monitor for 1 hour
# Check error rates, latency, logs
```

---

## Support & Resources

- [Node.js Deployment Guide](https://nodejs.org/en/docs/guides/nodejs-web-application/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)

---

**Last updated**: January 11, 2026
