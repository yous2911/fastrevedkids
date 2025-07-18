// Core type definitions for the RevEd Kids application

// Database and ORM types
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  ssl?: boolean | {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
}

// Redis types
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  lazyConnect: boolean;
  maxRetriesPerRequest: number;
  connectTimeout?: number;
  commandTimeout?: number;
  family?: 4 | 6;
}

// Cache types
export interface CacheOptions {
  ttl: number;
  max: number;
  maxAge?: number;
  updateAgeOnGet?: boolean;
  allowStale?: boolean;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  ttl(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

// WebSocket types
export interface WebSocketConfig {
  heartbeatInterval: number;
  maxConnections: number;
  connectionTimeout: number;
  maxFrameSize?: number;
  compression?: boolean;
  verifyClient?: (info: { origin: string; secure: boolean; req: any }) => boolean;
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
  id?: string;
  userId?: number;
}

export interface WebSocketConnection {
  id: string;
  userId?: number;
  socket: any;
  isAlive: boolean;
  connectedAt: Date;
  lastPing?: Date;
}

// Security types
export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  rateLimiting: {
    max: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  cors?: {
    origin: string | string[] | boolean;
    credentials: boolean;
    methods?: string[];
    allowedHeaders?: string[];
  };
}

// Analytics types
export interface AnalyticsData {
  studentId: number;
  action: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  sessionId?: string;
  exerciseId?: number;
  moduleId?: number;
}

export interface ProgressMetrics {
  totalExercises: number;
  completedExercises: number;
  averageScore: number;
  timeSpent: number;
  successRate: number;
  streakDays: number;
  totalPoints: number;
  level: string;
}

export interface RecommendationScore {
  exerciseId: number;
  score: number;
  reasons: string[];
  difficulty: number;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ExerciseRecommendation {
  exercise: {
    id: number;
    titre: string;
    difficulte: string;
    matiere: string;
    niveau: string;
  };
  score: number;
  reasons: string[];
  metadata?: Record<string, unknown>;
}

// Spaced Repetition types
export interface SpacedRepetitionConfig {
  initialInterval: number;
  easeFactor: number;
  intervalModifier: number;
  minInterval: number;
  maxInterval: number;
  difficultyThreshold: number;
}

export interface ReviewSession {
  exerciseId: number;
  difficulty: number;
  lastReview: Date;
  nextReview: Date;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}

export interface ReviewResult {
  exerciseId: number;
  studentId: number;
  success: boolean;
  timeSpent: number;
  difficulty: number;
  reviewedAt: Date;
}

// Schema-specific types for JSON columns
export interface StudentMetadata {
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
    soundEnabled?: boolean;
    difficultyPreference?: 'easy' | 'medium' | 'hard';
  };
  achievements?: string[];
  settings?: {
    sessionTimeout?: number;
    autoSave?: boolean;
    hintsEnabled?: boolean;
  };
  parentalControls?: {
    timeLimit?: number;
    allowedHours?: { start: string; end: string };
    blockedContent?: string[];
  };
}

export interface ExerciseContent {
  question: string;
  options?: string[];
  correctAnswer: string | number | string[];
  explanation?: string;
  hints?: string[];
  mediaUrl?: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'true-false' | 'matching' | 'essay';
  timeLimit?: number;
  resources?: {
    images?: string[];
    videos?: string[];
    audio?: string[];
  };
}

export interface ProgressHistory {
  timestamp: string;
  score: number;
  timeSpent: number;
  attempts: number;
  errors?: string[];
  hintsUsed?: number;
  completed: boolean;
}

export interface SessionActions {
  action: string;
  timestamp: string;
  data?: Record<string, unknown>;
  duration?: number;
  result?: 'success' | 'failure' | 'timeout';
}

// Monitoring and Performance types
export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    cache: 'up' | 'down';
    websocket: 'up' | 'down';
  };
  metrics: PerformanceMetrics;
  uptime: number;
}

// Logger types
export interface LoggerConfig {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  prettyPrint?: boolean;
  file?: string;
  maxFiles?: number;
  maxSize?: string;
  colorize?: boolean;
  timestamp?: boolean;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
  context?: Record<string, unknown>;
}

// Request/Response types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
} 