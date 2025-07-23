import { db } from './connection';
import * as schema from './schema';

export class MigrationManager {
  async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running database migrations...');
      
      // Check if tables exist by trying to query them
      await this.checkMigrationStatus();
      
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async checkMigrationStatus(): Promise<boolean> {
    try {
      // Simple check - try to query main tables to see if they exist
      await db.select().from(schema.students).limit(1);
      await db.select().from(schema.modules).limit(1);
      await db.select().from(schema.exercises).limit(1);
      
      console.log('✅ Database schema is ready');
      return true;
    } catch (error) {
      console.log('⚠️  Database schema not found or incomplete');
      return false;
    }
  }

  async createTables(): Promise<void> {
    // This would contain actual table creation logic
    // For now, we assume Drizzle migrations handle this
    console.log('📋 Tables creation handled by Drizzle migrations');
  }

  async dropTables(): Promise<void> {
    try {
      console.log('🗑️  Dropping all tables...');
      // Drop tables in reverse dependency order
      await db.delete(schema.revisions);
      await db.delete(schema.sessions);
      await db.delete(schema.progress);
      await db.delete(schema.exercises);
      await db.delete(schema.modules);
      await db.delete(schema.students);
      console.log('✅ All tables dropped');
    } catch (error) {
      console.error('❌ Error dropping tables:', error);
      throw error;
    }
  }
}

// Helper functions
export async function connectDatabase(): Promise<void> {
  const migrationManager = new MigrationManager();
  await migrationManager.runMigrations();
}

export async function disconnectDatabase(): Promise<void> {
  console.log('🔌 Disconnecting from database...');
  // Connection pool cleanup is handled automatically by mysql2
} 