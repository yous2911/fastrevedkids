import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { config } from '../config/config';

const redisPlugin = async (fastify: any) => {
  let redis: Redis | null = null;
  const memoryCache = new Map<string, { value: string; expiry: number }>();
  const stats = { hits: 0, misses: 0, keys: 0 };

  // Try to connect to Redis
  if (config!.REDIS_ENABLED) {
    try {
      redis = new Redis({
        host: config!.REDIS_HOST,
        port: config!.REDIS_PORT,
        password: config!.REDIS_PASSWORD || '',
        db: config!.REDIS_DB,
        maxRetriesPerRequest: 3,
      });

      await redis.ping();
      fastify.log.info('✅ Redis connected successfully');
    } catch (error) {
      fastify.log.warn('⚠️ Redis connection failed, falling back to memory cache');
      redis = null;
    }
  }

  // Cache interface
  const cache = {
    async get(_key: string): Promise<string | null> {
      if (redis) {
        try {
          const value = await redis.get(_key);
          if (value) {
            stats.hits++;
            return value;
          } else {
            stats.misses++;
            return null;
          }
        } catch (error) {
          fastify.log.error('Redis get error:', error);
          // Fallback to memory cache
        }
      }

      // Memory cache fallback
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
      
      if (redis) {
        try {
          await redis.setex(_key, ttl, _value);
          return;
        } catch (error) {
          fastify.log.error('Redis set error:', error);
          // Fallback to memory cache
        }
      }

      // Memory cache fallback
      memoryCache.set(_key, {
        value: _value,
        expiry: Date.now() + ttl * 1000,
      });

      // Clean up expired entries
      if (memoryCache.size > config!.CACHE_MAX_SIZE) {
        const now = Date.now();
        for (const [key, item] of memoryCache.entries()) {
          if (item.expiry <= now) {
            memoryCache.delete(key);
          }
        }
      }
    },

    async del(_key: string): Promise<number> {
      if (redis) {
        try {
          return await redis.del(_key);
        } catch (error) {
          fastify.log.error('Redis del error:', error);
        }
      }

      // Memory cache fallback
      return memoryCache.delete(_key) ? 1 : 0;
    },

    async flush(): Promise<void> {
      if (redis) {
        try {
          await redis.flushdb();
          return;
        } catch (error) {
          fastify.log.error('Redis flush error:', error);
        }
      }

      // Memory cache fallback
      memoryCache.clear();
    },

    async stats(): Promise<{ hits: number; misses: number; keys: number }> {
      if (redis) {
        try {
          const keys = await redis.dbsize();
          return { ...stats, keys };
        } catch (error) {
          fastify.log.error('Redis stats error:', error);
        }
      }

      // Memory cache fallback
      return { ...stats, keys: memoryCache.size };
    },
  };

  // Decorate fastify with cache
  fastify.decorate('cache', cache);

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    if (redis) {
      await redis.quit();
      fastify.log.info('Redis connection closed');
    }
  });

  fastify.log.info('✅ Cache plugin registered successfully');
};

export default fp(redisPlugin, {
  name: 'cache',
}); 