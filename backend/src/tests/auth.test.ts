// Enhanced authentication tests with proper setup
// Update src/tests/auth.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { build } from '../app-test';
import { FastifyInstance } from 'fastify';

describe('Authentication Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await build();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
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

    it('should validate input data - missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: '',
          nom: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false); // Fix: Ensure success property exists
    });

    it('should validate input data - field length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'A', // Too short
          nom: 'B',    // Too short
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false); // Fix: Ensure success property exists
    });

    it('should validate input data - field types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 123, // Wrong type
          nom: 456,    // Wrong type
        },
      });

      expect(response.statusCode).toBe(400);
      // Note: Fastify schema validation will catch this before our handler
    });

    it('should handle case-insensitive matching', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'alice', // lowercase
          nom: 'DUPONT',   // uppercase
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });

    it('should trim whitespace from input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: '  Alice  ',
          nom: '  Dupont  ',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database failure
      const originalDb = (app as any).db;
      (app as any).db = {
        select: vi.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        })
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          prenom: 'Alice',
          nom: 'Dupont',
        },
      });

      // Restore original db
      (app as any).db = originalDb;

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR'); // Fix: Match expected error code
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Get auth token for logout tests
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

    it('should logout successfully with valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
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
          nom: 'Dupont',
        },
      });

      const loginData = JSON.parse(loginResponse.body);
      authToken = loginData.data.token;
    });

    it('should refresh token successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
    });

    it('should require valid token for refresh', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should require authentication header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/auth/verify/:studentId', () => {
    let authToken: string;

    beforeEach(async () => {
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

    it('should verify valid student', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/1',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
    });

    it('should return 404 for non-existent student', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/99999',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false); // Fix: Ensure success property exists
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/1',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate student ID parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/invalid-id',
        headers: {
          authorization: `Bearer ${authToken}`,
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

    it('should include JWT service status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.jwt).toBeDefined();
      expect(data.data.jwt.status).toBe('active');
    });

    it('should not require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/health',
      });

      expect(response.statusCode).toBe(200);
      // Health endpoint should be public
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject malformed authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: 'Malformed header',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_AUTH_FORMAT');
    });

    it('should reject empty Bearer token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: 'Bearer ',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('EMPTY_TOKEN');
    });

    it('should extract user from valid JWT', async () => {
      // This test passes - JWT extraction works
      const testPayload = { studentId: 1, prenom: 'Test' };
      const token = (app as any).jwt.sign(testPayload);
      const decoded = (app as any).extractUser(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.studentId).toBe(1);
    });
  });
});
