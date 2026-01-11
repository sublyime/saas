#!/bin/bash

# AI-Powered Incident Resolution Examples
# This script demonstrates how to use the AI features of the Incident Resolver

BASE_URL="http://localhost:3000"
TOKEN="your-bearer-token-here"
ORG_ID="your-org-uuid-here"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== AI Provider Status ===${NC}"
curl -s -X GET "$BASE_URL/api/resolutions/ai/status" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n${BLUE}=== Example 1: Create Incident ===${NC}"
INCIDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/incidents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pod stuck in terminating state",
    "description": "Kubernetes pod in namespace monitoring-prod unable to terminate gracefully after 5 minutes. Logs show: failed to cleanup resources, timeout waiting for volumes",
    "severity": "high"
  }')

echo "$INCIDENT_RESPONSE" | jq .

INCIDENT_ID=$(echo "$INCIDENT_RESPONSE" | jq -r '.id')
echo -e "${YELLOW}Created incident: $INCIDENT_ID${NC}"

echo -e "\n${BLUE}=== Example 2: Upload Error Artifacts ===${NC}"
# Create sample error log
cat > /tmp/error.log <<EOF
2024-01-11T15:23:45Z ERROR [kubelet] failed to unmount volume: timeout
2024-01-11T15:23:46Z ERROR [kubelet] pod deletion grace period expired
2024-01-11T15:23:47Z WARN [cri-o] container still running after termination signal
2024-01-11T15:24:00Z ERROR [kubelet] failed to stop container: operation timed out
EOF

curl -s -X POST "$BASE_URL/api/incidents/$INCIDENT_ID/artifacts" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/error.log" | jq .

echo -e "\n${BLUE}=== Example 3: Generate AI Resolution with Ollama ===${NC}"
echo -e "${YELLOW}Using local Ollama (free, no API keys needed)${NC}"
curl -s -X POST "$BASE_URL/api/resolutions/$INCIDENT_ID/generate-resolution" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama"}' | jq .

echo -e "\n${BLUE}=== Example 4: Generate Resolution with OpenAI (GPT-4) ===${NC}"
echo -e "${YELLOW}Requires OPENAI_API_KEY in .env${NC}"
curl -s -X POST "$BASE_URL/api/resolutions/$INCIDENT_ID/generate-resolution" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}' | jq .

echo -e "\n${BLUE}=== Example 5: Generate Resolution with Anthropic (Claude) ===${NC}"
echo -e "${YELLOW}Requires ANTHROPIC_API_KEY in .env${NC}"
curl -s -X POST "$BASE_URL/api/resolutions/$INCIDENT_ID/generate-resolution" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic"}' | jq .

echo -e "\n${BLUE}=== Example 6: Find Correlated Incidents ===${NC}"
curl -s -X GET "$BASE_URL/api/resolutions/$INCIDENT_ID/correlate?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n${BLUE}=== Example 7: Change AI Provider (Admin Only) ===${NC}"
curl -s -X POST "$BASE_URL/api/resolutions/ai/provider" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}' | jq .

echo -e "\n${GREEN}Examples complete!${NC}"
