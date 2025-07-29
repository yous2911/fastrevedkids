import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// FORCE load ONLY env.backend - ignore all other .env files
const envPath = path.join(process.cwd(), 'env.backend');

// Verify the file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ env.backend file not found at:', envPath);
  process.exit(1);
}

// Clear any existing environment variables that might interfere
delete process.env.NODE_ENV;
delete process.env.PORT;
delete process.env.REDIS_ENABLED;

// Load ONLY from env.backend
const result = dotenv.config({ 
  path: envPath,
  override: true  // Override any existing env vars
});

if (result.error) {
  console.error('❌ Failed to load env.backend:', result.error.message);
  process.exit(1);
}

console.log('✅ Loaded environment from:', envPath);
console.log('✅ PORT from env.backend:', process.env.PORT);
console.log('✅ REDIS_ENABLED from env.backend:', process.env.REDIS_ENABLED);

// Flexible configuration schema with sensible defaults
const configSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1000).max(65535).default(3003),
  HOST: z.string().default('0.0.0.0'),
  
  // Database Configuration (flexible for development)
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('reved_kids'),
  DB_CONNECTION_LIMIT: z.coerce.number().default(20),
  
  // Redis Configuration (optional)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_ENABLED: z.coerce.boolean().default(false), // Disabled by default for easier setup
  
  // Security (with development fallbacks)
  JWT_SECRET: z.string().min(8).default('dev-secret-key-change-in-production-minimum-32-chars'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  ENCRYPTION_KEY: z.string().min(8).default('dev-encryption-key-change-in-production-32-chars'),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutes
  
  // File Upload
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Monitoring
  ENABLE_METRICS: z.coerce.boolean().default(true),
  METRICS_INTERVAL: z.coerce.number().default(60000),
  
  // Cache
  CACHE_TTL: z.coerce.number().default(900),
  CACHE_MAX_SIZE: z.coerce.number().default(1000),
  
  // Performance
  REQUEST_TIMEOUT: z.coerce.number().default(30000),
  BODY_LIMIT: z.coerce.number().default(10485760),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FILE: z.string().optional().default(''),
  
  // WebSocket
  WS_HEARTBEAT_INTERVAL: z.coerce.number().default(30000),
  WS_MAX_CONNECTIONS: z.coerce.number().default(1000),
  
  // GDPR Configuration
  GDPR_ENABLED: z.coerce.boolean().default(true),
  PARENTAL_CONSENT_REQUIRED: z.coerce.boolean().default(true),
  CONSENT_TOKEN_EXPIRY_HOURS: z.coerce.number().default(168), // 7 days
  DATA_RETENTION_DAYS: z.coerce.number().default(1095), // 3 years
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().default(2190), // 6 years
  ANONYMIZATION_AFTER_INACTIVITY_DAYS: z.coerce.number().default(730), // 2 years
  ENCRYPTION_KEY_ROTATION_DAYS: z.coerce.number().default(90),
  GDPR_REQUEST_DEADLINE_DAYS: z.coerce.number().default(30),
  
  // Email Configuration for GDPR
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@revedkids.com'),
  SUPPORT_EMAIL: z.string().default('support@revedkids.com'),
});

// Safe parsing with detailed error handling
let config: z.infer<typeof configSchema>;

try {
  const parseResult = configSchema.safeParse(process.env);
  
  if (!parseResult.success) {
    console.warn('⚠️  Configuration warnings:');
    parseResult.error.issues.forEach(issue => {
      console.warn(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    
    // Use defaults for missing values
    config = configSchema.parse({});
    console.log('✅ Using default configuration values');
  } else {
    config = parseResult.data;
    console.log('✅ Configuration loaded successfully');
  }
} catch (error) {
  console.error('❌ Critical configuration error:', error);
  console.log('🔧 Using emergency defaults...');
  
  // Emergency fallback configuration
  config = {
    NODE_ENV: 'development',
    PORT: 3000,
    HOST: '0.0.0.0',
    DB_HOST: 'localhost',
    DB_PORT: 3306,
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_NAME: 'reved_kids',
    DB_CONNECTION_LIMIT: 20,
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: '',
    REDIS_DB: 0,
    REDIS_ENABLED: false,
    JWT_SECRET: 'dev-secret-key-change-in-production-minimum-32-chars',
    JWT_EXPIRES_IN: '24h',
    ENCRYPTION_KEY: 'dev-encryption-key-change-in-production-32-chars',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW: 900000,
    MAX_FILE_SIZE: 10485760,
    UPLOAD_PATH: './uploads',
    ENABLE_METRICS: true,
    METRICS_INTERVAL: 60000,
    CACHE_TTL: 900,
    CACHE_MAX_SIZE: 1000,
    REQUEST_TIMEOUT: 30000,
    BODY_LIMIT: 10485760,
    CORS_ORIGIN: 'http://localhost:3000,http://localhost:3001',
    CORS_CREDENTIALS: true,
    LOG_LEVEL: 'info' as const,
    LOG_FILE: '',
    WS_HEARTBEAT_INTERVAL: 30000,
    WS_MAX_CONNECTIONS: 1000,
  };
}

// Environment helpers
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

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
  password: config.REDIS_PASSWORD || undefined,
  db: config.REDIS_DB,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  showFriendlyErrorStack: isDevelopment,
  connectTimeout: 10000,
  commandTimeout: 5000,
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
  allowList: isDevelopment ? ['127.0.0.1', 'localhost'] : [],
  continueExceeding: true,
  skipOnError: true,
  keyGenerator: (req: any) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
};

// Helmet configuration
export const helmetConfig = {
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
  crossOriginResourcePolicy: { policy: "cross-origin" as const },
};

// CORS configuration
export const corsConfig = {
  origin: isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']
    : config.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: config.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
};

// GDPR configuration
export const gdprConfig = {
  enabled: config.GDPR_ENABLED,
  parentalConsentRequired: config.PARENTAL_CONSENT_REQUIRED,
  consentTokenExpiryHours: config.CONSENT_TOKEN_EXPIRY_HOURS,
  dataRetentionDays: config.DATA_RETENTION_DAYS,
  auditLogRetentionDays: config.AUDIT_LOG_RETENTION_DAYS,
  anonymizationAfterInactivityDays: config.ANONYMIZATION_AFTER_INACTIVITY_DAYS,
  encryptionKeyRotationDays: config.ENCRYPTION_KEY_ROTATION_DAYS,
  gdprRequestDeadlineDays: config.GDPR_REQUEST_DEADLINE_DAYS,
};

// Email configuration
export const emailConfig = {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
  from: config.SMTP_FROM,
  supportEmail: config.SUPPORT_EMAIL,
};

// Enhanced validation with helpful messages
export function validateEnvironment(): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check critical production settings
  if (isProduction) {
    if (config.JWT_SECRET.includes('dev-') || config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be changed and be at least 32 characters in production');
    }
    
    if (config.ENCRYPTION_KEY.includes('dev-') || config.ENCRYPTION_KEY.length < 32) {
      errors.push('ENCRYPTION_KEY must be changed and be at least 32 characters in production');
    }
    
    if (!config.DB_PASSWORD) {
      warnings.push('Database password is empty in production');
    }
  }

  // Check database connection requirements
  if (!config.DB_HOST || !config.DB_NAME) {
    errors.push('Database host and name are required');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Log errors and exit if critical
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment validation passed');
}

// Export the config object
export { config }; 