const mysql = require('mysql2/promise');

async function checkSecurityAlerts() {
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  };
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL database');
    
    const [rows] = await connection.execute('DESCRIBE security_alerts');
    console.log('📋 security_alerts table structure:');
    rows.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSecurityAlerts();
