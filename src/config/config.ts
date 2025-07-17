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

if (!config) {
  throw new Error("Config is not defined");
}

// Database configuration for Drizzle
export const dbConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  connectionLimit: config.DB_CONNECTION_LIMIT,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
};

// Redis configuration
export const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  showFriendlyErrorStack: isDevelopment,
};

// JWT configuration
export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  algorithm: 'HS256' as const,
  issuer: 'reved-kids',
  audience: 'reved-kids-students',
};

// Rate limiting configuration
export const rateLimitConfig = {
  max: config.RATE_LIMIT_MAX,
  timeWindow: config.RATE_LIMIT_WINDOW,
  cache: 10000,
  allowList: ['127.0.0.1'],
  continueExceeding: true,
  skipOnError: true,
};

// CORS configuration
export const corsConfig = {
  origin: isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
    : config.CORS_ORIGIN.split(','),
  credentials: config.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Validation helper
export function validateEnvironment() {
  const required = ['JWT_SECRET', 'ENCRYPTION_KEY'];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  console.log('✅ Environment validation passed');
} 