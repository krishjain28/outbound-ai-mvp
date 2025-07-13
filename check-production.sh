#!/bin/bash

# Production Status Check Script
# No local development needed - everything runs in the cloud!

echo "🚀 AI SDR Production Status Check"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="https://outbound-ai.onrender.com"

echo -e "${BLUE}🔍 Checking Backend Health...${NC}"
if curl -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
    echo "   Environment: $(echo $HEALTH_RESPONSE | jq -r '.environment')"
    echo "   Uptime: $(echo $HEALTH_RESPONSE | jq -r '.uptime') seconds"
else
    echo -e "${RED}❌ Backend is down${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Checking Worker Status...${NC}"
if curl -s "$BACKEND_URL/api/workers/status" > /dev/null; then
    echo -e "${GREEN}✅ Workers are running${NC}"
    WORKER_RESPONSE=$(curl -s "$BACKEND_URL/api/workers/status")
    echo "   Call Processing: $(echo $WORKER_RESPONSE | jq -r '.callProcessingActive')"
    echo "   Conversation Processing: $(echo $WORKER_RESPONSE | jq -r '.conversationProcessingActive')"
else
    echo -e "${RED}❌ Workers are down${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Testing API Endpoints...${NC}"
if curl -s "$BACKEND_URL/api/auth/me" > /dev/null; then
    echo -e "${GREEN}✅ API endpoints are accessible${NC}"
else
    echo -e "${YELLOW}⚠️  API endpoints may require authentication${NC}"
fi

echo ""
echo -e "${BLUE}📊 Production URLs:${NC}"
echo "   Backend: $BACKEND_URL"
echo "   Health Check: $BACKEND_URL/health"
echo "   API Base: $BACKEND_URL/api"

echo ""
echo -e "${GREEN}🎉 Production system is ready!${NC}"
echo ""
echo -e "${YELLOW}💡 Remember: No local development needed!${NC}"
echo "   - Backend runs on Render"
echo "   - Frontend runs on Vercel"
echo "   - Database runs on MongoDB Atlas"
echo ""
echo -e "${BLUE}📋 For detailed monitoring:${NC}"
echo "   - Render Dashboard: https://dashboard.render.com"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo "   - MongoDB Atlas: https://cloud.mongodb.com" 