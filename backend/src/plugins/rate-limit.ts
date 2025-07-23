// src/plugins/rate-limit.ts
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { rateLimitConfig } from '../config/config';

const rateLimitPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: rateLimitConfig.max,
    timeWindow: rateLimitConfig.timeWindow,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    skipOnError: true, // Don't count failed requests
    errorResponseBuilder: (request, context) => {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${Math.ceil(context.ttl / 1000)} seconds`,
        date: Date.now(),
        expiresIn: Math.ceil(context.ttl / 1000),
      };
    },
  });

  fastify.log.info('✅ Rate limiting plugin registered successfully');
};

export default fp(rateLimitPlugin, { name: 'rate-limit' });
