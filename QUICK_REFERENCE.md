# AI Platform - Quick Reference Card

## 🚀 5-Minute Setup

### Option A: Ollama (Recommended - Development)
```bash
brew install ollama
ollama pull mistral
ollama serve &

# .env
AI_PROVIDER=ollama

npm run dev
# Ready!
```

### Option B: OpenAI (Production)
```bash
# Get API key: https://platform.openai.com

# .env
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai

npm run dev
# Ready!
```

### Option C: Anthropic (Production)
```bash
# Get API key: https://console.anthropic.com

# .env
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic

npm run dev
# Ready!
```

## 📡 API Cheat Sheet

### Check Status
```bash
curl http://localhost:3000/api/resolutions/ai/status
```

### Generate Resolution
```bash
POST /api/resolutions/:incident-id/generate-resolution
{ "provider": "openai" }  # optional
```

### Find Similar Incidents
```bash
GET /api/resolutions/:incident-id/correlate?limit=5
```

### Switch Provider (Admin)
```bash
POST /api/resolutions/ai/provider
{ "provider": "openai" }
```

## 💰 Cost Comparison

| Provider | Per Incident | 1000/mo |
|----------|--------------|---------|
| Ollama | Free | Free |
| OpenAI | $0.05 | $50 |
| Anthropic | $0.04 | $40 |

## 🔧 Supported Providers

| Name | Setup | Speed | Quality | Cost |
|------|-------|-------|---------|------|
| Ollama | 5min | 10-30s | 65% | Free |
| OpenAI | 2min | 2-5s | 92% | $0.05 |
| Anthropic | 2min | 3-7s | 90% | $0.04 |

## 📚 Full Documentation

- **AI_SETUP_GUIDE.md** - Detailed provider setup
- **AI_INTEGRATION_GUIDE.md** - Architecture & patterns
- **AI_IMPLEMENTATION_SUMMARY.md** - Feature overview
- **examples.sh** - cURL examples
- **examples.ts** - TypeScript examples

## 🔑 Environment Variables

```bash
# Provider Selection
AI_PROVIDER=ollama  # or openai, anthropic

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
```

## ✨ Key Features

✅ AI-agnostic (switch providers anytime)  
✅ Auto-detection (detects configured providers)  
✅ Runtime switching (change without restart)  
✅ Fallback support (try next provider on failure)  
✅ Custom providers (extend with your own)  
✅ Full audit logging (track all AI operations)  
✅ Enterprise security (RBAC, encryption, TLS)

## 🎯 Common Tasks

### Generate resolution for incident
```bash
# 1. Create incident
curl -X POST /api/incidents
# Get incident ID

# 2. Upload logs
curl -X POST /api/incidents/ID/artifacts -F "file=@logs"

# 3. Generate solution
curl -X POST /api/resolutions/ID/generate-resolution
```

### Compare AI providers
```typescript
for (const provider of ['ollama', 'openai', 'anthropic']) {
  const res = await generateAIResolution(id, orgId, provider);
  console.log(`${provider}: ${res.confidenceScore}`);
}
```

### Smart provider selection
```typescript
if (criticalIncident) aiService.setProvider('openai');
else aiService.setProvider('ollama');
```

## ⚠️ Troubleshooting

**Problem: "AI service not configured"**
- Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or start Ollama

**Problem: Slow responses**
- Use smaller model (ollama: neural-chat, openai: gpt-3.5)
- Reduce maxTokens parameter

**Problem: Low confidence**
- Upload more artifacts (logs, errors, traces)
- Try different provider

**Problem: High costs**
- Switch to Ollama (free)
- Use gpt-3.5-turbo (cheaper)
- Implement caching

## 📊 Performance

| Metric | Ollama | OpenAI | Anthropic |
|--------|--------|--------|-----------|
| Response Time | 10-30s | 2-5s | 3-7s |
| Quality | 65% | 92% | 90% |
| Cost/1000 | Free | $50 | $40 |
| Setup Time | 5min | 2min | 2min |
| Privacy | Excellent | Poor | Poor |

## 🚀 Production Checklist

- [ ] Choose primary AI provider
- [ ] Set API keys in environment
- [ ] Test resolution generation
- [ ] Monitor API usage/costs
- [ ] Set up cost alerts
- [ ] Implement caching
- [ ] Add monitoring/alerting
- [ ] Create runbooks for failures

## 📞 Quick Links

- Ollama: https://ollama.ai
- OpenAI Docs: https://platform.openai.com/docs
- Anthropic Docs: https://docs.anthropic.com
- This Project: See README.md

## 🎓 Learning Resources

1. Start with **AI_SETUP_GUIDE.md** for your chosen provider
2. Review **examples.sh** for API patterns
3. Check **AI_INTEGRATION_GUIDE.md** for advanced usage
4. Explore **examples.ts** for TypeScript integration

---

**Start with Ollama (free), upgrade to OpenAI/Anthropic when needed.** 🚀
