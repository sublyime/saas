# AI Provider Setup Guide

The Incident Resolver platform supports multiple AI providers for generating resolutions. Choose the one that best fits your needs.

## Quick Comparison

| Provider | Cost | Setup | Complexity | Recommended For |
|----------|------|-------|------------|-----------------|
| **Ollama** (Local) | Free | Easy | Low | Development, Privacy-First |
| **OpenAI** (GPT-4) | $0.03/1K input | 5 min | Low | Production, Best Quality |
| **Anthropic** (Claude) | $3/1M input | 5 min | Low | Production, Long Context |

---

## Option 1: Ollama (Local LLM) - Recommended for Development

**Best for:** Local development, privacy-first deployments, no API costs

### Setup

#### 1. Install Ollama
```bash
# macOS
brew install ollama

# Linux/Windows
# Download from https://ollama.ai
# Or run in Docker:
docker pull ollama/ollama
docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
```

#### 2. Pull a Model
```bash
# Mistral (fast, good quality)
ollama pull mistral

# Alternatives:
ollama pull neural-chat  # Optimized for chat
ollama pull dolphin-mixtral  # More advanced reasoning
ollama pull llama2  # Larger model
```

#### 3. Verify It's Running
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "What is incident resolution?",
  "stream": false
}'
```

#### 4. Configure Platform
```bash
# .env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
AI_PROVIDER=ollama
```

#### 5. Test Resolution Generation
```bash
# Create incident first
curl -X POST http://localhost:3000/api/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pod stuck terminating",
    "description": "Kubernetes pod unable to terminate gracefully",
    "severity": "high"
  }'

# Generate AI resolution
curl -X POST http://localhost:3000/api/resolutions/:incident-id/generate-resolution \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama"}'
```

### Running in Docker Compose
```yaml
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_MODELS=/root/.ollama

  app:
    environment:
      OLLAMA_BASE_URL=http://ollama:11434
      OLLAMA_MODEL=mistral
      AI_PROVIDER=ollama
    depends_on:
      - ollama
```

---

## Option 2: OpenAI (GPT-4 Turbo)

**Best for:** Production, highest quality output

### Setup

#### 1. Create OpenAI Account
- Go to https://platform.openai.com
- Sign up and create API key

#### 2. Set API Key
```bash
# .env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
AI_PROVIDER=openai
```

#### 3. Test Resolution Generation
```bash
curl -X POST http://localhost:3000/api/resolutions/:incident-id/generate-resolution \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}'
```

### Pricing
- GPT-4 Turbo: $0.01 per 1K input tokens, $0.03 per 1K output tokens
- GPT-3.5: $0.0005 per 1K input tokens, $0.0015 per 1K output tokens

### Environment Variables
```bash
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4-turbo  # or gpt-3.5-turbo, gpt-4, etc.
```

### Docker Compose
```yaml
app:
  environment:
    OPENAI_API_KEY: ${OPENAI_API_KEY}
    OPENAI_MODEL: gpt-4-turbo
    AI_PROVIDER: openai
```

---

## Option 3: Anthropic Claude

**Best for:** Production, long contexts, reasoning-heavy tasks

### Setup

#### 1. Create Anthropic Account
- Go to https://www.anthropic.com
- Create API key at https://console.anthropic.com

#### 2. Set API Key
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
AI_PROVIDER=anthropic
```

#### 3. Test Resolution Generation
```bash
curl -X POST http://localhost:3000/api/resolutions/:incident-id/generate-resolution \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic"}'
```

### Models Available
- `claude-3-opus-20240229` - Most capable (longer context)
- `claude-3-sonnet-20240229` - Balanced
- `claude-3-haiku-20240307` - Faster, cheaper

### Pricing
- Opus: $3 per 1M input tokens, $15 per 1M output tokens
- Sonnet: $3 per 1M input tokens, $15 per 1M output tokens
- Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens

### Environment Variables
```bash
ANTHROPIC_API_KEY=sk-ant-your-api-key
ANTHROPIC_MODEL=claude-3-opus-20240229
```

---

## Switching Providers at Runtime

### Get Current Status
```bash
curl http://localhost:3000/api/resolutions/ai/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "configured": true,
  "activeProvider": {
    "name": "ollama",
    "model": "mistral",
    "configured": true
  },
  "availableProviders": [
    {"name": "openai", "model": "gpt-4-turbo", "configured": false},
    {"name": "anthropic", "model": "claude-3-opus-20240229", "configured": false},
    {"name": "ollama", "model": "mistral", "configured": true}
  ]
}
```

### Change Active Provider
```bash
curl -X POST http://localhost:3000/api/resolutions/ai/provider \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}'

# Response:
{
  "message": "AI provider changed to openai",
  "activeProvider": {
    "name": "openai",
    "model": "gpt-4-turbo",
    "configured": true
  }
}
```

### Per-Request Provider Override
```bash
curl -X POST http://localhost:3000/api/resolutions/:incident-id/generate-resolution \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "claude"}'
```

---

## Custom AI Provider

To integrate a custom LLM provider:

```typescript
// src/services/ai/providers/custom.ts
import { AIProvider } from '../types';

export class CustomProvider implements AIProvider {
  name = 'custom';
  model = 'your-model-name';

  isConfigured(): boolean {
    return !!process.env.CUSTOM_API_KEY;
  }

  async generateText(prompt: string, options?: AIGenerationOptions) {
    // Implement your API calls
  }

  async generateWithContext(messages: AIMessage[], options?: AIGenerationOptions) {
    // Implement context handling
  }

  async generateIncidentResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions
  ): Promise<AIResolutionResponse> {
    // Implement resolution generation
  }
}

// In factory.ts
import { CustomProvider } from './providers/custom';

constructor(defaultProvider?: AIProviderType) {
  this.providers.set('custom', new CustomProvider());
  // ... rest of initialization
}
```

---

## Resolution Generation Example

```bash
# 1. Create incident
curl -X POST http://localhost:3000/api/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database connection timeout",
    "description": "Connections timing out at 30s interval",
    "severity": "critical"
  }'

# Response: { "id": "incident-uuid-here" }

# 2. Upload error logs
curl -X POST http://localhost:3000/api/incidents/incident-uuid-here/artifacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@error.log"

# 3. Generate resolution
curl -X POST http://localhost:3000/api/resolutions/incident-uuid-here/generate-resolution \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}'

# Response includes:
# - solutionTitle
# - solutionDescription
# - implementationSteps (array)
# - confidenceScore (0-1)
# - reasoning
# - relatedErrors
# - preventionSteps
```

---

## Troubleshooting

### "AI service not configured"
- Check that at least one provider has required environment variables
- Verify API keys are correct
- For Ollama: ensure service is running on correct URL

### Provider returns empty/invalid response
- Check model is compatible with the provider
- Verify API quotas/rate limits
- Check incident has sufficient artifact data

### Slow resolution generation
- Use faster/smaller model (Ollama: neural-chat, OpenAI: gpt-3.5)
- Increase `maxTokens` parameter
- Check network/API latency

### High costs with OpenAI/Anthropic
- Use gpt-3.5-turbo (much cheaper)
- Use Ollama for high-volume operations
- Implement response caching

---

## Production Recommendations

1. **Use Ollama** for infrastructure incidents (local, fast, reliable)
2. **Use OpenAI/Claude** for complex reasoning or long contexts
3. **Implement caching** to avoid duplicate generations
4. **Monitor API costs** with OpenAI/Anthropic
5. **Test responses** before storing in production
6. **Implement fallback** to manual resolution if AI fails

---

## API Rate Limits by Provider

| Provider | Rate | Cost Management |
|----------|------|-----------------|
| Ollama | Unlimited | Free, self-hosted |
| OpenAI | 3,500 RPM (free) | Set spending limits in dashboard |
| Anthropic | 50 RPM (free tier) | Apply for increased quota |

