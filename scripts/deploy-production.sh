#!/bin/bash
# Production Deployment Script for RevEd Kids
# One-command deployment with comprehensive checks and rollback capability

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Deployment state tracking
DEPLOYMENT_STARTED=false
SERVICES_STOPPED=false
BACKUP_CREATED=false
ROLLBACK_AVAILABLE=false

# Cleanup function for graceful exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ "$DEPLOYMENT_STARTED" = true ]; then
        echo -e "\n${RED}💥 DEPLOYMENT FAILED! Initiating cleanup...${NC}"
        
        if [ "$BACKUP_CREATED" = true ] && [ "$ROLLBACK_AVAILABLE" = true ]; then
            echo -e "${YELLOW}🔄 Rolling back to previous version...${NC}"
            rollback_deployment
        fi
        
        echo -e "${RED}❌ Deployment failed with exit code $exit_code${NC}"
        echo -e "${YELLOW}📋 Check the log file: $LOG_FILE${NC}"
    fi
}

trap cleanup EXIT

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Print functions
print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║          🚀 RevEd Kids Production Deployment v2.0           ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

print_step() {
    local step_num=$1
    local step_name=$2
    echo -e "${BLUE}┌─ Step $step_num: $step_name${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS" "$1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING" "$1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR" "$1"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
    log "INFO" "$1"
}

# Check system requirements
check_requirements() {
    print_step 1 "System Requirements Check"
    
    local requirements_met=true
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        requirements_met=false
    else
        local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        print_success "Docker $docker_version detected"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        requirements_met=false
    else
        local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        print_success "Docker Compose $compose_version detected"
    fi
    
    # Check Node.js (for scripts)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found - some monitoring scripts may not work"
    else
        local node_version=$(node --version)
        print_success "Node.js $node_version detected"
    fi
    
    # Check disk space (minimum 2GB)
    local available_space=$(df . | awk 'NR==2 {print $4}')
    local available_gb=$((available_space / 1024 / 1024))
    if [ $available_gb -lt 2 ]; then
        print_error "Insufficient disk space: ${available_gb}GB available, minimum 2GB required"
        requirements_met=false
    else
        print_success "Sufficient disk space: ${available_gb}GB available"
    fi
    
    if [ "$requirements_met" = false ]; then
        print_error "System requirements not met. Aborting deployment."
        exit 1
    fi
    
    echo
}

# Validate configuration files
validate_configuration() {
    print_step 2 "Configuration Validation"
    
    cd "$PROJECT_ROOT"
    
    # Check required files
    local required_files=(
        "$COMPOSE_FILE"
        "$ENV_FILE"
        "nginx/nginx.conf"
        "backend/Dockerfile"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file missing: $file"
            exit 1
        else
            print_success "Found: $file"
        fi
    done
    
    # Validate Docker Compose configuration
    if docker-compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
        print_success "Docker Compose configuration is valid"
    else
        print_error "Docker Compose configuration is invalid"
        exit 1
    fi
    
    # Validate Nginx configuration
    if docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro" nginx:alpine nginx -t > /dev/null 2>&1; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
    
    # Check SSL certificates
    if [ -f "nginx/ssl/yourdomain.com.crt" ] && [ -f "nginx/ssl/yourdomain.com.key" ]; then
        # Check certificate validity (not expired)
        if openssl x509 -in "nginx/ssl/yourdomain.com.crt" -noout -checkend 86400 > /dev/null 2>&1; then
            print_success "SSL certificates are valid"
        else
            print_warning "SSL certificates expire within 24 hours"
        fi
    else
        print_warning "SSL certificates not found - will generate self-signed certificates"
        
        # Generate self-signed certificates
        mkdir -p nginx/ssl
        cd nginx/ssl
        if [ -f "generate-self-signed.sh" ]; then
            chmod +x generate-self-signed.sh
            ./generate-self-signed.sh > /dev/null 2>&1
            print_success "Self-signed certificates generated"
        fi
        cd "$PROJECT_ROOT"
    fi
    
    echo
}

# Run pre-deployment checks
pre_deployment_checks() {
    print_step 3 "Pre-deployment Checks"
    
    # Run production checklist if available
    if [ -f "scripts/production-checklist.js" ] && command -v node &> /dev/null; then
        print_info "Running automated production checklist..."
        if node scripts/production-checklist.js --silent; then
            print_success "Production checklist passed"
        else
            print_warning "Some production checklist items failed - review manually"
        fi
    fi
    
    # Check if services are already running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        print_info "Existing services detected - will be updated"
        ROLLBACK_AVAILABLE=true
    else
        print_info "No existing services detected - fresh deployment"
    fi
    
    # Check network connectivity
    print_info "Checking network connectivity..."
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        print_success "Network connectivity confirmed"
    else
        print_warning "Network connectivity issues detected"
    fi
    
    echo
}

# Create backup of current deployment
create_backup() {
    print_step 4 "Creating Backup"
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Backup environment files
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_DIR/"
        print_success "Environment configuration backed up"
    fi
    
    # Backup database if running
    if docker-compose -f "$COMPOSE_FILE" ps mysql-prod | grep -q "Up"; then
        print_info "Creating database backup..."
        local db_backup_file="$BACKUP_DIR/database_backup.sql"
        
        if docker-compose -f "$COMPOSE_FILE" exec -T mysql-prod mysqldump -u root -p\${MYSQL_ROOT_PASSWORD} --all-databases > "$db_backup_file" 2>/dev/null; then
            print_success "Database backup created"
        else
            print_warning "Database backup failed - continuing without database backup"
        fi
    fi
    
    # Backup Docker volumes
    print_info "Creating volume backup..."
    docker-compose -f "$COMPOSE_FILE" ps -q | xargs -I {} docker inspect {} --format='{{.Name}} {{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}' > "$BACKUP_DIR/volume_info.txt" 2>/dev/null || true
    
    BACKUP_CREATED=true
    print_success "Backup created at: $BACKUP_DIR"
    echo
}

# Deploy services
deploy_services() {
    print_step 5 "Service Deployment"
    
    DEPLOYMENT_STARTED=true
    
    # Pull latest images
    print_info "Pulling latest Docker images..."
    if docker-compose -f "$COMPOSE_FILE" pull --quiet; then
        print_success "Docker images updated"
    else
        print_warning "Some images failed to update - using cached versions"
    fi
    
    # Stop existing services gracefully
    print_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down --timeout 30
    SERVICES_STOPPED=true
    print_success "Services stopped"
    
    # Start services with build
    print_info "Starting services (this may take several minutes)..."
    if docker-compose -f "$COMPOSE_FILE" up -d --build --remove-orphans; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
    
    echo
}

# Wait for services to be ready
wait_for_services() {
    print_step 6 "Service Health Verification"
    
    local max_attempts=60
    local attempt=1
    local services=("nginx-proxy" "backend-prod" "mysql-prod" "redis-prod")
    
    # Wait for containers to be running
    print_info "Waiting for containers to start..."
    while [ $attempt -le $max_attempts ]; do
        local all_running=true
        
        for service in "${services[@]}"; do
            if ! docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
                all_running=false
                break
            fi
        done
        
        if [ "$all_running" = true ]; then
            print_success "All containers are running"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Containers failed to start within timeout"
            exit 1
        fi
        
        echo -ne "\r${YELLOW}⏳ Waiting for containers... ($attempt/$max_attempts)${NC}"
        sleep 2
        ((attempt++))
    done
    echo
    
    # Wait for application readiness
    print_info "Waiting for application health checks..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        local health_checks_passed=0
        local total_checks=3
        
        # Check Nginx
        if curl -sf "http://localhost/.well-known/health-check" > /dev/null 2>&1; then
            ((health_checks_passed++))
        fi
        
        # Check Backend API
        if curl -sf "http://localhost/api/health" > /dev/null 2>&1; then
            ((health_checks_passed++))
        fi
        
        # Check Backend readiness
        if curl -sf "http://localhost/api/ready" > /dev/null 2>&1; then
            ((health_checks_passed++))
        fi
        
        if [ $health_checks_passed -eq $total_checks ]; then
            print_success "All health checks passed ($health_checks_passed/$total_checks)"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_warning "Some health checks failed ($health_checks_passed/$total_checks passed)"
            print_warning "Application may still be initializing - check manually"
            break
        fi
        
        echo -ne "\r${YELLOW}⏳ Health checks... ($health_checks_passed/$total_checks passed, attempt $attempt/$max_attempts)${NC}"
        sleep 3
        ((attempt++))
    done
    echo
}

# Run post-deployment tests
post_deployment_tests() {
    print_step 7 "Post-deployment Testing"
    
    local tests_passed=0
    local total_tests=8
    
    # Test 1: HTTP to HTTPS redirect
    print_info "Testing HTTP to HTTPS redirect..."
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost" | grep -q "301\|302"; then
        print_success "HTTPS redirect working"
        ((tests_passed++))
    else
        print_warning "HTTPS redirect not working as expected"
    fi
    
    # Test 2: Security headers
    print_info "Testing security headers..."
    local headers_count=$(curl -sI "http://localhost" | grep -c -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)")
    if [ "$headers_count" -ge 2 ]; then
        print_success "Security headers present ($headers_count found)"
        ((tests_passed++))
    else
        print_warning "Some security headers missing ($headers_count found)"
    fi
    
    # Test 3: API connectivity
    print_info "Testing API endpoints..."
    if curl -sf "http://localhost/api/health" > /dev/null; then
        print_success "API health endpoint responding"
        ((tests_passed++))
    else
        print_warning "API health endpoint not responding"
    fi
    
    # Test 4: Database connectivity
    print_info "Testing database connectivity..."
    if docker-compose -f "$COMPOSE_FILE" exec -T mysql-prod mysqladmin ping -h localhost --silent 2>/dev/null; then
        print_success "Database connectivity confirmed"
        ((tests_passed++))
    else
        print_warning "Database connectivity issues"
    fi
    
    # Test 5: Redis connectivity
    print_info "Testing Redis connectivity..."
    if docker-compose -f "$COMPOSE_FILE" exec -T redis-prod redis-cli ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis connectivity confirmed"
        ((tests_passed++))
    else
        print_warning "Redis connectivity issues"
    fi
    
    # Test 6: Rate limiting
    print_info "Testing rate limiting..."
    local rate_limit_headers=$(curl -sI "http://localhost/api/health" | grep -c -E "(X-RateLimit|X-Rate-Limit)")
    if [ "$rate_limit_headers" -ge 1 ]; then
        print_success "Rate limiting headers present"
        ((tests_passed++))
    else
        print_warning "Rate limiting headers not found"
    fi
    
    # Test 7: Compression
    print_info "Testing gzip compression..."
    if curl -H "Accept-Encoding: gzip" -sI "http://localhost" | grep -q "Content-Encoding: gzip"; then
        print_success "Gzip compression working"
        ((tests_passed++))
    else
        print_warning "Gzip compression not detected"
    fi
    
    # Test 8: Container resource usage
    print_info "Checking container resource usage..."
    local high_memory_containers=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemPerc}}" | tail -n +2 | awk -F'%' '$2 > 80' | wc -l)
    if [ "$high_memory_containers" -eq 0 ]; then
        print_success "Container memory usage normal"
        ((tests_passed++))
    else
        print_warning "$high_memory_containers containers using >80% memory"
    fi
    
    # Summary
    if [ $tests_passed -eq $total_tests ]; then
        print_success "All post-deployment tests passed ($tests_passed/$total_tests)"
    elif [ $tests_passed -ge $((total_tests * 3 / 4)) ]; then
        print_warning "Most tests passed ($tests_passed/$total_tests) - minor issues detected"
    else
        print_warning "Several tests failed ($tests_passed/$total_tests) - manual review recommended"
    fi
    
    echo
}

# Rollback function
rollback_deployment() {
    print_error "🔄 INITIATING ROLLBACK"
    
    if [ -d "$BACKUP_DIR" ] && [ "$BACKUP_CREATED" = true ]; then
        print_info "Restoring from backup: $BACKUP_DIR"
        
        # Stop current services
        docker-compose -f "$COMPOSE_FILE" down --timeout 10
        
        # Restore environment file
        if [ -f "$BACKUP_DIR/$ENV_FILE" ]; then
            cp "$BACKUP_DIR/$ENV_FILE" "./"
            print_success "Environment configuration restored"
        fi
        
        # Start services with previous configuration
        if docker-compose -f "$COMPOSE_FILE" up -d; then
            print_success "Services restored from backup"
        else
            print_error "Failed to restore services - manual intervention required"
        fi
    else
        print_error "No backup available for rollback - manual recovery required"
    fi
}

# Display deployment summary
display_summary() {
    local deployment_status="SUCCESS"
    local status_color=$GREEN
    
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    DEPLOYMENT SUMMARY                       ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Status: ${status_color}${deployment_status}${NC}                                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Timestamp: $(date '+%Y-%m-%d %H:%M:%S')                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Backup Location: $BACKUP_DIR    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Log File: $LOG_FILE         ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Display service status
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    echo
    
    # Display access URLs
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo "  • Main App: http://localhost"
    echo "  • Diamond App: http://localhost:3001"
    echo "  • API Health: http://localhost/api/health"
    echo "  • API Ready: http://localhost/api/ready"
    echo
    
    # Display next steps
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "  1. Update DNS records to point to this server"
    echo "  2. Replace self-signed certificates with proper SSL"
    echo "  3. Monitor application with: ./scripts/monitor-production.sh"
    echo "  4. Set up log rotation and backup schedules"
    echo
    
    # Display monitoring commands
    echo -e "${BLUE}🔍 Monitoring Commands:${NC}"
    echo "  • View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  • Monitor resources: docker stats"
    echo "  • Health check: curl http://localhost/api/health"
    echo "  • Service status: docker-compose -f $COMPOSE_FILE ps"
    echo
}

# Main execution
main() {
    print_header
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Start deployment process
    log "INFO" "Starting production deployment"
    
    check_requirements
    validate_configuration
    pre_deployment_checks
    create_backup
    deploy_services
    wait_for_services
    post_deployment_tests
    
    # If we reach here, deployment was successful
    print_success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    display_summary
    
    log "INFO" "Production deployment completed successfully"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --no-backup    Skip backup creation (not recommended)"
        echo "  --quick        Skip some time-consuming checks"
        echo
        echo "Environment Variables:"
        echo "  COMPOSE_FILE   Docker Compose file to use (default: docker-compose.prod.yml)"
        echo "  ENV_FILE       Environment file to use (default: .env.production)"
        echo
        exit 0
        ;;
    --no-backup)
        print_warning "Skipping backup creation as requested"
        create_backup() { echo "Backup creation skipped"; }
        ;;
    --quick)
        print_warning "Quick deployment mode - skipping extended checks"
        post_deployment_tests() { echo "Extended tests skipped in quick mode"; }
        ;;
esac

# Change to project root
cd "$PROJECT_ROOT"

# Run main function
main "$@"