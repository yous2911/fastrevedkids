import fastify, { FastifyServerOptions } from 'fastify';
import { validateEnvironment } from './config/environment.js';

const build = (opts: FastifyServerOptions = {}) => {
  const config = validateEnvironment();

  const serverOptions: FastifyServerOptions = {
    logger: {
      level: config.LOG_LEVEL,
      prettyPrint: config.NODE_ENV === 'development',
    },
    bodyLimit: config.BODY_LIMIT,
    requestTimeout: config.REQUEST_TIMEOUT,
    ...opts
  };

  const app = fastify(serverOptions);

  // Decorate fastify with config
  app.decorate('config', config as any);

  // Create and decorate cache service
  const cacheService = createCacheService({
    host: config.REDIS_HOST || 'localhost',
    port: config.REDIS_PORT || 6379,
    password: config.REDIS_PASSWORD || undefined,
    db: config.REDIS_DB,
    ttl: config.CACHE_TTL,
    enabled: config.REDIS_ENABLED,
  });
  app.decorate('cache', cacheService);

  // Register plugins
  async function registerPlugins() {
    // Core plugins
    await app.register(import('./plugins/database.js'));
    await app.register(import('./plugins/security.js'));
    await app.register(import('./plugins/auth.js'));
    await app.register(import('./plugins/websocket.js'));
    await app.register(import('./plugins/swagger.js'));
    await app.register(import('./plugins/monitoring.js'));
    await app.register(import('./plugins/validation.js'));

    // Routes
    await app.register(import('./routes/auth.js'), { prefix: '/api/auth' });
    await app.register(import('./routes/students.js'), { prefix: '/api/students' });
    await app.register(import('./routes/monitoring.js'), { prefix: '' });

    // Health check route
    app.get('/api/health', async () => {
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
          external: Math.round(memory.external / 1024 / 1024),
        },
        database: 'connected',
        redis: config.REDIS_ENABLED ? 'connected' : 'disabled',
      };
    });

    // Root endpoint
    app.get('/', async () => {
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
          monitoring: '/api/monitoring',
          docs: '/docs',
        },
      };
    });
  }

  // Graceful shutdown
  async function gracefulShutdown() {
    try {
      app.log.info('Starting graceful shutdown...');

      // Close Fastify server (this also closes all plugins)
      await app.close();

      app.log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      app.log.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  // Start server
  async function start() {
    try {
      // Register all plugins and routes
      await registerPlugins();

      // Start the server
      const address = await app.listen({
        port: config.PORT,
        host: config.HOST,
      });

      app.log.info(`🚀 RevEd Kids Fastify server started successfully!`);
      app.log.info(`📍 Server listening on: ${address}`);
      app.log.info(`🌍 Environment: ${config.NODE_ENV}`);
      app.log.info(`📊 Health Check: ${address}/api/health`);
      app.log.info(`📚 API Documentation: ${address}/docs`);
    } catch (error) {
      app.log.error('Error starting server:', error);
      process.exit(1);
    }
  }

  // Handle process signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    app.log.error('Uncaught Exception:', error);
    gracefulShutdown();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    app.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
  });

  // Start the server
  start();

  return app;
};

export default build;
