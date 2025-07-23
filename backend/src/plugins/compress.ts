// src/plugins/compress.ts
import fp from 'fastify-plugin';
import compress from '@fastify/compress';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const compressPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['gzip', 'deflate'],
  });
  
  fastify.log.info('✅ Compression plugin registered successfully');
};

export default fp(compressPlugin, { name: 'compress' });
