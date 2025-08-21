#!/bin/bash
# Database Backup Script for RevEd Kids Production
# Comprehensive backup solution with rotation, compression, and cloud storage

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_BASE_DIR="./backups"
BACKUP_LOG="./logs/backup_$(date +%Y%m%d).log"

# Backup configuration with defaults
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
COMPRESS_BACKUPS=${COMPRESS_BACKUPS:-true}
ENCRYPT_BACKUPS=${ENCRYPT_BACKUPS:-false}
UPLOAD_TO_S3=${UPLOAD_TO_S3:-false}
VERIFY_BACKUP=${VERIFY_BACKUP:-true}
BACKUP_MYSQL=${BACKUP_MYSQL:-true}
BACKUP_REDIS=${BACKUP_REDIS:-true}
BACKUP_UPLOADS=${BACKUP_UPLOADS:-true}

# S3 Configuration (if enabled)
S3_BUCKET=${S3_BUCKET:-""}
S3_PREFIX=${S3_PREFIX:-"backups/reved-kids"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Encryption configuration
ENCRYPTION_PASSWORD=${ENCRYPTION_PASSWORD:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$BACKUP_LOG"
}

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║            🗄️  RevEd Kids Database Backup v2.0              ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
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

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
    log "STEP" "$1"
}

# Create backup directory structure
setup_backup_environment() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="$BACKUP_BASE_DIR/$timestamp"
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$BACKUP_LOG")"
    
    print_info "Backup directory: $BACKUP_DIR"
    print_info "Log file: $BACKUP_LOG"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites"
    
    local prerequisites_met=true
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
        print_error "Docker or Docker Compose not found"
        prerequisites_met=false
    fi
    
    # Check if services are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        print_warning "Some services may not be running"
    fi
    
    # Check disk space (minimum 1GB free)
    local available_space=$(df "$BACKUP_BASE_DIR" 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
    local available_gb=$((available_space / 1024 / 1024))
    if [ $available_gb -lt 1 ]; then
        print_error "Insufficient disk space: ${available_gb}GB available, minimum 1GB required"
        prerequisites_met=false
    fi
    
    # Check compression tools
    if [ "$COMPRESS_BACKUPS" = true ]; then
        if ! command -v gzip &> /dev/null; then
            print_warning "gzip not found - backups will not be compressed"
            COMPRESS_BACKUPS=false
        fi
    fi
    
    # Check encryption tools
    if [ "$ENCRYPT_BACKUPS" = true ]; then
        if ! command -v openssl &> /dev/null; then
            print_warning "openssl not found - backups will not be encrypted"
            ENCRYPT_BACKUPS=false
        elif [ -z "$ENCRYPTION_PASSWORD" ]; then
            print_warning "No encryption password set - backups will not be encrypted"
            ENCRYPT_BACKUPS=false
        fi
    fi
    
    # Check AWS CLI for S3 upload
    if [ "$UPLOAD_TO_S3" = true ]; then
        if ! command -v aws &> /dev/null; then
            print_warning "AWS CLI not found - S3 upload disabled"
            UPLOAD_TO_S3=false
        elif [ -z "$S3_BUCKET" ]; then
            print_warning "S3 bucket not configured - S3 upload disabled"
            UPLOAD_TO_S3=false
        fi
    fi
    
    if [ "$prerequisites_met" = false ]; then
        print_error "Prerequisites not met - aborting backup"
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Backup MySQL database
backup_mysql() {
    if [ "$BACKUP_MYSQL" = false ]; then
        print_info "MySQL backup disabled"
        return 0
    fi
    
    print_step "Backing up MySQL database"
    
    local mysql_backup_file="$BACKUP_DIR/mysql_backup.sql"
    local mysql_container="mysql-prod"
    
    # Check if MySQL container is running
    if ! docker-compose -f "$COMPOSE_FILE" ps "$mysql_container" | grep -q "Up"; then
        print_error "MySQL container is not running"
        return 1
    fi
    
    # Create database backup
    print_info "Creating MySQL dump..."
    local start_time=$(date +%s)
    
    if docker-compose -f "$COMPOSE_FILE" exec -T "$mysql_container" \
        mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" \
        --single-transaction \
        --routines \
        --triggers \
        --add-drop-database \
        --all-databases > "$mysql_backup_file" 2>/dev/null; then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local file_size=$(du -h "$mysql_backup_file" | cut -f1)
        
        print_success "MySQL backup completed: $file_size in ${duration}s"
        
        # Verify backup integrity
        if [ "$VERIFY_BACKUP" = true ]; then
            print_info "Verifying MySQL backup integrity..."
            if head -n 20 "$mysql_backup_file" | grep -q "MySQL dump"; then
                print_success "MySQL backup verification passed"
            else
                print_error "MySQL backup verification failed"
                return 1
            fi
        fi
        
    else
        print_error "MySQL backup failed"
        return 1
    fi
    
    # Compress backup if enabled
    if [ "$COMPRESS_BACKUPS" = true ]; then
        print_info "Compressing MySQL backup..."
        if gzip "$mysql_backup_file"; then
            print_success "MySQL backup compressed: $(du -h "${mysql_backup_file}.gz" | cut -f1)"
        else
            print_warning "MySQL backup compression failed"
        fi
    fi
    
    return 0
}

# Backup Redis data
backup_redis() {
    if [ "$BACKUP_REDIS" = false ]; then
        print_info "Redis backup disabled"
        return 0
    fi
    
    print_step "Backing up Redis data"
    
    local redis_backup_dir="$BACKUP_DIR/redis"
    local redis_container="redis-prod"
    
    # Check if Redis container is running
    if ! docker-compose -f "$COMPOSE_FILE" ps "$redis_container" | grep -q "Up"; then
        print_warning "Redis container is not running - skipping backup"
        return 0
    fi
    
    mkdir -p "$redis_backup_dir"
    
    # Trigger Redis save
    print_info "Triggering Redis BGSAVE..."
    if docker-compose -f "$COMPOSE_FILE" exec -T "$redis_container" redis-cli BGSAVE > /dev/null 2>&1; then
        
        # Wait for background save to complete
        local save_complete=false
        local attempts=0
        local max_attempts=30
        
        while [ $attempts -lt $max_attempts ]; do
            if docker-compose -f "$COMPOSE_FILE" exec -T "$redis_container" redis-cli LASTSAVE > /dev/null 2>&1; then
                save_complete=true
                break
            fi
            sleep 2
            ((attempts++))
        done
        
        if [ "$save_complete" = true ]; then
            # Copy Redis dump file
            docker cp "$(docker-compose -f "$COMPOSE_FILE" ps -q "$redis_container"):/data/dump.rdb" "$redis_backup_dir/" 2>/dev/null || {
                print_warning "Could not copy Redis dump file"
                return 1
            }
            
            local file_size=$(du -h "$redis_backup_dir/dump.rdb" | cut -f1)
            print_success "Redis backup completed: $file_size"
            
            # Compress Redis backup
            if [ "$COMPRESS_BACKUPS" = true ]; then
                print_info "Compressing Redis backup..."
                if gzip "$redis_backup_dir/dump.rdb"; then
                    print_success "Redis backup compressed"
                fi
            fi
            
        else
            print_error "Redis background save timeout"
            return 1
        fi
        
    else
        print_error "Redis BGSAVE command failed"
        return 1
    fi
    
    return 0
}

# Backup uploaded files
backup_uploads() {
    if [ "$BACKUP_UPLOADS" = false ]; then
        print_info "Uploads backup disabled"
        return 0
    fi
    
    print_step "Backing up uploaded files"
    
    local uploads_dir="./uploads"
    local uploads_backup_dir="$BACKUP_DIR/uploads"
    
    # Check if uploads directory exists
    if [ ! -d "$uploads_dir" ]; then
        print_info "No uploads directory found - skipping"
        return 0
    fi
    
    # Copy uploads directory
    print_info "Copying uploads directory..."
    if cp -r "$uploads_dir" "$uploads_backup_dir" 2>/dev/null; then
        local file_count=$(find "$uploads_backup_dir" -type f | wc -l)
        local total_size=$(du -h "$uploads_backup_dir" | tail -1 | cut -f1)
        
        print_success "Uploads backup completed: $file_count files, $total_size"
        
        # Compress uploads if enabled
        if [ "$COMPRESS_BACKUPS" = true ]; then
            print_info "Compressing uploads backup..."
            if tar -czf "$uploads_backup_dir.tar.gz" -C "$BACKUP_DIR" "uploads"; then
                rm -rf "$uploads_backup_dir"
                print_success "Uploads backup compressed: $(du -h "$uploads_backup_dir.tar.gz" | cut -f1)"
            fi
        fi
        
    else
        print_error "Failed to backup uploads directory"
        return 1
    fi
    
    return 0
}

# Backup configuration files
backup_configuration() {
    print_step "Backing up configuration files"
    
    local config_backup_dir="$BACKUP_DIR/config"
    mkdir -p "$config_backup_dir"
    
    local config_files=(
        ".env.production"
        "docker-compose.prod.yml"
        "nginx/nginx.conf"
        "nginx/ssl"
    )
    
    local backed_up_files=0
    
    for config_file in "${config_files[@]}"; do
        if [ -e "$config_file" ]; then
            if cp -r "$config_file" "$config_backup_dir/" 2>/dev/null; then
                ((backed_up_files++))
            fi
        fi
    done
    
    if [ $backed_up_files -gt 0 ]; then
        print_success "Configuration backup completed: $backed_up_files files"
        
        # Compress configuration backup
        if [ "$COMPRESS_BACKUPS" = true ]; then
            if tar -czf "$config_backup_dir.tar.gz" -C "$BACKUP_DIR" "config"; then
                rm -rf "$config_backup_dir"
                print_success "Configuration backup compressed"
            fi
        fi
    else
        print_warning "No configuration files found to backup"
    fi
}

# Encrypt backup if enabled
encrypt_backup() {
    if [ "$ENCRYPT_BACKUPS" = false ]; then
        return 0
    fi
    
    print_step "Encrypting backup"
    
    local encrypted_backup="$BACKUP_DIR.tar.gz.enc"
    
    # Create tar archive of entire backup
    if tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"; then
        
        # Encrypt the archive
        if openssl enc -aes-256-cbc -salt -pbkdf2 -in "$BACKUP_DIR.tar.gz" -out "$encrypted_backup" -pass pass:"$ENCRYPTION_PASSWORD"; then
            
            # Remove unencrypted files
            rm -rf "$BACKUP_DIR" "$BACKUP_DIR.tar.gz"
            
            print_success "Backup encrypted: $(du -h "$encrypted_backup" | cut -f1)"
            
            # Update backup path for upload
            BACKUP_DIR="$encrypted_backup"
            
        else
            print_error "Backup encryption failed"
            return 1
        fi
        
    else
        print_error "Failed to create backup archive for encryption"
        return 1
    fi
    
    return 0
}

# Upload backup to S3
upload_to_s3() {
    if [ "$UPLOAD_TO_S3" = false ]; then
        return 0
    fi
    
    print_step "Uploading backup to S3"
    
    local s3_key="$S3_PREFIX/$(basename "$BACKUP_DIR")"
    local backup_path="$BACKUP_DIR"
    
    # If backup was encrypted, use the encrypted file
    if [ "$ENCRYPT_BACKUPS" = true ]; then
        backup_path="$BACKUP_DIR"
    elif [ -f "$BACKUP_DIR.tar.gz" ]; then
        backup_path="$BACKUP_DIR.tar.gz"
    else
        # Create tar for upload
        tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
        backup_path="$BACKUP_DIR.tar.gz"
    fi
    
    print_info "Uploading to s3://$S3_BUCKET/$s3_key"
    
    if aws s3 cp "$backup_path" "s3://$S3_BUCKET/$s3_key" --region "$AWS_REGION" --storage-class STANDARD_IA; then
        local file_size=$(du -h "$backup_path" | cut -f1)
        print_success "Backup uploaded to S3: $file_size"
        
        # Verify upload
        if aws s3 ls "s3://$S3_BUCKET/$s3_key" > /dev/null 2>&1; then
            print_success "S3 upload verification passed"
        else
            print_warning "S3 upload verification failed"
        fi
        
    else
        print_error "S3 upload failed"
        return 1
    fi
    
    return 0
}

# Clean up old backups
cleanup_old_backups() {
    print_step "Cleaning up old backups"
    
    local deleted_count=0
    
    # Clean local backups
    if [ -d "$BACKUP_BASE_DIR" ]; then
        local old_backups=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -mtime +$BACKUP_RETENTION_DAYS 2>/dev/null || true)
        
        if [ -n "$old_backups" ]; then
            echo "$old_backups" | while read -r old_backup; do
                if [ -n "$old_backup" ] && [ "$old_backup" != "$BACKUP_BASE_DIR" ]; then
                    rm -rf "$old_backup"
                    ((deleted_count++))
                fi
            done
        fi
        
        # Also clean old compressed/encrypted backups
        find "$BACKUP_BASE_DIR" -name "*.tar.gz*" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true
    fi
    
    # Clean S3 backups if configured
    if [ "$UPLOAD_TO_S3" = true ]; then
        local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%Y-%m-%d)
        
        # List and delete old S3 objects
        aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | \
        awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
        while read -r old_s3_object; do
            if [ -n "$old_s3_object" ]; then
                aws s3 rm "s3://$S3_BUCKET/$old_s3_object" 2>/dev/null || true
                ((deleted_count++))
            fi
        done
    fi
    
    if [ $deleted_count -gt 0 ]; then
        print_success "Cleaned up $deleted_count old backups"
    else
        print_info "No old backups to clean up"
    fi
}

# Generate backup report
generate_backup_report() {
    print_step "Generating backup report"
    
    local report_file="$BACKUP_DIR/backup_report.json"
    local backup_size="0"
    local backup_files=0
    
    # Calculate backup size and file count
    if [ -d "$BACKUP_DIR" ]; then
        backup_size=$(du -sb "$BACKUP_DIR" | cut -f1)
        backup_files=$(find "$BACKUP_DIR" -type f | wc -l)
    elif [ -f "$BACKUP_DIR" ]; then
        backup_size=$(stat -f%z "$BACKUP_DIR" 2>/dev/null || stat -c%s "$BACKUP_DIR" 2>/dev/null || echo "0")
        backup_files=1
    fi
    
    local backup_report=$(cat <<EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "backup_id": "$(basename "$BACKUP_DIR")",
    "status": "completed",
    "size_bytes": $backup_size,
    "size_human": "$(du -h "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0B")",
    "file_count": $backup_files,
    "components": {
        "mysql": $BACKUP_MYSQL,
        "redis": $BACKUP_REDIS,
        "uploads": $BACKUP_UPLOADS,
        "configuration": true
    },
    "features": {
        "compressed": $COMPRESS_BACKUPS,
        "encrypted": $ENCRYPT_BACKUPS,
        "uploaded_to_s3": $UPLOAD_TO_S3
    },
    "retention_days": $BACKUP_RETENTION_DAYS,
    "verification_passed": $VERIFY_BACKUP
}
EOF
    )
    
    echo "$backup_report" > "$report_file"
    print_success "Backup report generated: $report_file"
}

# Display backup summary
display_summary() {
    echo
    print_header "Backup Summary"
    
    local total_size="0B"
    local status_color=$GREEN
    local status_text="SUCCESS"
    
    if [ -d "$BACKUP_DIR" ]; then
        total_size=$(du -h "$BACKUP_DIR" | tail -1 | cut -f1)
    elif [ -f "$BACKUP_DIR" ]; then
        total_size=$(du -h "$BACKUP_DIR" | cut -f1)
    fi
    
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                      BACKUP SUMMARY                         ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Status: ${status_color}${status_text}${NC}                                          ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Backup Size: $total_size                                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Location: $BACKUP_DIR                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Timestamp: $(date '+%Y-%m-%d %H:%M:%S')                    ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Display component status
    echo -e "${BLUE}📊 Backup Components:${NC}"
    echo "  • MySQL Database: $([ "$BACKUP_MYSQL" = true ] && echo "✅ Included" || echo "⏭️ Skipped")"
    echo "  • Redis Data: $([ "$BACKUP_REDIS" = true ] && echo "✅ Included" || echo "⏭️ Skipped")"
    echo "  • Uploaded Files: $([ "$BACKUP_UPLOADS" = true ] && echo "✅ Included" || echo "⏭️ Skipped")"
    echo "  • Configuration: ✅ Included"
    echo
    
    # Display features
    echo -e "${BLUE}🔧 Features Applied:${NC}"
    echo "  • Compression: $([ "$COMPRESS_BACKUPS" = true ] && echo "✅ Enabled" || echo "❌ Disabled")"
    echo "  • Encryption: $([ "$ENCRYPT_BACKUPS" = true ] && echo "✅ Enabled" || echo "❌ Disabled")"
    echo "  • S3 Upload: $([ "$UPLOAD_TO_S3" = true ] && echo "✅ Enabled" || echo "❌ Disabled")"
    echo "  • Verification: $([ "$VERIFY_BACKUP" = true ] && echo "✅ Enabled" || echo "❌ Disabled")"
    echo
    
    # Display next steps
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "  1. Verify backup integrity if needed"
    echo "  2. Test backup restoration in staging environment"
    echo "  3. Update disaster recovery documentation"
    echo "  4. Schedule regular backup monitoring"
    echo
}

# Main backup function
main() {
    cd "$PROJECT_ROOT"
    
    print_header
    log "INFO" "Starting backup process"
    
    setup_backup_environment
    check_prerequisites
    
    # Perform backups
    local backup_success=true
    
    backup_mysql || backup_success=false
    backup_redis || backup_success=false
    backup_uploads || backup_success=false
    backup_configuration
    
    if [ "$backup_success" = true ]; then
        encrypt_backup
        upload_to_s3
        cleanup_old_backups
        generate_backup_report
        
        print_success "🎉 BACKUP COMPLETED SUCCESSFULLY!"
        display_summary
        log "INFO" "Backup process completed successfully"
    else
        print_error "❌ BACKUP COMPLETED WITH ERRORS!"
        log "ERROR" "Backup process completed with errors"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h              Show this help message"
        echo "  --mysql-only           Backup only MySQL database"
        echo "  --redis-only           Backup only Redis data"
        echo "  --uploads-only         Backup only uploaded files"
        echo "  --no-compression       Disable backup compression"
        echo "  --encrypt              Enable backup encryption (requires ENCRYPTION_PASSWORD)"
        echo "  --upload-s3            Upload backup to S3 (requires AWS configuration)"
        echo "  --retention-days N     Set backup retention period (default: 7)"
        echo
        echo "Environment Variables:"
        echo "  BACKUP_RETENTION_DAYS  Number of days to keep backups"
        echo "  ENCRYPTION_PASSWORD    Password for backup encryption"
        echo "  S3_BUCKET             S3 bucket for backup storage"
        echo "  S3_PREFIX             S3 key prefix"
        echo "  AWS_REGION            AWS region"
        echo
        exit 0
        ;;
    --mysql-only)
        BACKUP_REDIS=false
        BACKUP_UPLOADS=false
        ;;
    --redis-only)
        BACKUP_MYSQL=false
        BACKUP_UPLOADS=false
        ;;
    --uploads-only)
        BACKUP_MYSQL=false
        BACKUP_REDIS=false
        ;;
    --no-compression)
        COMPRESS_BACKUPS=false
        ;;
    --encrypt)
        ENCRYPT_BACKUPS=true
        ;;
    --upload-s3)
        UPLOAD_TO_S3=true
        ;;
    --retention-days)
        BACKUP_RETENTION_DAYS="$2"
        shift
        ;;
esac

# Run main function
main "$@"