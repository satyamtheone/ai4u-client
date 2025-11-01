#!/bin/bash
# Test script to verify Docker Compose setup

set -e  # Exit on error

echo "=========================================="
echo "RTO Predictor - Docker Setup Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    docker --version
else
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
echo ""
echo "2. Checking Docker Compose..."
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose is available${NC}"
    docker compose version
else
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    exit 1
fi

# Check .env file
echo ""
echo "3. Checking .env file..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Check required directories
echo ""
echo "4. Checking required directories..."
for dir in models backups logs data; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ Directory '$dir' exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Creating directory '$dir'${NC}"
        mkdir -p "$dir"
    fi
done

# Validate docker-compose.yml
echo ""
echo "5. Validating docker-compose.yml..."
if docker compose config --quiet; then
    echo -e "${GREEN}✅ docker-compose.yml is valid${NC}"
else
    echo -e "${RED}❌ docker-compose.yml has errors${NC}"
    exit 1
fi

# Validate development config
echo ""
echo "6. Validating development configuration..."
if docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet; then
    echo -e "${GREEN}✅ Development config is valid${NC}"
else
    echo -e "${RED}❌ Development config has errors${NC}"
    exit 1
fi

# Check requirements files
echo ""
echo "7. Checking requirements files..."
if [ -f requirements.txt ]; then
    echo -e "${GREEN}✅ requirements.txt found${NC}"
else
    echo -e "${RED}❌ requirements.txt not found${NC}"
    exit 1
fi

if [ -f requirements-database.txt ]; then
    echo -e "${GREEN}✅ requirements-database.txt found${NC}"
else
    echo -e "${RED}❌ requirements-database.txt not found${NC}"
    exit 1
fi

# Check Dockerfile
echo ""
echo "8. Checking Dockerfile..."
if [ -f Dockerfile ]; then
    echo -e "${GREEN}✅ Dockerfile found${NC}"
else
    echo -e "${RED}❌ Dockerfile not found${NC}"
    exit 1
fi

# List configured services
echo ""
echo "9. Configured services:"
docker compose config --services | while read service; do
    echo -e "  ${GREEN}→${NC} $service"
done

# Test build (dry run)
echo ""
echo "10. Testing Docker build (this may take a few minutes)..."
echo -e "${YELLOW}ℹ️  Building Docker image...${NC}"
if docker compose build --quiet backend 2>&1 | grep -q "error\|Error"; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Docker build successful${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review .env file and update if needed"
echo "  2. Start services: docker compose up -d"
echo "  3. Check logs: docker compose logs -f"
echo "  4. Access API: http://localhost:8002"
echo "  5. API Docs: http://localhost:8002/docs"
echo ""
echo "Quick commands:"
echo "  Development: docker compose -f docker-compose.yml -f docker-compose.dev.yml up"
echo "  Production:  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo "  Stop:        docker compose down"
echo "  Logs:        docker compose logs -f backend"
echo ""
