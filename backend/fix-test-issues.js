const mysql = require('mysql2/promise');

async function fixTestIssues() {
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  };
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔧 Fixing test issues...');
    
    // Fix security_alerts table - add 'type' column alias
    console.log('📋 Adding type column alias to security_alerts...');
    try {
      await connection.execute(`
        ALTER TABLE security_alerts 
        ADD COLUMN type VARCHAR(50) GENERATED ALWAYS AS (alert_type) VIRTUAL
      `);
      console.log('✅ Added type column alias to security_alerts');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ type column already exists in security_alerts');
      } else {
        console.log('⚠️ Could not add type column:', error.message);
      }
    }
    
    // Fix files table - add 'size' column alias
    console.log('📋 Adding size column alias to files...');
    try {
      await connection.execute(`
        ALTER TABLE files 
        ADD COLUMN size INT GENERATED ALWAYS AS (file_size) VIRTUAL
      `);
      console.log('✅ Added size column alias to files');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ size column already exists in files');
      } else {
        console.log('⚠️ Could not add size column:', error.message);
      }
    }
    
    // Add missing audit_entries column to security_alerts
    console.log('📋 Adding audit_entries column to security_alerts...');
    try {
      await connection.execute(`
        ALTER TABLE security_alerts 
        ADD COLUMN audit_entries JSON DEFAULT NULL
      `);
      console.log('✅ Added audit_entries column to security_alerts');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ audit_entries column already exists in security_alerts');
      } else {
        console.log('⚠️ Could not add audit_entries column:', error.message);
      }
    }
    
    // Add missing detected_at column to security_alerts
    console.log('📋 Adding detected_at column to security_alerts...');
    try {
      await connection.execute(`
        ALTER TABLE security_alerts 
        ADD COLUMN detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Added detected_at column to security_alerts');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ detected_at column already exists in security_alerts');
      } else {
        console.log('⚠️ Could not add detected_at column:', error.message);
      }
    }
    
    await connection.end();
    console.log('🎉 Database fixes completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixTestIssues();
