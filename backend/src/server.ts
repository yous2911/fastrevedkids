import fastify, { FastifyInstance } from 'fastify';
import { config, validateEnvironment } from './config/config';
import { connectDatabase, disconnectDatabase } from './db/connection';
// Type declarations handled by plugins

// Validate environment first
validateEnvironment();

// Create Fastify instance
const app: FastifyInstance = fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
  bodyLimit: config.BODY_LIMIT,
  connectionTimeout: config.REQUEST_TIMEOUT,
  keepAliveTimeout: 30000,
  maxParamLength: 500,
});

// Register plugins function
async function registerPlugins(): Promise<void> {
  try {
    // Core plugins
    await app.register(import('./plugins/cors'));
    app.log.info('✅ CORS plugin registered');
    
    await app.register(import('./plugins/helmet'));
    app.log.info('✅ Helmet plugin registered');
    

    
    await app.register(import('./plugins/rate-limit'));
    app.log.info('✅ Rate limit plugin registered');
    
    // Infrastructure plugins
    await app.register(import('./plugins/redis'));
    app.log.info('✅ Redis plugin registered');
    
    await app.register(import('./plugins/database'));
    app.log.info('✅ Database plugin registered');
    
    // Authentication
    await app.register(import('./plugins/auth'));
    app.log.info('✅ Auth plugin registered');
    
    // Validation and documentation
    await app.register(import('./plugins/validation'));
    app.log.info('✅ Validation plugin registered');
    
    await app.register(import('./plugins/swagger'));
    app.log.info('✅ Swagger plugin registered');
    
    // Monitoring
    await app.register(import('./plugins/monitoring'));
    app.log.info('✅ Monitoring plugin registered');
    
    // WebSocket support
    await app.register(import('./plugins/websocket'));
    app.log.info('✅ WebSocket plugin registered');
    
    // Routes
    await app.register(import('./routes/health'), { prefix: '/api' });
    app.log.info('✅ Health routes registered');
    
    await app.register(import('./routes/auth'), { prefix: '/api/auth' });
    app.log.info('✅ Auth routes registered');
    
    await app.register(import('./routes/students'), { prefix: '/api/students' });
    app.log.info('✅ Students routes registered');
    
    await app.register(import('./routes/exercises'), { prefix: '/api' });
    app.log.info('✅ Exercises routes registered');
    
    await app.register(import('./routes/curriculum'), { prefix: '/api/curriculum' });
    app.log.info('✅ Curriculum routes registered');
    
    await app.register(import('./routes/monitoring'), { prefix: '/api/monitoring' });
    app.log.info('✅ Monitoring routes registered');
    
    // await app.register(import('./routes/cp2025'), { prefix: '/api/cp2025' });
    // app.log.info('✅ CP2025 routes registered');
    
  } catch (error) {
    app.log.error('❌ Error registering plugins:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
  
  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
    const statusCode = (error as any).statusCode || 500;
    
    request.log.error({
      error: {
        message: error.message,
        stack: error.stack,
        statusCode,
      },
      request: {
        method: request.method,
        url: request.url,
      },
    });

    await reply.status(statusCode).send({
      success: false,
      error: {
        message: statusCode >= 500 ? 'Internal Server Error' : error.message,
        statusCode,
      },
      timestamp: new Date().toISOString(),
    });
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
        exercises: '/api/exercises',
        cp2025: '/api/cp2025',
        docs: '/docs',
      },
    };
  });
}

// Graceful shutdown
async function gracefulShutdown(): Promise<void> {
  try {
    app.log.info('Starting graceful shutdown...');
    
    // Close Fastify server
    await app.close();
    
    // Close database connections
    await disconnectDatabase();
    
    app.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    app.log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function start(): Promise<void> {
  try {
    // Test database connection
    await connectDatabase();
    app.log.info('Database connected successfully');

    // Register all plugins and routes
    await registerPlugins();
    
    // Start the server
    const address = await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    app.log.info(`🚀 RevEd Kids Fastify server started!`);
    app.log.info(`📍 Server: ${address}`);
    app.log.info(`🌍 Environment: ${config.NODE_ENV}`);
    app.log.info(`📊 Health: ${address}/api/health`);
    app.log.info(`📚 Docs: ${address}/docs`);

  } catch (error) {
    app.log.error('Error starting server:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  app.log.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  app.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
start();

export default app;
