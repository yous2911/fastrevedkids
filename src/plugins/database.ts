import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { connectDatabase, getDatabase } from '../db/connection';

// Removed unused FastifyInstance

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof getDatabase>;
    dbHealth: () => Promise<{ status: string; message: string }>;
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  // Connect to database
  await connectDatabase();
  const db = getDatabase();

  // Decorate fastify with database instance
  fastify.decorate('db', db);

  // Add database health check
  fastify.decorate('dbHealth', async () => {
    try {
      // Simple query to test connection
      await db.execute('SELECT 1');
      return { status: 'healthy', message: 'Database connection OK' };
    } catch (error) {
      fastify.log.error('Database health check failed:', error);
      return { status: 'unhealthy', message: 'Database connection failed' };
    }
  });

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    // Close database connections if needed
    fastify.log.info('Database connections closed');
  });

  fastify.log.info('✅ Database plugin registered successfully');
};

export default fp(databasePlugin, {
  name: 'database',
}); 