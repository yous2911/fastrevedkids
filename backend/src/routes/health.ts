import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { testConnection } from '../db/connection';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  services: {
    database: string;
    redis: string;
    [key: string]: string;
  };
  uptime: number;
  memory: NodeJS.MemoryUsage;
  environment?: string;
  system?: any;
}

// Helper function to test Redis connection
async function testRedisConnection(fastify: FastifyInstance): Promise<boolean> {
  try {
    if ((fastify as any).redis) {
      await (fastify as any).redis.ping();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Helper function to check service dependencies
async function checkServiceDependencies(fastify: FastifyInstance): Promise<{
  database: { status: string; responseTime: number };
  redis: { status: string; responseTime: number };
  filesystem: { status: string };
}> {
  const results = {
    database: { status: 'unknown', responseTime: 0 },
    redis: { status: 'unknown', responseTime: 0 },
    filesystem: { status: 'unknown' }
  };

  // Test database
  try {
    const dbStart = Date.now();
    const dbConnected = await testConnection();
    results.database.responseTime = Date.now() - dbStart;
    results.database.status = dbConnected ? 'healthy' : 'unhealthy';
  } catch (error) {
    results.database.status = 'unhealthy';
  }

  // Test Redis
  try {
    const redisStart = Date.now();
    const redisConnected = await testRedisConnection(fastify);
    results.redis.responseTime = Date.now() - redisStart;
    results.redis.status = redisConnected ? 'healthy' : process.env.REDIS_ENABLED === 'true' ? 'unhealthy' : 'disabled';
  } catch (error) {
    results.redis.status = process.env.REDIS_ENABLED === 'true' ? 'unhealthy' : 'disabled';
  }

  // Test filesystem (basic write test)
  try {
    const fs = require('fs');
    const testFile = '/tmp/health_check_test';
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    results.filesystem.status = 'healthy';
  } catch (error) {
    results.filesystem.status = 'unhealthy';
  }

  return results;
}

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Basic health check - lightweight for load balancers
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dbConnected = await testConnection();
      const redisConnected = await testRedisConnection(fastify);
      
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
          database: dbConnected ? 'connected' : 'disconnected',
          redis: redisConnected ? 'connected' : (process.env.REDIS_ENABLED === 'true' ? 'disconnected' : 'disabled'),
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      // Determine overall health status
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (!dbConnected) {
        overallStatus = 'unhealthy';
      } else if (process.env.REDIS_ENABLED === 'true' && !redisConnected) {
        overallStatus = 'degraded';
      }

      health.status = overallStatus;
      const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

      // Add response time header for monitoring
      reply.header('X-Health-Check-Time', Date.now().toString());
      
      return reply.status(statusCode).send(health);
    } catch (error) {
      fastify.log.error('Health check failed:', error);
      return reply.status(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        version: '2.0.0',
        services: { database: 'unknown', redis: 'unknown' },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    }
  });

  // Main readiness endpoint for production monitoring
  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dependencies = await checkServiceDependencies(fastify);
      
      const isReady = dependencies.database.status === 'healthy' && 
                     (dependencies.redis.status === 'healthy' || dependencies.redis.status === 'disabled');
      
      const readiness = {
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: dependencies.database.status,
            responseTime: `${dependencies.database.responseTime}ms`
          },
          redis: {
            status: dependencies.redis.status,
            responseTime: dependencies.redis.status !== 'disabled' ? `${dependencies.redis.responseTime}ms` : 'N/A'
          },
          filesystem: {
            status: dependencies.filesystem.status
          }
        }
      };

      // Add readiness score for monitoring
      let readinessScore = 0;
      if (dependencies.database.status === 'healthy') readinessScore += 70; // Database is critical
      if (dependencies.redis.status === 'healthy') readinessScore += 20;
      if (dependencies.redis.status === 'disabled') readinessScore += 20; // Don't penalize if Redis disabled
      if (dependencies.filesystem.status === 'healthy') readinessScore += 10;

      reply.header('X-Readiness-Score', readinessScore.toString());
      reply.header('X-Health-Check-Time', Date.now().toString());

      return reply.status(isReady ? 200 : 503).send(readiness);
    } catch (error) {
      fastify.log.error('Readiness check failed:', error);
      return reply.status(503).send({
        ready: false,
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed',
        checks: {}
      });
    }
  });

  // Detailed health check with comprehensive system information
  fastify.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dependencies = await checkServiceDependencies(fastify);
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV,
        services: {
          database: {
            status: dependencies.database.status,
            responseTime: `${dependencies.database.responseTime}ms`,
            connection_pool: 'active' // Could be enhanced with actual pool stats
          },
          redis: {
            status: dependencies.redis.status,
            responseTime: dependencies.redis.status !== 'disabled' ? `${dependencies.redis.responseTime}ms` : 'N/A',
            enabled: process.env.REDIS_ENABLED === 'true'
          },
          filesystem: {
            status: dependencies.filesystem.status,
            writable: dependencies.filesystem.status === 'healthy'
          }
        },
        system: {
          uptime: Math.floor(process.uptime()),
          memory: {
            ...process.memoryUsage(),
            usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heap_usage_percent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
          },
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
          arch: process.arch
        },
        configuration: {
          cors_enabled: true,
          rate_limiting: true,
          helmet_enabled: true,
          ssl_enabled: process.env.HTTPS_ONLY === 'true',
          gdpr_compliance: process.env.GDPR_ENABLED === 'true'
        }
      };

      // Determine overall health status
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (dependencies.database.status !== 'healthy') {
        overallStatus = 'unhealthy';
      } else if (dependencies.redis.status === 'unhealthy' || dependencies.filesystem.status !== 'healthy') {
        overallStatus = 'degraded';
      }

      health.status = overallStatus;
      const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
      
      reply.header('X-Health-Check-Time', Date.now().toString());
      reply.header('X-Service-Version', '2.0.0');
      
      return reply.status(statusCode).send(health);
    } catch (error) {
      fastify.log.error('Detailed health check failed:', error);
      return reply.status(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Detailed health check failed',
        version: '2.0.0'
      });
    }
  });

  // Readiness probe
  fastify.get('/health/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dbConnected = await testConnection();
      
      if (dbConnected) {
        return reply.send({ status: 'ready' });
      } else {
        return reply.status(503).send({ status: 'not_ready', reason: 'database_disconnected' });
      }
    } catch (error) {
      return reply.status(503).send({ status: 'not_ready', reason: 'health_check_failed' });
    }
  });

  // Liveness probe
  fastify.get('/health/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: 'alive', timestamp: new Date().toISOString() });
  });
} 