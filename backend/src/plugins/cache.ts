// src/plugins/cache.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';
import { RedisConfig, CacheService } from '../types';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  memory?: {
    used: number;
    total: number;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    cache: CacheService;
  }
}

class MemoryCache implements CacheService {
  private cache = new Map<string, { value: string; expires: number }>();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return JSON.parse(item.value) as T;
  }

  async set<T>(key: string, value: T, ttl: number = 900): Promise<void> {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value: JSON.stringify(value), expires });
    this.stats.sets++;
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.stats.deletes++;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;
    
    // Simple pattern matching (can be enhanced)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return -2; // Key doesn't exist
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return -2; // Key doesn't exist
    }
    
    return Math.ceil((item.expires - Date.now()) / 1000);
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expires = Date.now() + seconds * 1000;
    }
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async getStats(): Promise<CacheStats> {
    return {
      ...this.stats,
      memory: {
        used: this.cache.size,
        total: -1, // Not applicable for memory cache
      },
    };
  }

  // Cleanup expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

class RedisCache implements CacheService {
  private redis: Redis;
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch {
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 900): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      this.stats.sets++;
    } catch {
      // Fail silently for cache errors
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.stats.deletes++;
    } catch {
      // Fail silently for cache errors
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch {
      // Fail silently for cache errors
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern || '*');
    } catch {
      return [];
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch {
      return -2;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds);
    } catch {
      // Fail silently for cache errors
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const maxMemoryMatch = info.match(/maxmemory:(\d+)/);

      return {
        ...this.stats,
        memory: {
          used: memoryMatch ? parseInt(memoryMatch[1]) : 0,
          total: maxMemoryMatch ? parseInt(maxMemoryMatch[1]) : 0,
        },
      };
    } catch {
      return this.stats;
    }
  }
}

const cachePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  let cacheService: CacheService;

  if (fastify.config.REDIS_ENABLED && fastify.config.REDIS_HOST) {
    try {
      // FIXED: Line 198:26 - Replace any with RedisConfig
      const redisConfig: RedisConfig = {
        host: fastify.config.REDIS_HOST!,
        port: fastify.config.REDIS_PORT || 6379,
        db: fastify.config.REDIS_DB || 0,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnFailover: 100,
      };

      // Add password if provided
      if (fastify.config.REDIS_PASSWORD) {
        redisConfig.password = fastify.config.REDIS_PASSWORD;
      }

      const redis = new Redis(redisConfig);

      // Test Redis connection
      await redis.ping();
      fastify.log.info('Redis cache connected successfully');

      cacheService = new RedisCache(redis);

      // Graceful shutdown for Redis
      fastify.addHook('onClose', async () => {
        await redis.quit();
        fastify.log.info('Redis connection closed');
      });
    } catch (error) {
      fastify.log.warn('Redis connection failed, falling back to memory cache:', error);
      cacheService = new MemoryCache();
    }
  } else {
    fastify.log.info('Using memory cache (Redis disabled)');
    cacheService = new MemoryCache();
  }

  // If using memory cache, set up cleanup interval
  if (cacheService instanceof MemoryCache) {
    const cleanupInterval = setInterval(() => {
      cacheService.cleanup();
    }, 60000); // Clean up every minute

    fastify.addHook('onClose', async () => {
      clearInterval(cleanupInterval);
    });
  }

  // Decorate fastify instance with cache service
  fastify.decorate('cache', cacheService);

  fastify.log.info('Cache service initialized');
};

export default fp(cachePlugin, {
  name: 'cache',
  dependencies: ['config'],
});
