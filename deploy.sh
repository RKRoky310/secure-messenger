#!/bin/bash

set -e

echo "🚀 Starting Secure Messenger deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${YELLOW}Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo "${RED}Docker is required but not installed.${NC}" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "${RED}Docker Compose is required but not installed.${NC}" >&2; exit 1; }

echo "${GREEN}✓ Docker installed${NC}"
echo "${GREEN}✓ Docker Compose installed${NC}"

# Load environment
if [ ! -f .env ]; then
    echo "${RED}Error: .env file not found${NC}"
    exit 1
fi

echo "${YELLOW}Building Docker image...${NC}"
docker-compose build

echo "${YELLOW}Starting services...${NC}"
docker-compose up -d

echo "${YELLOW}Running migrations...${NC}"
sleep 5
docker-compose exec -T backend npm run migrate

echo "${YELLOW}Checking health...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        echo "${GREEN}✓ Application is healthy${NC}"
        break
    fi
    echo "Waiting for application to be ready... ($i/30)"
    sleep 1
done

echo "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Services are running at:"
echo "  API: http://localhost:3000"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3001"
echo ""
echo "View logs with: docker-compose logs -f"
