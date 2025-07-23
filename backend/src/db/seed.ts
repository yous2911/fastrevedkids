import { db } from './connection';
import * as schema from './schema';
import type { NewExercise } from './schema';

export async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed students
    console.log('📚 Seeding students...');
    const students = await db.insert(schema.students).values([
      {
        prenom: 'Alice',
        nom: 'Dupont',
        age: 8,
        niveauActuel: 'CP',
        totalPoints: 0,
        serieJours: 0,
        preferences: {},
        metadata: {},
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        prenom: 'Bob',
        nom: 'Martin',
        age: 9,
        niveauActuel: 'CE1',
        totalPoints: 0,
        serieJours: 0,
        preferences: {},
        metadata: {},
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed modules
    console.log('📖 Seeding modules...');
    const modules = await db.insert(schema.modules).values([
      {
        nom: 'Mathématiques CP',
        description: 'Module de mathématiques pour le CP',
        niveau: 'CP',
        matiere: 'MATHEMATIQUES',
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nom: 'Français CP',
        description: 'Module de français pour le CP',
        niveau: 'CP',
        matiere: 'FRANCAIS',
        ordre: 2,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed exercises
    console.log('🎯 Seeding exercises...');
    const exercise1: NewExercise = {
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
    };

    const exercise2: NewExercise = {
      moduleId: 2,
      titre: 'Lecture de syllabes',
      contenu: {
        question: 'Lis cette syllabe: MA',
        correctAnswer: 'MA',
        type: 'fill-in-blank',
        explanation: 'La syllabe MA se prononce "ma"',
      },
      difficulte: 'FACILE',
      matiere: 'FRANCAIS',
      niveau: 'CP',
      ordre: 1,
      tempsEstime: 45,
      pointsMax: 10,
      estActif: true,
      metadata: {},
      donneesSupplementaires: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.exercises).values([exercise1, exercise2]);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
