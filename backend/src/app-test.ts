import Fastify from 'fastify';
import { vi } from 'vitest';
import { 
  mockStudents, 
  mockExercises, 
  mockDbQueries, 
  mockJwtPayloads,
  mockHelpers 
} from './tests/mocks/data';

export async function build() {
  const fastify = Fastify({
    logger: false, // Disable logging in tests
  });

  // Mock database decorator with comprehensive query methods
  fastify.decorate('db', {
    // Select operations
    select: vi.fn().mockImplementation((query: any) => {
      // Mock different queries based on the query structure
      if (query.from?.students) {
        return Promise.resolve(mockStudents);
      }
      if (query.from?.exercises) {
        return Promise.resolve(mockExercises);
      }
      return Promise.resolve([]);
    }),
    
    // Insert operations
    insert: vi.fn().mockImplementation(() => {
      return Promise.resolve({ affectedRows: 1, insertId: Date.now() });
    }),
    
    // Update operations
    update: vi.fn().mockImplementation(() => {
      return Promise.resolve({ affectedRows: 1 });
    }),
    
    // Delete operations
    delete: vi.fn().mockImplementation(() => {
      return Promise.resolve({ affectedRows: 1 });
    }),
    
    // Raw query method
    query: vi.fn().mockImplementation((sql: string, params?: any[]) => {
      // Mock based on SQL patterns
      if (sql.includes('SELECT') && sql.includes('students')) {
        if (sql.includes('WHERE') && params) {
          // Find student by name or ID
          const student = mockStudents.find(s => 
            params.includes(s.prenom) || 
            params.includes(s.nom) || 
            params.includes(s.id)
          );
          return Promise.resolve(student ? [student] : []);
        }
        return Promise.resolve(mockStudents);
      }
      
      if (sql.includes('SELECT') && sql.includes('exercises')) {
        return Promise.resolve(mockExercises);
      }
      
      if (sql.includes('INSERT')) {
        return Promise.resolve({ affectedRows: 1, insertId: Date.now() });
      }
      
      if (sql.includes('UPDATE')) {
        return Promise.resolve({ affectedRows: 1 });
      }
      
      return Promise.resolve([]);
    }),
    
    // Execute method for prepared statements
    execute: vi.fn().mockImplementation((sql: string, params?: any[]) => {
      return fastify.db.query(sql, params);
    }),
  });

  // Mock Redis decorator
  fastify.decorate('redis', {
    get: vi.fn().mockImplementation((key: string) => {
      // Mock some cached data
      if (key.includes('student:')) {
        const studentId = parseInt(key.split(':')[1]);
        const student = mockStudents.find(s => s.id === studentId);
        return Promise.resolve(student ? JSON.stringify(student) : null);
      }
      return Promise.resolve(null);
    }),
    
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(300),
    incr: vi.fn().mockResolvedValue(1),
    decr: vi.fn().mockResolvedValue(0),
  });

  // Mock JWT decorator
  fastify.decorate('jwt', {
    sign: vi.fn().mockImplementation((payload: any) => {
      // Return a predictable token based on the payload
      return `mock-token-${payload.studentId}`;
    }),
    
    verify: vi.fn().mockImplementation((token: string) => {
      // Mock token verification
      if (token === 'mock-token-1') {
        return mockJwtPayloads.alice;
      }
      if (token === 'mock-token-2') {
        return mockJwtPayloads.bob;
      }
      if (token.startsWith('mock-token-')) {
        // Extract student ID from token
        const studentId = parseInt(token.split('-')[2]);
        const student = mockStudents.find(s => s.id === studentId);
        if (student) {
          return {
            studentId: student.id,
            prenom: student.prenom,
            nom: student.nom,
            niveau: student.niveau,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
          };
        }
      }
      throw new Error('Invalid token');
    }),
  });

  // Mock authentication preHandler
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: {
          message: 'Token requis',
          code: 'MISSING_TOKEN',
        },
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = fastify.jwt.verify(token);
      request.user = payload;
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: {
          message: 'Token invalide',
          code: 'INVALID_TOKEN',
        },
      });
    }
  });

  // Mock health check decorators
  fastify.decorate('dbHealth', async () => ({
    status: 'healthy',
    message: 'Database connection OK (mocked)',
    responseTime: 5,
  }));

  fastify.decorate('redisHealth', async () => ({
    status: 'healthy',
    message: 'Redis connection OK (mocked)',
    responseTime: 2,
  }));

  // Register validation plugin (can be real since it doesn't need external deps)
  try {
    await fastify.register(import('./plugins/validation'));
  } catch (error) {
    // If validation plugin fails, create a minimal mock
    console.warn('Validation plugin failed to load, using mock');
  }

  // Register routes with mocked dependencies
  await fastify.register(import('./routes/auth'), { prefix: '/api/auth' });
  await fastify.register(import('./routes/students'), { prefix: '/api/students' });
  await fastify.register(import('./routes/monitoring'), { prefix: '/api/monitoring' });

  // Add health check endpoint
  fastify.get('/api/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'test',
      services: {
        database: await fastify.dbHealth(),
        redis: await fastify.redisHealth(),
      },
    };
  });

  // Global error handler for tests
  fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);
    
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
      },
    });
  });

  return fastify;
}
