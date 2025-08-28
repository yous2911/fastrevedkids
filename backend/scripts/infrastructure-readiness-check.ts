#!/usr/bin/env tsx
/**
 * Infrastructure Readiness Check Script
 * Validates that all systems are ready for production deployment
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { connection } from '../src/db/connection';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string[];
}

interface SystemCheck {
  category: string;
  checks: CheckResult[];
  critical: boolean;
}

class InfrastructureChecker {
  private results: SystemCheck[] = [];
  private readonly requiredEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN',
    'PORT'
  ];

  async runAllChecks(): Promise<void> {
    console.log('🏗️  Infrastructure Readiness Assessment');
    console.log('=====================================\n');

    await this.checkEnvironment();
    await this.checkDatabase();
    await this.checkDependencies();
    await this.checkSecurity();
    await this.checkPerformance();
    await this.checkGDPR();
    await this.checkBackups();

    this.generateReport();
  }

  private async checkEnvironment(): Promise<void> {
    const checks: CheckResult[] = [];
    const category = 'Environment Configuration';

    // Check required environment variables
    const missingVars: string[] = [];
    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length === 0) {
      checks.push({
        name: 'Required Environment Variables',
        status: 'PASS',
        message: 'All required environment variables are set'
      });
    } else {
      checks.push({
        name: 'Required Environment Variables',
        status: 'FAIL',
        message: `Missing required environment variables`,
        details: missingVars
      });
    }

    // Check NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      checks.push({
        name: 'Production Environment',
        status: 'PASS',
        message: 'Running in production mode'
      });
    } else {
      checks.push({
        name: 'Production Environment',
        status: 'WARN',
        message: `Currently in ${nodeEnv} mode - ensure production for launch`
      });
    }

    // Check file permissions
    try {
      await fs.access('./uploads', fs.constants.W_OK);
      checks.push({
        name: 'File Upload Directory',
        status: 'PASS',
        message: 'Upload directory is writable'
      });
    } catch {
      checks.push({
        name: 'File Upload Directory',
        status: 'FAIL',
        message: 'Upload directory not writable or missing'
      });
    }

    this.results.push({
      category,
      checks,
      critical: true
    });
  }

  private async checkDatabase(): Promise<void> {
    const checks: CheckResult[] = [];
    const category = 'Database Connectivity';

    try {
      // Test basic database connection
      await connection.execute('SELECT 1 as test');
      
      checks.push({
        name: 'Database Connection',
        status: 'PASS',
        message: 'Database connection successful'
      });

      // Check critical tables exist in MySQL
      const criticalTables = [
        'students', 'exercises', 'competencies', 
        'progress_tracking', 'parental_consent', 'gdpr_requests'
      ];

      const [existingTables] = await connection.execute('SHOW TABLES');
      const tableNames = (existingTables as any[]).map((row: any) => Object.values(row)[0]);

      for (const table of criticalTables) {
        if (tableNames.includes(table)) {
          checks.push({
            name: `Table: ${table}`,
            status: 'PASS',
            message: `Table ${table} exists and accessible`
          });
        } else {
          checks.push({
            name: `Table: ${table}`,
            status: 'WARN',
            message: `Table ${table} not found - may need database migration`
          });
        }
      }

    } catch (error) {
      checks.push({
        name: 'Database Connection',
        status: 'FAIL',
        message: 'Failed to connect to database',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
    }

    this.results.push({
      category,
      checks,
      critical: true
    });
  }

  private async checkDependencies(): Promise<void> {
    const checks: CheckResult[] = [];
    const category = 'Dependencies & Build';

    try {
      // Check package.json exists
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      checks.push({
        name: 'Package Configuration',
        status: 'PASS',
        message: `Package ${packageJson.name} v${packageJson.version} loaded`
      });

      // Check critical dependencies
      const criticalDeps = [
        'fastify', 'drizzle-orm', 'jsonwebtoken', '@fastify/helmet'
      ];

      const missing = criticalDeps.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      if (missing.length === 0) {
        checks.push({
          name: 'Critical Dependencies',
          status: 'PASS',
          message: 'All critical dependencies present'
        });
      } else {
        checks.push({
          name: 'Critical Dependencies',
          status: 'FAIL',
          message: 'Missing critical dependencies',
          details: missing
        });
      }

      // Check TypeScript compilation
      try {
        const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
        await fs.access(tsConfigPath);
        
        checks.push({
          name: 'TypeScript Configuration',
          status: 'PASS',
          message: 'TypeScript configuration file found'
        });
      } catch (error) {
        checks.push({
          name: 'TypeScript Configuration',
          status: 'WARN',
          message: 'TypeScript configuration missing - recommended for production'
        });
      }

    } catch (error) {
      checks.push({
        name: 'Package Configuration',
        status: 'FAIL',
        message: 'Failed to load package.json',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
    }

    this.results.push({
      category,
      checks,
      critical: false
    });
  }

  private async checkSecurity(): Promise<void> {
    const checks: CheckResult[] = [];
    const category = 'Security Configuration';

    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length >= 32) {
      checks.push({
        name: 'JWT Secret Strength',
        status: 'PASS',
        message: 'JWT secret meets minimum length requirements'
      });
    } else {
      checks.push({
        name: 'JWT Secret Strength',
        status: 'FAIL',
        message: 'JWT secret too short or missing (minimum 32 characters)'
      });
    }

    // Check CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin && corsOrigin !== '*') {
      checks.push({
        name: 'CORS Configuration',
        status: 'PASS',
        message: 'CORS origin properly restricted'
      });
    } else {
      checks.push({
        name: 'CORS Configuration',
        status: 'WARN',
        message: 'CORS allows all origins - restrict for production'
      });
    }

    // Check for development secrets in production
    if (process.env.NODE_ENV === 'production') {
      const devPatterns = ['dev', 'test', 'local', '123', 'password'];
      const suspiciousEnvs = Object.entries(process.env)
        .filter(([key, value]) => 
          key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')
        )
        .filter(([, value]) => 
          devPatterns.some(pattern => 
            value?.toLowerCase().includes(pattern)
          )
        );

      if (suspiciousEnvs.length === 0) {
        checks.push({
          name: 'Production Secrets',
          status: 'PASS',
          message: 'No suspicious development secrets detected'
        });
      } else {
        checks.push({
          name: 'Production Secrets',
          status: 'FAIL',
          message: 'Suspicious development secrets detected in production',
          details: suspiciousEnvs.map(([key]) => key)
        });
      }
    }

    this.results.push({
      category,
      checks,
      critical: true
    });
  }

  private async checkPerformance(): Promise<void> {
    const checks: CheckResult[] = [];
    const category = 'Performance Readiness';

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB < 100) {
      checks.push({
        name: 'Memory Usage',
        status: 'PASS',
        message: `Heap usage: ${heapUsedMB}MB (healthy)`
      });
    } else {
      checks.push({
        name: 'Memory Usage',
        status: 'WARN',
        message: `Heap usage: ${heapUsedMB}MB (monitor closely)`
      });
    }

    // Check if caching is configured
    if (process.env.REDIS_URL || process.env.CACHE_ENABLED) {
      checks.push({
        name: 'Caching Layer',
        status: 'PASS',
        message: 'Caching is configured'
      });
    } else {
      checks.push({
        name: 'Caching Layer',
        status: 'WARN',
        message: 'No caching layer detected - consider Redis for performance'
      });
    }

    // Check upload directory size
    try {
      const uploadStats = await this.getDirectorySize('./uploads');
      const sizeMB = Math.round(uploadStats / 1024 / 1024);
      
      if (sizeMB < 1000) {
        checks.push({
          name: 'Upload Directory Size',
          status: 'PASS',
          message: `Upload directory: ${sizeMB}MB`
        });
      } else {
        checks.push({
          name: 'Upload Directory Size',
          status: 'WARN',
          message: `Upload directory: ${sizeMB}MB (consider cleanup or CDN)`
        });
      }
    } catch {
      checks.push({
        name: 'Upload Directory Size',
        status: 'WARN',
        message: 'Could not check upload directory size'
      });
    }

    this.results.push({
      category,
      checks,
      critical: false
    });
  }

  private async checkGDPR(): Promise<void> {
    const checks: CheckResult[] = [];
    const category = 'GDPR Compliance';

    try {
      // Check GDPR tables exist in MySQL
      const gdprTables = ['parental_consent', 'gdpr_requests', 'data_retention_policies'];
      
      const [existingTables] = await connection.execute('SHOW TABLES');
      const tableNames = (existingTables as any[]).map((row: any) => Object.values(row)[0]);
      
      const gdprTablesExist = gdprTables.filter(table => tableNames.includes(table));

      if (gdprTablesExist.length === gdprTables.length) {
        checks.push({
          name: 'GDPR Tables',
          status: 'PASS',
          message: 'All GDPR compliance tables exist'
        });
      } else {
        const missing = gdprTables.filter(table => !tableNames.includes(table));
        checks.push({
          name: 'GDPR Tables',
          status: 'WARN',
          message: 'Some GDPR tables missing - may need migration',
          details: missing
        });
      }

      // Check data retention policies if table exists
      if (tableNames.includes('data_retention_policies')) {
        try {
          const [policies] = await connection.execute('SELECT COUNT(*) as count FROM data_retention_policies');
          const policyCount = policies[0]?.count || 0;

          if (policyCount > 0) {
            checks.push({
              name: 'Data Retention Policies',
              status: 'PASS',
              message: `${policyCount} data retention policies configured`
            });
          } else {
            checks.push({
              name: 'Data Retention Policies',
              status: 'WARN',
              message: 'No data retention policies found - configure before launch'
            });
          }
        } catch {
          checks.push({
            name: 'Data Retention Policies',
            status: 'WARN',
            message: 'Could not verify data retention policies'
          });
        }
      } else {
        checks.push({
          name: 'Data Retention Policies',
          status: 'WARN',
          message: 'Data retention policies table not found'
        });
      }

    } catch (error) {
      checks.push({
        name: 'GDPR System Check',
        status: 'FAIL',
        message: 'Could not verify GDPR compliance setup',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
    }

    this.results.push({
      category,
      checks,
      critical: true
    });
  }

  private async checkBackups(): Promise<void> {
    const checks: CheckResult[] = [];
    const category = 'Backup & Recovery';

    // Check if backup scripts exist
    const backupScripts = [
      './scripts/backup.sh',
      './scripts/deploy-production.sh'
    ];

    let scriptsExist = true;
    for (const script of backupScripts) {
      try {
        await fs.access(script);
      } catch {
        scriptsExist = false;
        break;
      }
    }

    if (scriptsExist) {
      checks.push({
        name: 'Backup Scripts',
        status: 'PASS',
        message: 'Backup and deployment scripts exist'
      });
    } else {
      checks.push({
        name: 'Backup Scripts',
        status: 'WARN',
        message: 'Missing backup or deployment scripts'
      });
    }

    // Check for database backup configuration
    if (process.env.BACKUP_ENABLED || process.env.AWS_BACKUP_BUCKET) {
      checks.push({
        name: 'Automated Backups',
        status: 'PASS',
        message: 'Automated backup system configured'
      });
    } else {
      checks.push({
        name: 'Automated Backups',
        status: 'WARN',
        message: 'No automated backup system detected'
      });
    }

    this.results.push({
      category,
      checks,
      critical: false
    });
  }

  private generateReport(): void {
    console.log('\n📊 INFRASTRUCTURE READINESS REPORT');
    console.log('==================================\n');

    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let criticalFailures = 0;

    for (const system of this.results) {
      console.log(`📁 ${system.category}`);
      console.log('─'.repeat(system.category.length + 2));

      for (const check of system.checks) {
        totalChecks++;
        const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
        
        console.log(`${icon} ${check.name}: ${check.message}`);
        
        if (check.details) {
          check.details.forEach(detail => {
            console.log(`   └─ ${detail}`);
          });
        }

        if (check.status === 'PASS') passedChecks++;
        if (check.status === 'FAIL') {
          failedChecks++;
          if (system.critical) criticalFailures++;
        }
      }
      console.log('');
    }

    // Summary
    console.log('🎯 SUMMARY');
    console.log('==========');
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${passedChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
    console.log(`❌ Failed: ${failedChecks}`);
    console.log(`🔥 Critical Failures: ${criticalFailures}`);

    // Deployment readiness assessment
    console.log('\n🚀 DEPLOYMENT READINESS');
    console.log('======================');
    
    if (criticalFailures === 0 && failedChecks < 3) {
      console.log('✅ READY TO DEPLOY');
      console.log('Your infrastructure is ready for production deployment!');
    } else if (criticalFailures === 0) {
      console.log('⚠️ DEPLOY WITH CAUTION');
      console.log('Minor issues detected. Review warnings before deployment.');
    } else {
      console.log('❌ NOT READY TO DEPLOY');
      console.log('Critical issues must be resolved before production deployment.');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Fix all critical failures (❌)');
    console.log('2. Review and address warnings (⚠️)');
    console.log('3. Run tests: npm run test');
    console.log('4. Set up monitoring and alerts');
    console.log('5. Configure automated backups');
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let output = '';
      
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${output}`));
        }
      });
    });
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch {
      // Directory doesn't exist or is inaccessible
      return 0;
    }
    
    return totalSize;
  }
}

// Run the infrastructure check
const checker = new InfrastructureChecker();
checker.runAllChecks().catch(console.error);