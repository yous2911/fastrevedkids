import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

import { validateEnvironment } from '../config/environment.js';

const rateLimitPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const config = validateEnvironment();

  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW,
    allowList: ['127.0.0.1', '::1'],
    keyGenerator: request => {
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded, retry in ${Math.ceil(context.ttl / 1000)} seconds`,
          retryAfter: Math.ceil(context.ttl / 1000),
        },
      };
    },
  });

  fastify.log.info('✅ Rate limiting plugin registered successfully');
};

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});
