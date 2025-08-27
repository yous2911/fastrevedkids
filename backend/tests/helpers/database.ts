import { createConnection, Connection } from 'mysql2/promise';
import { dbConfig } from '../../src/config/config';

export interface TestDatabase {
  connection: Connection;
  databaseName: string;
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const databaseName = `test_fastrevedkids_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create connection to MySQL server (without specifying database)
  const connection = await createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password
  });

  try {
    // Create test database
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    
    // Use the test database (use query instead of execute for USE command)
    await connection.query(`USE \`${databaseName}\``);
    
    // Run migrations to create tables
    await runMigrations(connection);
    
    // Seed test data
    await seedTestData(connection);
    
    return {
      connection,
      databaseName
    };
  } catch (error) {
    await connection.end();
    throw error;
  }
}

export async function cleanupTestDatabase(testDb: TestDatabase | undefined): Promise<void> {
  if (!testDb || !testDb.connection) {
    return;
  }
  
  try {
    // Drop the test database
    await testDb.connection.execute(`DROP DATABASE IF EXISTS \`${testDb.databaseName}\``);
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  } finally {
    try {
      await testDb.connection.end();
    } catch (error) {
      console.error('Error closing test database connection:', error);
    }
  }
}

async function runMigrations(connection: Connection): Promise<void> {
  // Create tables based on schema
  const migrations = [
    // Students table
    `CREATE TABLE students (
      id INT PRIMARY KEY AUTO_INCREMENT,
      prenom VARCHAR(100) NOT NULL,
      nom VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      date_naissance DATE NOT NULL,
      niveau_actuel VARCHAR(20) NOT NULL DEFAULT 'CP',
      total_points INT DEFAULT 0,
      serie_jours INT DEFAULT 0,
      mascotte_type ENUM('dragon', 'fairy', 'robot', 'cat', 'owl') DEFAULT 'fairy',
      dernier_acces TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      est_connecte BOOLEAN DEFAULT FALSE,
      failed_login_attempts INT DEFAULT 0,
      locked_until TIMESTAMP NULL,
      niveau_scolaire VARCHAR(20) DEFAULT 'CP',
      mascotte_color VARCHAR(7) DEFAULT '#ff6b9d',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Competences CP table
    `CREATE TABLE competences_cp (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      nom VARCHAR(200) NOT NULL,
      matiere ENUM('FR', 'MA') NOT NULL,
      domaine VARCHAR(10) NOT NULL,
      niveau_comp INT NOT NULL,
      sous_competence INT NOT NULL,
      description TEXT,
      seuil_maitrise DECIMAL(3,2) DEFAULT 0.80,
      xp_reward INT DEFAULT 10,
      prerequis JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Exercises table
    `CREATE TABLE exercises (
      id INT AUTO_INCREMENT PRIMARY KEY,
      competence_id INT NOT NULL,
      type ENUM('multiple_choice', 'drag_drop', 'fill_blank', 'true_false', 'matching') NOT NULL,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      options JSON,
      difficulty_level INT DEFAULT 1,
      xp_reward INT DEFAULT 5,
      time_limit INT DEFAULT 60,
      hints_available BOOLEAN DEFAULT FALSE,
      hints_text TEXT,
      metadata JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (competence_id) REFERENCES competences_cp(id) ON DELETE CASCADE
    )`,

    // Student progress table
    `CREATE TABLE student_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      competence_id INT NOT NULL,
      status ENUM('not_started', 'in_progress', 'mastered', 'review') DEFAULT 'not_started',
      current_level INT DEFAULT 0,
      success_rate DECIMAL(5,2) DEFAULT 0.00,
      attempts_count INT DEFAULT 0,
      correct_attempts INT DEFAULT 0,
      last_practice_date TIMESTAMP NULL,
      next_review_date TIMESTAMP NULL,
      repetition_number INT DEFAULT 0,
      easiness_factor DECIMAL(3,2) DEFAULT 2.5,
      total_time_spent INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (competence_id) REFERENCES competences_cp(id) ON DELETE CASCADE,
      UNIQUE KEY unique_student_competence (student_id, competence_id)
    )`,

    // Learning sessions table
    `CREATE TABLE learning_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP NULL,
      duration_minutes INT DEFAULT 0,
      exercises_completed INT DEFAULT 0,
      correct_answers INT DEFAULT 0,
      xp_earned INT DEFAULT 0,
      session_type ENUM('practice', 'assessment', 'review') DEFAULT 'practice',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    // Exercise results table
    `CREATE TABLE exercise_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      exercise_id INT NOT NULL,
      competence_id INT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      time_spent INT DEFAULT 0,
      hints_used INT DEFAULT 0,
      answer_given TEXT,
      supermemo_quality INT DEFAULT 0,
      xp_earned INT DEFAULT 0,
      session_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
      FOREIGN KEY (competence_id) REFERENCES competences_cp(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL
    )`,

    // Mascots table
    `CREATE TABLE mascots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      type ENUM('dragon', 'fairy', 'robot', 'cat', 'owl') DEFAULT 'fairy',
      current_emotion ENUM('idle', 'happy', 'thinking', 'celebrating', 'oops') DEFAULT 'idle',
      xp_level INT DEFAULT 1,
      equipped_items JSON,
      personality_traits JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE KEY unique_student_mascot (student_id)
    )`,

    // Wardrobe items table
    `CREATE TABLE wardrobe_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type ENUM('hat', 'accessory', 'outfit', 'background') NOT NULL,
      rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
      xp_requirement INT DEFAULT 0,
      competence_requirement VARCHAR(20),
      image_url VARCHAR(255),
      metadata JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Student wardrobe table
    `CREATE TABLE student_wardrobe (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      item_id INT NOT NULL,
      is_unlocked BOOLEAN DEFAULT FALSE,
      is_equipped BOOLEAN DEFAULT FALSE,
      unlocked_at TIMESTAMP NULL,
      unlocked_reason VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES wardrobe_items(id) ON DELETE CASCADE,
      UNIQUE KEY unique_student_item (student_id, item_id)
    )`,

    // Achievements table
    `CREATE TABLE achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon_url VARCHAR(255),
      xp_reward INT DEFAULT 0,
      criteria JSON NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Student achievements table
    `CREATE TABLE student_achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      achievement_id INT NOT NULL,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      progress_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE KEY unique_student_achievement (student_id, achievement_id)
    )`,

    // Student stats table
    `CREATE TABLE student_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      total_exercises_completed INT DEFAULT 0,
      total_correct_answers INT DEFAULT 0,
      total_time_spent INT DEFAULT 0,
      current_streak INT DEFAULT 0,
      longest_streak INT DEFAULT 0,
      competences_mastered INT DEFAULT 0,
      achievements_earned INT DEFAULT 0,
      last_activity_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE KEY unique_student_stats (student_id)
    )`,

    // Sessions table
    `CREATE TABLE sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    // GDPR files table
    `CREATE TABLE gdpr_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size INT NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      category ENUM('image', 'document', 'audio', 'video', 'resource') NOT NULL,
      is_public BOOLEAN DEFAULT FALSE,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    // GDPR consent requests table
    `CREATE TABLE gdpr_consent_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      consent_type VARCHAR(50) NOT NULL,
      consent_given BOOLEAN NOT NULL,
      purpose VARCHAR(100) NOT NULL,
      legal_basis VARCHAR(50) NOT NULL,
      data_categories JSON NOT NULL,
      retention_period VARCHAR(50) NOT NULL,
      third_party_sharing BOOLEAN DEFAULT FALSE,
      automated_decision_making BOOLEAN DEFAULT FALSE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    // GDPR data processing log table
    `CREATE TABLE gdpr_data_processing_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      processing_activity VARCHAR(100) NOT NULL,
      data_categories JSON NOT NULL,
      purpose VARCHAR(100) NOT NULL,
      legal_basis VARCHAR(50) NOT NULL,
      third_parties JSON,
      retention_period VARCHAR(50) NOT NULL,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    // Audit logs table
    `CREATE TABLE audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT NOT NULL,
      action VARCHAR(50) NOT NULL,
      old_values JSON,
      new_values JSON,
      user_id INT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_timestamp (timestamp),
      INDEX idx_action (action)
    )`,

    // Security alerts table
    `CREATE TABLE security_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      alert_type VARCHAR(50) NOT NULL,
      severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
      description TEXT NOT NULL,
      student_id INT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      metadata JSON,
      is_resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
    )`
  ];

  for (const migration of migrations) {
    await connection.execute(migration);
  }
}

async function seedTestData(connection: Connection): Promise<void> {
  // Insert test competences
  const competences = [
    {
      code: 'CP.FR.L1.1',
      nom: 'Maîtriser les 15 CGP de la Période 1',
      matiere: 'FR',
      domaine: 'L',
      niveau_comp: 1,
      sous_competence: 1,
      description: 'Maîtriser les graphèmes-phonèmes: a,e,i,o,u,l,m,s,r,t,p,n,c,f,b',
      prerequis: JSON.stringify([]),
      seuil_maitrise: 0.80,
      xp_reward: 10
    },
    {
      code: 'CP.FR.L1.2',
      nom: 'Maîtriser les 25-30 CGP supplémentaires',
      matiere: 'FR',
      domaine: 'L',
      niveau_comp: 1,
      sous_competence: 2,
      description: 'Maîtriser les graphèmes complexes: ch,ou,on,an,in,ai,ei,oi,au,eu',
      prerequis: JSON.stringify(['CP.FR.L1.1']),
      seuil_maitrise: 0.80,
      xp_reward: 15
    },
    {
      code: 'CP.MA.N1.1',
      nom: 'Compter jusqu\'à 30',
      matiere: 'MA',
      domaine: 'N',
      niveau_comp: 1,
      sous_competence: 1,
      description: 'Compter, dénombrer et comparer des quantités jusqu\'à 30',
      prerequis: JSON.stringify([]),
      seuil_maitrise: 0.80,
      xp_reward: 10
    }
  ];

  for (const competence of competences) {
    await connection.execute(
      `INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, prerequis, seuil_maitrise, xp_reward) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [competence.code, competence.nom, competence.matiere, competence.domaine, competence.niveau_comp, competence.sous_competence, competence.description, competence.prerequis, competence.seuil_maitrise, competence.xp_reward]
    );
  }

  // Insert test exercises
  const exercises = [
    {
      competence_id: 1,
      type: 'multiple_choice',
      question: 'Quel son fait la lettre "a" ?',
      correct_answer: 'a',
      options: JSON.stringify(['a', 'b', 'c', 'd']),
      difficulty_level: 1,
      xp_reward: 5
    },
    {
      competence_id: 1,
      type: 'drag_drop',
      question: 'Glisse les lettres pour former le mot "chat"',
      correct_answer: 'chat',
      options: JSON.stringify(['c', 'h', 'a', 't']),
      difficulty_level: 2,
      xp_reward: 8
    },
    {
      competence_id: 3,
      type: 'multiple_choice',
      question: 'Combien y a-t-il de pommes ? (image avec 5 pommes)',
      correct_answer: '5',
      options: JSON.stringify(['3', '4', '5', '6']),
      difficulty_level: 1,
      xp_reward: 5
    }
  ];

  for (const exercise of exercises) {
    await connection.execute(
      `INSERT INTO exercises (competence_id, type, question, correct_answer, options, difficulty_level, xp_reward) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [exercise.competence_id, exercise.type, exercise.question, exercise.correct_answer, exercise.options, exercise.difficulty_level, exercise.xp_reward]
    );
  }

  // Insert test wardrobe items
  const wardrobeItems = [
    {
      name: 'Couronne dorée',
      type: 'hat',
      rarity: 'rare',
      xp_requirement: 50,
      image_url: '/wardrobe/crown.png'
    },
    {
      name: 'Baguette magique',
      type: 'accessory',
      rarity: 'epic',
      xp_requirement: 100,
      image_url: '/wardrobe/wand.png'
    },
    {
      name: 'Costume de chevalier',
      type: 'outfit',
      rarity: 'legendary',
      xp_requirement: 200,
      image_url: '/wardrobe/knight.png'
    }
  ];

  for (const item of wardrobeItems) {
    await connection.execute(
      `INSERT INTO wardrobe_items (name, type, rarity, xp_requirement, image_url) 
       VALUES (?, ?, ?, ?, ?)`,
      [item.name, item.type, item.rarity, item.xp_requirement, item.image_url]
    );
  }

  // Insert test achievements
  const achievements = [
    {
      name: 'Premier pas',
      description: 'Complète ton premier exercice',
      icon_url: '/achievements/first-step.png',
      xp_reward: 20,
      criteria: JSON.stringify({ exercises_completed: 1 })
    },
    {
      name: 'Érudit en herbe',
      description: 'Maîtrise 5 compétences',
      icon_url: '/achievements/scholar.png',
      xp_reward: 100,
      criteria: JSON.stringify({ competences_mastered: 5 })
    },
    {
      name: 'Sérieux',
      description: 'Maintiens une série de 7 jours',
      icon_url: '/achievements/streak.png',
      xp_reward: 50,
      criteria: JSON.stringify({ current_streak: 7 })
    }
  ];

  for (const achievement of achievements) {
    await connection.execute(
      `INSERT INTO achievements (name, description, icon_url, xp_reward, criteria) 
       VALUES (?, ?, ?, ?, ?)`,
      [achievement.name, achievement.description, achievement.icon_url, achievement.xp_reward, achievement.criteria]
    );
  }
}

export async function resetTestDatabase(testDb: TestDatabase): Promise<void> {
  // Truncate all tables to reset data
  const tables = [
    'student_achievements',
    'student_wardrobe',
    'student_stats',
    'exercise_results',
    'learning_sessions',
    'student_progress',
    'mascots',
    'sessions',
    'gdpr_files',
    'gdpr_consent_requests',
    'gdpr_data_processing_log',
    'audit_logs',
    'security_alerts',
    'exercises',
    'students'
  ];

  // Disable foreign key checks temporarily
  await testDb.connection.execute('SET FOREIGN_KEY_CHECKS = 0');
  
  for (const table of tables) {
    await testDb.connection.execute(`TRUNCATE TABLE ${table}`);
  }
  
  // Re-enable foreign key checks
  await testDb.connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  
  // Re-seed test data
  await seedTestData(testDb.connection);
}

export async function createTestStudent(connection: Connection, studentData: any = {}): Promise<number> {
  const defaultData = {
    prenom: 'Test',
    nom: 'Student',
    email: `test${Date.now()}@example.com`,
    password_hash: '$2b$10$test.hash',
    date_naissance: '2015-06-15',
    niveau_scolaire: 'CP',
    ...studentData
  };

  const [result] = await connection.execute(
    `INSERT INTO students (prenom, nom, email, password_hash, date_naissance, niveau_scolaire) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [defaultData.prenom, defaultData.nom, defaultData.email, defaultData.password_hash, defaultData.date_naissance, defaultData.niveau_scolaire]
  );

  return (result as any).insertId;
}

export async function createTestMascot(connection: Connection, studentId: number, mascotData: any = {}): Promise<number> {
  const defaultData = {
    type: 'fairy',
    current_emotion: 'idle',
    xp_level: 1,
    equipped_items: JSON.stringify([]),
    personality_traits: JSON.stringify({}),
    ...mascotData
  };

  const [result] = await connection.execute(
    `INSERT INTO mascots (student_id, type, current_emotion, xp_level, equipped_items, personality_traits) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [studentId, defaultData.type, defaultData.current_emotion, defaultData.xp_level, defaultData.equipped_items, defaultData.personality_traits]
  );

  return (result as any).insertId;
}

export async function createTestProgress(connection: Connection, studentId: number, competenceId: number, progressData: any = {}): Promise<number> {
  const defaultData = {
    status: 'in_progress',
    current_level: 1,
    success_rate: 0.75,
    attempts_count: 4,
    correct_attempts: 3,
    ...progressData
  };

  const [result] = await connection.execute(
    `INSERT INTO student_progress (student_id, competence_id, status, current_level, success_rate, attempts_count, correct_attempts) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [studentId, competenceId, defaultData.status, defaultData.current_level, defaultData.success_rate, defaultData.attempts_count, defaultData.correct_attempts]
  );

  return (result as any).insertId;
}
