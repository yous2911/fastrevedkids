import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { config } from '../config/config';

// Re-export config for other modules
export { config } from '../config/config';

// Create connection pool
const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle instance
export const db = drizzle(pool);

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Enhanced health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  connections?: any;
  error?: string;
}> {
  const start = Date.now();
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    
    // Get connection pool stats
    const poolStats = {
      threadId: connection.threadId,
      connectionLimit: pool.config.connectionLimit,
      queueLimit: pool.config.queueLimit,
    };
    
    connection.release();
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime,
      connections: poolStats,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Legacy exports for backward compatibility
export async function connectDatabase(): Promise<void> {
  // Database is already connected via pool
  console.log('Database connection pool ready');
}

export function getDatabase() {
  return db;
}

export async function disconnectDatabase(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}
