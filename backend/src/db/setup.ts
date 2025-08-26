import { db } from './connection';
import { 
  students, 
  exercises, 
  studentProgress
} from './schema';
import { sql } from 'drizzle-orm';
import { config } from '../config/config';

export async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Use Drizzle migrations instead of raw SQL
    console.log('✅ Database tables are managed by Drizzle migrations');

    // Check if we already have data
    const existingStudents = await db.select().from(students);
    
    if (existingStudents.length === 0) {
      console.log('🌱 Seeding database with test data...');
      
      // Insert test students
      await db.insert(students).values([
        {
          prenom: 'Alice',
          nom: 'Dupont',
          dateNaissance: new Date('2015-03-15'),
          niveauActuel: 'CP',
          niveauScolaire: 'CP',
          totalPoints: 150,
          serieJours: 5,
          mascotteType: 'dragon',
        },
        {
          prenom: 'Lucas',
          nom: 'Martin',
          dateNaissance: new Date('2014-08-22'),
          niveauActuel: 'CE1',
          niveauScolaire: 'CE1',
          totalPoints: 320,
          serieJours: 12,
          mascotteType: 'robot',
        },
        {
          prenom: 'Emma',
          nom: 'Bernard',
          dateNaissance: new Date('2015-11-08'),
          niveauActuel: 'CP',
          niveauScolaire: 'CP',
          totalPoints: 85,
          serieJours: 3,
          mascotteType: 'fairy',
        }
      ]);

      // Insert test exercises
      await db.insert(exercises).values([
        {
          titre: 'Addition simple',
          description: 'Apprendre à additionner des nombres simples',
          matiere: 'mathematiques',
          niveau: 'CP',
          difficulte: 'FACILE',
          competenceCode: 'MATH_ADD_CP',
          contenu: {
            question: 'Combien font 2 + 3 ?',
            type: 'addition'
          },
          solution: {
            bonneReponse: '5'
          },
          pointsRecompense: 10,
          tempsEstime: 300,
          typeExercice: 'CALCUL',
          type: 'CALCUL',
          ordre: 1,
          configuration: JSON.stringify({
            question: 'Combien font 2 + 3 ?',
            bonneReponse: '5',
            type: 'addition'
          }),
        },
        {
          titre: 'Lecture de mots',
          description: 'Lire des mots simples',
          matiere: 'francais',
          niveau: 'CP',
          difficulte: 'FACILE',
          competenceCode: 'FR_READ_CP',
          contenu: {
            question: 'Lis le mot : "chat"',
            type: 'lecture'
          },
          solution: {
            bonneReponse: 'chat'
          },
          pointsRecompense: 15,
          tempsEstime: 240,
          typeExercice: 'LECTURE',
          type: 'LECTURE',
          ordre: 2,
          configuration: JSON.stringify({
            question: 'Lis le mot : "chat"',
            bonneReponse: 'chat',
            type: 'lecture'
          }),
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