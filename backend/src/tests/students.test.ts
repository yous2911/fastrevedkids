import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '../app-test';

describe('Students Routes', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeEach(async () => {
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

    const loginData = JSON.parse(loginResponse.body);
    authToken = loginData.data.token;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/students/:id', () => {
    it('should get student data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/1',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.prenom).toBe('Alice');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/1',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should prevent access to other students data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/999',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/students/:id/recommendations', () => {
    it('should get exercise recommendations', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/1/recommendations?limit=5',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/students/:id/attempts', () => {
    it('should submit exercise attempt', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/students/1/attempts',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          exerciseId: 1,
          attempt: {
            reponse: '7',
            reussi: true,
            tempsSecondes: 30,
            aidesUtilisees: 0,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.reussi).toBe(true);
      expect(data.data.pointsGagnes).toBeGreaterThan(0);
    });

    it('should validate attempt data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/students/1/attempts',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          exerciseId: 1,
          attempt: {
            reponse: '7',
            reussi: 'invalid', // Should be boolean
            tempsSecondes: 30,
          },
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
