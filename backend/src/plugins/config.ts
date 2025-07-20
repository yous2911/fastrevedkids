// src/plugins/config.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { validateEnvironment } from '../config/environment.js';

const configPlugin: FastifyPluginAsync = async (fastify) => {
  const config = validateEnvironment();
  
  // Decorate fastify with config
  fastify.decorate('config', config as any);
};

export default fp(configPlugin, {
  name: 'config',
}); 