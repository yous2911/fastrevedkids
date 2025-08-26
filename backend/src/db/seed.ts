import { db } from './connection';
import * as schema from './schema';
import type { NewExercise } from './schema';
import { comprehensiveSeed } from './seeds/comprehensive-seed';

export async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Use comprehensive seeding by default
    await comprehensiveSeed();
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Simple seed function as fallback
export async function simpleSeed() {
  try {
    console.log('🌱 Starting simple database seeding...');

    // Seed students
    console.log('📚 Seeding students...');
    const students = await db.insert(schema.students).values([
      {
        prenom: 'Lucas',
        nom: 'Martin',
        dateNaissance: new Date('2014-05-15'),
        niveauActuel: 'CE2',
        niveauScolaire: 'CE2',
        totalPoints: 150,
        serieJours: 3,
        mascotteType: 'dragon',
        dernierAcces: null,
        estConnecte: false,
        // createdAt and updatedAt are handled by default values
      },
      {
        prenom: 'Emma',
        nom: 'Durand',
        dateNaissance: new Date('2013-08-22'),
        niveauActuel: 'CM1',
        niveauScolaire: 'CM1',
        totalPoints: 200,
        serieJours: 5,
        mascotteType: 'unicorn',
        dernierAcces: null,
        estConnecte: false,
        // createdAt and updatedAt are handled by default values
      },
      {
        prenom: 'Noah',
        nom: 'Lefebvre',
        dateNaissance: new Date('2015-03-10'),
        niveauActuel: 'CE1',
        niveauScolaire: 'CE1',
        totalPoints: 75,
        serieJours: 1,
        mascotteType: 'robot',
        dernierAcces: null,
        estConnecte: false,
        // createdAt and updatedAt are handled by default values
      },
      {
        prenom: 'Alice',
        nom: 'Dupont',
        dateNaissance: new Date('2015-11-05'),
        niveauActuel: 'CE1',
        niveauScolaire: 'CE1',
        totalPoints: 120,
        serieJours: 2,
        mascotteType: 'cat',
        dernierAcces: null,
        estConnecte: false,
        // createdAt and updatedAt are handled by default values
      },
    ]);

    // Seed modules
    console.log('📖 Seeding modules...');
    const modules = await db.insert(schema.modules).values([
      {
        titre: 'Les nombres jusqu\'à 100',
        niveau: 'CE1',
        matiere: 'MATHEMATIQUES',
        ordre: 1,
        estActif: true,
      },
      {
        titre: 'Les verbes du premier groupe',
        niveau: 'CE2',
        matiere: 'FRANCAIS',
        ordre: 1,
        estActif: true,
      },
      {
        titre: 'Le système solaire',
        niveau: 'CM1',
        matiere: 'SCIENCES',
        ordre: 1,
        estActif: true,
      },
    ]);

    // Seed exercises
    console.log('🎯 Seeding exercises...');
    const exercise1: NewExercise = {
      titre: 'Compter de 10 en 10',
      description: 'Complète la suite : 10, 20, ___, 40, 50',
      matiere: 'mathematiques',
      niveau: 'CE1',
      difficulte: 'FACILE',
      competenceCode: 'MATH_COUNT_10',
      contenu: {
        question: 'Complète la suite : 10, 20, ___, 40, 50',
        options: ['25', '30', '35', '45']
      },
      solution: {
        correctAnswer: '30',
        explanation: 'En comptant de 10 en 10, après 20 vient 30'
      },
      typeExercice: 'multiple-choice',
      type: 'multiple-choice',
      xp: 10,
      configuration: JSON.stringify({
        question: 'Complète la suite : 10, 20, ___, 40, 50',
        options: ['25', '30', '35', '45'],
        correctAnswer: '30',
        explanation: 'En comptant de 10 en 10, après 20 vient 30',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const exercise2: NewExercise = {
      titre: 'Conjuguer CHANTER',
      description: 'Conjugue "chanter" à la première personne du singulier',
      matiere: 'francais',
      niveau: 'CE2',
      difficulte: 'MOYEN',
      competenceCode: 'FR_CONJ_PRES',
      contenu: {
        question: 'Conjugue "chanter" à la première personne du singulier',
        verb: 'chanter',
        person: 'first_singular'
      },
      solution: {
        correctAnswer: 'chante',
        explanation: 'Je chante - première personne du singulier du verbe chanter'
      },
      typeExercice: 'fill-in-blank',
      type: 'fill-in-blank',
      xp: 15,
      configuration: JSON.stringify({
        question: 'Conjugue "chanter" à la première personne du singulier',
        correctAnswer: 'chante',
        explanation: 'Je chante - première personne du singulier du verbe chanter',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const exercise3: NewExercise = {
      titre: 'Les planètes rocheuses',
      description: 'Quelles sont les planètes rocheuses du système solaire ?',
      matiere: 'sciences',
      niveau: 'CM1',
      difficulte: 'DIFFICILE',
      competenceCode: 'SCI_SPACE_PLANETS',
      contenu: {
        question: 'Quelles sont les planètes rocheuses du système solaire ?',
        options: ['Mercure, Vénus, Terre, Mars', 'Jupiter, Saturne, Uranus, Neptune', 'Toutes les planètes', 'Aucune']
      },
      solution: {
        correctAnswer: 'Mercure, Vénus, Terre, Mars',
        explanation: 'Les planètes rocheuses sont les 4 plus proches du Soleil'
      },
      typeExercice: 'multiple-choice',
      type: 'multiple-choice',
      xp: 20,
      configuration: JSON.stringify({
        question: 'Quelles sont les planètes rocheuses du système solaire ?',
        options: ['Mercure, Vénus, Terre, Mars', 'Jupiter, Saturne, Uranus, Neptune', 'Toutes les planètes', 'Aucune'],
        correctAnswer: 'Mercure, Vénus, Terre, Mars',
        explanation: 'Les planètes rocheuses sont les 4 plus proches du Soleil',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.exercises).values([exercise1, exercise2, exercise3]);

    console.log('✅ Simple database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Simple database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  // Check command line arguments for seed type
  const seedType = process.argv[2];
  
  if (seedType === 'simple') {
    simpleSeed()
      .then(() => {
        console.log('🎉 Simple seeding finished');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Simple seeding failed:', error);
        process.exit(1);
      });
  } else {
    // Default to comprehensive seeding
    seed()
      .then(() => {
        console.log('🎉 Comprehensive seeding finished');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Comprehensive seeding failed:', error);
        process.exit(1);
      });
  }
}
