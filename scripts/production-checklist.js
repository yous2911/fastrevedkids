#!/usr/bin/env node
/**
 * Production Readiness Checklist for RevEd Kids
 * Automated verification of production deployment requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class ProductionChecklist {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.checks = [];
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            total: 0
        };
        this.silent = process.argv.includes('--silent');
        this.verbose = process.argv.includes('--verbose');
    }

    // Logging methods
    log(message, color = 'reset') {
        if (!this.silent) {
            console.log(`${colors[color]}${message}${colors.reset}`);
        }
    }

    logSuccess(message) {
        this.log(`✅ ${message}`, 'green');
    }

    logError(message) {
        this.log(`❌ ${message}`, 'red');
    }

    logWarning(message) {
        this.log(`⚠️  ${message}`, 'yellow');
    }

    logInfo(message) {
        this.log(`ℹ️  ${message}`, 'blue');
    }

    logHeader(message) {
        if (!this.silent) {
            console.log();
            this.log(`${colors.cyan}╔${'═'.repeat(message.length + 2)}╗${colors.reset}`);
            this.log(`${colors.cyan}║ ${message} ║${colors.reset}`);
            this.log(`${colors.cyan}╚${'═'.repeat(message.length + 2)}╝${colors.reset}`);
            console.log();
        }
    }

    // Helper methods
    fileExists(filePath) {
        return fs.existsSync(path.join(this.projectRoot, filePath));
    }

    readFile(filePath) {
        try {
            return fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8');
        } catch (error) {
            return null;
        }
    }

    executeCommand(command, options = {}) {
        try {
            return execSync(command, { 
                cwd: this.projectRoot,
                encoding: 'utf8',
                stdio: this.verbose ? 'pipe' : 'pipe',
                ...options
            });
        } catch (error) {
            if (this.verbose) {
                this.logError(`Command failed: ${command}`);
                this.logError(`Error: ${error.message}`);
            }
            return null;
        }
    }

    // Add check result
    addResult(name, status, message, recommendation = '') {
        const result = { name, status, message, recommendation };
        this.checks.push(result);
        this.results.total++;
        
        if (status === 'pass') {
            this.results.passed++;
            this.logSuccess(`${name}: ${message}`);
        } else if (status === 'fail') {
            this.results.failed++;
            this.logError(`${name}: ${message}`);
            if (recommendation) {
                this.log(`  → ${recommendation}`, 'yellow');
            }
        } else if (status === 'warning') {
            this.results.warnings++;
            this.logWarning(`${name}: ${message}`);
            if (recommendation) {
                this.log(`  → ${recommendation}`, 'yellow');
            }
        }
    }

    // Security checks
    checkSecurityConfiguration() {
        this.logHeader('Security Configuration');

        // Check environment files
        if (this.fileExists('.env.production')) {
            const envContent = this.readFile('.env.production');
            
            // Check for secure JWT secret
            if (envContent && envContent.includes('JWT_SECRET=')) {
                const jwtSecret = envContent.match(/JWT_SECRET=(.+)/)?.[1]?.trim();
                if (jwtSecret && jwtSecret.length >= 32 && !jwtSecret.includes('CHANGE_ME') && !jwtSecret.includes('your-secret')) {
                    this.addResult('JWT Secret', 'pass', 'Strong JWT secret configured');
                } else {
                    this.addResult('JWT Secret', 'fail', 'Weak or default JWT secret detected', 'Generate a secure 32+ character JWT secret');
                }
            } else {
                this.addResult('JWT Secret', 'fail', 'JWT_SECRET not found in .env.production', 'Add JWT_SECRET to environment configuration');
            }

            // Check for encryption key
            if (envContent && envContent.includes('ENCRYPTION_KEY=')) {
                const encKey = envContent.match(/ENCRYPTION_KEY=(.+)/)?.[1]?.trim();
                if (encKey && encKey.length >= 32 && !encKey.includes('CHANGE_ME')) {
                    this.addResult('Encryption Key', 'pass', 'Encryption key configured');
                } else {
                    this.addResult('Encryption Key', 'fail', 'Weak encryption key detected', 'Generate a secure 32+ character encryption key');
                }
            }

            // Check for secure database passwords
            const dbPassword = envContent.match(/DB_PASSWORD=(.+)/)?.[1]?.trim();
            if (dbPassword && dbPassword.length >= 12 && !dbPassword.includes('password') && !dbPassword.includes('CHANGE_ME')) {
                this.addResult('Database Password', 'pass', 'Strong database password configured');
            } else {
                this.addResult('Database Password', 'fail', 'Weak database password detected', 'Use a strong database password (12+ characters)');
            }

        } else {
            this.addResult('Environment File', 'fail', '.env.production file missing', 'Create .env.production with production configuration');
        }

        // Check SSL certificates
        if (this.fileExists('nginx/ssl/yourdomain.com.crt') && this.fileExists('nginx/ssl/yourdomain.com.key')) {
            // Check certificate validity
            const certInfo = this.executeCommand('openssl x509 -in nginx/ssl/yourdomain.com.crt -noout -dates 2>/dev/null');
            if (certInfo) {
                const notAfter = certInfo.match(/notAfter=(.+)/)?.[1];
                if (notAfter) {
                    const expiryDate = new Date(notAfter);
                    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilExpiry > 30) {
                        this.addResult('SSL Certificate', 'pass', `Certificate valid for ${daysUntilExpiry} days`);
                    } else if (daysUntilExpiry > 0) {
                        this.addResult('SSL Certificate', 'warning', `Certificate expires in ${daysUntilExpiry} days`, 'Renew SSL certificate soon');
                    } else {
                        this.addResult('SSL Certificate', 'fail', 'SSL certificate has expired', 'Renew SSL certificate immediately');
                    }
                } else {
                    this.addResult('SSL Certificate', 'warning', 'Could not verify certificate expiry');
                }
            } else {
                this.addResult('SSL Certificate', 'warning', 'Could not verify certificate validity');
            }
        } else {
            this.addResult('SSL Certificate', 'warning', 'SSL certificates not found', 'Generate or install SSL certificates for production');
        }

        // Check Nginx security configuration
        if (this.fileExists('nginx/nginx.conf')) {
            const nginxConfig = this.readFile('nginx/nginx.conf');
            
            const securityHeaders = [
                'X-Frame-Options',
                'X-Content-Type-Options', 
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Content-Security-Policy'
            ];

            let foundHeaders = 0;
            securityHeaders.forEach(header => {
                if (nginxConfig && nginxConfig.includes(header)) {
                    foundHeaders++;
                }
            });

            if (foundHeaders >= 4) {
                this.addResult('Security Headers', 'pass', `${foundHeaders}/${securityHeaders.length} security headers configured`);
            } else if (foundHeaders >= 2) {
                this.addResult('Security Headers', 'warning', `Only ${foundHeaders}/${securityHeaders.length} security headers found`, 'Add missing security headers to Nginx configuration');
            } else {
                this.addResult('Security Headers', 'fail', `Only ${foundHeaders}/${securityHeaders.length} security headers found`, 'Configure security headers in Nginx');
            }
        }
    }

    // Docker and infrastructure checks
    checkInfrastructure() {
        this.logHeader('Infrastructure Configuration');

        // Check Docker Compose file
        if (this.fileExists('docker-compose.prod.yml')) {
            const composeContent = this.readFile('docker-compose.prod.yml');
            
            // Check for production settings
            if (composeContent && composeContent.includes('NODE_ENV=production')) {
                this.addResult('Production Environment', 'pass', 'NODE_ENV set to production');
            } else {
                this.addResult('Production Environment', 'fail', 'NODE_ENV not set to production', 'Set NODE_ENV=production in docker-compose.prod.yml');
            }

            // Check for health checks
            if (composeContent && composeContent.includes('healthcheck:')) {
                this.addResult('Health Checks', 'pass', 'Health checks configured in Docker Compose');
            } else {
                this.addResult('Health Checks', 'warning', 'No health checks found in Docker Compose', 'Add health checks for better reliability');
            }

            // Check for restart policies
            if (composeContent && composeContent.includes('restart:') && composeContent.includes('unless-stopped')) {
                this.addResult('Restart Policy', 'pass', 'Restart policy configured');
            } else {
                this.addResult('Restart Policy', 'warning', 'No restart policy found', 'Add restart: unless-stopped to services');
            }

        } else {
            this.addResult('Docker Compose', 'fail', 'docker-compose.prod.yml not found', 'Create production Docker Compose configuration');
        }

        // Check Docker installation
        const dockerVersion = this.executeCommand('docker --version 2>/dev/null');
        if (dockerVersion) {
            this.addResult('Docker', 'pass', `Docker installed: ${dockerVersion.trim()}`);
        } else {
            this.addResult('Docker', 'fail', 'Docker not installed or not accessible', 'Install Docker and ensure it\'s in PATH');
        }

        // Check Docker Compose installation
        const composeVersion = this.executeCommand('docker-compose --version 2>/dev/null');
        if (composeVersion) {
            this.addResult('Docker Compose', 'pass', `Docker Compose installed: ${composeVersion.trim()}`);
        } else {
            this.addResult('Docker Compose', 'fail', 'Docker Compose not installed', 'Install Docker Compose');
        }

        // Check for Nginx configuration
        if (this.fileExists('nginx/nginx.conf')) {
            // Test Nginx configuration syntax
            const nginxTest = this.executeCommand('docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t 2>/dev/null');
            if (nginxTest !== null) {
                this.addResult('Nginx Configuration', 'pass', 'Nginx configuration syntax is valid');
            } else {
                this.addResult('Nginx Configuration', 'fail', 'Nginx configuration syntax errors', 'Fix Nginx configuration syntax errors');
            }
        } else {
            this.addResult('Nginx Configuration', 'fail', 'nginx/nginx.conf not found', 'Create Nginx configuration file');
        }
    }

    // Application configuration checks
    checkApplicationConfig() {
        this.logHeader('Application Configuration');

        // Check backend configuration
        if (this.fileExists('backend/package.json')) {
            const packageJson = JSON.parse(this.readFile('backend/package.json') || '{}');
            
            // Check for production dependencies
            const prodDeps = ['helmet', 'rate-limiter-flexible', '@fastify/helmet'];
            let securityDepsFound = 0;
            
            Object.keys(packageJson.dependencies || {}).forEach(dep => {
                if (prodDeps.some(prodDep => dep.includes(prodDep.split('/').pop()))) {
                    securityDepsFound++;
                }
            });

            if (securityDepsFound >= 1) {
                this.addResult('Security Dependencies', 'pass', 'Security middleware dependencies found');
            } else {
                this.addResult('Security Dependencies', 'warning', 'Security middleware dependencies not found', 'Install security middleware (helmet, rate limiting)');
            }

            // Check for scripts
            if (packageJson.scripts && packageJson.scripts.start) {
                this.addResult('Start Script', 'pass', 'Start script configured');
            } else {
                this.addResult('Start Script', 'warning', 'No start script found', 'Add start script to package.json');
            }
        }

        // Check for Dockerfile
        if (this.fileExists('backend/Dockerfile')) {
            const dockerfile = this.readFile('backend/Dockerfile');
            
            // Check for multi-stage build
            if (dockerfile && dockerfile.includes('FROM') && dockerfile.includes('AS')) {
                this.addResult('Dockerfile', 'pass', 'Multi-stage Dockerfile found');
            } else if (dockerfile) {
                this.addResult('Dockerfile', 'warning', 'Basic Dockerfile found', 'Consider using multi-stage build for optimization');
            } else {
                this.addResult('Dockerfile', 'fail', 'Invalid Dockerfile', 'Fix Dockerfile syntax');
            }
        } else {
            this.addResult('Dockerfile', 'fail', 'backend/Dockerfile not found', 'Create Dockerfile for backend');
        }

        // Check for environment example file
        if (this.fileExists('backend/.env.example') || this.fileExists('.env.example')) {
            this.addResult('Environment Example', 'pass', 'Environment example file found');
        } else {
            this.addResult('Environment Example', 'warning', 'No environment example file', 'Create .env.example for documentation');
        }
    }

    // Database and storage checks
    checkDatabase() {
        this.logHeader('Database Configuration');

        // Check for database initialization scripts
        if (this.fileExists('backend/scripts') && fs.readdirSync(path.join(this.projectRoot, 'backend/scripts')).some(file => file.includes('init') || file.includes('sql'))) {
            this.addResult('Database Scripts', 'pass', 'Database initialization scripts found');
        } else {
            this.addResult('Database Scripts', 'warning', 'No database initialization scripts found', 'Add database setup scripts');
        }

        // Check for migrations
        if (this.fileExists('backend/drizzle') || this.fileExists('backend/migrations') || this.fileExists('backend/src/db/migrations')) {
            this.addResult('Database Migrations', 'pass', 'Database migration system found');
        } else {
            this.addResult('Database Migrations', 'warning', 'No migration system found', 'Set up database migrations for schema management');
        }

        // Check for backup directory
        if (this.fileExists('backups') || fs.existsSync(path.join(this.projectRoot, 'backups'))) {
            this.addResult('Backup Directory', 'pass', 'Backup directory exists');
        } else {
            this.addResult('Backup Directory', 'warning', 'No backup directory found', 'Create backup directory and scripts');
        }
    }

    // Monitoring and logging checks
    checkMonitoring() {
        this.logHeader('Monitoring & Logging');

        // Check for monitoring scripts
        if (this.fileExists('scripts/monitor-production.sh') || this.fileExists('scripts/monitor-production.js')) {
            this.addResult('Monitoring Scripts', 'pass', 'Production monitoring scripts found');
        } else {
            this.addResult('Monitoring Scripts', 'warning', 'No monitoring scripts found', 'Create monitoring scripts for production');
        }

        // Check for log directory
        if (this.fileExists('logs') || fs.existsSync(path.join(this.projectRoot, 'logs'))) {
            this.addResult('Log Directory', 'pass', 'Log directory exists');
        } else {
            this.addResult('Log Directory', 'warning', 'No log directory found', 'Create log directory for application logs');
        }

        // Check for health check endpoints in code
        const backendFiles = this.executeCommand('find backend/src -name "*.ts" -o -name "*.js" 2>/dev/null | head -20');
        if (backendFiles) {
            const hasHealthCheck = this.executeCommand('grep -r "/health\\|/ready" backend/src 2>/dev/null');
            if (hasHealthCheck) {
                this.addResult('Health Endpoints', 'pass', 'Health check endpoints found in code');
            } else {
                this.addResult('Health Endpoints', 'warning', 'No health check endpoints found', 'Implement /api/health and /api/ready endpoints');
            }
        }
    }

    // Performance checks
    checkPerformance() {
        this.logHeader('Performance Configuration');

        // Check Nginx performance settings
        if (this.fileExists('nginx/nginx.conf')) {
            const nginxConfig = this.readFile('nginx/nginx.conf');
            
            const performanceFeatures = ['gzip', 'keepalive', 'proxy_cache', 'worker_processes'];
            let foundFeatures = 0;
            
            performanceFeatures.forEach(feature => {
                if (nginxConfig && nginxConfig.includes(feature)) {
                    foundFeatures++;
                }
            });

            if (foundFeatures >= 3) {
                this.addResult('Nginx Performance', 'pass', `${foundFeatures}/${performanceFeatures.length} performance features configured`);
            } else {
                this.addResult('Nginx Performance', 'warning', `Only ${foundFeatures}/${performanceFeatures.length} performance features found`, 'Enable more Nginx performance optimizations');
            }
        }

        // Check for Redis cache configuration
        const envContent = this.readFile('.env.production') || '';
        if (envContent.includes('REDIS_') && envContent.includes('REDIS_ENABLED=true')) {
            this.addResult('Redis Cache', 'pass', 'Redis caching configured');
        } else {
            this.addResult('Redis Cache', 'warning', 'Redis caching not configured', 'Configure Redis for better performance');
        }
    }

    // GDPR compliance checks
    checkCompliance() {
        this.logHeader('Compliance & Legal');

        const envContent = this.readFile('.env.production') || '';
        
        // Check GDPR settings
        if (envContent.includes('GDPR_ENABLED=true')) {
            this.addResult('GDPR Configuration', 'pass', 'GDPR compliance enabled');
        } else {
            this.addResult('GDPR Configuration', 'warning', 'GDPR compliance not configured', 'Enable GDPR compliance features');
        }

        // Check data retention settings
        if (envContent.includes('DATA_RETENTION_DAYS')) {
            this.addResult('Data Retention', 'pass', 'Data retention policy configured');
        } else {
            this.addResult('Data Retention', 'warning', 'Data retention policy not set', 'Configure data retention policies');
        }

        // Check for privacy policy or terms
        if (this.fileExists('PRIVACY.md') || this.fileExists('TERMS.md') || this.fileExists('docs/privacy') || this.fileExists('legal')) {
            this.addResult('Legal Documents', 'pass', 'Legal documents found');
        } else {
            this.addResult('Legal Documents', 'warning', 'No legal documents found', 'Add privacy policy and terms of service');
        }
    }

    // Generate final report
    generateReport() {
        this.logHeader('Production Readiness Report');

        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        
        // Summary statistics
        this.log(`📊 Summary:`, 'cyan');
        this.log(`   Total Checks: ${this.results.total}`);
        this.log(`   ✅ Passed: ${this.results.passed}`, 'green');
        this.log(`   ❌ Failed: ${this.results.failed}`, 'red');
        this.log(`   ⚠️  Warnings: ${this.results.warnings}`, 'yellow');
        this.log(`   📈 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');
        console.log();

        // Overall assessment
        let assessment = '';
        let assessmentColor = '';
        
        if (this.results.failed === 0 && passRate >= 90) {
            assessment = '🎉 PRODUCTION READY - Excellent configuration!';
            assessmentColor = 'green';
        } else if (this.results.failed <= 2 && passRate >= 75) {
            assessment = '✅ MOSTLY READY - Minor issues to address';
            assessmentColor = 'yellow';
        } else if (this.results.failed <= 5 && passRate >= 60) {
            assessment = '⚠️  NEEDS WORK - Several issues to fix before production';
            assessmentColor = 'yellow';
        } else {
            assessment = '❌ NOT READY - Critical issues must be resolved';
            assessmentColor = 'red';
        }

        this.log(`🎯 Overall Assessment: ${assessment}`, assessmentColor);
        console.log();

        // Critical issues
        const criticalIssues = this.checks.filter(check => check.status === 'fail');
        if (criticalIssues.length > 0) {
            this.log('🚨 Critical Issues to Fix:', 'red');
            criticalIssues.forEach((issue, index) => {
                this.log(`   ${index + 1}. ${issue.name}: ${issue.message}`, 'red');
                if (issue.recommendation) {
                    this.log(`      → ${issue.recommendation}`, 'yellow');
                }
            });
            console.log();
        }

        // Recommendations
        const warnings = this.checks.filter(check => check.status === 'warning');
        if (warnings.length > 0) {
            this.log('💡 Recommendations:', 'yellow');
            warnings.slice(0, 5).forEach((warning, index) => {
                this.log(`   ${index + 1}. ${warning.name}: ${warning.recommendation || warning.message}`, 'yellow');
            });
            if (warnings.length > 5) {
                this.log(`   ... and ${warnings.length - 5} more recommendations`, 'yellow');
            }
            console.log();
        }

        // Next steps
        this.log('📝 Next Steps:', 'blue');
        if (this.results.failed > 0) {
            this.log('   1. Fix all critical issues (failed checks)', 'blue');
        }
        if (this.results.warnings > 0) {
            this.log('   2. Address warnings for optimal production setup', 'blue');
        }
        this.log('   3. Run this checklist again after making changes', 'blue');
        this.log('   4. Deploy using: ./scripts/deploy-production.sh', 'blue');
        console.log();

        // Return exit code based on results
        return this.results.failed === 0 ? 0 : 1;
    }

    // Main execution
    async run() {
        this.logHeader('RevEd Kids Production Readiness Checklist v2.0');

        try {
            await this.checkSecurityConfiguration();
            await this.checkInfrastructure();
            await this.checkApplicationConfig();
            await this.checkDatabase();
            await this.checkMonitoring();
            await this.checkPerformance();
            await this.checkCompliance();
            
            return this.generateReport();
        } catch (error) {
            this.logError(`Checklist execution failed: ${error.message}`);
            if (this.verbose) {
                console.error(error);
            }
            return 1;
        }
    }
}

// Run the checklist if called directly
if (require.main === module) {
    const checklist = new ProductionChecklist();
    checklist.run().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ProductionChecklist;