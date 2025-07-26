import Fastify from 'fastify';
import { config, validateEnvironment } from './config/config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './db/connection';
import { setupDatabase } from './db/setup';

// Validate environment on startup
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// Build Fastify instance with enhanced configuration
const fastify = Fastify({
  logger: logger,
  trustProxy: true,
  bodyLimit: config.BODY_LIMIT,
  keepAliveTimeout: 5000,
  requestIdHeader: 'x-request-id',
  connectionTimeout: config.REQUEST_TIMEOUT,
  pluginTimeout: 30000,
  disableRequestLogging: false,
  genReqId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
});

// Enhanced port management to avoid EADDRINUSE
async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

// Register plugins in correct order
async function registerPlugins() {
  try {
    // Essential plugins first
    await fastify.register(import('./plugins/cors'));
    await fastify.register(import('./plugins/helmet'));
    
    // Database and cache
    await fastify.register(import('./plugins/database'));
    // await fastify.register(import('./plugins/redis'));
    
    // Auth and validation
    await fastify.register(import('./plugins/auth'));
    await fastify.register(import('./plugins/validation'));
    
    // Rate limiting and monitoring
    await fastify.register(import('./plugins/rate-limit'));
    await fastify.register(import('./plugins/monitoring'));
    
    // GDPR plugin (conditional registration)
    if (config.GDPR_ENABLED) {
      await fastify.register(import('./plugins/gdpr'));
    }
    
    // Optional plugins
    await fastify.register(import('./plugins/websocket'));
    await fastify.register(import('./plugins/swagger'));

    // Routes with proper prefixes
    await fastify.register(import('./routes/auth'), { prefix: '/api/auth' });
    await fastify.register(import('./routes/students'), { prefix: '/api/students' });
    await fastify.register(import('./routes/exercises'), { prefix: '/api' });
    await fastify.register(import('./routes/curriculum'), { prefix: '/api/curriculum' });
    await fastify.register(import('./routes/cp2025'), { prefix: '/api/cp2025' });
    await fastify.register(import('./routes/monitoring'), { prefix: '/api/monitoring' });
    
    // GDPR Compliance Routes
    if (config.GDPR_ENABLED) {
      await fastify.register(import('./routes/gdpr'), { prefix: '/api/gdpr' });
      fastify.log.info('✅ GDPR routes enabled');
    }
    
    // Health check route
    fastify.get('/api/health', async () => {
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      
      return {
        success: true,
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
          exercises: '/api/exercises',
          curriculum: '/api/curriculum',
          cp2025: '/api/cp2025',
          monitoring: '/api/monitoring',
          gdpr: config.GDPR_ENABLED ? '/api/gdpr' : 'disabled',
          docs: '/docs'
        }
      };
    });

    fastify.log.info('✅ All plugins registered successfully');
  } catch (error) {
    fastify.log.error('❌ Plugin registration failed:', error);
    throw error;
  }
}

// Graceful shutdown with proper cleanup
async function gracefulShutdown(signal: string) {
  try {
    fastify.log.info(`Received ${signal}, starting graceful shutdown...`);
    
    // Stop accepting new connections
    await fastify.close();
    
    // Close database connections
    await disconnectDatabase();
    
    fastify.log.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    fastify.log.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Enhanced server startup
async function start() {
  try {
    // Test database connection first
    await connectDatabase();
    fastify.log.info('✅ Database connected successfully');

    // Setup database tables and seed data
    await setupDatabase();
    fastify.log.info('✅ Database setup completed');

    // Initialize GDPR services if enabled
    if (config.GDPR_ENABLED) {
      // Initialize GDPR services
      const { AuditTrailService } = await import('./services/audit-trail.service');
      const { EncryptionService } = await import('./services/encryption.service');
      const { EmailService } = await import('./services/email.service');
      const { GDPRRightsService } = await import('./services/gdpr-rights.service');
      const { ParentalConsentService } = await import('./services/parental-consent.service');
      const { DataRetentionService } = await import('./services/data-retention.service');
      const { DataAnonymizationService } = await import('./services/data-anonymization.service');

      // Add services to fastify instance for route access
      fastify.decorate('auditService', new AuditTrailService());
      fastify.decorate('encryptionService', new EncryptionService());
      fastify.decorate('emailService', new EmailService());
      fastify.decorate('gdprService', new GDPRRightsService());
      fastify.decorate('consentService', new ParentalConsentService());
      fastify.decorate('retentionService', new DataRetentionService());
      fastify.decorate('anonymizationService', new DataAnonymizationService());

      fastify.log.info('✅ GDPR services initialized');
    }

    // Register all plugins and routes
    await registerPlugins();
    
    // Find available port if default is busy
    let serverPort = config.PORT;
    try {
      serverPort = await findAvailablePort(config.PORT);
      if (serverPort !== config.PORT) {
        fastify.log.warn(`Port ${config.PORT} busy, using port ${serverPort} instead`);
      }
    } catch (error) {
      fastify.log.error('Port detection failed, using default:', error);
    }
    
    // Start the server
    const address = await fastify.listen({
      port: serverPort,
      host: config.HOST
    });

    fastify.log.info(`🚀 RevEd Kids Fastify server started successfully!`);
    fastify.log.info(`📍 Server listening on: ${address}`);
    fastify.log.info(`🌍 Environment: ${config.NODE_ENV}`);
    fastify.log.info(`📊 Health Check: ${address}/api/health`);
    fastify.log.info(`📚 API Documentation: ${address}/docs`);
    fastify.log.info(`🔌 Port: ${serverPort} (requested: ${config.PORT})`);

  } catch (error) {
    fastify.log.error('❌ Server startup failed:', error);
    
    // Check for common port issues
    if ((error as any)?.code === 'EADDRINUSE') {
      fastify.log.error(`❌ Port ${config.PORT} is already in use. Please check if another process is running on this port.`);
      fastify.log.info('💡 Try: lsof -ti:3000 | xargs kill -9 (to kill processes on port 3000)');
    }
    
    process.exit(1);
  }
}

// Handle process signals properly
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
start();

export default fastify;
