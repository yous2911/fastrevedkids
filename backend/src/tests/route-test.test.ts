import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../app-test';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import type { FastifyInstance } from 'fastify';

describe('Route Accessibility Test', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Connect to database
    await connectDatabase();
    
    // Build the app
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await disconnectDatabase();
  });

  it('should access root endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.payload);
    expect(data.success).toBe(true);
  });

  it('should access health endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.payload);
    expect(data.status).toBe('healthy');
  });

  it('should access auth register endpoint (should return 400 for missing data)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {} // Empty payload should return 400
    });

    // Should not be 404 - the route should exist
    expect(response.statusCode).not.toBe(404);
    
    // Should be 400 for validation error
    expect(response.statusCode).toBe(400);
  });

  it('should list registered routes', async () => {
    // This will help us see what routes are actually registered
    const routes = app.printRoutes();
    console.log('Registered routes:', routes);
    
    // Check if auth routes are in the list
    expect(routes).toContain('/api/auth');
  });
});
