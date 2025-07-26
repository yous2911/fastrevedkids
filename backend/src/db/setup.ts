import { db } from './connection';
import { students, exercises, studentProgress } from './schema';
import { sql } from 'drizzle-orm';

export async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Create tables using Drizzle migrations
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prenom TEXT NOT NULL,
        nom TEXT NOT NULL,
        date_naissance TEXT NOT NULL,
        niveau_actuel TEXT NOT NULL,
        total_points INTEGER DEFAULT 0,
        serie_jours INTEGER DEFAULT 0,
        mascotte_type TEXT DEFAULT 'dragon',
        dernier_acces TEXT,
        est_connecte INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        difficulte TEXT NOT NULL,
        xp INTEGER DEFAULT 10,
        configuration TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS student_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
      )
    `);

    console.log('✅ Database tables created');

    // Check if we already have data
    const existingStudents = await db.select().from(students);
    
    if (existingStudents.length === 0) {
      console.log('🌱 Seeding database with test data...');
      
      // Insert test students
      await db.insert(students).values([
        {
          prenom: 'Alice',
          nom: 'Dupont',
          dateNaissance: '2015-03-15',
          niveauActuel: 'CP',
          totalPoints: 150,
          serieJours: 5,
          mascotteType: 'dragon',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          prenom: 'Lucas',
          nom: 'Martin',
          dateNaissance: '2014-08-22',
          niveauActuel: 'CE1',
          totalPoints: 320,
          serieJours: 12,
          mascotteType: 'robot',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          prenom: 'Emma',
          nom: 'Bernard',
          dateNaissance: '2015-11-08',
          niveauActuel: 'CP',
          totalPoints: 85,
          serieJours: 3,
          mascotteType: 'fairy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);

      // Insert test exercises
      await db.insert(exercises).values([
        {
          titre: 'Addition simple',
          description: 'Apprendre à additionner des nombres simples',
          type: 'CALCUL',
          difficulte: 'FACILE',
          xp: 10,
          configuration: JSON.stringify({
            question: 'Combien font 2 + 3 ?',
            bonneReponse: '5',
            type: 'addition'
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          titre: 'Lecture de mots',
          description: 'Lire des mots simples',
          type: 'LECTURE',
          difficulte: 'FACILE',
          xp: 15,
          configuration: JSON.stringify({
            question: 'Lis le mot : "chat"',
            bonneReponse: 'chat',
            type: 'lecture'
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          titre: 'Géométrie - Formes',
          description: 'Reconnaître les formes géométriques',
          type: 'GEOMETRIE',
          difficulte: 'MOYEN',
          xp: 20,
          configuration: JSON.stringify({
            question: 'Quelle forme a 4 côtés égaux ?',
            bonneReponse: 'carré',
            type: 'geometrie'
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);

      console.log('✅ Test data seeded successfully');
    } else {
      console.log('✅ Database already has data, skipping seed');
    }

    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
} 