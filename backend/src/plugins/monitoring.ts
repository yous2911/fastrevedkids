// src/plugins/monitoring.ts
import fp from 'fastify-plugin';

interface RequestMetrics {
  requestCount: number;
  responseTime: number[];
  errorCount: number;
  statusCodes: Record<string, number>;
  endpoints: Record<
    string,
    {
      count: number;
      averageTime: number;
      errors: number;
    }
  >;
}

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

const monitoringPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const metrics: RequestMetrics = {
    requestCount: 0,
    responseTime: [],
    errorCount: 0,
    statusCodes: {},
    endpoints: {},
  };

  // Request timing hook
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.startTime = Date.now();
  });

  // Response monitoring hook
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const responseTime = Date.now() - (request.startTime || Date.now());
    const statusCode = reply.statusCode;
    const endpoint = `${request.method} ${request.routerPath || request.url}`;

    // Update metrics
    metrics.requestCount++;
    metrics.responseTime.push(responseTime);

    // Keep only last 1000 response times for memory efficiency
    if (metrics.responseTime.length > 1000) {
      metrics.responseTime = metrics.responseTime.slice(-1000);
    }

    // Track status codes
    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;

    // Track errors
    if (statusCode >= 400) {
      metrics.errorCount++;
    }

    // Track endpoint metrics
    if (!metrics.endpoints[endpoint]) {
      metrics.endpoints[endpoint] = { count: 0, averageTime: 0, errors: 0 };
    }

    const endpointMetric = metrics.endpoints[endpoint];
    endpointMetric.count++;
    endpointMetric.averageTime =
      (endpointMetric.averageTime * (endpointMetric.count - 1) + responseTime) /
      endpointMetric.count;

    if (statusCode >= 400) {
      endpointMetric.errors++;
    }

    // Log slow requests
    if (responseTime > 5000) {
      // 5 seconds
      fastify.log.warn({
        msg: 'Slow request detected',
        method: request.method,
        url: request.url,
        responseTime,
        statusCode,
      });
    }

    // Log errors
    if (statusCode >= 500) {
      fastify.log.error({
        msg: 'Server error',
        method: request.method,
        url: request.url,
        responseTime,
        statusCode,
      });
    }
  });

  // Error tracking hook
  fastify.setErrorHandler(async (error, request, reply) => {
    metrics.errorCount++;

    fastify.log.error({
      msg: 'Request error',
      method: request.method,
      url: request.url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    // Send structured error response
    const errorResponse = {
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message:
          fastify.config.NODE_ENV === 'production' ? 'An internal error occurred' : error.message,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.id,
    };

    reply.code(error.statusCode || 500).send(errorResponse);
  });

  // Add metrics getter to fastify instance
  fastify.decorate('getMetrics', () => {
    const avgResponseTime =
      metrics.responseTime.length > 0
        ? metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length
        : 0;

    const sortedResponseTimes = [...metrics.responseTime].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p95ResponseTime =
      sortedResponseTimes.length > 0 && p95Index < sortedResponseTimes.length
        ? sortedResponseTimes[p95Index] || 0
        : 0;

    return {
      ...metrics,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
      errorRate:
        metrics.requestCount > 0
          ? Math.round((metrics.errorCount / metrics.requestCount) * 10000) / 100
          : 0,
    };
  });

  // Reset metrics periodically to prevent memory leaks
  setInterval(() => {
    if (metrics.responseTime.length > 10000) {
      metrics.responseTime = metrics.responseTime.slice(-5000);
    }
  }, 60000); // Every minute
};

export default fp(monitoringPlugin, {
  name: 'monitoring',
});
