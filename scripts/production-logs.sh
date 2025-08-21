#!/bin/bash

# Production Log Management Script for RevEd Kids
# 
# Usage:
#   bash scripts/production-logs.sh [service] [options]
#
# Services: nginx, backend, frontend, mysql, redis, all
# Options:
#   --follow, -f     Follow log output
#   --tail=50        Show last N lines (default: 50)
#   --since=1h       Show logs since timestamp
#   --errors         Show only error logs
#   --export         Export logs to file
#   --clean          Clean old log files

set -euo pipefail

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
LOG_DIR="logs/production"
DEFAULT_TAIL=50
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage information
show_usage() {
    cat << EOF
Production Log Management Script for RevEd Kids

Usage: bash scripts/production-logs.sh [service] [options]

Services:
    nginx       Show Nginx reverse proxy logs
    backend     Show Node.js backend application logs
    frontend    Show React frontend build logs
    mysql       Show MySQL database logs
    redis       Show Redis cache logs
    all         Show logs from all services (default)

Options:
    --follow, -f        Follow log output (live tail)
    --tail=N            Show last N lines (default: 50)
    --since=TIME        Show logs since timestamp (1h, 30m, 2d, etc.)
    --errors            Show only error logs (grep for ERROR, WARN, etc.)
    --export            Export logs to timestamped file
    --clean             Clean old log files (older than 7 days)
    --help, -h          Show this help message

Examples:
    bash scripts/production-logs.sh nginx --follow
    bash scripts/production-logs.sh backend --tail=100 --errors
    bash scripts/production-logs.sh all --since=1h --export
    bash scripts/production-logs.sh --clean

EOF
}

# Create log directory if it doesn't exist
ensure_log_dir() {
    if [[ ! -d "$LOG_DIR" ]]; then
        mkdir -p "$LOG_DIR"
        log_info "Created log directory: $LOG_DIR"
    fi
}

# Export logs to file
export_logs() {
    local service="$1"
    local options="$2"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local export_file="$LOG_DIR/${service}_logs_${timestamp}.log"
    
    log_info "Exporting $service logs to: $export_file"
    
    if [[ "$service" == "all" ]]; then
        docker-compose -f "$COMPOSE_FILE" logs $options > "$export_file"
    else
        docker-compose -f "$COMPOSE_FILE" logs $options "$service" > "$export_file"
    fi
    
    log_success "Logs exported to: $export_file"
    echo "File size: $(du -h "$export_file" | cut -f1)"
}

# Clean old log files
clean_logs() {
    log_info "Cleaning log files older than 7 days..."
    
    if [[ -d "$LOG_DIR" ]]; then
        # Find and remove log files older than 7 days
        local old_files=$(find "$LOG_DIR" -name "*.log" -type f -mtime +7 2>/dev/null || true)
        
        if [[ -n "$old_files" ]]; then
            echo "$old_files" | while read -r file; do
                log_info "Removing old log file: $(basename "$file")"
                rm -f "$file"
            done
            log_success "Old log files cleaned"
        else
            log_info "No old log files found"
        fi
        
        # Clean Docker log files if they're getting too large
        log_info "Checking Docker container log sizes..."
        docker system df
        
        # Optionally truncate large container logs
        log_warn "To clean Docker container logs, run: docker system prune --volumes"
    else
        log_info "Log directory doesn't exist: $LOG_DIR"
    fi
}

# Filter error logs
filter_errors() {
    grep -i -E "(error|err|exception|fatal|critical|warn|warning|fail|failed)" --color=always
}

# Show logs for specific service
show_logs() {
    local service="$1"
    local follow="$2"
    local tail="$3"
    local since="$4"
    local errors_only="$5"
    local export_logs_flag="$6"
    
    # Build docker-compose logs options
    local options=""
    
    if [[ "$follow" == "true" ]]; then
        options="$options --follow"
    fi
    
    if [[ -n "$tail" ]]; then
        options="$options --tail=$tail"
    fi
    
    if [[ -n "$since" ]]; then
        options="$options --since=$since"
    fi
    
    # Export logs if requested
    if [[ "$export_logs_flag" == "true" ]]; then
        ensure_log_dir
        export_logs "$service" "$options"
        return
    fi
    
    log_info "Showing logs for: $service"
    log_info "Options: $options"
    echo "Press Ctrl+C to stop following logs"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Show logs
    if [[ "$service" == "all" ]]; then
        if [[ "$errors_only" == "true" ]]; then
            docker-compose -f "$COMPOSE_FILE" logs $options | filter_errors
        else
            docker-compose -f "$COMPOSE_FILE" logs $options
        fi
    else
        if [[ "$errors_only" == "true" ]]; then
            docker-compose -f "$COMPOSE_FILE" logs $options "$service" | filter_errors
        else
            docker-compose -f "$COMPOSE_FILE" logs $options "$service"
        fi
    fi
}

# Validate service name
validate_service() {
    local service="$1"
    local valid_services=("nginx" "backend" "frontend" "mysql" "redis" "all")
    
    for valid in "${valid_services[@]}"; do
        if [[ "$service" == "$valid" ]]; then
            return 0
        fi
    done
    
    log_error "Invalid service: $service"
    log_info "Valid services: ${valid_services[*]}"
    return 1
}

# Main function
main() {
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Check if docker-compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Production docker-compose file not found: $COMPOSE_FILE"
        log_info "Are you running this from the project root?"
        exit 1
    fi
    
    # Default values
    local service="all"
    local follow="false"
    local tail="$DEFAULT_TAIL"
    local since=""
    local errors_only="false"
    local export_logs_flag="false"
    local clean_logs_flag="false"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            nginx|backend|frontend|mysql|redis|all)
                service="$1"
                shift
                ;;
            --follow|-f)
                follow="true"
                shift
                ;;
            --tail=*)
                tail="${1#*=}"
                shift
                ;;
            --since=*)
                since="${1#*=}"
                shift
                ;;
            --errors)
                errors_only="true"
                shift
                ;;
            --export)
                export_logs_flag="true"
                shift
                ;;
            --clean)
                clean_logs_flag="true"
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Handle clean logs
    if [[ "$clean_logs_flag" == "true" ]]; then
        clean_logs
        exit 0
    fi
    
    # Validate service
    if ! validate_service "$service"; then
        exit 1
    fi
    
    # Check if containers are running
    if ! docker-compose -f "$COMPOSE_FILE" ps --services --filter status=running | grep -q .; then
        log_warn "No running containers found. Start services with:"
        log_info "  node scripts/start-production.js"
        exit 1
    fi
    
    # Show logs
    show_logs "$service" "$follow" "$tail" "$since" "$errors_only" "$export_logs_flag"
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Log viewing interrupted${NC}"; exit 0' INT TERM

# Run main function
main "$@"