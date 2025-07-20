// Enhanced student tests
// Update src/tests/students.test.ts

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { build } from '../app-test';
import { FastifyInstance } from 'fastify';

describe('Students Routes', () => {
  let app: FastifyInstance;
  let authToken: string | null = null;

  beforeAll(async () => {
    // Setup test data
    await setupStudentTestData();
  });

  beforeEach(async () => {
    try {
      app = await build();
      
      // Ensure the auth route is available before trying to login
      const healthCheck = await app.inject({
        method: 'GET',
        url: '/api/auth/health'
      });
      
      if (healthCheck.statusCode !== 200) {
        throw new Error('Auth service not ready');
      }
      
      // Login to get auth token with better error handling
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'Alice',
          nom: 'Dupont',
        },
      });

      if (loginResponse.statusCode !== 200) {
        const errorBody = JSON.parse(loginResponse.body);
        throw new Error(`Login failed: ${errorBody.error?.message || 'Unknown error'}`);
      }

      const loginData = JSON.parse(loginResponse.body);
      
      if (!loginData.success || !loginData.data?.token) {
        throw new Error('Login response missing token');
      }
      
      authToken = loginData.data.token;
    } catch (error) {
      console.error('Failed to setup student test:', error);
      // Clean up the app if setup failed
      if (app) {
        await app.close();
      }
      throw error;
    }
  });

  afterEach(async () => {
    authToken = null;
    if (app) {
      await app.close();
    }
  });

  // Helper function to make authenticated requests
  const authenticatedRequest = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: any) => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    
    return app.inject({
      method,
      url,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload,
    });
  };

  describe('GET /api/students/:id', () => {
    it('should get student data', async () => {
      const response = await authenticatedRequest('GET', '/api/students/1');

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/1',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should prevent access to other students data', async () => {
      const response = await authenticatedRequest('GET', '/api/students/999');

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/students/:id/recommendations', () => {
    it('should get exercise recommendations', async () => {
      const response = await authenticatedRequest('GET', '/api/students/1/recommendations?limit=5');

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/students/:id/attempts', () => {
    it('should submit exercise attempt', async () => {
      const response = await authenticatedRequest('POST', '/api/students/1/attempts', {
        exerciseId: 1,
        attempt: {
          reponse: '7',
          reussi: true,
          tempsSecondes: 30,
          aidesUtilisees: 0,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.reussi).toBe(true);
      expect(data.data.pointsGagnes).toBeGreaterThan(0);
    });

    it('should validate attempt data', async () => {
      const response = await authenticatedRequest('POST', '/api/students/1/attempts', {
        exerciseId: 1,
        attempt: {
          reponse: '7',
          reussi: 'invalid', // Should be boolean
          tempsSecondes: 30,
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });
});

// Test data setup functions
async function setupStudentTestData() {
  // Setup test students
  try {
    console.log('Setting up student test data...');
    // Add your test data setup here
  } catch (error) {
    console.warn('Student test data setup failed:', error);
  }
}
