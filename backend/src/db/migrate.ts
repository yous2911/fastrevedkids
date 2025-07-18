import { migrate } from 'drizzle-orm/mysql2/migrator';
import { getDatabase, connectDatabase, disconnectDatabase } from './connection';

async function runMigrations() {
  try {
    // console.log removed for production

    await connectDatabase();
    const db = getDatabase();

    await migrate(db, { migrationsFolder: './drizzle' });

    // console.log removed for production

    await disconnectDatabase();
    process.exit(0);
  } catch {
    // console.error removed for production
    process.exit(1);
  }
}

runMigrations();
