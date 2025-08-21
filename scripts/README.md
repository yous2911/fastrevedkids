# Production Scripts for RevEd Kids

This directory contains production deployment, monitoring, and maintenance scripts for the RevEd Kids platform.

## Quick Start

```bash
# 1. Deploy to production (one command)
bash scripts/deploy-production.sh

# 2. Start production environment
node scripts/start-production.js

# 3. Monitor production status
bash scripts/monitor-production.sh

# 4. Check current status
node scripts/production-status.js
```

## Scripts Overview

### Core Production Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-production.sh` | Complete production deployment with rollback | `bash scripts/deploy-production.sh [--rollback]` |
| `start-production.js` | Orchestrated service startup | `node scripts/start-production.js [--check-only]` |
| `production-checklist.js` | Automated readiness verification | `node scripts/production-checklist.js` |
| `monitor-production.sh` | Real-time production monitoring | `bash scripts/monitor-production.sh [--alerts]` |

### Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `production-status.js` | Quick status check | `node scripts/production-status.js [--json]` |
| `production-logs.sh` | Log management and viewing | `bash scripts/production-logs.sh [service] [options]` |
| `backup-database.sh` | Database and system backup | `bash scripts/backup-database.sh [--s3-upload]` |

## Detailed Usage

### 1. Production Deployment (`deploy-production.sh`)

Comprehensive deployment script with pre-checks, backup, and rollback capabilities.

```bash
# Standard deployment
bash scripts/deploy-production.sh

# Force deployment (skip some checks)
bash scripts/deploy-production.sh --force

# Rollback to previous version
bash scripts/deploy-production.sh --rollback

# Dry run (show what would be done)
bash scripts/deploy-production.sh --dry-run
```

**Features:**
- Pre-deployment environment checks
- Automatic backup before deployment
- Rolling deployment with health checks
- Automatic rollback on failure
- Post-deployment validation

### 2. Service Startup (`start-production.js`)

Orchestrated startup of all production services with dependency management.

```bash
# Start all services
node scripts/start-production.js

# Run pre-flight checks only
node scripts/start-production.js --check-only

# Verbose logging
node scripts/start-production.js --verbose

# Custom timeout
node scripts/start-production.js --timeout=60
```

**Features:**
- Dependency-aware service startup
- Health checks and validation
- Graceful rollback on failure
- Startup time optimization

### 3. Production Monitoring (`monitor-production.sh`)

Real-time monitoring dashboard with alerts and performance metrics.

```bash
# Start monitoring dashboard
bash scripts/monitor-production.sh

# Enable Slack alerts
bash scripts/monitor-production.sh --alerts

# Monitor specific service
bash scripts/monitor-production.sh --service=backend

# Export metrics
bash scripts/monitor-production.sh --export
```

**Monitors:**
- Service health and response times
- System resources (CPU, memory, disk)
- Database and Redis performance
- Container resource usage
- SSL certificate expiration

### 4. Status Checking (`production-status.js`)

Quick status overview of all production services.

```bash
# Human-readable status
node scripts/production-status.js

# JSON output for automation
node scripts/production-status.js --json

# Verbose output
node scripts/production-status.js --verbose
```

### 5. Log Management (`production-logs.sh`)

Comprehensive log viewing and management.

```bash
# View all service logs
bash scripts/production-logs.sh

# Follow nginx logs
bash scripts/production-logs.sh nginx --follow

# Show last 100 lines of backend logs
bash scripts/production-logs.sh backend --tail=100

# Show only errors from last hour
bash scripts/production-logs.sh all --since=1h --errors

# Export logs to file
bash scripts/production-logs.sh backend --export

# Clean old log files
bash scripts/production-logs.sh --clean
```

### 6. Database Backup (`backup-database.sh`)

Comprehensive backup solution with encryption and cloud upload.

```bash
# Standard backup
bash scripts/backup-database.sh

# Backup with S3 upload
bash scripts/backup-database.sh --s3-upload

# Encrypted backup
bash scripts/backup-database.sh --encrypt

# Custom backup location
bash scripts/backup-database.sh --backup-dir=/custom/path
```

**Features:**
- MySQL database backup
- Redis data backup
- File uploads backup
- Configuration backup
- Compression and encryption
- S3 cloud upload
- Backup verification

## Production Readiness Checklist

The `production-checklist.js` script validates:

### Security Configuration
- ✅ JWT secrets configured
- ✅ SSL certificates valid
- ✅ Environment variables set
- ✅ Database credentials secure
- ✅ API rate limiting enabled

### Infrastructure Setup
- ✅ Docker and Docker Compose available
- ✅ Nginx configuration valid
- ✅ SSL certificates present
- ✅ Database connection working
- ✅ Redis connection (if enabled)

### Application Configuration
- ✅ Environment files present
- ✅ Database migrations applied
- ✅ File upload directories writable
- ✅ Log directories accessible
- ✅ GDPR compliance features

### Performance Optimization
- ✅ Caching configuration
- ✅ CDN setup (if applicable)
- ✅ Database indexing
- ✅ Image optimization
- ✅ Gzip compression

## Environment Setup

### Required Environment Variables

```bash
# Production environment
NODE_ENV=production
HTTPS_ONLY=true

# Database
DATABASE_URL=mysql://user:pass@localhost:3306/revedkids
DB_HOST=localhost
DB_NAME=revedkids
DB_USER=revedkids_user
DB_PASSWORD=secure_password

# Redis (optional)
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# JWT Security
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Email (for alerts)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=smtp_password

# Backup (optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BACKUP_BUCKET=revedkids-backups

# Monitoring (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Docker Compose Configuration

The scripts work with `docker-compose.prod.yml` which should include:

```yaml
version: '3.8'
services:
  nginx:
    # Reverse proxy with SSL termination
  backend:
    # Node.js API server
  frontend:
    # React application
  mysql:
    # Database server
  redis:
    # Cache server (optional)
```

## Monitoring and Alerts

### Health Check Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/api/health` | Basic health check | Service status and uptime |
| `/api/ready` | Readiness probe | Dependency check results |
| `/api/health/detailed` | Comprehensive health | Full system information |
| `/api/health/live` | Liveness probe | Simple alive confirmation |

### Alert Conditions

The monitoring script can send alerts for:
- Service downtime
- High response times (>2 seconds)
- High CPU usage (>80%)
- High memory usage (>85%)
- Low disk space (<10% free)
- SSL certificate expiration (<30 days)
- Database connection failures

## Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   # Check pre-flight requirements
   node scripts/start-production.js --check-only
   
   # View detailed logs
   bash scripts/production-logs.sh all --tail=100 --errors
   ```

2. **Health checks failing**
   ```bash
   # Check service status
   node scripts/production-status.js
   
   # Test health endpoints manually
   curl -i http://localhost/api/health
   ```

3. **Performance issues**
   ```bash
   # Monitor resource usage
   bash scripts/monitor-production.sh
   
   # Check container resources
   docker stats
   ```

4. **SSL certificate issues**
   ```bash
   # Regenerate self-signed certificates
   bash nginx/ssl/generate-self-signed.sh
   
   # Check certificate validity
   openssl x509 -in nginx/ssl/yourdomain.com.crt -text -noout
   ```

### Getting Help

1. **Check logs**: Always start by examining the logs
   ```bash
   bash scripts/production-logs.sh all --since=1h --errors
   ```

2. **Run production checklist**: Validates configuration
   ```bash
   node scripts/production-checklist.js
   ```

3. **Monitor status**: Real-time system monitoring
   ```bash
   bash scripts/monitor-production.sh
   ```

## Maintenance

### Daily Tasks
- Monitor service health
- Check system resources
- Review error logs

### Weekly Tasks
- Run full backup
- Update SSL certificates (if needed)
- Clean old log files
- Review performance metrics

### Monthly Tasks
- Security updates
- Database optimization
- Backup verification
- Performance tuning

## Security Notes

- All scripts implement security best practices
- Sensitive data is never logged or exposed
- Backup files are encrypted when using `--encrypt`
- SSL certificates should be replaced with real certificates for production
- Environment variables contain sensitive information and should be protected
- Regular security updates are recommended

---

**Note**: These scripts are designed for the RevEd Kids production environment. Customize the configuration and settings according to your specific deployment requirements.