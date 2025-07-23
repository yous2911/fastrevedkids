import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { db, testConnection } from '../db/connection';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }
}

async function databasePlugin(fastify: FastifyInstance): Promise<void> {
  // Test connection
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to database');
  }

  // Decorate fastify with database
  fastify.decorate('db', db);

  // Add health check hook
  fastify.addHook('onReady', async () => {
    const connected = await testConnection();
    if (connected) {
      fastify.log.info('Database connection verified');
    } else {
      fastify.log.error('Database connection failed');
    }
  });

  // Cleanup on close
  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing database connections...');
    // Connection pool will be closed automatically
  });
}

export default fp(databasePlugin, {
  name: 'database',
});
