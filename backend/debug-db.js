// debug-db.js - Debug database connection
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids',
    connectionLimit: 20
  };
  
  console.log('📋 Connection config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful!');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query successful:', rows);
    
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students');
    console.log('✅ Students table accessible:', students);
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
