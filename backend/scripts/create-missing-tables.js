const mysql = require('mysql2/promise');

async function createMissingTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  });

  try {
    console.log('🔧 Creating missing tables...');

    // Create encryption_keys table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS encryption_keys (
        id VARCHAR(36) PRIMARY KEY,
        key_data TEXT NOT NULL,
        \`usage\` VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created encryption_keys table');

    // Create audit_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        user_id VARCHAR(255),
        parent_id VARCHAR(255),
        student_id INT,
        details TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMP NOT NULL,
        severity VARCHAR(20) NOT NULL,
        category VARCHAR(50),
        session_id VARCHAR(255),
        correlation_id VARCHAR(255),
        checksum VARCHAR(64) NOT NULL,
        encrypted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created audit_logs table');

    console.log('🎉 All missing tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating missing tables:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
createMissingTables().catch(console.error);
