import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { config } from '../config/config';

interface CacheItem {
  value: string;
  expiry: number;
  accessed: number; // ✨ LRU tracking
}

const redisPlugin = async (fastify: any) => {
  let redis: Redis | null = null;
  const memoryCache = new Map<string, CacheItem>();
  const stats = { hits: 0, misses: 0, errors: 0 };

  // ✨ AMÉLIORATION 1: Configuration Redis optimisée
  if (config.REDIS_HOST) {
    try {
      redis = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT || 6379,
        password: config.REDIS_PASSWORD,
        db: 0, // Default DB
        // ⚡ Optimisations de performance
        maxRetriesPerRequest: 2, // Réduit pour éviter la latence
        connectTimeout: 5000, // Timeout plus court
        lazyConnect: true, // Connexion à la demande
        keepAlive: 30000,
        // ⚡ Pool de connexions
        family: 4, // IPv4 plus rapide
        enableReadyCheck: false, // Skip ready check
        enableOfflineQueue: false, // Pas de queue offline
      });

      await redis.ping();
      fastify.log.info('✅ Redis connected');
    } catch (error) {
      fastify.log.warn('⚠️ Redis unavailable, using memory cache');
      redis = null;
    }
  } else {
    fastify.log.info('Redis not configured, using memory-only caching');
  }

  // ✨ AMÉLIORATION 2: Nettoyage automatique LRU
  const cleanupMemoryCache = () => {
    const maxSize = 1000; // Default max size
    if (memoryCache.size < maxSize) return;

    const now = Date.now();
    const entries = Array.from(memoryCache.entries());
    
    // Supprimer les expirés d'abord
    entries.forEach(([key, item]) => {
      if (item.expiry <= now) {
        memoryCache.delete(key);
      }
    });

    // Si toujours trop gros, supprimer les moins utilisés
    if (memoryCache.size >= maxSize) {
      const sorted = entries
        .filter(([, item]) => item.expiry > now)
        .sort((a, b) => a[1].accessed - b[1].accessed);
      
      const toDelete = sorted.slice(0, Math.floor(maxSize * 0.2));
      toDelete.forEach(([key]) => memoryCache.delete(key));
    }
  };

  // ✨ AMÉLIORATION 3: Interface cache optimisée
  const cache = {
    async get(key: string): Promise<string | null> {
      try {
        if (redis) {
          const value = await redis.get(key);
          if (value !== null) {
            stats.hits++;
            return value;
          }
        }
      } catch (error) {
        stats.errors++;
        fastify.log.warn('Redis get error:', error);
      }

      // Memory cache fallback avec LRU
      const item = memoryCache.get(key);
      if (item && item.expiry > Date.now()) {
        item.accessed = Date.now(); // ⚡ Update LRU
        stats.hits++;
        return item.value;
      } else if (item) {
        memoryCache.delete(key);
      }
      
      stats.misses++;
      return null;
    },

    async set(key: string, value: string, ttl: number = 3600): Promise<void> {
      // ⚡ Validation rapide
      if (!key || value === undefined) return;

      try {
        if (redis) {
          await redis.setex(key, ttl, value);
          return;
        }
      } catch (error) {
        stats.errors++;
        fastify.log.warn('Redis set error:', error);
      }

      // Memory cache avec cleanup automatique
      const now = Date.now();
      memoryCache.set(key, {
        value,
        expiry: now + ttl * 1000,
        accessed: now,
      });

      // ⚡ Cleanup asynchrone pour pas bloquer
      if (memoryCache.size % 100 === 0) {
        setImmediate(cleanupMemoryCache);
      }
    },

    async del(key: string): Promise<number> {
      let deleted = 0;
      
      try {
        if (redis) {
          deleted = await redis.del(key);
        }
      } catch (error) {
        stats.errors++;
        fastify.log.warn('Redis del error:', error);
      }

      if (memoryCache.delete(key)) {
        deleted = 1;
      }

      return deleted;
    },

    // ✨ AMÉLIORATION 4: Méthodes utilitaires
    async mget(keys: string[]): Promise<(string | null)[]> {
      if (!keys.length) return [];

      try {
        if (redis) {
          return await redis.mget(...keys);
        }
      } catch (error) {
        stats.errors++;
        fastify.log.warn('Redis mget error:', error);
      }

      // Fallback memory
      return keys.map(key => {
        const item = memoryCache.get(key);
        return item && item.expiry > Date.now() ? item.value : null;
      });
    },

    async flush(): Promise<void> {
      try {
        if (redis) {
          await redis.flushdb();
        }
      } catch (error) {
        stats.errors++;
        fastify.log.warn('Redis flush error:', error);
      }
      memoryCache.clear();
    },

    getStats() {
      return {
        ...stats,
        memoryKeys: memoryCache.size,
        redisConnected: !!redis,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      };
    },
  };

  fastify.decorate('cache', cache);

  // ✨ AMÉLIORATION 5: Cleanup périodique
  const cleanupInterval = setInterval(cleanupMemoryCache, 60000); // Chaque minute

  fastify.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
    if (redis) {
      await redis.quit();
      fastify.log.info('Redis connection closed');
    }
  });

  fastify.log.info('✅ Cache plugin registered');
};

export default fp(redisPlugin, { name: 'cache' });
