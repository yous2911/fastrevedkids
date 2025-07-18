import fp from 'fastify-plugin';
import compress from '@fastify/compress';

const compressPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(compress, {
    global: true,
    threshold: 1024,
    encodings: ['gzip', 'deflate'],
  });
  fastify.log.info('✅ Compression plugin registered successfully');
};

export default fp(compressPlugin, { name: 'compress' });
