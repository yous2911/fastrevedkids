/**
 * Service de rate limiting sécurisé avec stockage persistant
 * Utilise Redis quand disponible, sinon fallback sur Map en mémoire
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDuration?: number;
  skipSuccessful?: boolean;
  skipFailed?: boolean;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

export class SecureRateLimiterService {
  private static instance: SecureRateLimiterService;
  private memoryStore = new Map<string, RateLimitInfo>();
  private redis: any = null; // Redis client si disponible

  private constructor() {
    // Tenter de se connecter à Redis
    this.initializeRedis();
    
    // Nettoyage périodique du store en mémoire
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000); // 5 minutes
  }

  public static getInstance(): SecureRateLimiterService {
    if (!SecureRateLimiterService.instance) {
      SecureRateLimiterService.instance = new SecureRateLimiterService();
    }
    return SecureRateLimiterService.instance;
  }

  /**
   * Initialise la connexion Redis si disponible
   */
  private async initializeRedis() {
    try {
      // Essayer d'importer et initialiser Redis
      const redisEnabled = process.env.REDIS_ENABLED === 'true';
      
      if (redisEnabled) {
        const Redis = require('ioredis');
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });

        await this.redis.ping();
        logger.info('✅ Redis connected for rate limiting');
      }
    } catch (error) {
      logger.warn('⚠️ Redis not available, using in-memory rate limiting', { error: error.message });
      this.redis = null;
    }
  }

  /**
   * Vérifie et met à jour le rate limit
   */
  async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    rateLimitInfo: RateLimitInfo;
    headers: Record<string, string>;
  }> {
    const now = Date.now();
    
    try {
      let rateLimitInfo: RateLimitInfo;

      if (this.redis) {
        rateLimitInfo = await this.checkRateLimitRedis(key, config, now);
      } else {
        rateLimitInfo = await this.checkRateLimitMemory(key, config, now);
      }

      const allowed = !rateLimitInfo.blocked && rateLimitInfo.count <= config.maxAttempts;

      // Headers de rate limiting
      const headers = {
        'X-RateLimit-Limit': config.maxAttempts.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.maxAttempts - rateLimitInfo.count).toString(),
        'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString(),
      };

      if (rateLimitInfo.blocked && rateLimitInfo.blockUntil) {
        headers['Retry-After'] = Math.ceil((rateLimitInfo.blockUntil - now) / 1000).toString();
      }

      return { allowed, rateLimitInfo, headers };

    } catch (error) {
      logger.error('Rate limit check error:', error);
      // En cas d'erreur, autoriser la requête mais logger l'incident
      return {
        allowed: true,
        rateLimitInfo: { count: 0, resetTime: now + config.windowMs, blocked: false },
        headers: {}
      };
    }
  }

  /**
   * Rate limiting avec Redis
   */
  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<RateLimitInfo> {
    const pipe = this.redis.pipeline();
    
    // Script Lua pour opération atomique
    const luaScript = `
      local key = KEYS[1]
      local maxAttempts = tonumber(ARGV[1])
      local windowMs = tonumber(ARGV[2])
      local blockDuration = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      local current = redis.call('HMGET', key, 'count', 'resetTime', 'blocked', 'blockUntil')
      local count = tonumber(current[1]) or 0
      local resetTime = tonumber(current[2]) or (now + windowMs)
      local blocked = current[3] == 'true'
      local blockUntil = tonumber(current[4])
      
      -- Vérifier si le block a expiré
      if blocked and blockUntil and now >= blockUntil then
        blocked = false
        blockUntil = nil
        count = 0
        resetTime = now + windowMs
      end
      
      -- Reset si fenêtre expirée
      if now >= resetTime then
        count = 0
        resetTime = now + windowMs
        blocked = false
        blockUntil = nil
      end
      
      -- Incrémenter le compteur
      count = count + 1
      
      -- Bloquer si limite dépassée
      if count > maxAttempts and not blocked then
        blocked = true
        blockUntil = now + blockDuration
      end
      
      -- Sauvegarder
      redis.call('HMSET', key, 
        'count', count,
        'resetTime', resetTime,
        'blocked', blocked and 'true' or 'false',
        'blockUntil', blockUntil or 0
      )
      redis.call('EXPIRE', key, math.ceil(math.max(windowMs, blockDuration or 0) / 1000))
      
      return {count, resetTime, blocked and 1 or 0, blockUntil or 0}
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      key,
      config.maxAttempts,
      config.windowMs,
      config.blockDuration || config.windowMs * 2,
      now
    );

    return {
      count: result[0],
      resetTime: result[1],
      blocked: result[2] === 1,
      blockUntil: result[3] > 0 ? result[3] : undefined
    };
  }

  /**
   * Rate limiting en mémoire (fallback)
   */
  private async checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<RateLimitInfo> {
    let info = this.memoryStore.get(key) || {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false
    };

    // Vérifier si le block a expiré
    if (info.blocked && info.blockUntil && now >= info.blockUntil) {
      info.blocked = false;
      info.blockUntil = undefined;
      info.count = 0;
      info.resetTime = now + config.windowMs;
    }

    // Reset si fenêtre expirée
    if (now >= info.resetTime) {
      info.count = 0;
      info.resetTime = now + config.windowMs;
      info.blocked = false;
      info.blockUntil = undefined;
    }

    // Incrémenter le compteur
    info.count++;

    // Bloquer si limite dépassée
    if (info.count > config.maxAttempts && !info.blocked) {
      info.blocked = true;
      info.blockUntil = now + (config.blockDuration || config.windowMs * 2);
    }

    this.memoryStore.set(key, info);
    return info;
  }

  /**
   * Reset rate limit pour une clé
   */
  async resetRateLimit(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryStore.delete(key);
      }
      logger.info('Rate limit reset', { key });
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Obtient les informations de rate limit sans les modifier
   */
  async getRateLimitInfo(key: string): Promise<RateLimitInfo | null> {
    try {
      if (this.redis) {
        const result = await this.redis.hmget(key, 'count', 'resetTime', 'blocked', 'blockUntil');
        if (!result[0]) return null;

        return {
          count: parseInt(result[0]) || 0,
          resetTime: parseInt(result[1]) || 0,
          blocked: result[2] === 'true',
          blockUntil: result[3] ? parseInt(result[3]) : undefined
        };
      } else {
        return this.memoryStore.get(key) || null;
      }
    } catch (error) {
      logger.error('Error getting rate limit info:', error);
      return null;
    }
  }

  /**
   * Nettoie les entrées expirées (pour le store mémoire)
   */
  private cleanupExpiredEntries(): void {
    if (this.redis) return; // Pas besoin si on utilise Redis

    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, info] of this.memoryStore.entries()) {
      const isExpired = now >= info.resetTime && 
        (!info.blockUntil || now >= info.blockUntil);
      
      if (isExpired) {
        this.memoryStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Rate limit cleanup completed', { 
        cleanedEntries: cleanedCount,
        remainingEntries: this.memoryStore.size 
      });
    }
  }

  /**
   * Obtient des statistiques globales
   */
  getStats(): {
    totalEntries: number;
    blockedEntries: number;
    storageType: 'redis' | 'memory';
  } {
    let totalEntries = 0;
    let blockedEntries = 0;

    if (this.redis) {
      // Pour Redis, on retourne des stats basiques
      return {
        totalEntries: -1, // Non disponible facilement
        blockedEntries: -1,
        storageType: 'redis'
      };
    } else {
      for (const info of this.memoryStore.values()) {
        totalEntries++;
        if (info.blocked) blockedEntries++;
      }
    }

    return {
      totalEntries,
      blockedEntries,
      storageType: 'memory'
    };
  }
}

/**
 * Middleware factory pour l'authentification
 */
export function createSecureAuthRateLimiter(config?: Partial<RateLimitConfig>) {
  const limiter = SecureRateLimiterService.getInstance();
  
  const fullConfig: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 60 * 60 * 1000, // 1 heure de blocage
    skipSuccessful: false,
    skipFailed: false,
    ...config
  };

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip || 'unknown';
    const key = `auth_attempts:${ip}`;

    try {
      const result = await limiter.checkRateLimit(key, fullConfig);
      
      // Ajouter les headers de rate limiting
      Object.entries(result.headers).forEach(([name, value]) => {
        reply.header(name, value);
      });

      if (!result.allowed) {
        logger.warn('Auth rate limit exceeded', {
          ip,
          userAgent: request.headers['user-agent'],
          attempts: result.rateLimitInfo.count,
          blocked: result.rateLimitInfo.blocked
        });

        return reply.status(429).send({
          success: false,
          error: {
            message: result.rateLimitInfo.blocked 
              ? 'IP temporairement bloquée pour trop de tentatives'
              : 'Trop de tentatives de connexion',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: result.headers['Retry-After'] ? parseInt(result.headers['Retry-After']) : undefined
          }
        });
      }
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // En cas d'erreur, on laisse passer mais on log l'incident
    }
  };
}