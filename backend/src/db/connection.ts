import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { config } from '../config/config';

// Re-export config for other modules
export { config } from '../config/config';

// Create SQLite database
const sqlite = new Database('reved_kids.db');

// Create Drizzle instance
export const db = drizzle(sqlite);

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    // Test with a simple query
    const result = sqlite.prepare('SELECT 1 as test').get();
    return result !== null;
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
    const result = sqlite.prepare('SELECT 1 as test').get();
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime,
      connections: { type: 'sqlite', database: 'reved_kids.db' },
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
  // Database is already connected via SQLite
  console.log('Database connection ready');
}

export function getDatabase() {
  return db;
}

export async function disconnectDatabase(): Promise<void> {
  sqlite.close();
  console.log('Database connection closed');
}
