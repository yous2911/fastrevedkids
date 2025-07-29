import fp from 'fastify-plugin';
import { config } from '../config/config';

const redisPlugin = async (fastify: any) => {
  const memoryCache = new Map<string, { value: string; expiry: number }>();
  const stats = { hits: 0, misses: 0, keys: 0 };

  // ONLY use memory cache - NO Redis connection attempts
  if (config!.REDIS_ENABLED) {
    fastify.log.info('⚠️ Redis is enabled but using memory cache only for now');
  } else {
    fastify.log.info('✅ Redis disabled - using memory cache only');
  }

  // Memory-only cache interface
  const cache = {
    async get(_key: string): Promise<string | null> {
      const item = memoryCache.get(_key);
      if (item && item.expiry > Date.now()) {
        stats.hits++;
        return item.value;
      } else if (item) {
        memoryCache.delete(_key);
      }
      stats.misses++;
      return null;
    },

    async set(_key: string, _value: string, _ttl?: number): Promise<void> {
      const ttl = _ttl || config!.CACHE_TTL;
      memoryCache.set(_key, {
        value: _value,
        expiry: Date.now() + ttl * 1000,
      });
    },

    async del(_key: string): Promise<number> {
      return memoryCache.delete(_key) ? 1 : 0;
    },

    async flush(): Promise<void> {
      memoryCache.clear();
    },

    async stats(): Promise<{ hits: number; misses: number; keys: number }> {
      return { ...stats, keys: memoryCache.size };
    },
  };

  fastify.decorate('cache', cache);
  fastify.log.info('✅ Memory cache plugin registered successfully');
};

export default fp(redisPlugin, { name: 'cache' });
