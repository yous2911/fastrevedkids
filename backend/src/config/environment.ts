import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables from .env files
config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

// Environment schema with validation using Zod
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().min(1).max(65535).default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_CONNECTION_LIMIT: z.coerce.number().min(1).default(10),
  DB_TIMEOUT: z.coerce.number().default(60000),

  // Redis
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().min(1).max(65535).optional(),
  REDIS_ENABLED: z.coerce.boolean().default(false),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).default(0),

  // Security
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().min(1).default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default('1 minute'),

  // Cache
  CACHE_TTL: z.coerce.number().min(0).default(900),

  // CORS
  CORS_ORIGIN: z
    .string()
    .transform(val => (val.includes(',') ? val.split(',').map(origin => origin.trim()) : val))
    .default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // File uploads
  MAX_FILE_SIZE: z.coerce.number().default(5242880), // 5MB
  UPLOAD_DIR: z.string().default('./uploads'),

  // Monitoring
  HEALTH_CHECK_INTERVAL: z.coerce.number().default(30000),
  METRICS_ENABLED: z.coerce.boolean().default(true),
});

type Environment = z.infer<typeof EnvSchema>;

export function validateEnvironment(): Environment {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join('\n');

      throw new Error(`Environment validation failed:\n${errors}`);
    }
    throw error;
  }
}

export type { Environment };
export { EnvSchema };
