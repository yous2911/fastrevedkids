// src/plugins/database.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { db } from '../db/connection';

const databasePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Decorate fastify with the database instance
  fastify.decorate('db', db);

  fastify.log.info('✅ Database plugin registered successfully');
};

export default fp(databasePlugin, { name: 'database' });
