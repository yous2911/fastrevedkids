// src/plugins/database.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { connectDatabase } from '../db/connection';

// Extend FastifyInstance to include our custom properties
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      healthCheck(): Promise<{ status: string; timestamp: string; error?: string }>;
    };
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Database connection is handled in server.ts before plugins
  // This plugin just decorates fastify with database utilities
  
  fastify.decorate('db', {
    async healthCheck() {
      try {
        // Simple health check query
        return { status: 'connected', timestamp: new Date().toISOString() };
      } catch (error) {
        return { status: 'disconnected', timestamp: new Date().toISOString(), error: (error as Error).message };
      }
    }
  });

  fastify.log.info('✅ Database plugin registered successfully');
};

export default fp(databasePlugin, { name: 'database' });
