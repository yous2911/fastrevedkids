// src/routes/curriculum.ts - Updated with Zod schemas
import { FastifyPluginAsync } from 'fastify';
import { db } from '../db/connection';
import { exercises, modules } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { curriculumSchemas } from '../schemas/curriculum.schema';

interface CurriculumLevel {
  id: string;
  name: string;
  displayName: string;
  order: number;
}

const SUPPORTED_LEVELS: CurriculumLevel[] = [
  { id: 'cp', name: 'CP', displayName: 'Cours Préparatoire', order: 1 },
  { id: 'ce1', name: 'CE1', displayName: 'Cours Élémentaire 1', order: 2 },
  { id: 'ce2', name: 'CE2', displayName: 'Cours Élémentaire 2', order: 3 },
  { id: 'cm1', name: 'CM1', displayName: 'Cours Moyen 1', order: 4 },
  { id: 'cm2', name: 'CM2', displayName: 'Cours Moyen 2', order: 5 },
  { id: 'cp-ce1', name: 'CP-CE1', displayName: 'Bridge CP-CE1', order: 1.5 }
];

const curriculumPlugin: FastifyPluginAsync = async (fastify, opts) => {
  // Get all supported levels
  fastify.get('/levels', {
    schema: curriculumSchemas.getLevels,
    handler: async (request, reply) => {
      try {
        // Get levels from database with counts
        const levelsData = await db
          .select({
            niveau: exercises.niveau,
            count: sql<number>`COUNT(DISTINCT ${exercises.matiere})`
          })
          .from(exercises)
          .groupBy(exercises.niveau);

        // Merge with supported levels configuration
        const enrichedLevels = SUPPORTED_LEVELS.map(level => {
          const dbLevel = levelsData.find(l => l.niveau.toLowerCase() === level.id);
          return {
            ...level,
            subjectsCount: dbLevel?.count || 0,
            available: !!dbLevel
          };
        });

        return reply.send({
          success: true,
          data: enrichedLevels,
          message: 'Niveaux disponibles récupérés'
        });
      } catch (error) {
        fastify.log.error('Get levels error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des niveaux',
            code: 'GET_LEVELS_ERROR'
          }
        });
      }
    }
  });

  // Get curriculum for a specific level
  fastify.get('/:level', {
    schema: curriculumSchemas.getCurriculumByLevel,
    handler: async (request: any, reply) => {
      try {
        const { level } = request.params;
        const { subject } = request.query;

        // Validate level
        const supportedLevel = SUPPORTED_LEVELS.find(l => l.id === level.toLowerCase());
        if (!supportedLevel) {
          return reply.status(404).send({
            success: false,
            error: {
              message: `Niveau ${level} non supporté`,
              code: 'INVALID_LEVEL',
              supportedLevels: SUPPORTED_LEVELS.map(l => l.id)
            }
          });
        }

        // Build query conditions
        const conditions = [
          eq(exercises.niveau, supportedLevel.name)
        ];

        if (subject) {
          conditions.push(eq(exercises.matiere, subject.toUpperCase()));
        }

        // Get curriculum data
        const curriculumData = await db
          .select({
            niveau: exercises.niveau,
            matiere: exercises.matiere,
            moduleId: exercises.moduleId,
            exercicesCount: sql<number>`COUNT(*)`
          })
          .from(exercises)
          .where(eq(exercises.niveau, supportedLevel.name))
          .groupBy(exercises.matiere, exercises.moduleId);

        // Get modules for this level
        const modulesData = await db
          .select()
          .from(modules)
          .where(eq(modules.niveau, supportedLevel.name));

        return reply.send({
          success: true,
          data: {
            level: supportedLevel,
            curriculum: {
              subjects: curriculumData,
              modules: modulesData
            },
            totalExercises: curriculumData.reduce((acc, curr) => acc + curr.exercicesCount, 0),
            lastUpdated: new Date().toISOString()
          },
          message: `Programme ${supportedLevel.displayName} récupéré`
        });
      } catch (error) {
        fastify.log.error('Get curriculum error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération du programme',
            code: 'GET_CURRICULUM_ERROR'
          }
        });
      }
    }
  });

  // Get subjects for a specific level
  fastify.get('/:level/subjects', {
    schema: curriculumSchemas.getSubjectsByLevel,
    handler: async (request: any, reply) => {
      try {
        const { level } = request.params;
        
        const subjects = await db
          .select({
            nom: exercises.matiere,
            exercicesCount: sql<number>`COUNT(*)`
          })
          .from(exercises)
          .where(eq(exercises.niveau, level.toUpperCase()))
          .groupBy(exercises.matiere);

        return reply.send({
          success: true,
          data: subjects.map(s => ({
            id: s.nom,
            nom: s.nom,
            exercicesCount: s.exercicesCount
          })),
          message: `Matières pour ${level} récupérées`
        });
      } catch (error) {
        fastify.log.error('Get subjects error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des matières',
            code: 'GET_SUBJECTS_ERROR'
          }
        });
      }
    }
  });

  // Get exercises for a specific level
  fastify.get('/:level/exercises', {
    schema: curriculumSchemas.getExercisesByLevel,
    handler: async (request: any, reply) => {
      try {
        const { level } = request.params;
        const { 
          subject, 
          difficulty, 
          type, 
          limit = 20, 
          offset = 0 
        } = request.query;

        // Build query conditions
        const conditions = [
          eq(exercises.niveau, level.toUpperCase())
        ];

        if (subject) {
          conditions.push(eq(exercises.matiere, subject.toUpperCase()));
        }
        if (difficulty) {
          conditions.push(eq(exercises.difficulte, difficulty.toUpperCase()));
        }

        // Get exercises with pagination
        const exercisesData = await db
          .select()
          .from(exercises)
          .where(eq(exercises.niveau, level.toUpperCase()))
          .limit(limit)
          .offset(offset);

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(exercises)
          .where(eq(exercises.niveau, level.toUpperCase()));

        const totalCount = countResult[0]?.count || 0;

        return reply.send({
          success: true,
          data: {
            exercises: exercisesData,
            pagination: {
              total: totalCount,
              limit,
              offset,
              hasMore: offset + limit < totalCount
            }
          },
          message: `Exercices pour ${level} récupérés`
        });
      } catch (error) {
        fastify.log.error('Get exercises error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des exercices',
            code: 'GET_EXERCISES_ERROR'
          }
        });
      }
    }
  });

  // Get statistics across all levels
  fastify.get('/statistics', {
    schema: curriculumSchemas.getStatistics,
    handler: async (request, reply) => {
      try {
        const stats = await db
          .select({
            level: exercises.niveau,
            subjectsCount: sql<number>`COUNT(DISTINCT ${exercises.matiere})`,
            exercisesCount: sql<number>`COUNT(*)`
          })
          .from(exercises)
          .groupBy(exercises.niveau);

        // Get exercise type distribution
        const exerciseTypes = await db
          .select({
            type: exercises.contenu,
            count: sql<number>`COUNT(*)`
          })
          .from(exercises)
          .groupBy(exercises.contenu);

        // Get difficulty distribution
        const difficultyDistribution = await db
          .select({
            difficulty: exercises.difficulte,
            count: sql<number>`COUNT(*)`
          })
          .from(exercises)
          .groupBy(exercises.difficulte);

        return reply.send({
          success: true,
          data: {
            levelStatistics: stats,
            exerciseTypes,
            difficultyDistribution,
            totalLevels: SUPPORTED_LEVELS.length,
            lastUpdated: new Date().toISOString()
          },
          message: 'Statistiques du programme récupérées'
        });
      } catch (error) {
        fastify.log.error('Get statistics error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des statistiques',
            code: 'GET_STATISTICS_ERROR'
          }
        });
      }
    }
  });
};

export default curriculumPlugin; 