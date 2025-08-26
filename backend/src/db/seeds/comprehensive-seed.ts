import { db } from '../connection';
import * as schema from '../schema';
import type { 
  NewStudent, 
  NewExercise, 
  NewModule, 
  NewStudentProgress,
  NewStudentLearningPath,
  NewSession,
  NewRevision
} from '../schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export async function comprehensiveSeed(): Promise<void> {
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // =============================================================================
    // SEED STUDENTS
    // =============================================================================
    console.log('👥 Seeding students...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const studentsData: NewStudent[] = [
      {
        prenom: 'Lucas',
        nom: 'Martin',
        email: 'lucas.martin@test.com',
        passwordHash: hashedPassword,
        dateNaissance: new Date('2014-05-15'),
        niveauActuel: 'CE2',
        niveauScolaire: 'CE2',
        totalPoints: 150,
        serieJours: 3,
        mascotteType: 'dragon',
        mascotteColor: '#ff6b35',
        dernierAcces: new Date(),
        estConnecte: false,
      },
      {
        prenom: 'Emma',
        nom: 'Durand',
        email: 'emma.durand@test.com',
        passwordHash: hashedPassword,
        dateNaissance: new Date('2013-08-22'),
        niveauActuel: 'CM1',
        niveauScolaire: 'CM1',
        totalPoints: 200,
        serieJours: 5,
        mascotteType: 'unicorn',
        mascotteColor: '#9b59b6',
        dernierAcces: new Date(),
        estConnecte: false,
      },
      {
        prenom: 'Noah',
        nom: 'Lefebvre',
        email: 'noah.lefebvre@test.com',
        passwordHash: hashedPassword,
        dateNaissance: new Date('2015-03-10'),
        niveauActuel: 'CE1',
        niveauScolaire: 'CE1',
        totalPoints: 75,
        serieJours: 1,
        mascotteType: 'robot',
        mascotteColor: '#3498db',
        dernierAcces: new Date(),
        estConnecte: false,
      },
      {
        prenom: 'Alice',
        nom: 'Dupont',
        email: 'alice.dupont@test.com',
        passwordHash: hashedPassword,
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
        prenom: 'Thomas',
        nom: 'Moreau',
        email: 'thomas.moreau@test.com',
        passwordHash: hashedPassword,
        dateNaissance: new Date('2014-12-03'),
        niveauActuel: 'CE2',
        niveauScolaire: 'CE2',
        totalPoints: 180,
        serieJours: 4,
        mascotteType: 'dragon',
        mascotteColor: '#f39c12',
        dernierAcces: new Date(),
        estConnecte: false,
      }
    ];

    const insertedStudents = await db.insert(schema.students).values(studentsData);
    console.log(`✅ Inserted ${studentsData.length} students`);

    // =============================================================================
    // SEED MODULES
    // =============================================================================
    console.log('📖 Seeding modules...');
    
    const modulesData: NewModule[] = [
      {
        titre: 'Les nombres jusqu\'à 100',
        niveau: 'CE1',
        matiere: 'mathematiques',
        ordre: 1,
        estActif: true,
      },
      {
        titre: 'Addition et soustraction',
        niveau: 'CE1',
        matiere: 'mathematiques',
        ordre: 2,
        estActif: true,
      },
      {
        titre: 'Les verbes du premier groupe',
        niveau: 'CE2',
        matiere: 'francais',
        ordre: 1,
        estActif: true,
      },
      {
        titre: 'La conjugaison au présent',
        niveau: 'CE2',
        matiere: 'francais',
        ordre: 2,
        estActif: true,
      },
      {
        titre: 'Le système solaire',
        niveau: 'CM1',
        matiere: 'sciences',
        ordre: 1,
        estActif: true,
      },
      {
        titre: 'Les animaux et leur habitat',
        niveau: 'CM1',
        matiere: 'sciences',
        ordre: 2,
        estActif: true,
      },
      {
        titre: 'Multiplication et division',
        niveau: 'CE2',
        matiere: 'mathematiques',
        ordre: 1,
        estActif: true,
      },
      {
        titre: 'La lecture et la compréhension',
        niveau: 'CE1',
        matiere: 'francais',
        ordre: 1,
        estActif: true,
      }
    ];

    const insertedModules = await db.insert(schema.modules).values(modulesData);
    console.log(`✅ Inserted ${modulesData.length} modules`);

    // =============================================================================
    // SEED EXERCISES
    // =============================================================================
    console.log('🎯 Seeding exercises...');
    
    const exercisesData: NewExercise[] = [
      // Mathématiques CE1
      {
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
        pointsRecompense: 10,
        tempsEstime: 60,
        configuration: JSON.stringify({
          question: 'Complète la suite : 10, 20, ___, 40, 50',
          options: ['25', '30', '35', '45'],
          correctAnswer: '30',
          explanation: 'En comptant de 10 en 10, après 20 vient 30',
        }),
      },
      {
        titre: 'Addition simple',
        description: 'Combien font 15 + 8 ?',
        matiere: 'mathematiques',
        niveau: 'CE1',
        difficulte: 'FACILE',
        competenceCode: 'MATH_ADD_SIMPLE',
        contenu: {
          question: 'Combien font 15 + 8 ?',
          options: ['21', '22', '23', '24']
        },
        solution: {
          correctAnswer: '23',
          explanation: '15 + 8 = 23'
        },
        typeExercice: 'multiple-choice',
        type: 'multiple-choice',
        xp: 10,
        pointsRecompense: 10,
        tempsEstime: 45,
        configuration: JSON.stringify({
          question: 'Combien font 15 + 8 ?',
          options: ['21', '22', '23', '24'],
          correctAnswer: '23',
          explanation: '15 + 8 = 23',
        }),
      },
      {
        titre: 'Soustraction',
        description: 'Combien font 25 - 7 ?',
        matiere: 'mathematiques',
        niveau: 'CE1',
        difficulte: 'MOYEN',
        competenceCode: 'MATH_SUB_SIMPLE',
        contenu: {
          question: 'Combien font 25 - 7 ?'
        },
        solution: {
          correctAnswer: '18',
          explanation: '25 - 7 = 18'
        },
        typeExercice: 'fill-in-blank',
        type: 'fill-in-blank',
        xp: 15,
        pointsRecompense: 15,
        tempsEstime: 60,
        configuration: JSON.stringify({
          question: 'Combien font 25 - 7 ?',
          correctAnswer: '18',
          explanation: '25 - 7 = 18',
        }),
      },
      // Français CE2
      {
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
        pointsRecompense: 15,
        tempsEstime: 90,
        configuration: JSON.stringify({
          question: 'Conjugue "chanter" à la première personne du singulier',
          correctAnswer: 'chante',
          explanation: 'Je chante - première personne du singulier du verbe chanter',
        }),
      },
      {
        titre: 'Les articles définis',
        description: 'Complète avec le bon article : ___ chat',
        matiere: 'francais',
        niveau: 'CE2',
        difficulte: 'FACILE',
        competenceCode: 'FR_ARTICLES',
        contenu: {
          question: 'Complète avec le bon article : ___ chat',
          options: ['le', 'la', 'les', 'un']
        },
        solution: {
          correctAnswer: 'le',
          explanation: 'Le chat - article défini masculin singulier'
        },
        typeExercice: 'multiple-choice',
        type: 'multiple-choice',
        xp: 10,
        pointsRecompense: 10,
        tempsEstime: 30,
        configuration: JSON.stringify({
          question: 'Complète avec le bon article : ___ chat',
          options: ['le', 'la', 'les', 'un'],
          correctAnswer: 'le',
          explanation: 'Le chat - article défini masculin singulier',
        }),
      },
      // Sciences CM1
      {
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
        pointsRecompense: 20,
        tempsEstime: 120,
        configuration: JSON.stringify({
          question: 'Quelles sont les planètes rocheuses du système solaire ?',
          options: ['Mercure, Vénus, Terre, Mars', 'Jupiter, Saturne, Uranus, Neptune', 'Toutes les planètes', 'Aucune'],
          correctAnswer: 'Mercure, Vénus, Terre, Mars',
          explanation: 'Les planètes rocheuses sont les 4 plus proches du Soleil',
        }),
      },
      // Mathématiques CE2
      {
        titre: 'Multiplication par 2',
        description: 'Combien font 7 × 2 ?',
        matiere: 'mathematiques',
        niveau: 'CE2',
        difficulte: 'MOYEN',
        competenceCode: 'MATH_MULT_2',
        contenu: {
          question: 'Combien font 7 × 2 ?',
          options: ['12', '14', '16', '18']
        },
        solution: {
          correctAnswer: '14',
          explanation: '7 × 2 = 14'
        },
        typeExercice: 'multiple-choice',
        type: 'multiple-choice',
        xp: 15,
        pointsRecompense: 15,
        tempsEstime: 60,
        configuration: JSON.stringify({
          question: 'Combien font 7 × 2 ?',
          options: ['12', '14', '16', '18'],
          correctAnswer: '14',
          explanation: '7 × 2 = 14',
        }),
      },
      {
        titre: 'Division simple',
        description: 'Combien font 16 ÷ 4 ?',
        matiere: 'mathematiques',
        niveau: 'CE2',
        difficulte: 'DIFFICILE',
        competenceCode: 'MATH_DIV_SIMPLE',
        contenu: {
          question: 'Combien font 16 ÷ 4 ?'
        },
        solution: {
          correctAnswer: '4',
          explanation: '16 ÷ 4 = 4'
        },
        typeExercice: 'fill-in-blank',
        type: 'fill-in-blank',
        xp: 20,
        pointsRecompense: 20,
        tempsEstime: 90,
        configuration: JSON.stringify({
          question: 'Combien font 16 ÷ 4 ?',
          correctAnswer: '4',
          explanation: '16 ÷ 4 = 4',
        }),
      }
    ];

    const insertedExercises = await db.insert(schema.exercises).values(exercisesData);
    console.log(`✅ Inserted ${exercisesData.length} exercises`);

    // =============================================================================
    // SEED STUDENT PROGRESS
    // =============================================================================
    console.log('📊 Seeding student progress...');
    
    // Get the inserted students and exercises to create progress records
    const students = await db.select().from(schema.students);
    const exercises = await db.select().from(schema.exercises);
    
    const progressData: NewStudentProgress[] = [];
    
    // Create progress records for each student on some exercises
    students.forEach((student, studentIndex) => {
      exercises.forEach((exercise, exerciseIndex) => {
        // Create varied progress data
        const isCompleted = Math.random() > 0.5;
        const score = isCompleted ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 60);
        const attempts = Math.floor(Math.random() * 3) + 1;
        const timeSpent = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
        
        progressData.push({
          studentId: student.id,
          exerciseId: exercise.id,
          competenceCode: exercise.competenceCode,
          progressPercent: String(isCompleted ? 100 : Math.floor(Math.random() * 90) + 10),
          masteryLevel: isCompleted ? 'mastered' : ['not_started', 'in_progress', 'needs_review'][Math.floor(Math.random() * 3)],
          totalAttempts: attempts,
          successfulAttempts: isCompleted ? attempts : Math.floor(Math.random() * attempts),
          averageScore: String(score),
          bestScore: String(score + Math.floor(Math.random() * 20)),
          totalTimeSpent: timeSpent,
          lastAttemptAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
          masteredAt: isCompleted ? new Date() : null,
          needsReview: Math.random() > 0.7,
          reviewScheduledAt: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          streakCount: Math.floor(Math.random() * 5),
          difficultyPreference: ['FACILE', 'MOYEN', 'DIFFICILE'][Math.floor(Math.random() * 3)],
          // Legacy fields
          completed: isCompleted,
          score: String(score),
          timeSpent: timeSpent,
          attempts: attempts,
          completedAt: isCompleted ? new Date() : null,
        });
      });
    });

    const insertedProgress = await db.insert(schema.studentProgress).values(progressData);
    console.log(`✅ Inserted ${progressData.length} progress records`);

    // =============================================================================
    // SEED STUDENT LEARNING PATHS
    // =============================================================================
    console.log('🛤️ Seeding learning paths...');
    
    const learningPathData: NewStudentLearningPath[] = [];
    
    students.forEach((student) => {
      exercises.forEach((exercise) => {
        const isAvailable = Math.random() > 0.3;
        const currentLevel = ['decouverte', 'pratique', 'maitrise'][Math.floor(Math.random() * 3)];
        
        learningPathData.push({
          studentId: student.id,
          competenceCode: exercise.competenceCode,
          currentLevel: currentLevel,
          targetLevel: 'maitrise',
          status: isAvailable ? 'available' : 'locked',
          priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
          recommendedDifficulty: exercise.difficulte,
          estimatedCompletionTime: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
          personalizedOrder: Math.floor(Math.random() * 10),
          isBlocked: !isAvailable,
          blockingReasons: !isAvailable ? ['prerequisite_not_met'] : null,
          unlockedAt: isAvailable ? new Date() : null,
        });
      });
    });

    const insertedLearningPaths = await db.insert(schema.studentLearningPath).values(learningPathData);
    console.log(`✅ Inserted ${learningPathData.length} learning path records`);

    // =============================================================================
    // SEED SESSIONS
    // =============================================================================
    console.log('🔐 Seeding sessions...');
    
    const sessionsData: NewSession[] = students.slice(0, 3).map(student => ({
      id: uuidv4(),
      studentId: student.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    }));

    const insertedSessions = await db.insert(schema.sessions).values(sessionsData);
    console.log(`✅ Inserted ${sessionsData.length} sessions`);

    // =============================================================================
    // SEED REVISIONS
    // =============================================================================
    console.log('📝 Seeding revisions...');
    
    const revisionsData: NewRevision[] = [];
    
    students.slice(0, 3).forEach((student) => {
      exercises.slice(0, 5).forEach((exercise) => {
        const revisionDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days
        const score = Math.floor(Math.random() * 100) + 1;
        
        revisionsData.push({
          studentId: student.id,
          exerciseId: exercise.id,
          revisionDate: revisionDate,
          score: score,
        });
      });
    });

    const insertedRevisions = await db.insert(schema.revisions).values(revisionsData);
    console.log(`✅ Inserted ${revisionsData.length} revision records`);

    // =============================================================================
    // SEED AUDIT LOGS (for compliance testing)
    // =============================================================================
    console.log('📋 Seeding audit logs...');
    
    const auditLogsData = [
      {
        id: uuidv4(),
        entityType: 'student',
        entityId: students[0].id.toString(),
        action: 'login',
        userId: students[0].id.toString(),
        studentId: students[0].id.toString(),
        details: { ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'low',
        category: 'authentication',
        sessionId: sessionsData[0].id,
        correlationId: uuidv4(),
        checksum: 'abc123',
        encrypted: false,
      },
      {
        id: uuidv4(),
        entityType: 'exercise',
        entityId: exercises[0].id.toString(),
        action: 'completed',
        userId: students[0].id.toString(),
        studentId: students[0].id.toString(),
        details: { score: 85, timeSpent: 120 },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        category: 'learning',
        sessionId: sessionsData[0].id,
        correlationId: uuidv4(),
        checksum: 'def456',
        encrypted: false,
      }
    ];

    const insertedAuditLogs = await db.insert(schema.auditLogs).values(auditLogsData);
    console.log(`✅ Inserted ${auditLogsData.length} audit log records`);

    console.log('🎉 Comprehensive database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${studentsData.length} students`);
    console.log(`   - ${modulesData.length} modules`);
    console.log(`   - ${exercisesData.length} exercises`);
    console.log(`   - ${progressData.length} progress records`);
    console.log(`   - ${learningPathData.length} learning paths`);
    console.log(`   - ${sessionsData.length} sessions`);
    console.log(`   - ${revisionsData.length} revisions`);
    console.log(`   - ${auditLogsData.length} audit logs`);
    
    console.log('\n🔑 Test Credentials:');
    studentsData.forEach(student => {
      console.log(`   Email: ${student.email}, Password: password123`);
    });

  } catch (error) {
    console.error('❌ Comprehensive seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  comprehensiveSeed()
    .then(() => {
      console.log('🎉 Comprehensive seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Comprehensive seeding failed:', error);
      process.exit(1);
    });
}
