import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from '../services/analytics.service';

export default async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  const analyticsService = new AnalyticsService();

  // Performance analytics endpoint
  fastify.post('/performance', {
    schema: {
      body: {
        type: 'object',
        properties: {
          metrics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                metric: { type: 'object' },
                url: { type: 'string' },
                userAgent: { type: 'string' },
                timestamp: { type: 'number' },
                userId: { type: 'string' },
                sessionId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { metrics } = request.body as { metrics: any[] };
      
      // Log performance metrics (in production, you'd store these in a database)
      fastify.log.info('Performance metrics received', { 
        count: metrics.length,
        sessionId: metrics[0]?.sessionId 
      });

      return reply.send({
        success: true,
        message: 'Performance metrics received',
        count: metrics.length
      });
    } catch (error) {
      fastify.log.error('Performance analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to process performance metrics',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get student analytics
  fastify.get('/student/:studentId/progress', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'number' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: number };
      
      const progress = await analyticsService.getStudentProgress(studentId);

      return reply.send({
        success: true,
        data: progress
      });
    } catch (error) {
      fastify.log.error('Get student progress analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get student progress analytics',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get student session stats
  fastify.get('/student/:studentId/sessions', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', default: 30 }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: number };
      const { days } = request.query as { days?: number };
      
      const stats = await analyticsService.getStudentSessionStats(studentId, days);

      return reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      fastify.log.error('Get student session stats error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get student session stats',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get exercise completion rate
  fastify.get('/exercise/:exerciseId/completion', {
    schema: {
      params: {
        type: 'object',
        properties: {
          exerciseId: { type: 'number' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { exerciseId } = request.params as { exerciseId: number };
      
      const completion = await analyticsService.getExerciseCompletionRate(exerciseId);

      return reply.send({
        success: true,
        data: completion
      });
    } catch (error) {
      fastify.log.error('Get exercise completion rate error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get exercise completion rate',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });
} 