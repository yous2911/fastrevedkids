import { migrate } from 'drizzle-orm/mysql2/migrator';
import { getDatabase, connectDatabase, disconnectDatabase } from './connection';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    await connectDatabase();
    const db = getDatabase();
    
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migrations completed successfully');
    
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 