import { beforeAll, afterAll, beforeEach } from 'vitest';
import { vi } from 'vitest';

// Mock database connection for tests
beforeAll(async () => {
  // Mock the database plugin
  vi.mock('../plugins/database', () => ({
    default: vi.fn().mockImplementation(async (fastify) => {
      // Mock database connection
      fastify.decorate('db', {
        query: vi.fn(),
        execute: vi.fn(),
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });
      
      // Mock database health check
      fastify.decorate('dbHealth', vi.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Database connection OK (mocked)',
      }));
    }),
  }));

  // Mock Redis plugin
  vi.mock('../plugins/redis', () => ({
    default: vi.fn().mockImplementation(async (fastify) => {
      // Mock Redis connection
      fastify.decorate('redis', {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        exists: vi.fn(),
        expire: vi.fn(),
        ttl: vi.fn(),
        incr: vi.fn(),
        decr: vi.fn(),
      });
      
      // Mock Redis health check
      fastify.decorate('redisHealth', vi.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Redis connection OK (mocked)',
      }));
    }),
  }));

  // Mock JWT plugin
  vi.mock('../plugins/auth', () => ({
    default: vi.fn().mockImplementation(async (fastify) => {
      // Mock JWT methods
      fastify.decorate('jwt', {
        sign: vi.fn().mockReturnValue('mock-jwt-token'),
        verify: vi.fn().mockReturnValue({ studentId: 1, prenom: 'Alice', nom: 'Dupont' }),
      });
      
      // Mock authentication preHandler
      fastify.decorate('authenticate', vi.fn().mockImplementation(async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({
            success: false,
            error: { message: 'Token requis', code: 'MISSING_TOKEN' },
          });
        }
        
        // Mock successful authentication
        request.user = { studentId: 1, prenom: 'Alice', nom: 'Dupont' };
      }));
    }),
  }));

  // Mock validation plugin
  vi.mock('../plugins/validation', () => ({
    default: vi.fn().mockImplementation(async (fastify) => {
      // Validation plugin usually adds schema compilation
      // For tests, we can mock this or let it pass through
    }),
  }));

  console.log('✅ Test mocks initialized');
});

afterAll(async () => {
  vi.clearAllMocks();
  console.log('✅ Test mocks cleared');
});

beforeEach(async () => {
  // Clear mocks before each test but keep the mock implementations
  vi.clearAllMocks();
});
