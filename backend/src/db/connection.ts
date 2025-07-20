import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { config } from '../config/config';
import * as schema from './schema';

let connection: mysql.Pool | null = null;
let database: ReturnType<typeof drizzle> | null = null;

export async function connectDatabase(): Promise<void> {
  try {
    if (connection) {
      console.log('📊 Database already connected');
      return;
    }

    console.log('🔄 Connecting to database...');

    // Create connection pool with enhanced configuration
    connection = mysql.createPool({
      ...dbConfig,
      // Enhanced connection settings
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      multipleStatements: false,
      timezone: '+00:00',
      charset: 'utf8mb4',
      
      // SSL configuration for production
      ssl: config.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY,
      } : false,
    });

    // Test connection
    const testConnection = await connection.getConnection();
    await testConnection.execute('SELECT 1 as test');
    testConnection.release();

    // Initialize Drizzle
    database = drizzle(connection, { 
      schema, 
      mode: 'default',
      logger: config.NODE_ENV === 'development',
    });

    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    if (connection) {
      await connection.end();
      connection = null;
      database = null;
      console.log('✅ Database disconnected');
    }
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!database) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return database;
}

export function getConnection() {
  if (!connection) {
    throw new Error('Database connection not established.');
  }
  return connection;
}

// Database health check with detailed status
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    activeConnections?: number;
    freeConnections?: number;
    queuedConnections?: number;
    lastError?: string;
  };
}> {
  try {
    if (!connection) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          lastError: 'No database connection',
        },
      };
    }

    // Test connection
    const testConnection = await connection.getConnection();
    await testConnection.execute('SELECT 1 as health_check');
    testConnection.release();

    return {
      status: 'healthy',
      details: {
        connected: true,
        activeConnections: (connection as any)._allConnections?.length || 0,
        freeConnections: (connection as any)._freeConnections?.length || 0,
        queuedConnections: (connection as any)._connectionQueue?.length || 0,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
