import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/environment';

// Re-export dbConfig for other modules
export { dbConfig } from '../config/environment';

// Create connection pool
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
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
