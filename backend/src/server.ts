import Fastify, { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { config } from './config/config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './db/connection';

// Build Fastify instance
const fastify: FastifyInstance = Fastify({
  logger: logger,
  trustProxy: true,
  bodyLimit: 10485760, // 10MB
  keepAliveTimeout: 5000,
  requestIdHeader: 'x-request-id',
  genReqId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
});

// Plugin registration function
async function registerPlugins(): Promise<void> {
  try {
    // Core plugins
    await fastify.register(import('./plugins/database'));
    await fastify.register(import('./plugins/redis'));
    await fastify.register(import('./plugins/cors'));
    await fastify.register(import('./plugins/helmet'));
    await fastify.register(import('./plugins/compress'));
    await fastify.register(import('./plugins/rate-limit'));
    await fastify.register(import('./plugins/auth'));
    await fastify.register(import('./plugins/websocket'));
    await fastify.register(import('./plugins/swagger'));
    await fastify.register(import('./plugins/monitoring'));
    await fastify.register(import('./plugins/validation'));

    // Routes
    await fastify.register(import('./routes/auth'), { prefix: '/api/auth' });
    await fastify.register(import('./routes/students'), { prefix: '/api/students' });
    await fastify.register(import('./routes/subjects'), { prefix: '/api/subjects' });
    await fastify.register(import('./routes/revisions'), { prefix: '/api/revisions' });
    await fastify.register(import('./routes/monitoring'), { prefix: '/api/monitoring' });

    // Health check route
    fastify.get('/api/health', async () => {
      const uptime = process.uptime();
      const memory = process.memoryUsage();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        environment: config.NODE_ENV,
        version: '2.0.0',
        memory: {
          used: Math.round(memory.heapUsed / 1024 / 1024),
          total: Math.round(memory.heapTotal / 1024 / 1024),
          external: Math.round(memory.external / 1024 / 1024)
        },
        database: 'connected',
        redis: (fastify as any).redis ? 'connected' : 'disconnected'
      };
    });

    // Root endpoint
    fastify.get('/', async () => {
      return {
        success: true,
        message: 'RevEd Kids Fastify API',
        version: '2.0.0',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          students: '/api/students',
          subjects: '/api/subjects',
          revisions: '/api/revisions',
          monitoring: '/api/monitoring',
          docs: '/docs'
        }
      };
    });

    fastify.log.info('✅ All plugins registered successfully');
  } catch (error) {
    fastify.log.error('❌ Error registering plugins:', error);
    throw error;
  }
}

// Rest of your server code remains the same...
