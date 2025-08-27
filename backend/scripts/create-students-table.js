const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createStudentsTable() {
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
    
    // Drop existing table
    await connection.execute('DROP TABLE IF EXISTS `students`');
    console.log('✅ Dropped existing students table');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Create new table
    const createTableSQL = `
      CREATE TABLE \`students\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`prenom\` varchar(100) NOT NULL,
        \`nom\` varchar(100) NOT NULL,
        \`email\` varchar(255) DEFAULT NULL,
        \`password_hash\` varchar(255) DEFAULT NULL,
        \`date_naissance\` date NOT NULL,
        \`niveau_actuel\` varchar(20) NOT NULL,
        \`total_points\` int DEFAULT '0',
        \`serie_jours\` int DEFAULT '0',
        \`mascotte_type\` varchar(50) DEFAULT 'dragon',
        \`dernier_acces\` timestamp NULL DEFAULT NULL,
        \`est_connecte\` tinyint(1) DEFAULT '0',
        \`failed_login_attempts\` int DEFAULT '0',
        \`locked_until\` timestamp NULL DEFAULT NULL,
        \`password_reset_token\` varchar(255) DEFAULT NULL,
        \`password_reset_expires\` timestamp NULL DEFAULT NULL,
        \`niveau_scolaire\` varchar(20) NOT NULL,
        \`mascotte_color\` varchar(20) DEFAULT '#ff6b35',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableSQL);
    
    console.log('✅ Students table created successfully');
    
    // Verify the table exists
    const [rows] = await connection.execute('DESCRIBE students');
    console.log('Table structure:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Error creating students table:', error.message);
  } finally {
    await connection.end();
  }
}

createStudentsTable();
