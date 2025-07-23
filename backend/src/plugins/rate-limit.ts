import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '../config/config';

async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(rateLimit, {
    max: rateLimitConfig.max,
    timeWindow: rateLimitConfig.timeWindow,
    cache: rateLimitConfig.cache,
    allowList: rateLimitConfig.allowList,
    continueExceeding: rateLimitConfig.continueExceeding,
    skipOnError: rateLimitConfig.skipOnError,
    keyGenerator: (request: any) => {
      return request.ip;
    },
    errorResponseBuilder: (request: any, context: any) => {
      return {
        success: false,
        error: {
          message: 'Rate limit exceeded',
          statusCode: 429,
          limit: context.max,
          resetTime: new Date(Date.now() + context.ttl),
        },
      };
    },
  });
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});
