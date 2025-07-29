// Simple test to verify database setup
const { setupDatabase } = require('./dist/db/setup.js');

async function testDatabaseSetup() {
  try {
    console.log('🧪 Testing database setup...');
    await setupDatabase();
    console.log('✅ Database setup test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup test failed:', error);
    process.exit(1);
  }
}

testDatabaseSetup();