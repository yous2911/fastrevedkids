import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { RedisConfig } from '../types';

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  if (fastify.config.REDIS_ENABLED && fastify.config.REDIS_HOST) {
    // FIXED: Line 5:37 - Replace any with RedisConfig
    const options: RedisConfig = {
      host: fastify.config.REDIS_HOST,
      port: fastify.config.REDIS_PORT || 6379,
      password: fastify.config.REDIS_PASSWORD,
      db: fastify.config.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    await fastify.register(import('@fastify/redis'), options);
    fastify.log.info('Redis plugin registered');
  } else {
    fastify.log.info('Redis disabled, skipping Redis plugin');
  }
};

export default fp(redisPlugin, {
  name: 'redis',
  dependencies: ['config'],
});
