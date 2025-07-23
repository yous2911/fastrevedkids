import { db } from '../connection';
import * as schema from '../schema';
import type { NewExercise } from '../schema';

async function seedCP2025Exercises(): Promise<void> {
  try {
    console.log('🌱 Seeding CP2025 exercises...');

    // Create sample exercises data with correct schema structure
    const exercisesData: NewExercise[] = [
      {
        moduleId: 1,
        titre: 'Addition simple',
        contenu: {
          question: 'Combien font 2 + 3 ?',
          options: ['4', '5', '6', '7'],
          correctAnswer: '5',
          type: 'multiple-choice',
          explanation: '2 + 3 = 5',
        },
        difficulte: 'FACILE',
        matiere: 'MATHEMATIQUES',
        niveau: 'CP',
        ordre: 1,
        tempsEstime: 60,
        pointsMax: 10,
        estActif: true,
        metadata: {},
        donneesSupplementaires: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        moduleId: 1,
        titre: 'Soustraction',
        contenu: {
          question: 'Combien font 10 - 4 ?',
          correctAnswer: '6',
          type: 'fill-in-blank',
          explanation: '10 - 4 = 6',
        },
        difficulte: 'MOYEN',
        matiere: 'MATHEMATIQUES',
        niveau: 'CP',
        ordre: 2,
        tempsEstime: 45,
        pointsMax: 15,
        estActif: true,
        metadata: {},
        donneesSupplementaires: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Insert exercises - FIXED: Remove .returning() which doesn't exist
    const insertResult = await db.insert(schema.exercises).values(exercisesData);
    
    console.log(`✅ Inserted ${exercisesData.length} exercises`);

    // Get modules for association - FIXED: Add proper type for parameter 'm'
    const modules = await db.select().from(schema.modules);
    modules.forEach((m: any) => {
      console.log(`Module: ${m.nom || m.title}`);
    });

    // Additional exercises
    const moreExercises: NewExercise[] = [
      {
        moduleId: 2,
        titre: 'Multiplication',
        contenu: {
          question: 'Combien font 7 × 8 ?',
          options: ['54', '56', '58', '60'],
          correctAnswer: '56',
          type: 'multiple-choice',
          explanation: '7 × 8 = 56',
        },
        difficulte: 'DIFFICILE',
        matiere: 'MATHEMATIQUES',
        niveau: 'CP',
        ordre: 3,
        tempsEstime: 90,
        pointsMax: 20,
        estActif: true,
        metadata: {},
        donneesSupplementaires: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Create chapters - FIXED: Add proper type for parameter 'm'
    const chapters = await db.select().from(schema.modules);
    chapters.forEach((m: any) => {
      console.log(`Chapter: ${m.nom || m.title}`);
    });

    // Insert more exercises - FIXED: Remove .returning() which doesn't exist
    const moreInsertResult = await db.insert(schema.exercises).values(moreExercises);

    console.log('✅ CP2025 exercises seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding CP2025 exercises:', error);
    throw error;
  }
}

export { seedCP2025Exercises }; 