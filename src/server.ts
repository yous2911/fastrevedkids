import Fastify from 'fastify';
import { config } from './config/config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './db/connection';

// Build Fastify instance
const fastify = Fastify({
  logger: logger,
  trustProxy: true,
  bodyLimit: 10485760, // 10MB
  keepAliveTimeout: 5000,
  requestIdHeader: 'x-request-id',
  genReqId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
});

// Register plugins
async function registerPlugins() {
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
      environment: config!.NODE_ENV,
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
      environment: config!.NODE_ENV,
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
}

// Graceful shutdown
async function gracefulShutdown() {
  try {
    fastify.log.info('Starting graceful shutdown...');
    
    // Close Fastify server (this also closes all plugins)
    await fastify.close();
    
    // Close database connections
    await disconnectDatabase();
    
    fastify.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    // Test database connection
    await connectDatabase();
    fastify.log.info('Database connected successfully');

    // Register all plugins and routes
    await registerPlugins();
    
    // Start the server
    const address = await fastify.listen({
      port: config.PORT,
      host: config.HOST
    });

    fastify.log.info(`🚀 RevEd Kids Fastify server started successfully!`);
    fastify.log.info(`📍 Server listening on: ${address}`);
    fastify.log.info(`🌍 Environment: ${config.NODE_ENV}`);
    fastify.log.info(`📊 Health Check: ${address}/api/health`);
    fastify.log.info(`📚 API Documentation: ${address}/docs`);

  } catch (error) {
    fastify.log.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
start();

export default fastify; 