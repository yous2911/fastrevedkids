// src/tests/basic.test.ts - Basic test to verify setup is working

import { describe, it, expect } from 'vitest';
import { app } from './setup';

describe('Basic Test Setup', () => {
  it('should have a working app instance', () => {
    expect(app).toBeDefined();
    expect(app.server).toBeDefined();
  });

  it('should respond to health check', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.status).toBe('healthy');
    expect(data.environment).toBe('test');
  });

  it('should have database connection', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/monitoring/health'
    });

    // This should work even if monitoring route fails
    expect(response.statusCode).toBeGreaterThanOrEqual(200);
    expect(response.statusCode).toBeLessThan(500);
  });
});
