import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { monitoringSchemas } from '../schemas/monitoring.schema';

export default async function monitoringRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', {
    schema: monitoringSchemas.health,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const dbHealth = await fastify.dbHealth();
        const cacheStats = await fastify.cache.stats();
        const metrics = fastify.metrics.get();

        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '2.0.0',
          database: dbHealth,
          cache: cacheStats,
          metrics: {
            requests: metrics.requests,
            responses: metrics.responses,
            errors: metrics.errors,
            averageResponseTime: metrics.averageResponseTime,
            errorRate: metrics.errorRate,
          },
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
          },
        };

        // Determine overall health status
        if (dbHealth.status !== 'healthy' || metrics.errorRate > 10) {
          health.status = 'unhealthy';
          return reply.status(503).send({
            success: false,
            data: health,
            message: 'Service unhealthy',
          });
        }

        if (metrics.errorRate > 5 || metrics.averageResponseTime > 1000) {
          health.status = 'degraded';
        }

        return reply.send({
          success: true,
          data: health,
          message: `Service is ${health.status}`,
        });
      } catch (error) {
        fastify.log.error('Health check error:', error);
        return reply.status(503).send({
          success: false,
          error: {
            message: 'Health check failed',
            code: 'HEALTH_CHECK_FAILED',
          },
        });
      }
    },
  });

  // Performance metrics
  fastify.get('/metrics', {
    schema: monitoringSchemas.metrics,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const metrics = fastify.metrics.get();
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return reply.send({
          success: true,
          data: {
            performance: metrics,
            system: {
              memory: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss,
              },
              cpu: cpuUsage,
              uptime: process.uptime(),
              nodeVersion: process.version,
              platform: process.platform,
            },
            timestamp: new Date().toISOString(),
          },
          message: 'Performance metrics retrieved successfully',
        });
      } catch (error) {
        fastify.log.error('Metrics error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Unable to retrieve metrics',
            code: 'METRICS_ERROR',
          },
        });
      }
    },
  });

  // Cache statistics
  fastify.get('/cache', {
    schema: monitoringSchemas.cache,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const cacheStats = await fastify.cache.stats();

        return reply.send({
          success: true,
          data: cacheStats,
          message: 'Cache statistics retrieved successfully',
        });
      } catch (error) {
        fastify.log.error('Cache stats error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Unable to retrieve cache statistics',
            code: 'CACHE_STATS_ERROR',
          },
        });
      }
    },
  });

  // Clear cache
  fastify.delete('/cache', {
    schema: monitoringSchemas.clearCache,
    handler: async (request: FastifyRequest<{
      Querystring: { pattern?: string }
    }>, reply: FastifyReply) => {
      try {
        const pattern = request.query.pattern || '*';
        
        let deletedCount = 0;
        if (pattern === '*') {
          await fastify.cache.flush();
          deletedCount = -1; // Indicates full flush
        } else {
          // For pattern matching, we'd need Redis SCAN or implement pattern matching
          // Simplified for this example
          deletedCount = await fastify.cache.del(pattern);
        }

        return reply.send({
          success: true,
          data: { deletedCount, pattern },
          message: deletedCount === -1 
            ? 'Cache flushed completely' 
            : `Cache cleared: ${deletedCount} entries deleted`,
        });
      } catch (error) {
        fastify.log.error('Clear cache error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Unable to clear cache',
            code: 'CLEAR_CACHE_ERROR',
          },
        });
      }
    },
  });

  // Reset metrics
  fastify.post('/reset', {
    schema: monitoringSchemas.reset,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        fastify.metrics.reset();

        return reply.send({
          success: true,
          message: 'Monitoring metrics reset successfully',
        });
      } catch (error) {
        fastify.log.error('Reset metrics error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Unable to reset metrics',
            code: 'RESET_METRICS_ERROR',
          },
        });
      }
    },
  });
} 