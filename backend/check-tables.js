const mysql = require('mysql2/promise');

async function checkTables() {
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
    
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('📋 Existing tables:');
    rows.forEach(row => {
      console.log(`  - ${Object.values(row)[0]}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
