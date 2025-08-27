// src/tests/helpers/test-data.ts - Test data setup helpers

import { db } from '../../db/connection';
import { students, exercises, modules } from '../../db/schema';

export async function setupExerciseTestData(): Promise<void> {
  try {
    console.log('📚 Setting up exercise test data...');
    
    // Check if test data already exists
    const existingStudents = await db.select().from(students).limit(1);
    
    if (existingStudents.length > 0) {
      console.log('✅ Test data already exists, skipping setup');
      return;
    }
    
    // Insert test students if they don't exist
    await db.insert(students).values([
      {
        prenom: 'Alice',
        nom: 'Dupont',
        email: 'alice.dupont@test.com',
        passwordHash: '$2b$10$test.hash.for.testing',
        dateNaissance: new Date('2015-11-05'),
        niveauActuel: 'CE1',
        niveauScolaire: 'CE1',
        totalPoints: 120,
        serieJours: 2,
        mascotteType: 'cat',
        mascotteColor: '#e74c3c',
        dernierAcces: new Date(),
        estConnecte: false,
      },
      {
        prenom: 'Lucas',
        nom: 'Martin',
        email: 'lucas.martin@test.com',
        passwordHash: '$2b$10$test.hash.for.testing',
        dateNaissance: new Date('2014-05-15'),
        niveauActuel: 'CE2',
        niveauScolaire: 'CE2',
        totalPoints: 150,
        serieJours: 3,
        mascotteType: 'dragon',
        mascotteColor: '#ff6b35',
        dernierAcces: new Date(),
        estConnecte: false,
      }
    ]);
    
    // Insert test modules if they don't exist
    await db.insert(modules).values([
      {
        titre: 'Test Module 1',
        description: 'Test module for exercises',
        niveau: 'CE1',
        matiere: 'mathematiques',
        competences: ['CP.2025.1', 'CP.2025.2'],
        difficulte: 'facile',
        dureeEstimee: 15,
        points: 10,
      },
      {
        titre: 'Test Module 2',
        description: 'Another test module',
        niveau: 'CE2',
        matiere: 'francais',
        competences: ['CP.2025.3'],
        difficulte: 'moyen',
        dureeEstimee: 20,
        points: 15,
      }
    ]);
    
    // Insert test exercises if they don't exist
    await db.insert(exercises).values([
      {
        titre: 'Test Exercise 1',
        description: 'A test exercise',
        type: 'qcm',
        niveau: 'CE1',
        matiere: 'mathematiques',
        competences: ['CP.2025.1'],
        difficulte: 'facile',
        points: 5,
        contenu: JSON.stringify({
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1
        }),
        tempsEstime: 5,
      },
      {
        titre: 'Test Exercise 2',
        description: 'Another test exercise',
        type: 'texte_libre',
        niveau: 'CE2',
        matiere: 'francais',
        competences: ['CP.2025.3'],
        difficulte: 'moyen',
        points: 8,
        contenu: JSON.stringify({
          question: 'Write a short sentence about your favorite animal.',
          maxLength: 100
        }),
        tempsEstime: 10,
      }
    ]);
    
    console.log('✅ Exercise test data setup completed');
    
  } catch (error) {
    console.error('❌ Failed to setup exercise test data:', error);
    // Don't throw - allow tests to continue with existing data
  }
}

export async function cleanupTestData(): Promise<void> {
  try {
    console.log('🧹 Cleaning up test data...');
    
    // Clean up test data (optional - you might want to keep it for other tests)
    // await db.delete(exercises).where(eq(exercises.titre, 'Test Exercise 1'));
    // await db.delete(modules).where(eq(modules.titre, 'Test Module 1'));
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('⚠️ Test data cleanup warning:', error);
  }
}
