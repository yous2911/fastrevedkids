import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { corsConfig } from '../config/config';

const corsPlugin = async (fastify: any) => {
  await fastify.register(cors, {
    ...corsConfig,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });

  fastify.log.info('✅ CORS plugin registered');
};

export default fp(corsPlugin, { name: 'cors' });
