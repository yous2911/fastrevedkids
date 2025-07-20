import { migrate } from 'drizzle-orm/mysql2/migrator';
import { sql } from 'drizzle-orm';
import { connectDatabase, getDatabase, disconnectDatabase } from './connection';
import { config } from '../config/config';

export async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Starting database migrations...');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`📍 Database: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);

    await connectDatabase();
    const db = getDatabase();

    // Run migrations
    await migrate(db, { 
      migrationsFolder: './drizzle',
      migrationsTable: '__drizzle_migrations__',
    });

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

export async function checkMigrationStatus(): Promise<{
  hasPendingMigrations: boolean;
  appliedMigrations: string[];
  pendingMigrations: string[];
}> {
  try {
    await connectDatabase();
    const db = getDatabase();

    // Check if migrations table exists
    const [tables] = await db.execute(sql`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ${config.DB_NAME} AND TABLE_NAME = '__drizzle_migrations__'
    `);

    if (!Array.isArray(tables) || tables.length === 0) {
      return {
        hasPendingMigrations: true,
        appliedMigrations: [],
        pendingMigrations: ['Initial migration required'],
      };
    }

    // Get applied migrations
    const [appliedRows] = await db.execute(sql`
      SELECT hash, created_at 
      FROM __drizzle_migrations__ 
      ORDER BY created_at ASC
    `);

    const appliedMigrations = Array.isArray(appliedRows) 
      ? appliedRows.map((row: any) => row.hash)
      : [];

    return {
      hasPendingMigrations: false,
      appliedMigrations,
      pendingMigrations: [],
    };
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    return {
      hasPendingMigrations: true,
      appliedMigrations: [],
      pendingMigrations: ['Unable to determine migration status'],
    };
  } finally {
    await disconnectDatabase();
  }
}

// CLI runner
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
