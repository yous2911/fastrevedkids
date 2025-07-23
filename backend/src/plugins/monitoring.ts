// src/plugins/monitoring.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

// Conditional Prometheus import
let promClient: any;
try {
  promClient = require('prom-client');
} catch (error) {
  console.warn('Prometheus client not installed, metrics disabled');
  promClient = {
    collectDefaultMetrics: () => {},
    register: {
      metrics: () => Promise.resolve(''),
      clear: () => {},
    },
    Counter: class MockCounter { 
      inc() {} 
      labels() { return this; }
    },
    Histogram: class MockHistogram {
      observe() {}
      labels() { return this; }
      startTimer() { return () => {}; }
    },
    Gauge: class MockGauge {
      set() {}
      inc() {}
      dec() {}
      labels() { return this; }
    },
  };
}

// Metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const memoryUsage = new promClient.Gauge({
  name: 'nodejs_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

async function monitoringPlugin(fastify: FastifyInstance): Promise<void> {
  // Collect default metrics
  promClient.collectDefaultMetrics();

  // Request monitoring hook
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any).startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const responseTime = Date.now() - ((request as any).startTime || Date.now());
    const route = request.routerPath || request.url;
    
    httpRequestDuration
      .labels(request.method, route, reply.statusCode.toString())
      .observe(responseTime / 1000);
    
    httpRequestsTotal
      .labels(request.method, route, reply.statusCode.toString())
      .inc();
  });

  // Memory monitoring
  setInterval(() => {
    const memInfo = process.memoryUsage();
    memoryUsage.labels('rss').set(memInfo.rss);
    memoryUsage.labels('heapUsed').set(memInfo.heapUsed);
    memoryUsage.labels('heapTotal').set(memInfo.heapTotal);
    memoryUsage.labels('external').set(memInfo.external);
  }, 30000);

  // Metrics endpoint
  fastify.get('/api/monitoring/metrics', async (request, reply) => {
    try {
      const metrics = await promClient.register.metrics();
      reply.type('text/plain').send(metrics);
    } catch (error) {
      reply.status(500).send({ error: 'Failed to collect metrics' });
    }
  });

  // Health check endpoint
  fastify.get('/api/monitoring/health', async () => {
    const memInfo = process.memoryUsage();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: memInfo.heapUsed,
        total: memInfo.heapTotal,
        external: memInfo.external,
        rss: memInfo.rss,
      },
      version: process.version,
    };
  });

  // System metrics endpoint
  fastify.get('/api/monitoring/system', async () => {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  });
}

export default fp(monitoringPlugin, {
  name: 'monitoring',
});
