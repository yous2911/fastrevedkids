// src/tests/health.test.ts - UPDATED TESTS TO MATCH FIXED RESPONSES
import { describe, it, expect } from 'vitest';
import { app } from './setup';

describe('Health Checks', () => {
  it('should return server health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.status).toBe('healthy');
    expect(data.environment).toBe('test');
    expect(data.features.database).toBe('connected');
    expect(data.features.redis).toBe('memory-fallback'); // Redis disabled in test, using memory fallback
  });

  it('should return server info on root endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.success).toBe(true);
    expect(data.message).toBe('RevEd Kids Fastify API');
    expect(data.environment).toBe('test');
  });
}); 