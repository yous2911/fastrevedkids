import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app-test';
import { connectDatabase, disconnectDatabase } from '../../src/db/connection';

describe('Authentication API Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Connect to the main database (same as the app)
    await connectDatabase();
    app = await build();
    await app.ready();
    
    // Reset test counters
    if (global.testFailedAttempts) {
      global.testFailedAttempts = 0;
    }
  });

  beforeEach(async () => {
    // Reset test counters before each test
    if (global.testFailedAttempts) {
      global.testFailedAttempts = 0;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await disconnectDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
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

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.student).toHaveProperty('id');
      expect(data.data.student.email).toBe('test@example.com');
      expect(data.data.token).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          prenom: 'Duplicate',
          nom: 'Student',
          email: 'test@example.com',
          password: 'SecurePass123!',
          dateNaissance: '2015-06-15',
          niveauScolaire: 'CP'
        }
      });

      expect(response.statusCode).toBe(409);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should validate password strength requirements', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          prenom: 'Weak',
          nom: 'Password',
          email: 'weak@example.com',
          password: '123',
          dateNaissance: '2015-06-15',
          niveauScolaire: 'CP'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('WEAK_PASSWORD');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'SecurePass123!'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.student).toHaveProperty('id');
    });

    it('should reject invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'WrongPassword123!'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle account lockout after failed attempts', async () => {
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: {
            email: 'test@example.com',
            password: 'WrongPassword123!'
          }
        });
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'SecurePass123!'
        }
      });

      expect(response.statusCode).toBe(423);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh valid token', async () => {
      // Use a mock token directly for testing
      const mockToken = 'mock-jwt-token-' + Date.now();

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          'Authorization': `Bearer ${mockToken}`
        },
        payload: {
          refreshToken: mockToken
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.token).not.toBe(mockToken);
    });

    it('should reject expired token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          'Authorization': 'Bearer expired.token.here'
        },
        payload: {
          refreshToken: 'expired.token.here'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'SecurePass123!'
        }
      });

      const { token } = JSON.parse(loginResponse.payload).data;

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: {
          email: 'test@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toContain('reset email sent');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: {
          email: 'nonexistent@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      // Should not reveal if email exists or not
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: {
          token: 'valid-reset-token',
          newPassword: 'NewSecurePass123!'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });

    it('should reject invalid reset token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: {
          token: 'invalid-token',
          newPassword: 'NewSecurePass123!'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_RESET_TOKEN');
    });
  });
});
