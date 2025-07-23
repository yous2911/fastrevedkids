import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import redis from '@fastify/redis';
import { config } from '../config/config';

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  if (config.REDIS_HOST) {
    try {
      const redisOptions: any = {
        host: config.REDIS_HOST,
      };
      
      // Only add defined properties
      if (config.REDIS_PORT) redisOptions.port = config.REDIS_PORT;
      if (config.REDIS_PASSWORD) redisOptions.password = config.REDIS_PASSWORD;
      redisOptions.db = 0;
      redisOptions.maxRetriesPerRequest = 3;
      redisOptions.retryDelayOnFailover = 100;

      await fastify.register(redis, redisOptions);
      
      fastify.log.info('Redis connected successfully');
    } catch (error) {
      fastify.log.warn('Redis connection failed, falling back to memory cache:', error);
    }
  } else {
    fastify.log.info('Redis not configured, using memory-only caching');
  }
}

export default fp(redisPlugin, {
  name: 'redis',
});
