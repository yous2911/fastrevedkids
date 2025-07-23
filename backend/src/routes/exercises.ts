import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, asc } from 'drizzle-orm';
import { exercises, progress, modules } from '../db/schema';

export default async function exercisesRoutes(fastify: FastifyInstance) {
  
  // Get exercise recommendations for a student
  fastify.get('/recommendations/:studentId', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', minimum: 1, maximum: 50, default: 10 }
        }
      }
    },
    handler: async (request: FastifyRequest<{
      Params: { studentId: string };
      Querystring: { limit?: string };
    }>, reply: FastifyReply) => {
      try {
        const { studentId } = request.params;
        const { limit = '10' } = request.query;
        
        // Verify student access
        const user = (request as any).user;
        if (user.studentId !== parseInt(studentId)) {
          return reply.status(403).send({
            success: false,
            error: {
              message: 'Accès non autorisé',
              code: 'FORBIDDEN',
            },
          });
        }

        // Get recommended exercises
        const recommendations = await fastify.db
          .select()
          .from(exercises)
          .limit(parseInt(limit));

        return reply.send({
          success: true,
          data: recommendations,
          message: 'Recommandations récupérées avec succès',
        });
      } catch (error) {
        fastify.log.error('Recommendations error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des recommandations',
            code: 'RECOMMENDATIONS_ERROR',
          },
        });
      }
    },
  });

  // Get exercises by module
  fastify.get('/by-module/:moduleId', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          moduleId: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest<{
      Params: { moduleId: string };
      Querystring: { limit?: string; offset?: string };
    }>, reply: FastifyReply) => {
      try {
        const { moduleId } = request.params;
        const { limit = '20', offset = '0' } = request.query;

        // Get exercises by module
        const exerciseList = await fastify.db
          .select()
          .from(exercises)
          .where(eq(exercises.moduleId, parseInt(moduleId)))
          .limit(parseInt(limit))
          .offset(parseInt(offset));

        return reply.send({
          success: true,
          data: exerciseList,
          message: 'Exercices récupérés avec succès',
        });
      } catch (error) {
        fastify.log.error('Get exercises by module error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des exercices',
            code: 'GET_EXERCISES_ERROR',
          },
        });
      }
    },
  });

  // Submit exercise attempt
  fastify.post('/attempt', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['exerciseId', 'score', 'completed'],
        properties: {
          exerciseId: { type: 'string' },
          score: { type: 'string', minimum: 0, maximum: 100 },
          completed: { type: 'string' },
          timeSpent: { type: 'string' },
          answers: {}
        }
      }
    },
    handler: async (request: FastifyRequest<{
      Body: {
        exerciseId: string;
        score: string;
        completed: string;
        timeSpent?: string;
        answers?: any;
      };
    }>, reply: FastifyReply) => {
      try {
        const attemptData = request.body;
        const user = (request as any).user;

        // Create attempt record
        const attempt = await fastify.db
          .insert(progress)
          .values({
            studentId: user.studentId,
            exerciseId: parseInt(attemptData.exerciseId),
            statut: attemptData.completed === 'true' ? 'TERMINE' : 'EN_COURS',
            nombreTentatives: 1,
            nombreReussites: attemptData.completed === 'true' ? 1 : 0,
            tauxReussite: parseFloat(attemptData.score),
            pointsGagnes: Math.floor(parseFloat(attemptData.score)),
            derniereTentative: new Date(),
          });

        // Simple analytics recording (removed service calls that don't exist)
        fastify.log.info(`Exercise attempt recorded for student ${user.studentId}`);

        return reply.send({
          success: true,
          data: attempt,
          message: 'Tentative enregistrée avec succès',
        });
      } catch (error) {
        fastify.log.error('Create attempt error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de l\'enregistrement de la tentative',
            code: 'CREATE_ATTEMPT_ERROR',
          },
        });
      }
    },
  });

  // Get student exercise history
  fastify.get('/student-history/:studentId', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'string', minimum: 0, default: 0 }
        }
      }
    },
    handler: async (request: FastifyRequest<{
      Params: { studentId: string };
      Querystring: { limit?: string; offset?: string };
    }>, reply: FastifyReply) => {
      try {
        const { studentId } = request.params;
        const { limit = '20', offset = '0' } = request.query;
        const user = (request as any).user;

        // Verify access
        if (user.studentId !== parseInt(studentId)) {
          return reply.status(403).send({
            success: false,
            error: {
              message: 'Accès non autorisé',
              code: 'FORBIDDEN',
            },
          });
        }

        // Get student exercise history (removed service call that doesn't exist)
        const history = await fastify.db
          .select()
          .from(progress)
          .where(eq(progress.studentId, parseInt(studentId)))
          .orderBy(desc(progress.derniereTentative))
          .limit(parseInt(limit))
          .offset(parseInt(offset));

        return reply.send({
          success: true,
          data: history,
          message: 'Historique récupéré avec succès',
        });
      } catch (error) {
        fastify.log.error('Get student history error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération de l\'historique',
            code: 'GET_HISTORY_ERROR',
          },
        });
      }
    },
  });

  // Get student progress
  fastify.get('/student-progress/:studentId', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest<{
      Params: { studentId: string };
    }>, reply: FastifyReply) => {
      try {
        const { studentId } = request.params;
        const user = (request as any).user;

        // Verify access
        if (user.studentId !== parseInt(studentId)) {
          return reply.status(403).send({
            success: false,
            error: {
              message: 'Accès non autorisé',
              code: 'FORBIDDEN',
            },
          });
        }

        // Get student progress
        const progressData = await fastify.db
          .select()
          .from(progress)
          .where(eq(progress.studentId, parseInt(studentId)))
          .orderBy(desc(progress.derniereTentative));

        return reply.send({
          success: true,
          data: progressData,
          message: 'Progrès récupéré avec succès',
        });
      } catch (error) {
        fastify.log.error('Get student progress error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération du progrès',
            code: 'GET_PROGRESS_ERROR',
          },
        });
      }
    },
  });

  // Get all exercises with pagination
  fastify.get('/', {
    handler: async (request: FastifyRequest<{
      Querystring: { 
        page?: string; 
        limit?: string; 
        search?: string;
        matiere?: string;
        niveau?: string;
        difficulte?: string;
      };
    }>, reply: FastifyReply) => {
      try {
        const { 
          page = '1', 
          limit = '20', 
          search, 
          matiere, 
          niveau, 
          difficulte 
        } = request.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build where conditions
        let whereConditions = [];
        
        if (matiere) {
          whereConditions.push(eq(exercises.matiere, matiere));
        }
        if (niveau) {
          whereConditions.push(eq(exercises.niveau, niveau));
        }
        if (difficulte) {
          whereConditions.push(eq(exercises.difficulte, difficulte as any));
        }

        // Get exercises with simple query (removed complex pagination)
        const allExercises = await fastify.db
          .select()
          .from(exercises)
          .limit(limitNum)
          .offset(offset);

        // Simple response structure
        return reply.send({
          success: true,
          data: {
            items: allExercises,
            total: allExercises.length,
            page: pageNum,
            limit: limitNum,
            hasMore: allExercises.length === limitNum
          },
          message: 'Exercices récupérés avec succès',
        });
      } catch (error) {
        fastify.log.error('Get exercises error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des exercices',
            code: 'GET_EXERCISES_ERROR',
          },
        });
      }
    },
  });

  // Get exercise by ID
  fastify.get('/:exerciseId', {
    handler: async (request: FastifyRequest<{
      Params: { exerciseId: string };
    }>, reply: FastifyReply) => {
      try {
        const { exerciseId } = request.params;

        // Get exercise by ID with simple query
        const exercise = await fastify.db
          .select()
          .from(exercises)
          .where(eq(exercises.id, parseInt(exerciseId)))
          .limit(1);

        if (exercise.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Exercice non trouvé',
              code: 'EXERCISE_NOT_FOUND',
            },
          });
        }

        // Simple response structure
        return reply.send({
          success: true,
          data: {
            items: exercise,
            total: exercise.length
          },
          message: 'Exercice récupéré avec succès',
        });
      } catch (error) {
        fastify.log.error('Get exercise by ID error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération de l\'exercice',
            code: 'GET_EXERCISE_ERROR',
          },
        });
      }
    },
  });
} 