const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  console.log('🔄 Running MySQL migrations...');
  
  // Database connection
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids',
    multipleStatements: false
  });

  try {
    // Create missing tables manually
    console.log('📋 Creating missing tables...');

    // Create competencies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS competencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        grade VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created competencies table');

    // Create progress_tracking table  
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS progress_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        exercise_id INT NOT NULL,
        score INT NOT NULL DEFAULT 0,
        completed_at TIMESTAMP,
        time_spent INT DEFAULT 0,
        attempts INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created progress_tracking table');

    // Create data_retention_policies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS data_retention_policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policy_name VARCHAR(255) NOT NULL,
        data_type VARCHAR(100) NOT NULL,
        retention_days INT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created data_retention_policies table');

    // Insert default retention policies
    await connection.execute(`
      INSERT IGNORE INTO data_retention_policies (policy_name, data_type, retention_days, description)
      VALUES 
      ('Student Data', 'personal_data', 2555, 'GDPR - 7 years retention for educational records'),
      ('Progress Data', 'learning_data', 1095, '3 years retention for progress tracking'),
      ('GDPR Requests', 'compliance_data', 2190, '6 years retention for compliance audit'),
      ('Parental Consent', 'consent_data', 2555, '7 years retention for legal compliance')
    `);
    console.log('✅ Inserted default retention policies');

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);