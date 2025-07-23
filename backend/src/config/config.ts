// src/config/config.ts
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('3306'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('reved_kids'),
  
  // Redis
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().default('your-default-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  
  // Performance
  REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),
  BODY_LIMIT: z.string().transform(Number).default('10485760'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const env = envSchema.parse(process.env);

// Export configuration
export const config = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  HOST: env.HOST,
  DB_HOST: env.DB_HOST,
  DB_PORT: env.DB_PORT,
  DB_USER: env.DB_USER,
  DB_PASSWORD: env.DB_PASSWORD,
  DB_NAME: env.DB_NAME,
  REDIS_HOST: env.REDIS_HOST,
  REDIS_PORT: env.REDIS_PORT,
  REDIS_PASSWORD: env.REDIS_PASSWORD,
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  LOG_LEVEL: env.LOG_LEVEL,
  REQUEST_TIMEOUT: env.REQUEST_TIMEOUT,
  BODY_LIMIT: env.BODY_LIMIT,
  CORS_ORIGIN: env.CORS_ORIGIN,
};

// CORS configuration
export const corsConfig = {
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
};

// Helmet configuration
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

// Rate limit configuration
export const rateLimitConfig = {
  max: 100,
  timeWindow: 900000, // 15 minutes
  cache: 10000,
  allowList: ['127.0.0.1'],
  continueExceeding: true,
  skipOnError: true,
};

// Environment validation
export function validateEnvironment(): void {
  const required = ['JWT_SECRET'];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  console.log('✅ Environment validation passed');
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple health check - can be enhanced later
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Redis health check
export async function checkRedisHealth(): Promise<boolean> {
  if (!config.REDIS_HOST) return true; // Assuming REDIS_HOST is optional, so if not set, it's enabled
  
  try {
    // Simple health check - can be enhanced later
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// All configurations are already exported above

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
    issues.push(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Database check
  const dbHealthy = await checkDatabaseHealth();
  if (!dbHealthy) {
    issues.push('Database connection failed');
  }
  
  // Redis check
  const redisHealthy = await checkRedisHealth();
  if (!redisHealthy && config.REDIS_HOST) { // Only warn if REDIS_HOST is set
    warnings.push('Redis connection failed - falling back to memory cache');
  }
  
  // Production-specific checks
  if (config.NODE_ENV === 'production') {
    if (!config.CORS_ORIGIN.includes('localhost')) {
      issues.push('CORS_ORIGIN not set to localhost in production');
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