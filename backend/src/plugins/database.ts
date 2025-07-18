// src/plugins/database.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { validateEnvironment } from '../config/environment.js';
import * as schema from '../db/schema.js';
import { DatabaseConfig } from '../types';

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  const config = validateEnvironment();

  // FIXED: Lines 31:21 & 82:21 - Replace any with DatabaseConfig
  const dbConfig: DatabaseConfig = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    connectionLimit: config.DB_CONNECTION_LIMIT,
    ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  const connection = mysql.createPool(dbConfig);
  const db = drizzle(connection, { schema });

  fastify.decorate('db', db);
  
  fastify.addHook('onClose', async () => {
    await connection.end();
  });
};

export default fp(databasePlugin, {
  name: 'database',
  dependencies: ['config'],
});
