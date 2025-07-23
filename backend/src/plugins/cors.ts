import fp from 'fastify-plugin';
import cors from '@fastify/cors';

import { config } from '../config/config.js';

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const config = validateEnvironment();

  await fastify.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  });

  fastify.log.info('✅ CORS plugin registered successfully');
};

export default fp(corsPlugin, {
  name: 'cors',
});
