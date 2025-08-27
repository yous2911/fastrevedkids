import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment variables  
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.BCRYPT_ROUNDS = '10';
process.env.LOG_LEVEL = 'error';

// Only mock external services - NOT your database!
// Your real seeded database with Emma, Lucas etc. will be used

// Mock only email service (already handled by email service itself in test mode)
vi.mock('../src/services/email.service', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue(true),
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
    sendGDPRNotification: vi.fn().mockResolvedValue(true)
  }
}));

// Mock Redis (your app already falls back to memory cache)
vi.mock('redis', () => ({
  default: {
    createClient: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
      off: vi.fn()
    })
  }
}));

// Mock file system operations for safety
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs') as any;
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      unlink: vi.fn().mockResolvedValue(undefined),
      access: vi.fn().mockResolvedValue(undefined)
    }
  };
});

// Global test setup
beforeAll(async () => {
  console.log('🚀 Test environment ready - using REAL seeded database');
});

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Test cleanup complete');
});

// Test utilities for your real data
export const testUtils = {
  createMockRequest: (data: any = {}) => ({
    headers: {},
    body: {},
    query: {},
    params: {},
    file: null,
    files: null,
    user: null,
    ...data
  }),

  createMockResponse: () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.redirect = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);
    res.getHeader = vi.fn();
    res.headers = {};
    return res;
  },

  createMockNext: () => vi.fn(),

  // Your real seeded data (Emma, Lucas, etc.)
  testStudents: {
    emma: {
      id: 1,
      firstName: 'Emma',
      lastName: 'Dupont',
      email: 'emma.dupont@test.com',
      level: 'CP'
    },
    lucas: {
      id: 2,
      firstName: 'Lucas',
      lastName: 'Martin',  
      email: 'lucas.martin@test.com',
      level: 'CE1'
    }
  }
};