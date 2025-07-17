import { getDatabase, connectDatabase, disconnectDatabase } from './connection';
import { students, modules, exercises } from './schema';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    
    await connectDatabase();
    const db = getDatabase();

    // Create sample students
    console.log('Creating sample students...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.insert(students).values([
      {
        prenom: 'Alice',
        nom: 'Dupont',
        dateNaissance: new Date('2015-03-15'),
        age: 9,
        niveauActuel: 'CE2',
        emailParent: 'parent1@example.com',
        motDePasseHash: hashedPassword,
        totalPoints: 250,
        serieJours: 5,
        preferences: { theme: 'colorful', sound: true },
        adaptations: { fontSize: 'large' },
      },
      {
        prenom: 'Thomas',
        nom: 'Martin',
        dateNaissance: new Date('2014-09-22'),
        age: 10,
        niveauActuel: 'CM1',
        emailParent: 'parent2@example.com',
        motDePasseHash: hashedPassword,
        totalPoints: 180,
        serieJours: 3,
        preferences: { theme: 'space', sound: false },
        adaptations: {},
      },
      {
        prenom: 'Emma',
        nom: 'Bernard',
        dateNaissance: new Date('2016-01-10'),
        age: 8,
        niveauActuel: 'CE1',
        emailParent: 'parent3@example.com',
        motDePasseHash: hashedPassword,
        totalPoints: 95,
        serieJours: 1,
        preferences: { theme: 'nature', sound: true },
        adaptations: { difficulty: 'easy' },
      },
    ]);

    // Create sample modules
    console.log('Creating sample modules...');
    await db.insert(modules).values([
      {
        titre: 'Addition et Soustraction',
        description: 'Apprentissage des opérations de base',
        niveau: 'CE2',
        matiere: 'MATHEMATIQUES',
        periode: 'P1',
        ordre: 1,
        actif: true,
        metadata: { difficulty: 'beginner', estimatedDuration: 120 },
      },
      {
        titre: 'Tables de Multiplication',
        description: 'Mémorisation des tables de multiplication',
        niveau: 'CE2',
        matiere: 'MATHEMATIQUES',
        periode: 'P2',
        ordre: 2,
        actif: true,
        metadata: { difficulty: 'intermediate', estimatedDuration: 180 },
      },
      {
        titre: 'Lecture et Compréhension',
        description: 'Améliorer la lecture et la compréhension de texte',
        niveau: 'CE2',
        matiere: 'FRANCAIS',
        periode: 'P1',
        ordre: 1,
        actif: true,
        metadata: { difficulty: 'beginner', estimatedDuration: 150 },
      },
      {
        titre: 'Grammaire de Base',
        description: 'Les règles fondamentales de grammaire',
        niveau: 'CE2',
        matiere: 'FRANCAIS',
        periode: 'P2',
        ordre: 2,
        actif: true,
        metadata: { difficulty: 'intermediate', estimatedDuration: 200 },
      },
    ]);

    // Create sample exercises
    console.log('Creating sample exercises...');
    await db.insert(exercises).values([
      {
        titre: 'Addition simple 1-10',
        consigne: 'Calculez les additions suivantes',
        type: 'CALCUL',
        difficulte: 'decouverte',
        pointsReussite: 10,
        dureeEstimee: 5,
        ordre: 1,
        moduleId: 1, // Addition et Soustraction
        configuration: {
          questions: [
            { question: '3 + 4 = ?', answer: 7 },
            { question: '5 + 2 = ?', answer: 7 },
            { question: '1 + 9 = ?', answer: 10 },
          ],
        },
        actif: true,
        metadata: { tags: ['addition', 'basic'] },
      },
      {
        titre: 'Soustraction simple 1-10',
        consigne: 'Calculez les soustractions suivantes',
        type: 'CALCUL',
        difficulte: 'decouverte',
        pointsReussite: 10,
        dureeEstimee: 5,
        ordre: 2,
        moduleId: 1,
        configuration: {
          questions: [
            { question: '10 - 3 = ?', answer: 7 },
            { question: '8 - 5 = ?', answer: 3 },
            { question: '9 - 4 = ?', answer: 5 },
          ],
        },
        actif: true,
        metadata: { tags: ['soustraction', 'basic'] },
      },
      {
        titre: 'Table de 2',
        consigne: 'Récitez et calculez la table de multiplication de 2',
        type: 'QCM',
        difficulte: 'consolidation',
        pointsReussite: 15,
        dureeEstimee: 8,
        ordre: 1,
        moduleId: 2, // Tables de Multiplication
        configuration: {
          questions: [
            {
              question: '2 × 3 = ?',
              options: ['4', '6', '8', '10'],
              correctAnswer: 1,
            },
            {
              question: '2 × 7 = ?',
              options: ['12', '14', '16', '18'],
              correctAnswer: 1,
            },
          ],
        },
        actif: true,
        metadata: { tags: ['multiplication', 'table2'] },
      },
      {
        titre: 'Lecture de phrase simple',
        consigne: 'Lisez la phrase et répondez aux questions',
        type: 'LECTURE',
        difficulte: 'decouverte',
        pointsReussite: 12,
        dureeEstimee: 10,
        ordre: 1,
        moduleId: 3, // Lecture et Compréhension
        configuration: {
          text: 'Le chat mange sa nourriture dans la cuisine.',
          questions: [
            {
              question: 'Où le chat mange-t-il ?',
              options: ['Dans le salon', 'Dans la cuisine', 'Dans la chambre'],
              correctAnswer: 1,
            },
          ],
        },
        actif: true,
        metadata: { tags: ['lecture', 'comprehension'] },
      },
      {
        titre: 'Reconnaître le nom',
        consigne: 'Identifiez les noms dans les phrases suivantes',
        type: 'DRAG_DROP',
        difficulte: 'consolidation',
        pointsReussite: 15,
        dureeEstimee: 12,
        ordre: 1,
        moduleId: 4, // Grammaire de Base
        configuration: {
          sentence: 'Le chien court dans le jardin.',
          words: ['Le', 'chien', 'court', 'dans', 'le', 'jardin'],
          correctNouns: ['chien', 'jardin'],
        },
        actif: true,
        metadata: { tags: ['grammaire', 'nom'] },
      },
    ]);

    console.log('✅ Database seeded successfully');
    
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase(); 