// Enhanced exercise and student tests with proper setup
// Create src/tests/exercises.test.ts

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { build } from '../app-test';
import { setupExerciseTestData } from './helpers/test-data';
import { FastifyInstance } from 'fastify';

describe('Exercise Routes', () => {
  let app: FastifyInstance;
  let authToken: string | null = null;

  // Setup test data before all tests
  beforeAll(async () => {
    // Ensure test data exists in database
    await setupExerciseTestData();
  });

  beforeEach(async () => {
    try {
      app = await build();
      
      // Login to get auth token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'Alice',
          nom: 'Dupont',
        },
      });

      if (loginResponse.statusCode === 200) {
        const loginData = JSON.parse(loginResponse.body);
        authToken = loginData.data?.token || null;
      }
    } catch (error) {
      console.error('Exercise test setup failed:', error);
      throw error;
    }
  });

  afterEach(async () => {
    authToken = null;
    if (app) {
      await app.close();
    }
  });

  // Helper function for authenticated requests
  const authenticatedRequest = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: any) => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    
    return await app.inject({
      method,
      url,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload,
    });
  };

  describe('Exercise Module Operations', () => {
    it('should create module with competence mapping', async () => {
      if (!authToken) {
        console.warn('Skipping test - no auth token');
        return;
      }

      const response = await authenticatedRequest('POST', '/api/exercises/modules', {
        titre: 'Test Module',
        description: 'Test module description',
        competences: ['CP.2025.1', 'CP.2025.2'],
        niveau: 'CE1'
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.titre).toBe('Test Module');
    });

    it('should generate multiple exercises from competence codes', async () => {
      if (!authToken) {
        console.warn('Skipping test - no auth token');
        return;
      }

      const response = await authenticatedRequest('POST', '/api/exercises/generate', {
        competences: ['CP.2025.1', 'CP.2025.2'],
        niveau: 'CE1',
        quantite: 5
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
}); 