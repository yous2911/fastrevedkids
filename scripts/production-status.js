#!/usr/bin/env node

/**
 * Production Status Checker for RevEd Kids
 * 
 * Quick status overview of all production services
 * 
 * Usage: node scripts/production-status.js [--json] [--verbose]
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

class ProductionStatus {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      services: {},
      system: {}
    };
  }

  async check() {
    if (!this.options.json) {
      console.log('🔍 Checking production status...\n');
    }

    await this.checkContainers();
    await this.checkHealthEndpoints();
    await this.checkSystemResources();
    
    this.determineOverallStatus();
    this.displayResults();
  }

  async checkContainers() {
    try {
      const output = execSync('docker-compose -f docker-compose.prod.yml ps --format json', { 
        encoding: 'utf8' 
      });
      
      const containers = output.trim().split('\n').map(line => JSON.parse(line));
      
      for (const container of containers) {
        this.results.services[container.Service] = {
          status: container.State,
          health: container.Health || 'unknown',
          ports: container.Publishers || []
        };
      }
    } catch (error) {
      this.results.services.containers_error = error.message;
    }
  }

  async checkHealthEndpoints() {
    const endpoints = [
      { name: 'api_health', url: 'http://localhost/api/health' },
      { name: 'api_ready', url: 'http://localhost/api/ready' },
      { name: 'frontend', url: 'http://localhost' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.httpCheck(endpoint.url);
        this.results.services[endpoint.name] = {
          status: response.status >= 200 && response.status < 400 ? 'healthy' : 'unhealthy',
          response_time: response.responseTime,
          status_code: response.status
        };
      } catch (error) {
        this.results.services[endpoint.name] = {
          status: 'unreachable',
          error: error.message
        };
      }
    }
  }

  async checkSystemResources() {
    try {
      // Docker stats
      const stats = execSync('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"', {
        encoding: 'utf8'
      });
      this.results.system.docker_stats = stats.trim().split('\n').slice(1);
    } catch (error) {
      this.results.system.docker_error = error.message;
    }

    try {
      // System uptime
      const uptime = execSync('uptime', { encoding: 'utf8' }).trim();
      this.results.system.uptime = uptime;
    } catch (error) {
      // Windows doesn't have uptime command
      this.results.system.platform = 'windows';
    }
  }

  async httpCheck(url) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, { timeout: 5000 }, (res) => {
        resolve({
          status: res.statusCode,
          responseTime: Date.now() - start
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('timeout')));
    });
  }

  determineOverallStatus() {
    const services = Object.values(this.results.services);
    const healthyCount = services.filter(s => s.status === 'healthy' || s.status === 'running').length;
    const totalCount = services.length;
    
    if (healthyCount === totalCount) {
      this.results.overall_status = 'healthy';
    } else if (healthyCount > totalCount / 2) {
      this.results.overall_status = 'degraded';
    } else {
      this.results.overall_status = 'unhealthy';
    }
  }

  displayResults() {
    if (this.options.json) {
      console.log(JSON.stringify(this.results, null, 2));
      return;
    }

    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌',
      unknown: '❓'
    };

    console.log(`${statusEmoji[this.results.overall_status]} Overall Status: ${this.results.overall_status.toUpperCase()}\n`);
    
    console.log('📋 Services:');
    for (const [name, info] of Object.entries(this.results.services)) {
      const emoji = statusEmoji[info.status] || '❓';
      console.log(`   ${emoji} ${name}: ${info.status}`);
      if (info.response_time) {
        console.log(`      Response time: ${info.response_time}ms`);
      }
    }
    
    if (this.results.system.docker_stats) {
      console.log('\n💾 Resource Usage:');
      this.results.system.docker_stats.forEach(stat => {
        console.log(`   ${stat}`);
      });
    }
  }
}

// Parse arguments
const args = process.argv.slice(2);
const options = {
  json: args.includes('--json'),
  verbose: args.includes('--verbose')
};

// Run status check
const checker = new ProductionStatus(options);
checker.check().catch(error => {
  if (options.json) {
    console.log(JSON.stringify({ error: error.message }));
  } else {
    console.error('❌ Status check failed:', error.message);
  }
  process.exit(1);
});