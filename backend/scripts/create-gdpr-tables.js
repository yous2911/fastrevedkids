const mysql = require('mysql2/promise');

async function createGdprTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  });

  try {
    console.log('🔧 Creating GDPR tables...');

    // Create parental_consent table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS parental_consent (
        id VARCHAR(36) PRIMARY KEY,
        parent_email VARCHAR(255) NOT NULL,
        parent_name VARCHAR(255),
        child_name VARCHAR(255),
        child_age INT,
        consent_types TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        first_consent_token VARCHAR(255),
        second_consent_token VARCHAR(255),
        first_consent_date TIMESTAMP NULL,
        second_consent_date TIMESTAMP NULL,
        verification_date TIMESTAMP NULL,
        expiry_date TIMESTAMP NULL,
        revoked_at TIMESTAMP NULL,
        revoked_by VARCHAR(255),
        revocation_reason TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created parental_consent table');

    // Create gdpr_requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gdpr_requests (
        id VARCHAR(36) PRIMARY KEY,
        request_type VARCHAR(50) NOT NULL,
        requester_type VARCHAR(50) NOT NULL,
        requester_email VARCHAR(255) NOT NULL,
        requester_name VARCHAR(255) NOT NULL,
        student_id INT,
        student_name VARCHAR(255),
        parent_email VARCHAR(255),
        request_details JSON NOT NULL,
        urgent_request BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        submitted_at TIMESTAMP NOT NULL,
        due_date TIMESTAMP NOT NULL,
        verification_token VARCHAR(255),
        verified_at TIMESTAMP NULL,
        assigned_to VARCHAR(255),
        processed_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT NOT NULL,
        verification_method VARCHAR(50) NOT NULL,
        legal_basis VARCHAR(100),
        response_details JSON,
        actions_taken JSON,
        exported_data JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created gdpr_requests table');

    // Create retention_policies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS retention_policies (
        id VARCHAR(36) PRIMARY KEY,
        policy_name VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        retention_period_days INT NOT NULL,
        trigger_condition VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        legal_basis VARCHAR(255),
        exceptions JSON,
        notification_days INT DEFAULT 30,
        last_executed TIMESTAMP NULL,
        records_processed INT DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created retention_policies table');

    // Create consent_preferences table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS consent_preferences (
        id VARCHAR(36) PRIMARY KEY,
        student_id INT,
        essential BOOLEAN NOT NULL DEFAULT TRUE,
        functional BOOLEAN NOT NULL DEFAULT FALSE,
        analytics BOOLEAN NOT NULL DEFAULT FALSE,
        marketing BOOLEAN NOT NULL DEFAULT FALSE,
        personalization BOOLEAN NOT NULL DEFAULT FALSE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created consent_preferences table');

    console.log('🎉 All GDPR tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating GDPR tables:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
createGdprTables().catch(console.error);
