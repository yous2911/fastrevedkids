import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../app-test';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import type { FastifyInstance } from 'fastify';

describe('Debug Auth Test', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Connect to the main database (same as the app)
    await connectDatabase();
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await disconnectDatabase();
  });

  it('should list registered routes', async () => {
    const routes = app.printRoutes();
    console.log('Registered routes:', routes);
    
    // Check if auth routes are in the list (handle trailing slash)
    expect(routes).toContain('auth/');
  });

  it('should access auth register endpoint with empty payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {} // Empty payload should return 400
    });

    console.log('Response status:', response.statusCode);
    console.log('Response payload:', response.payload);
    
    // Should not be 404 - the route should exist
    expect(response.statusCode).not.toBe(404);
  });

  it('should access auth register endpoint with valid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        prenom: 'Test',
        nom: 'Student',
        email: 'test@example.com',
        password: 'SecurePass123!',
        dateNaissance: '2015-06-15',
        niveauScolaire: 'CP'
      }
    });

    console.log('Response status:', response.statusCode);
    console.log('Response payload:', response.payload);
    
    // Should not be 404 - the route should exist
    expect(response.statusCode).not.toBe(404);
  });
});
