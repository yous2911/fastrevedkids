import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '../app-test';
import { FastifyInstance } from 'fastify';

describe('Authentication Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await build();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login student successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'Alice',
          nom: 'Dupont',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.student.prenom).toBe('Alice');
    });

    it('should return 404 for non-existent student', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'NonExistent',
          nom: 'Student',
        },
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('STUDENT_NOT_FOUND');
    });

    it('should validate input data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'A', // Too short
          nom: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/auth/health', () => {
    it('should return auth service health', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
    });
  });
}); 