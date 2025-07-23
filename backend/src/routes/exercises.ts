import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CP2025Service } from '../services/cp2025.service';
import { AnalyticsService } from '../services/analytics.service';
import { RecommendationService } from '../services/recommendation.service';
import type { AuthenticatedRequest } from '../types/fastify-extended';

// Validation schemas
const exerciseQuerySchema = z.object({
  level: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  type: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
});

const attemptSchema = z.object({
  exerciseId: z.number(),
  score: z.number().min(0).max(100),
  completed: z.boolean(),
  timeSpent: z.number().optional(),
  answers: z.any().optional(),
});

export default async function exerciseRoutes(fastify: FastifyInstance): Promise<void> {
  const cp2025Service = new CP2025Service();
  const analyticsService = new AnalyticsService();
  const recommendationService = new RecommendationService();

  // Get all exercises with filters
  fastify.get('/exercises', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          level: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          type: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
          search: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = exerciseQuerySchema.parse(request.query);
      
      let exercises = await cp2025Service.getAllExercises();

      // Apply filters
      if (query.level) {
        exercises = await cp2025Service.getExercisesByLevel(query.level);
      }

      if (query.difficulty) {
        // Map query difficulty to schema difficulty
        const difficultyMap: Record<string, 'FACILE' | 'MOYEN' | 'DIFFICILE'> = {
          'easy': 'FACILE',
          'medium': 'MOYEN', 
          'hard': 'DIFFICILE'
        };
        const mappedDifficulty = difficultyMap[query.difficulty];
        if (mappedDifficulty) {
          exercises = exercises.filter(ex => ex.difficulte === mappedDifficulty);
        }
      }

      if (query.search) {
        exercises = await cp2025Service.searchExercises(query.search);
      }

      // Apply limit
      exercises = exercises.slice(0, query.limit);

      return reply.send({
        success: true,
        data: {
          exercises,
          total: exercises.length,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Invalid query parameters',
            details: error.errors,
            statusCode: 400,
          },
        });
      }

      fastify.log.error('Get exercises error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch exercises',
          statusCode: 500,
        },
      });
    }
  });

  // Get exercise by ID
  fastify.get('/exercises/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const exerciseId = Number(request.params.id);
      const exercise = await cp2025Service.getExerciseById(exerciseId);

      if (!exercise) {
        return reply.status(404).send({
          success: false,
          error: {
            message: 'Exercise not found',
            statusCode: 404,
          },
        });
      }

      return reply.send({
        success: true,
        data: { exercise },
      });
    } catch (error) {
      fastify.log.error('Get exercise error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch exercise',
          statusCode: 500,
        },
      });
    }
  });

  // Get recommended exercises for authenticated user
  fastify.get('/exercises/recommendations', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 20, default: 5 },
        },
      },
    },
  }, async (request: AuthenticatedRequest<{ Querystring: { limit?: number } }>, reply: FastifyReply) => {
    try {
      const limit = request.query?.limit || 5;
      const recommendations = await recommendationService.getRecommendedExercises(
        request.user.id,
        limit
      );

      return reply.send({
        success: true,
        data: {
          recommendations,
          total: recommendations.length,
        },
      });
    } catch (error) {
      fastify.log.error('Get recommendations error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch recommendations',
          statusCode: 500,
        },
      });
    }
  });

  // Get next exercise for user
  fastify.get('/exercises/next', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          moduleId: { type: 'number' },
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const moduleId = request.query?.moduleId;
      const nextExercise = await recommendationService.getNextExercise(
        request.user.id,
        moduleId
      );

      if (!nextExercise) {
        return reply.send({
          success: true,
          data: {
            exercise: null,
            message: 'No more exercises available',
          },
        });
      }

      return reply.send({
        success: true,
        data: { exercise: nextExercise },
      });
    } catch (error) {
      fastify.log.error('Get next exercise error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch next exercise',
          statusCode: 500,
        },
      });
    }
  });

  // Submit exercise attempt
  fastify.post('/exercises/attempts', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['exerciseId', 'score', 'completed'],
        properties: {
          exerciseId: { type: 'number' },
          score: { type: 'number', minimum: 0, maximum: 100 },
          completed: { type: 'boolean' },
          timeSpent: { type: 'number' },
          answers: {},
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const attemptData = attemptSchema.parse(request.body);

      // Verify exercise exists
      const exercise = await cp2025Service.getExerciseById(attemptData.exerciseId);
      if (!exercise) {
        return reply.status(404).send({
          success: false,
          error: {
            message: 'Exercise not found',
            statusCode: 404,
          },
        });
      }

      // Record the attempt
      const success = await recommendationService.recordExerciseAttempt({
        studentId: request.user.id,
        exerciseId: attemptData.exerciseId,
        score: attemptData.score,
        completed: attemptData.completed,
        timeSpent: attemptData.timeSpent,
      });

      if (!success) {
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Failed to record attempt',
            statusCode: 500,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          message: 'Attempt recorded successfully',
          score: attemptData.score,
          completed: attemptData.completed,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Invalid attempt data',
            details: error.errors,
            statusCode: 400,
          },
        });
      }

      fastify.log.error('Submit attempt error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to submit attempt',
          statusCode: 500,
        },
      });
    }
  });

  // Get user progress
  fastify.get('/students/:studentId/progress', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'number' },
        },
      },
    },
  }, async (request: AuthenticatedRequest<{ Params: { studentId: number } }>, reply: FastifyReply) => {
    try {
      const studentId = Number(request.params.studentId);
      
      // Check if user can access this student's data
      if (request.user.id !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Access denied',
            statusCode: 403,
          },
        });
      }

      const progress = await analyticsService.getStudentProgress(studentId);

      return reply.send({
        success: true,
        data: { progress },
      });
    } catch (error) {
      fastify.log.error('Get progress error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch progress',
          statusCode: 500,
        },
      });
    }
  });

  // Get exercise statistics
  fastify.get('/exercises/statistics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await cp2025Service.getExerciseStatistics();

      return reply.send({
        success: true,
        data: { statistics: stats },
      });
    } catch (error) {
      fastify.log.error('Get exercise statistics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch statistics',
          statusCode: 500,
        },
      });
    }
  });

  // Get all modules
  fastify.get('/modules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const modules = await cp2025Service.getAllModules();

      return reply.send({
        success: true,
        data: {
          modules,
          total: modules.length,
        },
      });
    } catch (error) {
      fastify.log.error('Get modules error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch modules',
          statusCode: 500,
        },
      });
    }
  });

  // Get module by ID
  fastify.get('/modules/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const moduleId = Number(request.params.id);
      const module = await cp2025Service.getModuleById(moduleId);

      if (!module) {
        return reply.status(404).send({
          success: false,
          error: {
            message: 'Module not found',
            statusCode: 404,
          },
        });
      }

      return reply.send({
        success: true,
        data: { module },
      });
    } catch (error) {
      fastify.log.error('Get module error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch module',
          statusCode: 500,
        },
      });
    }
  });

  // Get exercises by module
  fastify.get('/modules/:id/exercises', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const moduleId = Number(request.params.id);
      const exercises = await cp2025Service.getExercisesByModule(moduleId);

      return reply.send({
        success: true,
        data: {
          exercises,
          total: exercises.length,
        },
      });
    } catch (error) {
      fastify.log.error('Get module exercises error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to fetch module exercises',
          statusCode: 500,
        },
      });
    }
  });
} 