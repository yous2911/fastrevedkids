import { db } from '../connection';
import * as schema from '../schema';
import type { NewExercise } from '../schema';

async function seedCP2025Exercises(): Promise<void> {
  try {
    console.log('🌱 Seeding CP2025 exercises...');

    // Create sample exercises data with correct schema structure
    const exercisesData: NewExercise[] = [
      {
        titre: 'Addition simple',
        description: 'Combien font 2 + 3 ?',
        matiere: 'mathematiques',
        niveau: 'CP',
        difficulte: 'FACILE',
        competenceCode: 'MATH_ADD_CP',
        contenu: {
          question: 'Combien font 2 + 3 ?',
          options: ['4', '5', '6', '7']
        },
        solution: {
          correctAnswer: '5',
          explanation: '2 + 3 = 5'
        },
        typeExercice: 'multiple-choice',
        type: 'multiple-choice',
        xp: 10,
        configuration: JSON.stringify({
          question: 'Combien font 2 + 3 ?',
          options: ['4', '5', '6', '7'],
          correctAnswer: '5',
          explanation: '2 + 3 = 5',
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        titre: 'Soustraction',
        description: 'Combien font 10 - 4 ?',
        matiere: 'mathematiques',
        niveau: 'CP',
        difficulte: 'MOYEN',
        competenceCode: 'MATH_SUB_CP',
        contenu: {
          question: 'Combien font 10 - 4 ?'
        },
        solution: {
          correctAnswer: '6',
          explanation: '10 - 4 = 6'
        },
        typeExercice: 'fill-in-blank',
        type: 'fill-in-blank',
        xp: 15,
        configuration: JSON.stringify({
          question: 'Combien font 10 - 4 ?',
          correctAnswer: '6',
          explanation: '10 - 4 = 6',
        }),
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
        titre: 'Multiplication',
        description: 'Combien font 7 × 8 ?',
        matiere: 'mathematiques',
        niveau: 'CE2',
        difficulte: 'DIFFICILE',
        competenceCode: 'MATH_MULT_CE2',
        contenu: {
          question: 'Combien font 7 × 8 ?',
          options: ['56', '64', '49', '72']
        },
        solution: {
          correctAnswer: '56',
          explanation: '7 × 8 = 56'
        },
        typeExercice: 'multiple-choice',
        type: 'multiple-choice',
        xp: 20,
        configuration: JSON.stringify({
          question: 'Combien font 7 × 8 ?',
          options: ['54', '56', '58', '60'],
          correctAnswer: '56',
          explanation: '7 × 8 = 56',
        }),
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