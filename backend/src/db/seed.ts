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
        prenom: 'Lucas',
        nom: 'Martin',
        age: 9,
        niveauActuel: 'CE2',
        totalPoints: 150,
        serieJours: 3,
        preferences: {
          matiereFavorite: 'MATHEMATIQUES',
          tempsPrefere: 'matin',
          difficultePreferee: 'consolidation'
        },
        metadata: {
          preferences: {
            theme: 'light',
            language: 'fr',
            notifications: true,
            soundEnabled: true,
            difficultyPreference: 'medium'
          },
          settings: {
            sessionTimeout: 30,
            autoSave: true,
            hintsEnabled: true
          }
        },
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        prenom: 'Emma',
        nom: 'Durand',
        age: 10,
        niveauActuel: 'CM1',
        totalPoints: 200,
        serieJours: 5,
        preferences: {
          matiereFavorite: 'FRANCAIS',
          tempsPrefere: 'apres-midi',
          difficultePreferee: 'maitrise'
        },
        metadata: {},
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        prenom: 'Noah',
        nom: 'Lefebvre',
        age: 8,
        niveauActuel: 'CE1',
        totalPoints: 75,
        serieJours: 1,
        preferences: {
          matiereFavorite: 'SCIENCES',
          tempsPrefere: 'soir',
          difficultePreferee: 'decouverte'
        },
        metadata: {},
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        prenom: 'Alice',
        nom: 'Dupont',
        age: 8,
        niveauActuel: 'CE1',
        totalPoints: 120,
        serieJours: 2,
        preferences: {
          matiereFavorite: 'MATHEMATIQUES',
          tempsPrefere: 'matin',
          difficultePreferee: 'consolidation'
        },
        metadata: {
          preferences: {
            theme: 'dark',
            language: 'fr',
            notifications: true,
            soundEnabled: false,
            difficultyPreference: 'easy'
          },
          settings: {
            sessionTimeout: 45,
            autoSave: true,
            hintsEnabled: true
          }
        },
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed modules
    console.log('📖 Seeding modules...');
    const modules = await db.insert(schema.modules).values([
      {
        nom: 'Les nombres jusqu\'à 100',
        description: 'Découverte et manipulation des nombres de 0 à 100',
        niveau: 'CE1',
        matiere: 'MATHEMATIQUES',
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nom: 'Les verbes du premier groupe',
        description: 'Conjugaison des verbes en -er au présent',
        niveau: 'CE2',
        matiere: 'FRANCAIS',
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nom: 'Le système solaire',
        description: 'Découverte des planètes et du soleil',
        niveau: 'CM1',
        matiere: 'SCIENCES',
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed exercises
    console.log('🎯 Seeding exercises...');
    const exercise1: NewExercise = {
      moduleId: 1,
      titre: 'Compter de 10 en 10',
      contenu: {
        question: 'Complète la suite : 10, 20, ___, 40, 50',
        options: ['25', '30', '35', '45'],
        correctAnswer: '30',
        type: 'multiple-choice',
        explanation: 'En comptant de 10 en 10, après 20 vient 30',
      },
      difficulte: 'FACILE',
      matiere: 'MATHEMATIQUES',
      niveau: 'CE1',
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
      titre: 'Conjuguer CHANTER',
      contenu: {
        question: 'Conjugue "chanter" à la première personne du singulier',
        correctAnswer: 'chante',
        type: 'fill-in-blank',
        explanation: 'Je chante - première personne du singulier du verbe chanter',
      },
      difficulte: 'MOYEN',
      matiere: 'FRANCAIS',
      niveau: 'CE2',
      ordre: 1,
      tempsEstime: 45,
      pointsMax: 15,
      estActif: true,
      metadata: {},
      donneesSupplementaires: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const exercise3: NewExercise = {
      moduleId: 3,
      titre: 'Les planètes rocheuses',
      contenu: {
        question: 'Quelles sont les planètes rocheuses du système solaire ?',
        options: ['Mercure, Vénus, Terre, Mars', 'Jupiter, Saturne, Uranus, Neptune', 'Toutes les planètes', 'Aucune'],
        correctAnswer: 'Mercure, Vénus, Terre, Mars',
        type: 'multiple-choice',
        explanation: 'Les planètes rocheuses sont les 4 plus proches du Soleil',
      },
      difficulte: 'DIFFICILE',
      matiere: 'SCIENCES',
      niveau: 'CM1',
      ordre: 1,
      tempsEstime: 90,
      pointsMax: 20,
      estActif: true,
      metadata: {},
      donneesSupplementaires: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.exercises).values([exercise1, exercise2, exercise3]);

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
