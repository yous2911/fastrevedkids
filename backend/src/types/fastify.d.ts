import 'fastify';
import { Database } from '../db/connection.js';
import { CacheService } from '../services/cache.js';
import { Student } from '../db/schema.js';

declare module 'fastify' {
  interface FastifyInstance {
    // Database decorator
    db: Database;
    dbHealthCheck: () => Promise<boolean>;
    dbConnectionCount: () => number;

    // Configuration decorator
    config: {
      NODE_ENV: string;
      PORT: number;
      HOST: string;
      DB_HOST: string;
      DB_PORT: number;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_NAME: string;
      DB_CONNECTION_LIMIT: number;
      DB_TIMEOUT: number;
      REDIS_HOST?: string;
      REDIS_PORT?: number;
      REDIS_ENABLED: boolean;
      REDIS_PASSWORD?: string;
      REDIS_DB: number;
      JWT_SECRET: string;
      ENCRYPTION_KEY: string;
      COOKIE_SECRET: string;
      RATE_LIMIT_MAX: number;
      RATE_LIMIT_TIME_WINDOW: string;
      CACHE_TTL: number;
      CORS_ORIGIN: string | string[];
      LOG_LEVEL: string;
      MAX_FILE_SIZE: number;
      UPLOAD_DIR: string;
      HEALTH_CHECK_INTERVAL: number;
      METRICS_ENABLED: boolean;
    };

    // Services decorators
    cache: CacheService;

    // Auth decorator
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    // Monitoring decorators
    getMetrics: () => any;
    sanitizer: any;
  }

  interface FastifyRequest {
    // FIXED: Lines 50:23 & 51:16 - Replace any with proper types
    user?: Student;
    sessionData?: Record<string, unknown>;
    startTime?: number;
  }
}
