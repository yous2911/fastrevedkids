import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { rateLimitConfig } from '../config/config';

const rateLimitPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    ...rateLimitConfig,
    keyGenerator: (request) => {
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: {
          message: `Trop de requêtes, réessayez dans ${Math.round(context.after / 1000)} secondes`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: context.after,
        },
      };
    },
  });
  fastify.log.info('✅ Rate limit plugin registered successfully');
};

export default fp(rateLimitPlugin, { name: 'rate-limit' }); 