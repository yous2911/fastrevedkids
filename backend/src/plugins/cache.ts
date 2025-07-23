// src/plugins/cache.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/config';

// FIXED: Cache service interface that matches type declarations
interface CacheService {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
  flush: () => Promise<void>;
  stats: () => Promise<{ hits: number; misses: number; keys: number }>;
  clear: () => Promise<void>; // ADDED: Missing method
}

const cachePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  let redis: any = null;
  const memoryCache = new Map<string, { value: string; expires: number }>();
  const stats = { hits: 0, misses: 0 };

  // Try to connect to Redis if host is configured
  if (config.REDIS_HOST) {
    try {
      const { Redis } = await import('ioredis');
      redis = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT || 6379,
        password: config.REDIS_PASSWORD,
        db: 0, // Default to database 0
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      redis.on('connect', () => {
        fastify.log.info('Redis connected successfully');
      });

      redis.on('error', (error: Error) => {
        fastify.log.error('Redis connection error:', error);
        redis = null; // Fall back to memory cache
      });
    } catch (error) {
      fastify.log.warn('Redis not available, using memory cache:', error);
      redis = null;
    }
  }

  // FIXED: Cache service implementation
  const cache: CacheService = {
    async get(key: string): Promise<string | null> {
      if (redis) {
        try {
          const value = await redis.get(key);
          if (value) {
            stats.hits++;
            return value;
          } else {
            stats.misses++;
            return null;
          }
        } catch (error) {
          fastify.log.error('Redis get error:', error);
          // Fall through to memory cache
        }
      }

      // Memory cache fallback
      const item = memoryCache.get(key);
      if (item && item.expires > Date.now()) {
        stats.hits++;
        return item.value;
      } else {
        if (item) memoryCache.delete(key);
        stats.misses++;
        return null;
      }
    },

    async set(key: string, value: string, ttl: number = 900): Promise<void> {
      if (redis) {
        try {
          await redis.setex(key, ttl, value);
          return;
        } catch (error) {
          fastify.log.error('Redis set error:', error);
          // Fall through to memory cache
        }
      }

      // Memory cache fallback
      memoryCache.set(key, {
        value,
        expires: Date.now() + (ttl * 1000),
      });
    },

    async del(key: string): Promise<void> {
      if (redis) {
        try {
          await redis.del(key);
          return;
        } catch (error) {
          fastify.log.error('Redis del error:', error);
        }
      }

      // Memory cache fallback
      memoryCache.delete(key);
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

    // ADDED: Missing clear method
    async clear(): Promise<void> {
      return this.flush();
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

  // FIXED: Decorate with proper typing
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

export default fp(cachePlugin, { name: 'cache' });
