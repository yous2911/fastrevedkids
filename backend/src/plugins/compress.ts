import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import compress from '@fastify/compress';

async function compressPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(compress, {
    global: true,
    encodings: ['gzip', 'deflate', 'br'],
    threshold: 1024,
    removeContentLengthHeader: false,
  });
}

export default fp(compressPlugin, {
  name: 'compress',
});
