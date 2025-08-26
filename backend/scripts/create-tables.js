#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../env.backend') });

async function createTables() {
  console.log('🏗️ Creating database tables...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reved_kids',
    multipleStatements: true
  });

  try {
    // Create students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prenom VARCHAR(100) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        date_naissance DATE NOT NULL,
        niveau_actuel VARCHAR(20) NOT NULL,
        total_points INT DEFAULT 0,
        serie_jours INT DEFAULT 0,
        mascotte_type VARCHAR(50) DEFAULT 'dragon',
        dernier_acces TIMESTAMP NULL,
        est_connecte BOOLEAN DEFAULT FALSE,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP NULL,
        niveau_scolaire VARCHAR(20) NOT NULL,
        mascotte_color VARCHAR(20) DEFAULT '#ff6b35',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created students table');

    // Create exercises table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titre VARCHAR(200) NOT NULL,
        description TEXT,
        matiere VARCHAR(50) NOT NULL,
        niveau VARCHAR(20) NOT NULL,
        difficulte VARCHAR(30) NOT NULL,
        competence_code VARCHAR(20) NOT NULL,
        prerequis JSON,
        contenu JSON NOT NULL,
        solution JSON NOT NULL,
        points_recompense INT DEFAULT 10,
        temps_estime INT DEFAULT 300,
        type_exercice VARCHAR(30) NOT NULL,
        xp INT DEFAULT 10,
        configuration TEXT,
        type VARCHAR(50) NOT NULL,
        ordre INT DEFAULT 0,
        est_actif BOOLEAN DEFAULT TRUE,
        metadonnees JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created exercises table');

    // Create modules table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titre VARCHAR(200) NOT NULL,
        matiere VARCHAR(50) NOT NULL,
        niveau VARCHAR(20) NOT NULL,
        ordre INT DEFAULT 0,
        est_actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created modules table');

    // Create student_progress table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        exercise_id INT NOT NULL,
        competence_code VARCHAR(20) NOT NULL,
        progress_percent DECIMAL(5,2) DEFAULT 0.00,
        mastery_level VARCHAR(20) NOT NULL DEFAULT 'not_started',
        total_attempts INT DEFAULT 0,
        successful_attempts INT DEFAULT 0,
        average_score DECIMAL(5,2) DEFAULT 0.00,
        best_score DECIMAL(5,2) DEFAULT 0.00,
        total_time_spent INT DEFAULT 0,
        last_attempt_at TIMESTAMP NULL,
        mastered_at TIMESTAMP NULL,
        needs_review BOOLEAN DEFAULT FALSE,
        review_scheduled_at TIMESTAMP NULL,
        streak_count INT DEFAULT 0,
        difficulty_preference VARCHAR(30),
        completed BOOLEAN DEFAULT FALSE,
        score DECIMAL(5,2) DEFAULT 0.00,
        time_spent INT DEFAULT 0,
        attempts INT DEFAULT 0,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created student_progress table');

    // Create student_learning_path table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_learning_path (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        competence_code VARCHAR(20) NOT NULL,
        current_level VARCHAR(20) NOT NULL DEFAULT 'decouverte',
        target_level VARCHAR(20) NOT NULL DEFAULT 'maitrise',
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        recommended_difficulty VARCHAR(30) NOT NULL DEFAULT 'decouverte',
        estimated_completion_time INT,
        personalized_order INT DEFAULT 0,
        is_blocked BOOLEAN DEFAULT FALSE,
        blocking_reasons JSON,
        unlocked_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created student_learning_path table');

    // Create sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        student_id INT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created sessions table');

    // Create revisions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS revisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        exercise_id INT,
        revision_date DATE NOT NULL,
        score INT DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created revisions table');

    // Create audit_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        user_id VARCHAR(36),
        parent_id VARCHAR(36),
        student_id VARCHAR(36),
        details JSON NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        category VARCHAR(50),
        session_id VARCHAR(100),
        correlation_id VARCHAR(36),
        checksum VARCHAR(64) NOT NULL,
        encrypted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created audit_logs table');

    console.log('🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✅ Database tables setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database tables setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
