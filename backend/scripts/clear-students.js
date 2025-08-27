const mysql = require('mysql2/promise');

async function clearStudents() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  });

  try {
    console.log('Connected to database');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clear students table
    await connection.execute('DELETE FROM students');
    console.log('✅ Students table cleared');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
  } catch (error) {
    console.error('❌ Error clearing students table:', error.message);
  } finally {
    await connection.end();
  }
}

clearStudents();
