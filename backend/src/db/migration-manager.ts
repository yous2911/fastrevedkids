import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger.js';
import { env } from '../config/environment.js';

interface MigrationRecord {
  id: number;
  name: string;
  executed_at: Date;
  checksum: string;
  rollback_sql?: string;
}

interface MigrationFile {
  name: string;
  up: string;
  down?: string;
  checksum: string;
}

class MigrationManager {
  private db: any;
  private connection: mysql.Connection;

  constructor() {
    this.connection = mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    });
    
    this.db = drizzle(this.connection);
  }

  // Initialize migration tracking table
  private async initMigrationTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS __migrations__ (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL,
        rollback_sql TEXT,
        INDEX idx_name (name),
        INDEX idx_executed_at (executed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await this.connection.execute(createTableSQL);
      logger.info('Migration tracking table initialized');
    } catch (error) {
      logger.error('Failed to initialize migration table:', error);
      throw error;
    }
  }

  // Calculate checksum for migration content
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Parse migration file
  private async parseMigrationFile(filePath: string): Promise<MigrationFile> {
    const content = await readFile(filePath, 'utf-8');
    const name = filePath.split('/').pop()?.replace('.sql', '') || '';
    
    // Split content into up and down migrations
    const parts = content.split('-- DOWN MIGRATION');
    const up = parts[0].replace('-- UP MIGRATION', '').trim();
    const down = parts[1]?.trim();
    
    return {
      name,
      up,
      down,
      checksum: this.calculateChecksum(content),
    };
  }

  // Get executed migrations from database
  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM __migrations__ ORDER BY executed_at ASC'
      );
      return rows as MigrationRecord[];
    } catch (error) {
      logger.error('Failed to get executed migrations:', error);
      return [];
    }
  }

  // Get pending migrations
  private async getPendingMigrations(): Promise<MigrationFile[]> {
    const migrationsDir = join(process.cwd(), 'drizzle');
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map(m => m.name));
    
    const pendingMigrations: MigrationFile[] = [];
    
    for (const file of sqlFiles) {
      if (!executedNames.has(file.replace('.sql', ''))) {
        const filePath = join(migrationsDir, file);
        const migration = await this.parseMigrationFile(filePath);
        pendingMigrations.push(migration);
      }
    }
    
    return pendingMigrations.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Execute migration
  private async executeMigration(migration: MigrationFile): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(`Executing migration: ${migration.name}`);
      
      // Execute the migration
      await this.connection.execute(migration.up);
      
      // Record the migration
      await this.connection.execute(
        'INSERT INTO __migrations__ (name, checksum, rollback_sql) VALUES (?, ?, ?)',
        [migration.name, migration.checksum, migration.down || null]
      );
      
      const duration = Date.now() - startTime;
      logger.info(`✅ Migration ${migration.name} completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`❌ Migration ${migration.name} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // Rollback migration
  private async rollbackMigration(migration: MigrationRecord): Promise<void> {
    if (!migration.rollback_sql) {
      throw new Error(`No rollback SQL available for migration: ${migration.name}`);
    }
    
    const startTime = Date.now();
    
    try {
      logger.info(`Rolling back migration: ${migration.name}`);
      
      // Execute rollback SQL
      await this.connection.execute(migration.rollback_sql);
      
      // Remove migration record
      await this.connection.execute(
        'DELETE FROM __migrations__ WHERE id = ?',
        [migration.id]
      );
      
      const duration = Date.now() - startTime;
      logger.info(`✅ Rollback of ${migration.name} completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`❌ Rollback of ${migration.name} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // Run all pending migrations
  async migrate(): Promise<void> {
    try {
      await this.initMigrationTable();
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations found');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logger.info('✅ All migrations completed successfully');
      
    } catch (error) {
      logger.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Rollback last N migrations
  async rollback(count: number = 1): Promise<void> {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }
      
      const migrationsToRollback = executedMigrations
        .slice(-count)
        .reverse();
      
      logger.info(`Rolling back ${migrationsToRollback.length} migrations`);
      
      for (const migration of migrationsToRollback) {
        await this.rollbackMigration(migration);
      }
      
      logger.info('✅ All rollbacks completed successfully');
      
    } catch (error) {
      logger.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  // Get migration status
  async status(): Promise<{
    executed: MigrationRecord[];
    pending: MigrationFile[];
    total: number;
  }> {
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    
    return {
      executed,
      pending,
      total: executed.length + pending.length,
    };
  }

  // Validate migration integrity
  async validate(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    const executedMigrations = await this.getExecutedMigrations();
    
    for (const migration of executedMigrations) {
      const filePath = join(process.cwd(), 'drizzle', `${migration.name}.sql`);
      
      try {
        const content = await readFile(filePath, 'utf-8');
        const currentChecksum = this.calculateChecksum(content);
        
        if (currentChecksum !== migration.checksum) {
          issues.push(`Migration ${migration.name} has been modified since execution`);
        }
      } catch (error) {
        issues.push(`Migration file ${migration.name}.sql not found`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // Close database connection
  async close(): Promise<void> {
    await this.connection.end();
  }
}

export const migrationManager = new MigrationManager(); 