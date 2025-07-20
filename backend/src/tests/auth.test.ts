import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { build } from '../app-test';
import type { FastifyInstance } from 'fastify';
import { mockStudents, mockJwtPayloads } from './mocks/data';

// Extend FastifyInstance to include our custom decorators
interface TestFastifyInstance extends FastifyInstance {
  db: {
    query: any;
    select: any;
    insert: any;
    update: any;
    delete: any;
    execute: any;
  };
  redis: {
    get: any;
    set: any;
    del: any;
    exists: any;
    expire: any;
    ttl: any;
    incr: any;
    decr: any;
  };
  jwt: {
    sign: any;
    verify: any;
  };
  authenticate: any;
  dbHealth: any;
  redisHealth: any;
}

describe('Authentication Routes', () => {
  let app: TestFastifyInstance;

  beforeEach(async () => {
    app = await build() as TestFastifyInstance;
    
    // Setup specific mocks for auth tests
    vi.mocked(app.db.query).mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('SELECT') && sql.includes('students') && params?.length === 2) {
        const [prenom, nom] = params;
        const student = mockStudents.find(s => 
          s.prenom.toLowerCase() === prenom.toLowerCase() && 
          s.nom.toLowerCase() === nom.toLowerCase()
        );
        return student ? [student] : [];
      }
      return [];
    });
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
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          prenom: 'Alice',
          nom: 'Dupont',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('token');
      expect(data.data).toHaveProperty('student');
      expect(data.data.student.prenom).toBe('Alice');
      expect(data.data.student.nom).toBe('Dupont');
      expect(data.data.token).toMatch(/^mock-token-\d+$/);
    });

    it('should return 404 for non-existent student', async () => {
      // Mock database to return empty array for non-existent student
      vi.mocked(app.db.query).mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json',
        },
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
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          prenom: 'Alice',
          // Missing nom field
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should validate input data - field length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          prenom: 'A', // Too short
          nom: '',     // Empty
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should validate input data - field types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          prenom: 123,     // Should be string
          nom: ['Dupont'], // Should be string
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should handle case-insensitive matching', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          prenom: 'alice',  // lowercase
          nom: 'DUPONT',    // uppercase
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.student.prenom).toBe('Alice');
      expect(data.data.student.nom).toBe('Dupont');
    });

    it('should trim whitespace from input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json',
        },
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
      // Mock database to throw error
      vi.mocked(app.db.query).mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          prenom: 'Alice',
          nom: 'Dupont',
        },
      });

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: 'Bearer mock-token-1',
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.message).toContain('déconnecté');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: 'Bearer invalid-token',
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          authorization: 'Bearer mock-token-1',
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('token');
      expect(data.data.token).toMatch(/^mock-token-\d+$/);
    });

    it('should require valid token for refresh', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          authorization: 'Bearer invalid-token',
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should require authentication header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/auth/verify/:studentId', () => {
    it('should verify valid student', async () => {
      // Mock database to return student data
      vi.mocked(app.db.query).mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('SELECT') && sql.includes('students') && sql.includes('WHERE')) {
          const studentId = params?.[0];
          const student = mockStudents.find(s => s.id === studentId);
          return student ? [student] : [];
        }
        return [];
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/1',
        headers: {
          authorization: 'Bearer mock-token-1',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('verified', true);
      expect(data.data).toHaveProperty('student');
    });

    it('should return 404 for non-existent student', async () => {
      vi.mocked(app.db.query).mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/999',
        headers: {
          authorization: 'Bearer mock-token-1',
        },
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('STUDENT_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/1',
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_TOKEN');
    });

    it('should validate student ID parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify/invalid',
        headers: {
          authorization: 'Bearer mock-token-1',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
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
      expect(data.data).toHaveProperty('status', 'healthy');
      expect(data.data).toHaveProperty('timestamp');
      expect(data.data).toHaveProperty('service', 'auth');
    });

    it('should include JWT service status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('jwt');
      expect(data.data.jwt).toHaveProperty('status', 'healthy');
    });

    it('should not require authentication', async () => {
      // Health endpoint should be publicly accessible
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Authentication Middleware', () => {
    it('should extract user from valid JWT', async () => {
      // Test the authenticate middleware indirectly
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/1',
        headers: {
          authorization: 'Bearer mock-token-1',
        },
      });

      // If authentication succeeds, we should get a 200 or legitimate response
      expect([200, 404]).toContain(response.statusCode);
    });

    it('should reject malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/1',
        headers: {
          authorization: 'InvalidFormat token',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject empty Bearer token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/1',
        headers: {
          authorization: 'Bearer ',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
