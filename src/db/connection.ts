import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { dbConfig, isDevelopment } from '../config/config';
import * as schema from './schema';

// Create MySQL connection pool
let pool: mysql.Pool;
let db: ReturnType<typeof drizzle>;

export async function connectDatabase() {
  try {
    // Create connection pool
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      connectionLimit: dbConfig.connectionLimit,
      acquireTimeout: 60000,
      timeout: 60000,
      ssl: dbConfig.ssl,
      charset: 'utf8mb4',
      timezone: '+00:00',
      // Connection management
      removeNodeErrorCount: 5,
      restoreNodeTimeout: 0,
      // Query configuration
      multipleStatements: false,
      // Performance optimizations
      trace: false,
      debug: false,
    });

    // Initialize Drizzle with schema
    db = drizzle(pool, { 
      schema,
      mode: 'default',
      logger: isDevelopment,
    });

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    console.log('✅ Database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    if (pool) {
      await pool.end();
      console.log('✅ Database connection pool closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return db;
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    if (!pool) {
      return { status: 'disconnected', error: 'Pool not initialized' };
    }

    const connection = await pool.getConnection();
    const startTime = Date.now();
    
    await connection.ping();
    
    const responseTime = Date.now() - startTime;
    connection.release();

    return {
      status: 'healthy',
      responseTime,
      connections: {
        active: pool.pool.allConnections.length,
        idle: pool.pool.freeConnections.length,
        total: pool.pool.allConnections.length
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 