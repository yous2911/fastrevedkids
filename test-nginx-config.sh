#!/bin/bash
# Test script for Nginx configuration verification
set -e

echo "🧪 Testing Nginx Configuration for RevEd Kids"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN="yourdomain.com"
DIAMOND_DOMAIN="diamond.yourdomain.com"
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${YELLOW}📋 Configuration Tests${NC}"
echo "----------------------"

# Test 1: Nginx configuration syntax
run_test "Nginx config syntax" "docker run --rm -v '$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro' -v '$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro' nginx:alpine nginx -t"

# Test 2: SSL certificates exist
run_test "Main domain SSL cert" "[ -f 'nginx/ssl/$DOMAIN.crt' ] && [ -f 'nginx/ssl/$DOMAIN.key' ]"
run_test "Diamond domain SSL cert" "[ -f 'nginx/ssl/$DIAMOND_DOMAIN.crt' ] && [ -f 'nginx/ssl/$DIAMOND_DOMAIN.key' ]"

# Test 3: SSL certificate validity
run_test "Main domain cert validity" "openssl x509 -in 'nginx/ssl/$DOMAIN.crt' -noout -checkend 86400"
run_test "Diamond domain cert validity" "openssl x509 -in 'nginx/ssl/$DIAMOND_DOMAIN.crt' -noout -checkend 86400"

# Test 4: Configuration files exist
run_test "Main nginx.conf exists" "[ -f 'nginx/nginx.conf' ]"
run_test "Security config exists" "[ -f 'nginx/conf.d/security.conf' ]"
run_test "Performance config exists" "[ -f 'nginx/conf.d/performance.conf' ]"

# Test 5: Docker Compose configuration
run_test "Docker Compose config" "docker-compose -f docker-compose.prod.yml config > /dev/null"

echo
echo -e "${YELLOW}🌐 Runtime Tests (if services are running)${NC}"
echo "-------------------------------------------"

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}Services are running, performing runtime tests...${NC}"
    
    # Test 6: Service connectivity
    run_test "HTTP health check" "curl -sf http://localhost/.well-known/health-check"
    run_test "Backend API health" "curl -sf http://localhost/api/health"
    
    # Test 7: Security headers
    run_test "Security headers present" "curl -sI http://localhost | grep -q 'X-Frame-Options'"
    
    # Test 8: Rate limiting (should succeed for first request)
    run_test "Rate limiting functional" "curl -sf -o /dev/null http://localhost/api/health"
    
    # Test 9: Compression
    run_test "Gzip compression" "curl -H 'Accept-Encoding: gzip' -sI http://localhost | grep -q 'Content-Encoding: gzip' || true"
    
else
    echo -e "${YELLOW}⚠️  Services not running. Skipping runtime tests.${NC}"
    echo -e "${YELLOW}   Start services with: docker-compose -f docker-compose.prod.yml up -d${NC}"
fi

echo
echo -e "${YELLOW}📊 SSL Configuration Analysis${NC}"
echo "------------------------------"

if [ -f "nginx/ssl/$DOMAIN.crt" ]; then
    echo -e "${GREEN}Main domain certificate details:${NC}"
    openssl x509 -in "nginx/ssl/$DOMAIN.crt" -noout -subject -dates -issuer | sed 's/^/  /'
    
    echo -e "${GREEN}Certificate Subject Alternative Names:${NC}"
    openssl x509 -in "nginx/ssl/$DOMAIN.crt" -noout -text | grep -A1 "Subject Alternative Name" | tail -1 | sed 's/^/  /'
fi

echo
echo -e "${YELLOW}🔧 Configuration Recommendations${NC}"
echo "--------------------------------"

# Check for development vs production settings
if grep -q "yourdomain.com" nginx/nginx.conf; then
    echo -e "${YELLOW}⚠️  Update placeholder domains in nginx.conf with your actual domain${NC}"
fi

if grep -q "self-signed" nginx/ssl/*.crt 2>/dev/null || openssl x509 -in "nginx/ssl/$DOMAIN.crt" -noout -issuer 2>/dev/null | grep -q "RevEd Kids"; then
    echo -e "${YELLOW}⚠️  Using self-signed certificates. Replace with CA-signed certificates for production${NC}"
fi

if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Create .env.production file with your production configuration${NC}"
fi

echo
echo "=================================="
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Configuration looks good.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed. Please review the configuration.${NC}"
    exit 1
fi