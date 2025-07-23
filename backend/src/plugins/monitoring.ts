// src/plugins/monitoring.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

// Extend FastifyInstance to include our custom properties
declare module 'fastify' {
  interface FastifyInstance {
    monitoring: {
      getMetrics(): {
        requests: { total: number; errors: number };
        responseTime: { sum: number; count: number };
        startTime: number;
        avgResponseTime: number;
        uptime: number;
        memory: NodeJS.MemoryUsage;
      };
      resetMetrics(): void;
    };
  }
}

const monitoringPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Performance metrics
  const metrics = {
    requests: { total: 0, errors: 0 },
    responseTime: { sum: 0, count: 0 },
    startTime: Date.now(),
  };

  // Request tracking
  fastify.addHook('onRequest', async (request) => {
    (request as any).startTime = Date.now();
    metrics.requests.total++;
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - (request as any).startTime;
    metrics.responseTime.sum += responseTime;
    metrics.responseTime.count++;
    
    if (reply.statusCode >= 400) {
      metrics.requests.errors++;
    }
  });

  // Decorate with monitoring utilities
  fastify.decorate('monitoring', {
    getMetrics: () => ({
      ...metrics,
      avgResponseTime: metrics.responseTime.count > 0 
        ? Math.round(metrics.responseTime.sum / metrics.responseTime.count) 
        : 0,
      uptime: Date.now() - metrics.startTime,
      memory: process.memoryUsage(),
    }),
    resetMetrics: () => {
      metrics.requests = { total: 0, errors: 0 };
      metrics.responseTime = { sum: 0, count: 0 };
    },
  });

  fastify.log.info('✅ Monitoring plugin registered successfully');
};

export default fp(monitoringPlugin, { name: 'monitoring' });
