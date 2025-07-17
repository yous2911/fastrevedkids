import fp from 'fastify-plugin';
import underPressure from '@fastify/under-pressure';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const monitoringPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(underPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 1000000000,
    maxRssBytes: 1000000000,
    maxEventLoopUtilization: 0.98,
    message: 'Serveur surchargé, réessayez plus tard',
    retryAfter: 50,
  });

  // Performance metrics collection
  const metrics = {
    requests: 0,
    responses: 0,
    errors: 0,
    totalResponseTime: 0,
    startTime: Date.now(),
  };

  // Request timing hook
  fastify.addHook('onRequest', async (request) => {
    request.startTime = Date.now();
    metrics.requests++;
  });

  // Response timing hook
  fastify.addHook('onResponse', async (request, reply) => {
    if (request.startTime) {
      const responseTime = Date.now() - request.startTime;
      metrics.totalResponseTime += responseTime;
      metrics.responses++;
      
      if (reply.statusCode >= 400) {
        metrics.errors++;
      }
    }
  });

  // Metrics decorator
  fastify.decorate('metrics', {
    get() {
      const uptime = Date.now() - metrics.startTime;
      return {
        ...metrics,
        uptime,
        averageResponseTime: metrics.responses > 0 ? metrics.totalResponseTime / metrics.responses : 0,
        errorRate: metrics.responses > 0 ? (metrics.errors / metrics.responses) * 100 : 0,
      };
    },
    reset() {
      metrics.requests = 0;
      metrics.responses = 0;
      metrics.errors = 0;
      metrics.totalResponseTime = 0;
      metrics.startTime = Date.now();
    },
  });

  fastify.log.info('✅ Monitoring plugin registered successfully');
};

export default fp(monitoringPlugin, { name: 'monitoring' }); 