import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { build } from '../app-test';
import type { FastifyInstance } from 'fastify';

// Extend FastifyInstance to include our custom decorators
interface TestFastifyInstance extends FastifyInstance {
  db: {
    query: any;
    select: any;
    insert: any;
    update: any;
    delete: any;
    execute: any;
  };
  redis: {
    get: any;
    set: any;
    del: any;
    exists: any;
    expire: any;
    ttl: any;
    incr: any;
    decr: any;
  };
  jwt: {
    sign: any;
    verify: any;
  };
  authenticate: any;
  dbHealth: any;
  redisHealth: any;
}

describe('Monitoring Routes', () => {
  let app: TestFastifyInstance;

  beforeEach(async () => {
    app = await build() as TestFastifyInstance;
    
    // Mock metrics data
    vi.mocked(app.redis.get).mockImplementation(async (key: string) => {
      if (key.includes('metrics:')) {
        return JSON.stringify({
          requests: 1250,
          errors: 15,
          avgResponseTime: 125,
          cacheHits: 450,
          cacheMisses: 150,
        });
      }
      return null;
    });
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  describe('GET /api/monitoring/health', () => {
    it('should return detailed health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('timestamp');
      expect(data.data).toHaveProperty('services');
      expect(data.data.services).toHaveProperty('database');
      expect(data.data.services).toHaveProperty('redis');
    });

    it('should include service response times', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.services.database).toHaveProperty('responseTime');
      expect(data.data.services.redis).toHaveProperty('responseTime');
    });

    it('should be publicly accessible', async () => {
      // Health endpoint should not require authentication
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/monitoring/metrics', () => {
    it('should return performance metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/metrics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('requests');
      expect(data.data).toHaveProperty('errors');
      expect(data.data).toHaveProperty('avgResponseTime');
      expect(typeof data.data.requests).toBe('number');
      expect(typeof data.data.errors).toBe('number');
    });

    it('should include cache metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/metrics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('cacheHits');
      expect(data.data).toHaveProperty('cacheMisses');
      expect(typeof data.data.cacheHits).toBe('number');
      expect(typeof data.data.cacheMisses).toBe('number');
    });

    it('should calculate cache hit ratio', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/metrics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      
      if (data.data.cacheHits > 0 || data.data.cacheMisses > 0) {
        expect(data.data).toHaveProperty('cacheHitRatio');
        expect(typeof data.data.cacheHitRatio).toBe('number');
        expect(data.data.cacheHitRatio).toBeGreaterThanOrEqual(0);
        expect(data.data.cacheHitRatio).toBeLessThanOrEqual(1);
      }
    });

    it('should include memory usage', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/metrics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('memory');
      expect(data.data.memory).toHaveProperty('used');
      expect(data.data.memory).toHaveProperty('total');
    });
  });

  describe('GET /api/monitoring/system', () => {
    it('should return system metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/system',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('uptime');
      expect(data.data).toHaveProperty('memory');
      expect(data.data).toHaveProperty('cpu');
      expect(typeof data.data.uptime).toBe('number');
    });

    it('should include Node.js version info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/system',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('versions');
      expect(data.data.versions).toHaveProperty('node');
    });

    it('should include process information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/system',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('pid');
      expect(data.data).toHaveProperty('platform');
      expect(typeof data.data.pid).toBe('number');
      expect(typeof data.data.platform).toBe('string');
    });
  });

  describe('GET /api/monitoring/cache', () => {
    beforeEach(() => {
      // Mock cache statistics
      vi.mocked(app.redis.get).mockImplementation(async (key: string) => {
        const cacheStats = {
          'cache:stats:hits': '450',
          'cache:stats:misses': '150',
          'cache:stats:sets': '600',
          'cache:stats:gets': '600',
        };
        return cacheStats[key as keyof typeof cacheStats] || null;
      });
    });

    it('should return cache statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('hits');
      expect(data.data).toHaveProperty('misses');
      expect(data.data).toHaveProperty('hitRatio');
    });

    it('should calculate hit ratio correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      
      const expectedHitRatio = data.data.hits / (data.data.hits + data.data.misses);
      expect(data.data.hitRatio).toBeCloseTo(expectedHitRatio, 2);
    });

    it('should handle zero cache operations', async () => {
      // Mock zero cache operations
      vi.mocked(app.redis.get).mockResolvedValue('0');

      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.hitRatio).toBe(0);
    });
  });

  describe('DELETE /api/monitoring/cache', () => {
    beforeEach(() => {
      // Mock successful cache clear
      vi.mocked(app.redis.del).mockResolvedValue(10); // 10 keys deleted
    });

    it('should clear cache successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('cleared');
      expect(data.data.cleared).toBeGreaterThanOrEqual(0);
    });

    it('should reset cache statistics', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('statsReset', true);
    });

    it('should handle cache clear errors gracefully', async () => {
      // Mock Redis error
      vi.mocked(app.redis.del).mockRejectedValue(new Error('Redis connection failed'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/health (main health endpoint)', () => {
    it('should return basic health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('environment', 'test');
    });

    it('should include service health checks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('services');
      expect(data.services).toHaveProperty('database');
      expect(data.services).toHaveProperty('redis');
    });

    it('should be fast (under 100ms)', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });
      
      const duration = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(100); // Should respond quickly
    });
  });

  describe('Error Handling', () => {
    it('should handle database health check failures', async () => {
      // Mock database health check failure
      vi.mocked(app.dbHealth).mockResolvedValue({
        status: 'unhealthy',
        message: 'Database connection failed',
        responseTime: 5000,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      expect(response.statusCode).toBe(200); // Still return 200, but with unhealthy status
      const data = JSON.parse(response.body);
      expect(data.data.services.database.status).toBe('unhealthy');
    });

    it('should handle Redis health check failures', async () => {
      // Mock Redis health check failure
      vi.mocked(app.redisHealth).mockResolvedValue({
        status: 'unhealthy',
        message: 'Redis connection failed',
        responseTime: 5000,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.services.redis.status).toBe('unhealthy');
    });

    it('should handle metrics collection errors', async () => {
      // Mock Redis error for metrics
      vi.mocked(app.redis.get).mockRejectedValue(new Error('Redis unavailable'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/metrics',
      });

      // Should either return 500 or return with fallback data
      expect([200, 500]).toContain(response.statusCode);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent health checks', async () => {
      const promises = Array(10).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/health',
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle rapid successive metric requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await app.inject({
          method: 'GET',
          url: '/api/monitoring/metrics',
        });
        responses.push(response);
      }

      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });
}); 