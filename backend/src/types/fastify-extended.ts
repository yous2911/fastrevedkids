import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { Student } from '../db/schema';
import { CacheService, PerformanceMetrics } from './index';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    cache: CacheService;
    metrics: {
      collect(): PerformanceMetrics;
      reset(): void;
      getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy';
    };
    websocketServer?: {
      broadcast(message: string): void;
      getConnections(): number;
      closeAll(): void;
    };
  }

  interface FastifyRequest {
    user?: Student;
    studentId?: number;
    sessionId?: string;
    requestId?: string;
    startTime?: number;
  }

  interface FastifyReply {
    sendError(error: Error, statusCode?: number): FastifyReply;
    sendSuccess<T>(data: T, message?: string): FastifyReply;
    sendPaginated<T>(data: T[], pagination: PaginationInfo): FastifyReply;
  }
}

// Authenticated request type
export interface AuthenticatedRequest extends FastifyRequest {
  user: Student;
  studentId: number;
}

// Route parameter types
export interface StudentParams {
  id: string;
}

export interface ExerciseParams {
  id: string;
  studentId?: string;
}

export interface ModuleParams {
  id: string;
}

export interface ProgressParams {
  studentId: string;
  exerciseId?: string;
}

// Request body types
export interface LoginBody {
  prenom: string;
  nom: string;
}

export interface StudentCreateBody {
  prenom: string;
  nom: string;
  age: number;
  niveauActuel: string;
  preferences?: Record<string, unknown>;
}

export interface StudentUpdateBody {
  prenom?: string;
  nom?: string;
  age?: number;
  niveauActuel?: string;
  preferences?: Record<string, unknown>;
}

export interface ProgressUpdateBody {
  statut: 'EN_COURS' | 'TERMINE' | 'ECHEC';
  pointsGagnes?: number;
  tauxReussite?: number;
  nombreTentatives?: number;
  temps?: number;
}

export interface ExerciseCreateBody {
  titre: string;
  contenu: {
    question: string;
    options?: string[];
    correctAnswer: string | number;
    explanation?: string;
  };
  difficulte: 'FACILE' | 'MOYEN' | 'DIFFICILE';
  matiere: string;
  niveau: string;
  ordre: number;
  moduleId: number;
}

// Query string types
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentQuery extends PaginationQuery {
  niveau?: string;
  age?: string;
  search?: string;
}

export interface ExerciseQuery extends PaginationQuery {
  niveau?: string;
  matiere?: string;
  difficulte?: string;
  moduleId?: string;
}

export interface RecommendationQuery {
  limit?: string;
  niveau?: string;
  matiere?: string;
  difficulte?: string;
}

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  metrics?: string[];
}

// Response types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StudentResponse {
  id: number;
  prenom: string;
  nom: string;
  age: number;
  niveauActuel: string;
  totalPoints: number;
  serieJours: number;
  preferences: Record<string, unknown>;
  metadata: Record<string, unknown>;
  dernierAcces: string | null;
  estConnecte: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseResponse {
  id: number;
  titre: string;
  contenu: {
    question: string;
    options?: string[];
    correctAnswer: string | number;
    explanation?: string;
  };
  difficulte: string;
  matiere: string;
  niveau: string;
  ordre: number;
  moduleId: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressResponse {
  id: number;
  studentId: number;
  exerciseId: number;
  statut: string;
  nombreTentatives: number;
  nombreReussites: number;
  tauxReussite: string;
  pointsGagnes: number;
  derniereTentative: string | null;
  premiereReussite: string | null;
  historique: Array<{
    timestamp: string;
    score: number;
    timeSpent: number;
    attempts: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationResponse {
  exerciseId: number;
  titre: string;
  difficulte: string;
  matiere: string;
  niveau: string;
  score: number;
  reasons: string[];
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high';
}

export interface AnalyticsResponse {
  metrics: {
    totalExercises: number;
    completedExercises: number;
    averageScore: number;
    timeSpent: number;
    successRate: number;
    streakDays: number;
  };
  trends: Array<{
    date: string;
    exercises: number;
    score: number;
    timeSpent: number;
  }>;
  performance: {
    strongSubjects: string[];
    weakSubjects: string[];
    recommendedFocus: string[];
  };
}

// Validation schema types
export interface ValidationSchema {
  body?: Record<string, unknown>;
  querystring?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  response?: Record<number, Record<string, unknown>>;
}

// Route handler types
export type RouteHandler<TParams = unknown, TQuery = unknown, TBody = unknown> = (
  request: FastifyRequest<{
    Params: TParams;
    Querystring: TQuery;
    Body: TBody;
  }>,
  reply: FastifyReply
) => Promise<void> | void;

export type AuthenticatedRouteHandler<TParams = unknown, TQuery = unknown, TBody = unknown> = (
  request: AuthenticatedRequest & FastifyRequest<{
    Params: TParams;
    Querystring: TQuery;
    Body: TBody;
  }>,
  reply: FastifyReply
) => Promise<void> | void;

// Plugin options types
export interface DatabasePluginOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  ssl?: boolean | object;
}

export interface RedisPluginOptions {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  lazyConnect: boolean;
  maxRetriesPerRequest: number;
}

export interface CachePluginOptions {
  ttl: number;
  max: number;
  redis?: RedisPluginOptions;
  memory?: {
    maxSize: number;
    checkPeriod: number;
  };
}

export interface SecurityPluginOptions {
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rateLimit: {
    max: number;
    timeWindow: number;
  };
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
  };
}

export interface WebSocketPluginOptions {
  heartbeatInterval: number;
  maxConnections: number;
  connectionTimeout: number;
  compression: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
  stack?: string;
}

export interface ValidationError extends ApiError {
  field: string;
  value: unknown;
  constraint: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Service interfaces
export interface StudentService {
  findById(id: number): Promise<StudentResponse | null>;
  findByName(prenom: string, nom: string): Promise<StudentResponse | null>;
  create(data: StudentCreateBody): Promise<StudentResponse>;
  update(id: number, data: StudentUpdateBody): Promise<StudentResponse>;
  delete(id: number): Promise<void>;
  list(query: StudentQuery): Promise<{
    data: StudentResponse[];
    pagination: PaginationInfo;
  }>;
}

export interface ExerciseService {
  findById(id: number): Promise<ExerciseResponse | null>;
  findByModule(moduleId: number): Promise<ExerciseResponse[]>;
  create(data: ExerciseCreateBody): Promise<ExerciseResponse>;
  update(id: number, data: Partial<ExerciseCreateBody>): Promise<ExerciseResponse>;
  delete(id: number): Promise<void>;
  list(query: ExerciseQuery): Promise<{
    data: ExerciseResponse[];
    pagination: PaginationInfo;
  }>;
}

export interface ProgressService {
  findByStudent(studentId: number): Promise<ProgressResponse[]>;
  findByExercise(exerciseId: number): Promise<ProgressResponse[]>;
  findByStudentAndExercise(studentId: number, exerciseId: number): Promise<ProgressResponse | null>;
  updateProgress(studentId: number, exerciseId: number, data: ProgressUpdateBody): Promise<ProgressResponse>;
  getStatistics(studentId: number): Promise<AnalyticsResponse>;
}

export interface RecommendationService {
  getRecommendations(studentId: number, query: RecommendationQuery): Promise<RecommendationResponse[]>;
  updateRecommendations(studentId: number): Promise<void>;
}

export interface SpacedRepetitionService {
  getNextReviews(studentId: number): Promise<ExerciseResponse[]>;
  scheduleReview(studentId: number, exerciseId: number, performance: number): Promise<void>;
  processReview(studentId: number, exerciseId: number, success: boolean): Promise<void>;
} 