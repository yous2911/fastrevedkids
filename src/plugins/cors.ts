import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { corsConfig } from '../config/config';

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cors, corsConfig);
  fastify.log.info('✅ CORS plugin registered successfully');
};

export default fp(corsPlugin, { name: 'cors' }); 