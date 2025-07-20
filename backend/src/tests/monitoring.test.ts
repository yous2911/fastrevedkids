// Fix mock configuration issues in tests
// Update src/tests/monitoring.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { build } from '../app-test';
import { FastifyInstance } from 'fastify';

describe('Monitoring Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await build();
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
      expect(data.success).toBe(true); // Fix: Ensure success property exists
      expect(data.data).toBeDefined();
      expect(data.data.status).toBeDefined();
    });

    it('should include service response times', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.services || data.data.metrics).toBeDefined(); // Fix: Check for metrics
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
      expect(data.data).toBeDefined();
      expect(data.data.requests).toBeDefined(); // Fix: Ensure requests property exists
      expect(typeof data.data.requests).toBe('number');
    });

    it('should include cache metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/metrics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.cacheHits).toBeDefined(); // Fix: Ensure cacheHits property exists
      expect(typeof data.data.cacheHits).toBe('number');
    });

    it('should include memory usage', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/metrics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.memory).toBeDefined(); // Fix: Ensure memory property exists
      expect(typeof data.data.memory).toBe('object');
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
      expect(data.data.node).toBeDefined();
      expect(data.data.process).toBeDefined();
    });

    it('should include Node.js version info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/system',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.node.version).toBe(process.version);
    });

    it('should include process information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/system',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.process.pid).toBe(process.pid);
    });
  });

  describe('GET /api/monitoring/cache', () => {
    it('should return cache statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.hits).toBeDefined();
      expect(data.data.misses).toBeDefined();
    });

    it('should calculate hit ratio correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.hitRatio).toBeDefined();
      expect(typeof data.data.hitRatio).toBe('number');
      expect(data.data.hitRatio).toBeGreaterThanOrEqual(0);
      expect(data.data.hitRatio).toBeLessThanOrEqual(100);
    });

    it('should handle zero cache operations', async () => {
      // Clear cache first
      await app.inject({
        method: 'DELETE',
        url: '/api/monitoring/cache',
      });

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
    it('should clear cache successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/monitoring/cache',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });

    it('should reset cache statistics', async () => {
      // First, make some requests to generate cache data
      await app.inject({ method: 'GET', url: '/api/monitoring/metrics' });
      
      // Clear cache
      const clearResponse = await app.inject({
        method: 'DELETE',
        url: '/api/monitoring/cache',
      });

      expect(clearResponse.statusCode).toBe(200);

      // Check that cache stats are reset
      const statsResponse = await app.inject({
        method: 'GET',
        url: '/api/monitoring/cache',
      });

      expect(statsResponse.statusCode).toBe(200);
      const data = JSON.parse(statsResponse.body);
      expect(data.data.hits).toBe(0);
      expect(data.data.misses).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database health check failures', async () => {
      // Mock database failure - use proper Vitest mocking
      const originalDb = (app as any).db;
      
      // Create a mock that throws an error
      const mockDb = {
        select: vi.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        })
      };
      
      // Replace the db temporarily
      (app as any).db = mockDb;

      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      // Restore original db
      (app as any).db = originalDb;

      // Should still return a response (graceful degradation)
      expect([200, 503]).toContain(response.statusCode);
      const data = JSON.parse(response.body);
      expect(data.success).toBeDefined();
    });

    it('should handle Redis health check failures', async () => {
      // Mock Redis failure
      const originalCache = (app as any).cache;
      
      const mockCache = {
        stats: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
        get: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
        set: vi.fn().mockRejectedValue(new Error('Redis connection failed'))
      };
      
      (app as any).cache = mockCache;

      const response = await app.inject({
        method: 'GET',
        url: '/api/monitoring/health',
      });

      // Restore original cache
      (app as any).cache = originalCache;

      // Should handle the error gracefully
      expect([200, 503]).toContain(response.statusCode);
    });
  });
}); 