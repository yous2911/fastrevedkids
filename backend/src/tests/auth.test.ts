// src/tests/auth.test.ts - Authentication testing
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from './setup';

describe('Authentication Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'Alice',
          nom: 'Dupont'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.student.prenom).toBe('Alice');
    });

    it('should reject invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: '',
          nom: ''
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/auth/verify/:studentId', () => {
    it('should verify existing student', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/1'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.student).toBeDefined();
    });

    it('should return 404 for non-existent student', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/999999'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should validate student ID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/invalid'
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken: string;

    beforeEach(async () => {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'Alice',
          nom: 'Dupont'
        }
      });
      const loginData = JSON.parse(loginResponse.body);
      authToken = loginData.data.token;
    });

    it('should refresh valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.token).toBeDefined();
      expect(data.data.token).not.toBe(authToken);
    });

    it('should reject invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
