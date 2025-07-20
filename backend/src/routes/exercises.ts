import { FastifyInstance } from 'fastify';
import { databaseService } from '../services/database.service.js';
import { exerciseGeneratorService } from '../services/exercise-generator.service.js';

export default async function exerciseRoutes(fastify: FastifyInstance) {
  // Get exercises by level and subject
  fastify.get('/by-level/:niveau', {
    schema: {
      params: {
        type: 'object',
        required: ['niveau'],
        properties: {
          niveau: { type: 'string', enum: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'] }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          matiere: { type: 'string' },
          limit: { type: 'number', default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { niveau } = request.params as { niveau: string };
      const { matiere, limit } = request.query as { matiere?: string; limit?: number };
      
      const exercises = await databaseService.getExercisesByLevel(niveau, matiere, limit);
      
      return {
        success: true,
        data: {
          exercises,
          count: exercises.length,
          niveau,
          matiere: matiere || 'all'
        }
      };
    } catch (error) {
      fastify.log.error('Get exercises error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exercises'
        }
      });
    }
  });

  // Get specific exercise by ID
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number };
      
      const exercise = await databaseService.getExerciseById(id);
      
      if (!exercise) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EXERCISE_NOT_FOUND',
            message: 'Exercise not found'
          }
        });
      }

      return {
        success: true,
        data: { exercise }
      };
    } catch (error) {
      fastify.log.error('Get exercise error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exercise'
        }
      });
    }
  });

  // Generate new exercises
  fastify.post('/generate', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['niveau', 'matiere'],
        properties: {
          niveau: { type: 'string', enum: ['cp', 'ce1', 'ce2', 'cm1', 'cm2'] },
          matiere: { type: 'string' },
          difficulte: { type: 'string', enum: ['decouverte', 'entrainement', 'maitrise', 'expert'] },
          count: { type: 'number', default: 5 },
          concepts: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { niveau, matiere, difficulte, count, concepts } = request.body as any;
      
      const exercises = exerciseGeneratorService.generateExercisesBatch(
        niveau,
        matiere,
        difficulte,
        count,
        concepts
      );

      return {
        success: true,
        data: {
          exercises,
          count: exercises.length,
          niveau,
          matiere,
          difficulte
        }
      };
    } catch (error) {
      fastify.log.error('Generate exercises error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate exercises'
        }
      });
    }
  });

  // Get personalized exercises for student
  fastify.get('/personalized', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          matiere: { type: 'string' },
          count: { type: 'number', default: 3 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const { matiere, count } = request.query as { matiere?: string; count?: number };
      
      // Get student info
      const student = await databaseService.getStudentById(studentId);
      if (!student) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found'
          }
        });
      }

      // Get student's weak areas (simplified - you can enhance this)
      const weakConcepts: string[] = []; // TODO: Analyze student progress to find weak areas
      
      const exercises = exerciseGeneratorService.generatePersonalizedExercises(
        studentId,
        student.niveauActuel as any,
        matiere as any || 'mathematiques',
        weakConcepts,
        count
      );

      return {
        success: true,
        data: {
          exercises,
          count: exercises.length,
          niveau: student.niveauActuel,
          matiere: matiere || 'mathematiques',
          personalized: true
        }
      };
    } catch (error) {
      fastify.log.error('Get personalized exercises error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get personalized exercises'
        }
      });
    }
  });

  // Submit exercise answer
  fastify.post('/:id/submit', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        required: ['answer'],
        properties: {
          answer: { type: 'string' },
          timeSpent: { type: 'number' },
          attempts: { type: 'number', default: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const { id } = request.params as { id: number };
      const { answer, timeSpent, attempts } = request.body as any;
      
      // Get exercise
      const exercise = await databaseService.getExerciseById(id);
      if (!exercise) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EXERCISE_NOT_FOUND',
            message: 'Exercise not found'
          }
        });
      }

      // Check answer (simplified - you can enhance this)
      const isCorrect = checkAnswer(exercise, answer);
      const points = isCorrect ? exercise.pointsMax : 0;

      // Record progress
      const progress = await databaseService.recordProgress({
        studentId,
        exerciseId: id,
        statut: isCorrect ? 'TERMINE' : 'ECHEC',
        nombreTentatives: attempts,
        nombreReussites: isCorrect ? 1 : 0,
        tauxReussite: isCorrect ? 100 : 0,
        pointsGagnes: points,
        derniereTentative: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        data: {
          correct: isCorrect,
          points,
          progress,
          feedback: isCorrect ? exercise.contenu?.feedback_succes : exercise.contenu?.feedback_echec
        }
      };
    } catch (error) {
      fastify.log.error('Submit exercise error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit exercise'
        }
      });
    }
  });

  // Get available exercise templates
  fastify.get('/templates', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          niveau: { type: 'string' },
          matiere: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { niveau, matiere } = request.query as { niveau?: string; matiere?: string };
      
      const templates = exerciseGeneratorService.getAvailableTemplates(
        niveau as any,
        matiere as any
      );

      return {
        success: true,
        data: {
          templates: templates.map(t => ({
            type: t.type,
            niveau: t.niveau,
            matiere: t.matiere,
            difficulte: t.difficulte,
            concepts: t.concepts
          })),
          count: templates.length
        }
      };
    } catch (error) {
      fastify.log.error('Get templates error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get templates'
        }
      });
    }
  });

  // Health check for exercise service
  fastify.get('/health', async (request, reply) => {
    try {
      const dbHealth = await databaseService.healthCheck();
      
      return {
        success: true,
        data: {
          service: 'exercises',
          status: 'healthy',
          timestamp: new Date(),
          database: dbHealth.status,
          templates: exerciseGeneratorService.getAvailableTemplates().length,
          details: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: dbHealth.details
          }
        }
      };
    } catch (error) {
      fastify.log.error('Exercise health check error:', error);
      return reply.status(503).send({
        success: false,
        error: {
          code: 'SERVICE_UNHEALTHY',
          message: 'Exercise service is unhealthy'
        }
      });
    }
  });
}

// Helper function to check answers
function checkAnswer(exercise: any, answer: string): boolean {
  if (!exercise.contenu) return false;
  
  const expected = exercise.contenu.reponse_attendue;
  if (Array.isArray(expected)) {
    return expected.includes(answer);
  }
  
  return answer.toLowerCase().trim() === expected.toLowerCase().trim();
} 