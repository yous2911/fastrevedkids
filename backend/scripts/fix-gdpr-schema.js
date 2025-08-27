const mysql = require('mysql2/promise');

async function fixGdprSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  });

  try {
    console.log('🔧 Fixing GDPR schema...');

    // Add missing requester_type column to gdpr_requests table
    await connection.execute(`
      ALTER TABLE gdpr_requests 
      ADD COLUMN requester_type VARCHAR(50) NOT NULL DEFAULT 'parent' 
      AFTER request_type
    `);
    console.log('✅ Added requester_type column to gdpr_requests table');

    console.log('🎉 GDPR schema fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing GDPR schema:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
fixGdprSchema().catch(console.error);
