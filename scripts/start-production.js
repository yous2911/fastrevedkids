#!/usr/bin/env node

/**
 * Production Startup Orchestrator for RevEd Kids
 * 
 * This script provides orchestrated startup of all production services
 * with proper dependency management, health checking, and graceful rollback.
 * 
 * Usage:
 *   node scripts/start-production.js [options]
 * 
 * Options:
 *   --check-only    Run pre-flight checks only
 *   --force         Skip some non-critical checks
 *   --verbose       Enable detailed logging
 *   --timeout=30    Service startup timeout (seconds)
 *   --env=prod      Environment profile (prod|staging|test)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');

// Configuration
const CONFIG = {
  timeout: 30000, // 30 seconds default
  environment: 'production',
  healthCheckDelay: 5000, // Wait 5s before health checks
  maxRetries: 3,
  services: [
    {
      name: 'database',
      command: 'docker-compose -f docker-compose.prod.yml up -d mysql',
      healthCheck: 'http://localhost/api/health',
      critical: true,
      startupTime: 15000 // MySQL needs time to initialize
    },
    {
      name: 'redis',
      command: 'docker-compose -f docker-compose.prod.yml up -d redis',
      healthCheck: 'docker exec revedkids_redis_1 redis-cli ping',
      critical: false,
      startupTime: 3000
    },
    {
      name: 'backend',
      command: 'docker-compose -f docker-compose.prod.yml up -d backend',
      healthCheck: 'http://localhost/api/health',
      critical: true,
      startupTime: 10000
    },
    {
      name: 'frontend',
      command: 'docker-compose -f docker-compose.prod.yml up -d frontend',
      healthCheck: 'http://localhost',
      critical: true,
      startupTime: 5000
    },
    {
      name: 'nginx',
      command: 'docker-compose -f docker-compose.prod.yml up -d nginx',
      healthCheck: 'http://localhost/health',
      critical: true,
      startupTime: 3000
    }
  ]
};

// Logging utilities
class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  info(message, ...args) {
    console.log(`[INFO] ${this.timestamp()} ${message}`, ...args);
  }

  success(message, ...args) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${this.timestamp()} ${message}`, ...args);
  }

  warn(message, ...args) {
    console.log(`\x1b[33m[WARN]\x1b[0m ${this.timestamp()} ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${this.timestamp()} ${message}`, ...args);
  }

  debug(message, ...args) {
    if (this.verbose) {
      console.log(`[DEBUG] ${this.timestamp()} ${message}`, ...args);
    }
  }

  timestamp() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    return `[+${elapsed}s]`;
  }

  separator() {
    console.log('━'.repeat(80));
  }
}

// Startup orchestrator class
class ProductionStartup {
  constructor(options = {}) {
    this.options = {
      checkOnly: false,
      force: false,
      verbose: false,
      timeout: 30,
      environment: 'prod',
      ...options
    };
    
    this.logger = new Logger(this.options.verbose);
    this.startedServices = [];
    this.failed = false;
  }

  async run() {
    try {
      this.logger.info('🚀 Starting RevEd Kids Production Environment');
      this.logger.separator();

      // Parse command line arguments
      this.parseArguments();

      // Run pre-flight checks
      await this.runPreFlightChecks();

      if (this.options.checkOnly) {
        this.logger.success('✅ Pre-flight checks completed successfully');
        return process.exit(0);
      }

      // Stop any existing services
      await this.stopExistingServices();

      // Start services in order
      await this.startServices();

      // Run post-startup validation
      await this.validateStartup();

      this.logger.separator();
      this.logger.success('🎉 Production environment started successfully!');
      this.printStartupSummary();

    } catch (error) {
      this.logger.error('❌ Production startup failed:', error.message);
      
      if (this.startedServices.length > 0) {
        this.logger.info('🔄 Rolling back started services...');
        await this.rollback();
      }
      
      process.exit(1);
    }
  }

  parseArguments() {
    const args = process.argv.slice(2);
    
    args.forEach(arg => {
      if (arg === '--check-only') this.options.checkOnly = true;
      if (arg === '--force') this.options.force = true;
      if (arg === '--verbose') this.options.verbose = true;
      if (arg.startsWith('--timeout=')) this.options.timeout = parseInt(arg.split('=')[1]);
      if (arg.startsWith('--env=')) this.options.environment = arg.split('=')[1];
    });

    this.logger.debug('Parsed options:', this.options);
  }

  async runPreFlightChecks() {
    this.logger.info('🔍 Running pre-flight checks...');

    // Check Docker
    try {
      execSync('docker --version', { stdio: 'pipe' });
      this.logger.debug('✓ Docker is available');
    } catch (error) {
      throw new Error('Docker is not available or not running');
    }

    // Check Docker Compose
    try {
      execSync('docker-compose --version', { stdio: 'pipe' });
      this.logger.debug('✓ Docker Compose is available');
    } catch (error) {
      throw new Error('Docker Compose is not available');
    }

    // Check production compose file
    const composeFile = path.join(process.cwd(), 'docker-compose.prod.yml');
    if (!fs.existsSync(composeFile)) {
      throw new Error('Production docker-compose.prod.yml file not found');
    }
    this.logger.debug('✓ Production compose file exists');

    // Check environment files
    const envFiles = ['.env', '.env.production'];
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        this.logger.debug(`✓ Environment file ${envFile} exists`);
      }
    }

    // Check SSL certificates
    const sslDir = path.join(process.cwd(), 'nginx', 'ssl');
    if (!fs.existsSync(sslDir)) {
      this.logger.warn('⚠️  SSL directory not found - HTTPS may not work');
    } else {
      this.logger.debug('✓ SSL directory exists');
    }

    // Check available disk space
    try {
      const stats = execSync('df -h .', { encoding: 'utf8' });
      this.logger.debug('Disk space:', stats.split('\n')[1]);
    } catch (error) {
      this.logger.debug('Could not check disk space');
    }

    // Run production checklist if available
    const checklistScript = path.join(process.cwd(), 'scripts', 'production-checklist.js');
    if (fs.existsSync(checklistScript) && !this.options.force) {
      this.logger.info('📋 Running production readiness checklist...');
      try {
        execSync(`node "${checklistScript}"`, { stdio: 'inherit' });
        this.logger.debug('✓ Production checklist passed');
      } catch (error) {
        if (!this.options.force) {
          throw new Error('Production checklist failed. Use --force to skip.');
        }
        this.logger.warn('⚠️  Production checklist failed, but continuing due to --force flag');
      }
    }
  }

  async stopExistingServices() {
    this.logger.info('🛑 Stopping existing services...');
    
    try {
      execSync('docker-compose -f docker-compose.prod.yml down', { 
        stdio: this.options.verbose ? 'inherit' : 'pipe' 
      });
      this.logger.debug('✓ Existing services stopped');
    } catch (error) {
      this.logger.warn('⚠️  No existing services to stop or error stopping services');
    }
  }

  async startServices() {
    this.logger.info('🔄 Starting services in dependency order...');

    for (const service of CONFIG.services) {
      try {
        await this.startService(service);
        this.startedServices.push(service.name);
      } catch (error) {
        if (service.critical) {
          throw new Error(`Critical service ${service.name} failed to start: ${error.message}`);
        } else {
          this.logger.warn(`⚠️  Non-critical service ${service.name} failed to start: ${error.message}`);
        }
      }
    }
  }

  async startService(service) {
    this.logger.info(`🚀 Starting ${service.name}...`);
    this.logger.debug(`Command: ${service.command}`);

    // Start the service
    try {
      execSync(service.command, { 
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        timeout: this.options.timeout * 1000
      });
    } catch (error) {
      throw new Error(`Failed to execute start command: ${error.message}`);
    }

    // Wait for startup time
    this.logger.debug(`Waiting ${service.startupTime}ms for ${service.name} to initialize...`);
    await this.sleep(service.startupTime);

    // Health check
    if (service.healthCheck) {
      await this.healthCheck(service);
    }

    this.logger.success(`✅ ${service.name} started successfully`);
  }

  async healthCheck(service) {
    this.logger.debug(`Running health check for ${service.name}...`);
    
    let retries = 0;
    while (retries < CONFIG.maxRetries) {
      try {
        if (service.healthCheck.startsWith('http')) {
          // HTTP health check
          const response = await this.httpHealthCheck(service.healthCheck);
          if (response) {
            this.logger.debug(`✓ ${service.name} health check passed`);
            return;
          }
        } else {
          // Command health check
          execSync(service.healthCheck, { stdio: 'pipe', timeout: 5000 });
          this.logger.debug(`✓ ${service.name} health check passed`);
          return;
        }
      } catch (error) {
        retries++;
        this.logger.debug(`Health check attempt ${retries} failed for ${service.name}: ${error.message}`);
        
        if (retries < CONFIG.maxRetries) {
          await this.sleep(2000); // Wait 2s between retries
        }
      }
    }
    
    throw new Error(`Health check failed after ${CONFIG.maxRetries} attempts`);
  }

  async httpHealthCheck(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? require('https') : require('http');
      
      const request = protocol.get(url, { timeout: 5000 }, (response) => {
        const statusOk = response.statusCode >= 200 && response.statusCode < 400;
        resolve(statusOk);
      });
      
      request.on('error', reject);
      request.on('timeout', () => reject(new Error('HTTP health check timeout')));
    });
  }

  async validateStartup() {
    this.logger.info('🔍 Running post-startup validation...');

    // Check all containers are running
    try {
      const containers = execSync('docker-compose -f docker-compose.prod.yml ps --services --filter status=running', { 
        encoding: 'utf8' 
      }).trim().split('\n').filter(Boolean);
      
      this.logger.debug(`Running containers: ${containers.join(', ')}`);
      
      if (containers.length === 0) {
        throw new Error('No containers are running');
      }
    } catch (error) {
      throw new Error(`Container validation failed: ${error.message}`);
    }

    // Final health checks
    const healthEndpoints = [
      'http://localhost/api/health',
      'http://localhost/api/ready',
      'http://localhost'
    ];

    for (const endpoint of healthEndpoints) {
      try {
        const healthy = await this.httpHealthCheck(endpoint);
        if (healthy) {
          this.logger.debug(`✓ ${endpoint} is responding`);
        } else {
          this.logger.warn(`⚠️  ${endpoint} returned non-2xx status`);
        }
      } catch (error) {
        this.logger.warn(`⚠️  ${endpoint} health check failed: ${error.message}`);
      }
    }
  }

  async rollback() {
    this.logger.info('🔄 Rolling back services...');
    
    try {
      execSync('docker-compose -f docker-compose.prod.yml down', { 
        stdio: this.options.verbose ? 'inherit' : 'pipe' 
      });
      this.logger.info('✓ Services rolled back successfully');
    } catch (error) {
      this.logger.error('❌ Rollback failed:', error.message);
    }
  }

  printStartupSummary() {
    const uptime = ((Date.now() - this.logger.startTime) / 1000).toFixed(1);
    
    this.logger.info(`📊 Startup Summary:`);
    this.logger.info(`   • Total startup time: ${uptime}s`);
    this.logger.info(`   • Services started: ${this.startedServices.length}`);
    this.logger.info(`   • Environment: ${this.options.environment}`);
    this.logger.info(`   • Access URL: https://localhost`);
    this.logger.info(`   • Health check: https://localhost/api/health`);
    this.logger.info(`   • Monitoring: Run 'bash scripts/monitor-production.sh'`);
    
    this.logger.separator();
    this.logger.info('🎯 Next steps:');
    this.logger.info('   1. Monitor services: bash scripts/monitor-production.sh');
    this.logger.info('   2. View logs: docker-compose -f docker-compose.prod.yml logs -f');
    this.logger.info('   3. Scale services: docker-compose -f docker-compose.prod.yml up -d --scale backend=2');
    this.logger.info('   4. Backup database: bash scripts/backup-database.sh');
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(1);
});

// Run the startup orchestrator
if (require.main === module) {
  const startup = new ProductionStartup();
  startup.run().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = ProductionStartup;