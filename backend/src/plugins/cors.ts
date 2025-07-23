import fastifyPlugin from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  });

  fastify.log.info('✅ CORS plugin registered successfully');
};

export default fastifyPlugin(corsPlugin, {
  name: 'cors-plugin',
  fastify: '5.x'
});
