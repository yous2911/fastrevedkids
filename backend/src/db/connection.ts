import mysql from 'mysql2/promise';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { validateEnvironment } from '../config/environment.js';
import * as schema from './schema.js';
import { FastifyInstance } from 'fastify';

export type Database = MySql2Database<typeof schema>;

interface ConnectionPool {
  pool: mysql.Pool;
  database: Database;
  healthCheck: () => Promise<boolean>;
  getConnectionCount: () => number;
  closeAll: () => Promise<void>;
}

export async function createDatabaseConnection(
  config: ReturnType<typeof validateEnvironment>
): Promise<ConnectionPool> {
  const poolConfig: mysql.PoolOptions = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,

    // Connection pooling configuration
    connectionLimit: config.DB_CONNECTION_LIMIT,

    // Performance optimizations
    multipleStatements: false,
    dateStrings: false,
    supportBigNumbers: true,
    bigNumberStrings: true,

    // Character set
    charset: 'utf8mb4',
  };

  // Add SSL configuration conditionally
  if (config.NODE_ENV === 'production') {
    poolConfig.ssl = {
      rejectUnauthorized: true,
    };
  }

  const pool = mysql.createPool(poolConfig);

  const database = drizzle(pool, {
    schema,
    mode: 'default',
    logger: config.NODE_ENV === 'development',
  });

  // Health check function
  const healthCheck = async (): Promise<boolean> => {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch {
      return false;
    }
  };

  // Connection count monitoring
  const getConnectionCount = (): number => {
    // Note: mysql2 doesn't expose connection count directly
    // This is a simplified implementation
    return 0;
  };

  // Graceful shutdown
  const closeAll = async (): Promise<void> => {
    await pool.end();
  };

  return {
    pool,
    database,
    healthCheck,
    getConnectionCount,
    closeAll,
  };
}

// Database migration with rollback strategy
export async function runMigrations(database: Database, logger: FastifyInstance['log']) {
  try {
    logger.info('Starting database migrations...');
    await migrate(database, { migrationsFolder: './drizzle' });
    logger.info('Database migrations completed successfully');
      } catch (error) {
      logger.error('Database migration failed:', error);
      throw new Error(`Migration failed: ${error}`);
    }
}

// Migration rollback function
export async function rollbackMigration(
  config: ReturnType<typeof validateEnvironment>
) {
  await createDatabaseConnection(config);

  try {
    // This would need to be implemented based on your migration strategy
    // For now, throwing an error to indicate manual intervention needed
    throw new Error('Migration rollback must be handled manually. Please restore from backup.');
  } catch (error) {
    // console.error removed for production
    throw error;
  }
}

// Legacy functions for backward compatibility
let dbConnection: ConnectionPool | null = null;

export async function connectDatabase(): Promise<void> {
  if (dbConnection) {
    return;
  }

  try {
    // Import config dynamically to avoid circular dependencies
    const config = validateEnvironment();

    dbConnection = await createDatabaseConnection(config);
    // Database connected successfully
  } catch (error) {
    // Database connection failed
    throw error;
  }
}

export function getDatabase(): Database {
  if (!dbConnection) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return dbConnection.database;
}

export async function disconnectDatabase(): Promise<void> {
  if (dbConnection) {
    await dbConnection.closeAll();
    dbConnection = null;
    // Database disconnected
  }
}

export function getDatabaseHealthCheck(): (() => Promise<boolean>) | null {
  return dbConnection?.healthCheck || null;
}

export function getDatabaseConnectionCount(): (() => number) | null {
  return dbConnection?.getConnectionCount || null;
}
