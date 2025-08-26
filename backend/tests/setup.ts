import { beforeAll, afterAll } from 'vitest';
import { config } from '../src/config/config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_fastrevedkids';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.BCRYPT_ROUNDS = '10';
process.env.FILE_UPLOAD_PATH = './test-uploads';
process.env.MAX_FILE_SIZE = '10485760'; // 10MB
process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,image/gif,application/pdf,audio/mpeg,video/mp4';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.EMAIL_SERVICE = 'mock';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USER = 'test';
process.env.SMTP_PASS = 'test';
process.env.FROM_EMAIL = 'test@fastrevedkids.com';
process.env.LOG_LEVEL = 'error';
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';
process.env.RATE_LIMIT_WINDOW = '900000'; // 15 minutes
process.env.RATE_LIMIT_MAX = '100';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.SESSION_MAX_AGE = '86400000'; // 24 hours
process.env.PASSWORD_MIN_LENGTH = '8';
process.env.PASSWORD_REQUIRE_UPPERCASE = 'true';
process.env.PASSWORD_REQUIRE_LOWERCASE = 'true';
process.env.PASSWORD_REQUIRE_NUMBERS = 'true';
process.env.PASSWORD_REQUIRE_SPECIAL = 'true';
process.env.ACCOUNT_LOCKOUT_THRESHOLD = '5';
process.env.ACCOUNT_LOCKOUT_DURATION = '900000'; // 15 minutes
process.env.TOKEN_EXPIRY = '3600000'; // 1 hour
process.env.REFRESH_TOKEN_EXPIRY = '2592000000'; // 30 days
process.env.GDPR_RETENTION_PERIOD = '2555'; // 7 years
process.env.BACKUP_SCHEDULE = '0 2 * * *'; // Daily at 2 AM
process.env.BACKUP_RETENTION_DAYS = '30';
process.env.MONITORING_ENABLED = 'false';
process.env.ALERT_EMAIL = 'alerts@fastrevedkids.com';
process.env.SECURITY_SCAN_INTERVAL = '86400000'; // 24 hours
process.env.VULNERABILITY_SCAN_ENABLED = 'false';
process.env.PERFORMANCE_MONITORING = 'false';
process.env.ANALYTICS_ENABLED = 'false';
process.env.DEBUG_MODE = 'false';
process.env.TESTING_MODE = 'true';

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true)
  })
}));

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    off: jest.fn()
  })
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  },
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn()
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  resolve: jest.fn().mockImplementation((...args) => args.join('/')),
  extname: jest.fn().mockReturnValue('.jpg'),
  basename: jest.fn().mockImplementation((path) => path.split('/').pop())
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue(Buffer.from('test-random-bytes')),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('test-hash')
  })
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$test.hash'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('$2b$10$test.salt')
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test.jwt.token'),
  verify: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' })
}));

jest.mock('multer', () => {
  const multer = jest.fn().mockReturnValue({
    single: jest.fn().mockReturnValue((req: any, res: any, next: any) => {
      req.file = {
        fieldname: 'file',
        originalname: 'test-file.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: './test-uploads',
        filename: 'test-file.jpg',
        path: './test-uploads/test-file.jpg',
        buffer: Buffer.from('test-file-content')
      };
      next();
    }),
    array: jest.fn().mockReturnValue((req: any, res: any, next: any) => {
      req.files = [
        {
          fieldname: 'files',
          originalname: 'test-file-1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: './test-uploads',
          filename: 'test-file-1.jpg',
          path: './test-uploads/test-file-1.jpg',
          buffer: Buffer.from('test-file-content-1')
        },
        {
          fieldname: 'files',
          originalname: 'test-file-2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 2048,
          destination: './test-uploads',
          filename: 'test-file-2.jpg',
          path: './test-uploads/test-file-2.jpg',
          buffer: Buffer.from('test-file-content-2')
        }
      ];
      next();
    })
  });
  
  multer.memoryStorage = jest.fn().mockReturnValue({});
  multer.diskStorage = jest.fn().mockReturnValue({});
  
  return multer;
});

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test-image-buffer')),
    toFile: jest.fn().mockResolvedValue(undefined),
    metadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: 'jpeg',
      size: 1024
    })
  })
}));

jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation((schedule, callback) => ({
    start: jest.fn(),
    stop: jest.fn(),
    fireOnTick: jest.fn(),
    running: false
  }))
}));

jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
  }),
  format: {
    combine: jest.fn().mockReturnValue({}),
    timestamp: jest.fn().mockReturnValue({}),
    errors: jest.fn().mockReturnValue({}),
    json: jest.fn().mockReturnValue({}),
    simple: jest.fn().mockReturnValue({}),
    colorize: jest.fn().mockReturnValue({})
  },
  transports: {
    Console: jest.fn().mockImplementation(() => ({
      log: jest.fn()
    })),
    File: jest.fn().mockImplementation(() => ({
      log: jest.fn()
    }))
  }
}));

jest.mock('helmet', () => jest.fn().mockReturnValue((req: any, res: any, next: any) => next()));

jest.mock('cors', () => jest.fn().mockReturnValue((req: any, res: any, next: any) => next()));

jest.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: jest.fn().mockImplementation(() => ({
    consume: jest.fn().mockResolvedValue({ remainingPoints: 99, msBeforeNext: 900000 }),
    get: jest.fn().mockResolvedValue({ remainingPoints: 100, msBeforeNext: 900000 }),
    resetKey: jest.fn().mockResolvedValue(undefined)
  })),
  RateLimiterRedis: jest.fn().mockImplementation(() => ({
    consume: jest.fn().mockResolvedValue({ remainingPoints: 99, msBeforeNext: 900000 }),
    get: jest.fn().mockResolvedValue({ remainingPoints: 100, msBeforeNext: 900000 }),
    resetKey: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('express-rate-limit', () => jest.fn().mockReturnValue((req: any, res: any, next: any) => next()));

jest.mock('compression', () => jest.fn().mockReturnValue((req: any, res: any, next: any) => next()));

jest.mock('express-slow-down', () => jest.fn().mockReturnValue((req: any, res: any, next: any) => next()));

// Global test setup
beforeAll(async () => {
  // Create test directories
  const fs = require('fs');
  const testDirs = [
    './test-uploads',
    './test-uploads/image',
    './test-uploads/document',
    './test-uploads/audio',
    './test-uploads/video',
    './test-uploads/resource',
    './test-logs',
    './test-backups'
  ];

  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Set up test database connection
  console.log('Setting up test environment...');
});

// Global test cleanup
afterAll(async () => {
  // Clean up test files
  const fs = require('fs');
  const path = require('path');

  const cleanupDirs = [
    './test-uploads',
    './test-logs',
    './test-backups'
  ];

  for (const dir of cleanupDirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  console.log('Test environment cleaned up.');
});

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Export test utilities
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
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.getHeader = jest.fn();
    res.headers = {};
    return res;
  },

  createMockNext: () => jest.fn(),

  generateTestToken: (payload: any = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId: 1, email: 'test@example.com', ...payload },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  createTestFile: (filename: string, content: string = 'test content') => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join('./test-uploads', filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  },

  cleanupTestFile: (filePath: string) => {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// Global test timeout
jest.setTimeout(30000);
