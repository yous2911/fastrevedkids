#!/bin/bash
# Production Monitoring Script for RevEd Kids
# Comprehensive monitoring with alerts and automated responses

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="./logs/monitor_$(date +%Y%m%d).log"
ALERT_LOG="./logs/alerts_$(date +%Y%m%d).log"
METRICS_FILE="./logs/metrics_$(date +%Y%m%d_%H%M).json"

# Monitoring configuration
HEALTH_CHECK_INTERVAL=30  # seconds
ALERT_COOLDOWN=300       # 5 minutes between same alerts
MAX_CONSECUTIVE_FAILURES=3
MEMORY_THRESHOLD=80      # percentage
CPU_THRESHOLD=80         # percentage
DISK_THRESHOLD=90        # percentage
RESPONSE_TIME_THRESHOLD=5000  # milliseconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Global state tracking
CONSECUTIVE_FAILURES=0
LAST_ALERT_TIME=0
MONITORING_START_TIME=$(date +%s)

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")" "$(dirname "$ALERT_LOG")" "$(dirname "$METRICS_FILE")"

# Logging functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_alert() {
    local severity=$1
    local service=$2
    local message="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$severity] [$service] $message" | tee -a "$ALERT_LOG"
    
    # Send to monitoring system (webhook, email, etc.)
    send_alert "$severity" "$service" "$message"
}

# Print functions with color and logging
print_header() {
    local message="$1"
    echo -e "${CYAN}╔${'═'.repeat(${#message} + 2)}╗${NC}"
    echo -e "${CYAN}║ $message ║${NC}"
    echo -e "${CYAN}╚${'═'.repeat(${#message} + 2)}╝${NC}"
    log "INFO" "$message"
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
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO" "$1"
}

print_metric() {
    echo -e "${PURPLE}📊 $1${NC}"
    log "METRIC" "$1"
}

# Alert system
send_alert() {
    local severity=$1
    local service=$2
    local message="$3"
    
    # Check cooldown period
    local current_time=$(date +%s)
    if [ $((current_time - LAST_ALERT_TIME)) -lt $ALERT_COOLDOWN ]; then
        return 0
    fi
    
    LAST_ALERT_TIME=$current_time
    
    # Send to Slack webhook if configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color=""
        case $severity in
            "CRITICAL") color="#ff0000" ;;
            "WARNING") color="#ffaa00" ;;
            "INFO") color="#00ff00" ;;
        esac
        
        local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "RevEd Kids Production Alert",
        "fields": [
            {"title": "Severity", "value": "$severity", "short": true},
            {"title": "Service", "value": "$service", "short": true},
            {"title": "Message", "value": "$message", "short": false},
            {"title": "Timestamp", "value": "$(date)", "short": true}
        ]
    }]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
    fi
    
    # Send email if configured
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "Alert: $severity - $service - $message" | \
        mail -s "RevEd Kids Production Alert: $severity" "$ALERT_EMAIL" || true
    fi
}

# Check if services are running
check_services_running() {
    local services=("nginx-proxy" "backend-prod" "mysql-prod" "redis-prod" "frontend-main-prod")
    local all_running=true
    local service_status=()
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up"; then
            service_status+=("$service:UP")
        else
            service_status+=("$service:DOWN")
            all_running=false
            log_alert "CRITICAL" "$service" "Service is not running"
        fi
    done
    
    if [ "$all_running" = true ]; then
        print_success "All services running"
        CONSECUTIVE_FAILURES=0
    else
        print_error "Some services are down: ${service_status[*]}"
        ((CONSECUTIVE_FAILURES++))
        
        if [ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]; then
            log_alert "CRITICAL" "SYSTEM" "Multiple consecutive service failures detected"
            
            # Auto-restart attempt
            if [ "$AUTO_RESTART" = "true" ]; then
                print_warning "Attempting automatic service restart..."
                docker-compose -f "$COMPOSE_FILE" restart
                sleep 30
            fi
        fi
    fi
    
    return $([ "$all_running" = true ] && echo 0 || echo 1)
}

# Check health endpoints
check_health_endpoints() {
    local endpoints=(
        "http://localhost/.well-known/health-check:Nginx Health"
        "http://localhost/api/health:API Health"
        "http://localhost/api/ready:API Readiness"
    )
    
    local healthy_endpoints=0
    local total_endpoints=${#endpoints[@]}
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r url name <<< "$endpoint_info"
        
        local start_time=$(date +%s%3N)
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        if [ "$response_code" = "200" ]; then
            ((healthy_endpoints++))
            if [ $response_time -gt $RESPONSE_TIME_THRESHOLD ]; then
                print_warning "$name: OK but slow (${response_time}ms)"
                log_alert "WARNING" "$name" "Slow response time: ${response_time}ms"
            else
                print_success "$name: OK (${response_time}ms)"
            fi
        else
            print_error "$name: Failed (HTTP $response_code)"
            log_alert "CRITICAL" "$name" "Health check failed with HTTP $response_code"
        fi
    done
    
    local health_percentage=$((healthy_endpoints * 100 / total_endpoints))
    print_metric "Health Endpoints: $healthy_endpoints/$total_endpoints ($health_percentage%)"
    
    return $([ $healthy_endpoints -eq $total_endpoints ] && echo 0 || echo 1)
}

# Check system resources
check_system_resources() {
    local issues_found=false
    
    # Check memory usage
    local memory_info=$(free | grep '^Mem:')
    local total_mem=$(echo $memory_info | awk '{print $2}')
    local used_mem=$(echo $memory_info | awk '{print $3}')
    local memory_percent=$((used_mem * 100 / total_mem))
    
    if [ $memory_percent -gt $MEMORY_THRESHOLD ]; then
        print_error "High memory usage: ${memory_percent}%"
        log_alert "WARNING" "SYSTEM" "High memory usage: ${memory_percent}%"
        issues_found=true
    else
        print_success "Memory usage: ${memory_percent}%"
    fi
    
    # Check disk usage
    local disk_usage=$(df . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -gt $DISK_THRESHOLD ]; then
        print_error "High disk usage: ${disk_usage}%"
        log_alert "CRITICAL" "SYSTEM" "High disk usage: ${disk_usage}%"
        issues_found=true
    else
        print_success "Disk usage: ${disk_usage}%"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_percent=$(echo "$load_avg * 100 / $cpu_cores" | bc -l | cut -d. -f1)
    
    if [ $load_percent -gt $CPU_THRESHOLD ]; then
        print_error "High CPU load: ${load_percent}% (${load_avg} load avg)"
        log_alert "WARNING" "SYSTEM" "High CPU load: ${load_percent}%"
        issues_found=true
    else
        print_success "CPU load: ${load_percent}% (${load_avg} load avg)"
    fi
    
    return $([ "$issues_found" = false ] && echo 0 || echo 1)
}

# Check container resources
check_container_resources() {
    local containers_with_issues=0
    
    print_info "Container Resource Usage:"
    
    # Get container stats
    local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}")
    
    # Parse and check each container
    echo "$stats" | tail -n +2 | while read -r container cpu_percent mem_usage mem_percent rest; do
        local cpu_num=$(echo "$cpu_percent" | sed 's/%//')
        local mem_num=$(echo "$mem_percent" | sed 's/%//')
        
        # Convert to integer for comparison
        cpu_num=${cpu_num%.*}
        mem_num=${mem_num%.*}
        
        local status="OK"
        local color=$GREEN
        
        if [ "$cpu_num" -gt 80 ] || [ "$mem_num" -gt 80 ]; then
            status="HIGH"
            color=$RED
            ((containers_with_issues++))
            log_alert "WARNING" "$container" "High resource usage: CPU ${cpu_percent}, Memory ${mem_percent}"
        elif [ "$cpu_num" -gt 60 ] || [ "$mem_num" -gt 60 ]; then
            status="MODERATE"
            color=$YELLOW
        fi
        
        echo -e "  ${color}$container: CPU ${cpu_percent}, Memory ${mem_percent} [$status]${NC}"
    done
    
    return $([ $containers_with_issues -eq 0 ] && echo 0 || echo 1)
}

# Check database performance
check_database_performance() {
    local db_healthy=true
    
    # Check MySQL connection and performance
    if docker-compose -f "$COMPOSE_FILE" ps mysql-prod | grep -q "Up"; then
        # Test connection time
        local start_time=$(date +%s%3N)
        if docker-compose -f "$COMPOSE_FILE" exec -T mysql-prod mysqladmin ping -h localhost --silent 2>/dev/null; then
            local end_time=$(date +%s%3N)
            local connection_time=$((end_time - start_time))
            
            if [ $connection_time -gt 3000 ]; then
                print_warning "Database connection slow: ${connection_time}ms"
                log_alert "WARNING" "MYSQL" "Slow connection time: ${connection_time}ms"
            else
                print_success "Database connection: ${connection_time}ms"
            fi
        else
            print_error "Database connection failed"
            log_alert "CRITICAL" "MYSQL" "Database connection failed"
            db_healthy=false
        fi
        
        # Check slow queries and connections
        local slow_queries=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql-prod mysql -u root -p\${MYSQL_ROOT_PASSWORD} -e "SHOW GLOBAL STATUS LIKE 'Slow_queries';" 2>/dev/null | tail -1 | awk '{print $2}' || echo "0")
        local connections=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql-prod mysql -u root -p\${MYSQL_ROOT_PASSWORD} -e "SHOW GLOBAL STATUS LIKE 'Threads_connected';" 2>/dev/null | tail -1 | awk '{print $2}' || echo "0")
        
        print_metric "Database: $connections connections, $slow_queries slow queries"
        
    else
        print_error "MySQL container not running"
        log_alert "CRITICAL" "MYSQL" "MySQL container not running"
        db_healthy=false
    fi
    
    return $([ "$db_healthy" = true ] && echo 0 || echo 1)
}

# Check Redis performance
check_redis_performance() {
    if [ "$REDIS_ENABLED" = "true" ] || docker-compose -f "$COMPOSE_FILE" ps redis-prod | grep -q "Up"; then
        local start_time=$(date +%s%3N)
        if docker-compose -f "$COMPOSE_FILE" exec -T redis-prod redis-cli ping 2>/dev/null | grep -q "PONG"; then
            local end_time=$(date +%s%3N)
            local redis_time=$((end_time - start_time))
            
            # Get Redis info
            local redis_info=$(docker-compose -f "$COMPOSE_FILE" exec -T redis-prod redis-cli info memory 2>/dev/null | grep used_memory_human || echo "used_memory_human:N/A")
            local memory_usage=$(echo "$redis_info" | cut -d: -f2 | tr -d '\r')
            
            if [ $redis_time -gt 1000 ]; then
                print_warning "Redis response slow: ${redis_time}ms"
                log_alert "WARNING" "REDIS" "Slow response time: ${redis_time}ms"
            else
                print_success "Redis: ${redis_time}ms, Memory: $memory_usage"
            fi
        else
            print_error "Redis connection failed"
            log_alert "CRITICAL" "REDIS" "Redis connection failed"
            return 1
        fi
    else
        print_info "Redis not enabled or not running"
    fi
    
    return 0
}

# Generate metrics report
generate_metrics() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local uptime_seconds=$(($(date +%s) - MONITORING_START_TIME))
    
    # Collect metrics
    local metrics=$(cat <<EOF
{
    "timestamp": "$timestamp",
    "monitoring_uptime": $uptime_seconds,
    "services": {
        "nginx": $(check_service_health "nginx-proxy"),
        "backend": $(check_service_health "backend-prod"),
        "mysql": $(check_service_health "mysql-prod"),
        "redis": $(check_service_health "redis-prod")
    },
    "system": {
        "memory_percent": $(free | grep '^Mem:' | awk '{printf "%.1f", $3*100/$2}'),
        "disk_percent": $(df . | awk 'NR==2 {print $5}' | sed 's/%//'),
        "load_average": "$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')",
        "cpu_cores": $(nproc)
    },
    "endpoints": {
        "health_check": $(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost/api/health" 2>/dev/null || echo "0"),
        "readiness_check": $(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost/api/ready" 2>/dev/null || echo "0")
    }
}
EOF
    )
    
    echo "$metrics" > "$METRICS_FILE"
    print_metric "Metrics saved to: $METRICS_FILE"
}

# Helper function to check individual service health
check_service_health() {
    local service=$1
    if docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up"; then
        echo "1"
    else
        echo "0"
    fi
}

# Display monitoring dashboard
display_dashboard() {
    clear
    print_header "RevEd Kids Production Monitoring Dashboard"
    echo -e "${CYAN}Last Updated: $(date)${NC}"
    echo -e "${CYAN}Monitoring Duration: $(($(date +%s) - MONITORING_START_TIME)) seconds${NC}"
    echo -e "${CYAN}Log Files: $LOG_FILE${NC}"
    echo
    
    print_info "🔍 Running comprehensive health checks..."
    echo
    
    # Run all checks
    check_services_running
    echo
    
    check_health_endpoints
    echo
    
    check_system_resources
    echo
    
    check_container_resources
    echo
    
    check_database_performance
    echo
    
    check_redis_performance
    echo
    
    # Generate metrics
    generate_metrics
    echo
    
    print_info "Next check in $HEALTH_CHECK_INTERVAL seconds..."
    print_info "Press Ctrl+C to stop monitoring"
    echo
}

# Cleanup function
cleanup() {
    print_info "Monitoring stopped"
    log "INFO" "Monitoring session ended"
    exit 0
}

# Handle command line arguments
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --help, -h           Show this help message"
    echo "  --interval N         Set check interval in seconds (default: 30)"
    echo "  --continuous         Run continuously (default)"
    echo "  --once              Run checks once and exit"
    echo "  --dashboard         Show live dashboard"
    echo "  --metrics-only      Only generate metrics"
    echo "  --auto-restart      Enable automatic service restart on failures"
    echo
    echo "Environment Variables:"
    echo "  SLACK_WEBHOOK       Slack webhook URL for alerts"
    echo "  ALERT_EMAIL         Email address for alerts"
    echo "  AUTO_RESTART        Enable auto-restart (true/false)"
    echo
    exit 0
}

# Parse command line arguments
CONTINUOUS=true
DASHBOARD=false
METRICS_ONLY=false
AUTO_RESTART=${AUTO_RESTART:-false}

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            ;;
        --interval)
            HEALTH_CHECK_INTERVAL="$2"
            shift 2
            ;;
        --once)
            CONTINUOUS=false
            shift
            ;;
        --dashboard)
            DASHBOARD=true
            shift
            ;;
        --metrics-only)
            METRICS_ONLY=true
            shift
            ;;
        --auto-restart)
            AUTO_RESTART=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done

# Main execution
main() {
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    print_header "Starting Production Monitoring"
    log "INFO" "Monitoring session started with interval: ${HEALTH_CHECK_INTERVAL}s"
    
    if [ "$METRICS_ONLY" = true ]; then
        generate_metrics
        exit 0
    fi
    
    if [ "$CONTINUOUS" = false ]; then
        # Run once
        display_dashboard
        exit 0
    fi
    
    # Continuous monitoring
    while true; do
        if [ "$DASHBOARD" = true ]; then
            display_dashboard
        else
            print_info "Running health checks..."
            check_services_running
            check_health_endpoints
            check_system_resources
            
            # Generate metrics every 5 minutes
            if [ $(($(date +%s) % 300)) -eq 0 ]; then
                generate_metrics
            fi
        fi
        
        sleep "$HEALTH_CHECK_INTERVAL"
    done
}

# Run main function
main "$@"