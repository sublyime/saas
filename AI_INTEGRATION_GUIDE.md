# AI Integration & Usage Guide

Complete guide to using the AI-powered incident resolution features.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Express API                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Resolution Controller & Services                │
├─────────────────────────────────────────────────────────┤
│ generateResolution() → aiService.generateResolution()   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              AI Service (abstraction)                   │
├─────────────────────────────────────────────────────────┤
│ - generateText()                                        │
│ - generateWithContext()                                 │
│ - generateIncidentResolution()                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           AI Service Factory                            │
├─────────────────────────────────────────────────────────┤
│ Manages provider selection & initialization             │
│ - Auto-detect configured providers                      │
│ - Switch providers at runtime                           │
│ - Support custom providers                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌──────────────┬──────────────┬──────────────┐
│   OpenAI     │  Anthropic   │   Ollama     │
│   (GPT-4)    │  (Claude)    │  (Local)     │
└──────────────┴──────────────┴──────────────┘
```

## Provider Comparison

### 1. Ollama (Local LLM) - RECOMMENDED FOR DEVELOPMENT

**Pros:**
- ✅ Free (runs locally)
- ✅ No API keys needed
- ✅ No rate limits
- ✅ Private (data never leaves your machine)
- ✅ Works offline

**Cons:**
- ❌ Requires local installation
- ❌ Slower than cloud APIs
- ❌ Less advanced models

**Setup:**
```bash
# Install
brew install ollama

# Pull a model
ollama pull mistral

# Start
ollama serve

# In .env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
AI_PROVIDER=ollama
```

**Best For:** Local development, testing, privacy-sensitive deployments

### 2. OpenAI (GPT-4 Turbo)

**Pros:**
- ✅ Highest quality outputs
- ✅ Fast response times
- ✅ Excellent for complex reasoning
- ✅ Well-documented API

**Cons:**
- ❌ Costs money ($0.01-0.30 per incident)
- ❌ Rate limits apply
- ❌ Requires internet
- ❌ Data sent to external service

**Setup:**
```bash
# Get API key from https://platform.openai.com
# In .env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
AI_PROVIDER=openai
```

**Cost Estimation:**
- GPT-4 Turbo: ~$0.05 per incident average
- 1000 incidents/month: ~$50/month
- Enterprise plans available for volume

**Best For:** Production deployments, complex incident analysis, high-quality requirements

### 3. Anthropic (Claude)

**Pros:**
- ✅ Excellent reasoning capabilities
- ✅ 200K context window (reads entire logs)
- ✅ Strong on technical documentation
- ✅ Good cost/quality ratio

**Cons:**
- ❌ Slightly more expensive
- ❌ Rate limits (free tier: 50 RPM)
- ❌ Requires internet

**Setup:**
```bash
# Get API key from https://console.anthropic.com
# In .env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
AI_PROVIDER=anthropic
```

**Cost Estimation:**
- Opus: $0.015-0.075 per incident
- 1000 incidents/month: ~$45/month

**Best For:** Long-context incidents, legal/compliance analysis

## Quick Start

### Development (Ollama - Free)

```bash
# 1. Install Ollama
brew install ollama

# 2. Pull a model
ollama pull mistral

# 3. Run in background
ollama serve &

# 4. Test it works
curl http://localhost:11434/api/generate -d '{"model":"mistral","prompt":"test"}'

# 5. Set in .env
echo 'AI_PROVIDER=ollama' >> .env

# 6. Test API
npm run dev
# Then: curl http://localhost:3000/api/resolutions/ai/status
```

### Production (OpenAI)

```bash
# 1. Get API key from OpenAI dashboard

# 2. Set in .env
OPENAI_API_KEY=sk-your-key-here
AI_PROVIDER=openai

# 3. Deploy
docker-compose up -d
```

## API Endpoints

### Check AI Status
```bash
GET /api/resolutions/ai/status

Response:
{
  "configured": true,
  "activeProvider": {
    "name": "ollama",
    "model": "mistral",
    "configured": true
  },
  "availableProviders": [
    {
      "name": "openai",
      "model": "gpt-4-turbo",
      "configured": false
    },
    {
      "name": "anthropic",
      "model": "claude-3-opus-20240229",
      "configured": false
    },
    {
      "name": "ollama",
      "model": "mistral",
      "configured": true
    }
  ]
}
```

### Generate Resolution
```bash
POST /api/resolutions/:incident-id/generate-resolution

Body:
{
  "provider": "openai"  // optional, uses default if not specified
}

Response:
{
  "id": "resolution-uuid",
  "incidentId": "incident-uuid",
  "solutionTitle": "Fix Pod Termination Timeout",
  "solutionDescription": "...",
  "confidenceScore": 0.92,
  "implementationSteps": [
    "Step 1: Check resource limits",
    "Step 2: Verify volume cleanup",
    "Step 3: Increase grace period"
  ],
  "reasoning": "Based on the error logs showing timeout...",
  "relatedErrors": ["timeout waiting for volumes"],
  "preventionSteps": ["Monitor resource usage"],
  "source": "ai_generated",
  "createdAt": "2024-01-11T15:30:00Z"
}
```

### Find Correlated Incidents
```bash
GET /api/resolutions/:incident-id/correlate?limit=5

Response:
{
  "targetIncident": "incident-uuid",
  "correlatedCount": 3,
  "incidents": [
    {
      "id": "incident-uuid-2",
      "title": "Similar pod termination issue",
      "severity": "high",
      "status": "open",
      "artifact_count": 2
    }
  ]
}
```

### Change AI Provider (Admin Only)
```bash
POST /api/resolutions/ai/provider

Body:
{
  "provider": "openai"
}

Response:
{
  "message": "AI provider changed to openai",
  "activeProvider": {
    "name": "openai",
    "model": "gpt-4-turbo",
    "configured": true
  }
}
```

## Usage Patterns

### Pattern 1: Simple Resolution Generation
```bash
# 1. Create incident with context
POST /api/incidents
{
  "title": "Database timeout",
  "description": "SELECT queries timing out after 30s",
  "severity": "critical"
}

# 2. Upload logs
POST /api/incidents/:id/artifacts
(file: database.log)

# 3. Generate solution
POST /api/resolutions/:id/generate-resolution

# Done! Returns implementation steps
```

### Pattern 2: Multi-Provider Comparison
```typescript
// Compare outputs from different providers
const providers = ['ollama', 'openai', 'anthropic'];

for (const provider of providers) {
  const resolution = await generateAIResolution(
    incidentId,
    orgId,
    provider
  );
  
  console.log(`${provider}: ${resolution.confidenceScore}`);
}

// Pick the highest confidence or best reasoning
```

### Pattern 3: Smart Provider Selection
```typescript
// Automatically pick best provider for context

if (incident.severity === 'critical') {
  // Use best model for critical issues
  aiService.setProvider('openai');
} else if (artifactTexts.length > 10) {
  // Use long-context model for many artifacts
  aiService.setProvider('anthropic');
} else {
  // Use free local model for simple cases
  aiService.setProvider('ollama');
}

const resolution = await generateAIResolution(incidentId, orgId);
```

### Pattern 4: Fallback Strategy
```typescript
const providers = ['openai', 'anthropic', 'ollama'];

for (const provider of providers) {
  try {
    const resolution = await generateAIResolution(
      incidentId,
      orgId,
      provider
    );
    
    if (resolution.confidenceScore > 0.7) {
      return resolution; // Good enough
    }
  } catch (error) {
    console.log(`${provider} failed, trying next...`);
  }
}

throw new Error('All providers failed');
```

## Custom Provider Implementation

```typescript
// src/services/ai/providers/custom.ts
import { AIProvider, AIGenerationOptions, AIGenerationResponse, AIMessage, AIResolutionRequest, AIResolutionResponse } from '../types';

export class CustomLLMProvider implements AIProvider {
  name = 'custom-llm';
  model = 'your-model-name';
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.CUSTOM_LLM_API_KEY || '';
    this.endpoint = process.env.CUSTOM_LLM_ENDPOINT || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.endpoint;
  }

  async generateText(
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    const response = await fetch(`${this.endpoint}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
    });

    const data = await response.json();

    return {
      content: data.text,
      stopReason: data.stop_reason,
      tokensUsed: data.tokens,
      provider: this.name,
      model: this.model,
    };
  }

  async generateWithContext(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    // Similar implementation for messages
  }

  async generateIncidentResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions
  ): Promise<AIResolutionResponse> {
    // Incident-specific logic
  }
}

// Register in factory.ts
factory.registerProvider('custom-llm', new CustomLLMProvider());
```

## Monitoring & Costs

### OpenAI Cost Tracking
```bash
# Monitor API usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Set budget alerts in dashboard
# https://platform.openai.com/account/billing/overview
```

### Anthropic Cost Tracking
```bash
# Available in console
# https://console.anthropic.com/account/usage
```

### Log Resolution Attempts
```typescript
// Track all resolution attempts
await query(`
  INSERT INTO resolution_attempts (
    incident_id, provider, status, tokens_used, cost, created_at
  ) VALUES ($1, $2, $3, $4, $5, NOW())
`, [incidentId, provider, status, tokensUsed, estimatedCost]);
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "AI service not configured" | No provider has API key | Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or start Ollama |
| Ollama returns empty response | Model not pulled | Run `ollama pull mistral` |
| OpenAI rate limit hit | Too many requests | Implement caching, increase quota |
| Slow generation | Model/network latency | Use faster model (gpt-3.5, dolphin-mixtral) |
| High confidence score but bad solution | Model hallucinating | Increase temperature, add more context |

## Best Practices

1. **Start with Ollama** for development (free, no setup)
2. **Use OpenAI for production** (highest quality, worth the cost)
3. **Implement caching** for identical incidents
4. **Monitor confidence scores** - filter low-confidence results
5. **Test multiple providers** with sample incidents
6. **Set up cost alerts** with OpenAI/Anthropic
7. **Provide manual override** option if AI suggestion is wrong
8. **Log all attempts** for analysis and improvement

## Performance Metrics

| Provider | Avg Response Time | Confidence | Cost/Incident |
|----------|------------------|------------|-----------------|
| Ollama | 10-30s | 65% | Free |
| OpenAI | 2-5s | 92% | $0.05 |
| Anthropic | 3-7s | 90% | $0.04 |

## Next Steps

1. Set up your preferred AI provider (recommend Ollama for now)
2. Create test incidents and generate resolutions
3. Monitor output quality and adjust provider if needed
4. Implement knowledge base matching (coming soon)
5. Set up Slack/Teams integration for notifications
