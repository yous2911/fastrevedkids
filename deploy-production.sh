#!/bin/bash
# Production deployment script for RevEd Kids
set -e

echo "🚀 Starting RevEd Kids Production Deployment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found!${NC}"
    echo -e "${YELLOW}Please create .env.production with your production configuration${NC}"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/yourdomain.com.crt" ] || [ ! -f "nginx/ssl/yourdomain.com.key" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found. Generating self-signed certificates for testing...${NC}"
    cd nginx/ssl
    chmod +x generate-self-signed.sh
    ./generate-self-signed.sh
    cd ../..
fi

# Test nginx configuration
echo -e "${GREEN}📋 Testing Nginx configuration...${NC}"
docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro" nginx:alpine nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx configuration is valid${NC}"

# Stop existing containers
echo -e "${GREEN}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Build and start services
echo -e "${GREEN}🏗️  Building and starting production services...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo -e "${GREEN}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check service health
echo -e "${GREEN}🏥 Checking service health...${NC}"

# Check Nginx
if curl -sf http://localhost/.well-known/health-check > /dev/null; then
    echo -e "${GREEN}✅ Nginx proxy is healthy${NC}"
else
    echo -e "${RED}❌ Nginx proxy health check failed${NC}"
fi

# Check backend API
if curl -sf http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API health check failed - may still be starting${NC}"
fi

# Show container status
echo -e "${GREEN}📊 Container status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your DNS records to point to this server"
echo "2. Replace self-signed certificates with proper SSL certificates"
echo "3. Update domain names in nginx/nginx.conf"
echo "4. Test the application at: https://yourdomain.com"
echo
echo -e "${YELLOW}📊 Monitor logs with:${NC}"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo
echo -e "${YELLOW}🔧 Manage SSL certificates:${NC}"
echo "  - Self-signed: ./nginx/ssl/generate-self-signed.sh"
echo "  - Let's Encrypt: certbot --nginx -d yourdomain.com"
echo
echo -e "${GREEN}✨ Happy coding!${NC}"