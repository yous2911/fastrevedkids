// src/config/config.ts
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Configuration schema validation
const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('reved_kids'),
  DB_CONNECTION_LIMIT: z.coerce.number().default(20),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_ENABLED: z.coerce.boolean().default(true),

  // Security
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  ENCRYPTION_KEY: z.string().min(32),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutes

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),

  // Monitoring
  ENABLE_METRICS: z.coerce.boolean().default(true),
  METRICS_INTERVAL: z.coerce.number().default(60000), // 1 minute

  // Cache
  CACHE_TTL: z.coerce.number().default(900), // 15 minutes
  CACHE_MAX_SIZE: z.coerce.number().default(1000),

  // Performance
  REQUEST_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  BODY_LIMIT: z.coerce.number().default(10485760), // 10MB

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FILE: z.string().optional(),

  // WebSocket
  WS_HEARTBEAT_INTERVAL: z.coerce.number().default(30000), // 30 seconds
  WS_MAX_CONNECTIONS: z.coerce.number().default(1000),

  // SSL Configuration
  SSL_ENABLED: z.coerce.boolean().default(false),
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  SSL_CA_PATH: z.string().optional(),
});

// Parse and validate configuration
const parseResult = configSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Configuration validation failed:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const config = parseResult.data;

// Environment-specific configurations
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Database configuration for Drizzle
const dbConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  connectionLimit: config.DB_CONNECTION_LIMIT,
  ssl: isProduction ? {
    rejectUnauthorized: false,
    ca: config.SSL_CA_PATH ? require('fs').readFileSync(config.SSL_CA_PATH) : undefined,
    cert: config.SSL_CERT_PATH ? require('fs').readFileSync(config.SSL_CERT_PATH) : undefined,
    key: config.SSL_KEY_PATH ? require('fs').readFileSync(config.SSL_KEY_PATH) : undefined,
  } : undefined,
};

// Redis configuration
const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  showFriendlyErrorStack: isDevelopment,
  connectTimeout: 60000,
  commandTimeout: 5000,
  family: 4, // IPv4
};

// JWT configuration
const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  algorithm: 'HS256' as const,
  issuer: 'reved-kids',
  audience: 'reved-kids-students',
};

// Rate limiting configuration
const rateLimitConfig = {
  max: config.RATE_LIMIT_MAX,
  timeWindow: config.RATE_LIMIT_WINDOW,
  cache: 10000,
  allowList: ['127.0.0.1'],
  continueExceeding: true,
  skipOnError: true,
  keyGenerator: (request: any) => {
    return request.ip + ':' + (request.headers['user-agent'] || 'unknown');
  },
};

// CORS configuration
const corsConfig = {
  origin: isDevelopment
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
    : config.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: config.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-API-Key',
    'Cache-Control'
  ],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
  maxAge: 86400, // 24 hours
};

// Helmet security configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

// Monitoring configuration
const monitoringConfig = {
  enableMetrics: config.ENABLE_METRICS,
  metricsInterval: config.METRICS_INTERVAL,
  healthCheckTimeout: 5000,
  alertThresholds: {
    cpuUsage: 80, // percent
    memoryUsage: 85, // percent
    diskUsage: 90, // percent
    responseTime: 2000, // milliseconds
    errorRate: 5, // percent
  },
};

// Cache configuration
const cacheConfig = {
  ttl: config.CACHE_TTL,
  maxSize: config.CACHE_MAX_SIZE,
  checkPeriod: 600, // 10 minutes
  useClones: false,
  deleteOnExpire: true,
  enableLegacyCallbacks: false,
};

// File upload configuration
const uploadConfig = {
  maxFileSize: config.MAX_FILE_SIZE,
  uploadPath: config.UPLOAD_PATH,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
  ],
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024, // 1MB
    fields: 10,
    files: 5,
  },
};

// WebSocket configuration
const wsConfig = {
  heartbeatInterval: config.WS_HEARTBEAT_INTERVAL,
  maxConnections: config.WS_MAX_CONNECTIONS,
  compression: true,
  perMessageDeflate: {
    threshold: 1024,
    concurrencyLimit: 10,
    memLevel: 7,
  },
};

// Validation helper
export function validateEnvironment() {
  const required = ['JWT_SECRET', 'ENCRYPTION_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // Validate JWT secret length
  if (config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate encryption key length
  if (config.ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }

  // Production-specific validations
  if (isProduction) {
    const productionChecks = [
      { key: 'DB_PASSWORD', message: 'Database password is required in production' },
      { key: 'REDIS_PASSWORD', message: 'Redis password is required in production' },
    ];

    for (const check of productionChecks) {
      if (!process.env[check.key]) {
        console.warn(`⚠️  Warning: ${check.message}`);
      }
    }

    // Check for default/weak passwords
    const weakPasswords = ['password', 'admin', 'root', '123456', 'rootpassword'];
    if (config.DB_PASSWORD && weakPasswords.includes(config.DB_PASSWORD.toLowerCase())) {
      throw new Error('Weak database password detected. Use a strong password in production.');
    }
  }

  console.log('✅ Environment validation passed');
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { getDatabase } = await import('../db/connection');
    const db = getDatabase();
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Redis health check
export async function checkRedisHealth(): Promise<boolean> {
  if (!config.REDIS_ENABLED) return true;

  try {
    const Redis = await import('ioredis');
    const redis = new Redis.default(redisConfig);
    await redis.ping();
    await redis.disconnect();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Export all configurations
export {
  dbConfig,
  redisConfig,
  jwtConfig,
  rateLimitConfig,
  corsConfig,
  helmetConfig,
  monitoringConfig,
  cacheConfig,
  uploadConfig,
  wsConfig,
};

// Production readiness check
export async function checkProductionReadiness(): Promise<{
  ready: boolean;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Environment checks
  try {
    validateEnvironment();
  } catch (error) {
    issues.push(`Environment validation failed: ${error.message}`);
  }

  // Database check
  const dbHealthy = await checkDatabaseHealth();
  if (!dbHealthy) {
    issues.push('Database connection failed');
  }

  // Redis check
  const redisHealthy = await checkRedisHealth();
  if (!redisHealthy && config.REDIS_ENABLED) {
    warnings.push('Redis connection failed - falling back to memory cache');
  }

  // Production-specific checks
  if (isProduction) {
    if (!config.SSL_ENABLED) {
      warnings.push('SSL not enabled in production');
    }

    if (config.CORS_ORIGIN === 'http://localhost:3000') {
      issues.push('CORS_ORIGIN still set to localhost in production');
    }

    if (config.LOG_LEVEL === 'debug' || config.LOG_LEVEL === 'trace') {
      warnings.push('Debug logging enabled in production');
    }
  }

  return {
    ready: issues.length === 0,
    issues,
    warnings,
  };
}
