import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import * as Sentry from '@sentry/node';
import { logger } from './logger';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  DATABASE = 'DATABASE_ERROR',
  REDIS = 'REDIS_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  MAINTENANCE = 'MAINTENANCE_ERROR'
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error factory functions
export const createValidationError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.VALIDATION, 400, true, context);

export const createAuthenticationError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.AUTHENTICATION, 401, true, context);

export const createAuthorizationError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.AUTHORIZATION, 403, true, context);

export const createNotFoundError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.NOT_FOUND, 404, true, context);

export const createDatabaseError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.DATABASE, 500, true, context);

export const createRedisError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.REDIS, 500, true, context);

export const createExternalApiError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.EXTERNAL_API, 502, true, context);

export const createFileUploadError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.FILE_UPLOAD, 400, true, context);

export const createRateLimitError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.RATE_LIMIT, 429, true, context);

export const createInternalError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.INTERNAL, 500, false, context);

export const createMaintenanceError = (message: string, context?: Record<string, any>) =>
  new AppError(message, ErrorType.MAINTENANCE, 503, true, context);

// Error response interface
interface ErrorResponse {
  error: {
    type: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    path?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };
  context?: Record<string, any>;
  stack?: string;
}

// Initialize Sentry
export const initializeSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: null }), // Will be set later
      ],
      beforeSend(event) {
        // Filter out certain errors in production
        if (process.env.NODE_ENV === 'production') {
          // Don't send 404 errors to Sentry
          if (event.exception && event.exception.values) {
            const exception = event.exception.values[0];
            if (exception.value && exception.value.includes('404')) {
              return null;
            }
          }
        }
        return event;
      },
    });
  }
};

// Error handler middleware
export const errorHandler = (
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const requestId = request.id;
  const path = request.url;
  const method = request.method;
  const userAgent = request.headers['user-agent'];
  const ip = request.ip || request.socket.remoteAddress;

  // Convert FastifyError to AppError if needed
  let appError: AppError;
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Handle Fastify validation errors
    if (error.validation) {
      appError = createValidationError(
        'Validation failed',
        { validation: error.validation, details: error.message }
      );
    } else if (error.statusCode === 404) {
      appError = createNotFoundError('Resource not found');
    } else if (error.statusCode === 429) {
      appError = createRateLimitError('Too many requests');
    } else {
      appError = createInternalError(
        error.message || 'Internal server error',
        { originalError: error.message, stack: error.stack }
      );
    }
  }

  // Add request context
  appError.context = {
    ...appError.context,
    requestId,
    path,
    method,
    userAgent,
    ip,
    timestamp: appError.timestamp.toISOString(),
  };

  // Log error
  logError(appError, request);

  // Send to Sentry for non-operational errors or in development
  if (!appError.isOperational || process.env.NODE_ENV !== 'production') {
    sendToSentry(appError, request);
  }

  // Prepare response
  const errorResponse: ErrorResponse = {
    error: {
      type: appError.type,
      message: appError.message,
      statusCode: appError.statusCode,
      timestamp: appError.timestamp.toISOString(),
      requestId,
      path,
      method,
      userAgent,
      ip,
    },
    context: appError.context,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = appError.stack;
  }

  // Send response
  reply.status(appError.statusCode).send(errorResponse);
};

// Log error with context
const logError = (error: AppError, request: FastifyRequest) => {
  const logData = {
    error: {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
    },
    request: {
      id: request.id,
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      query: request.query,
      params: request.params,
    },
    context: error.context,
    timestamp: error.timestamp,
  };

  if (error.statusCode >= 500) {
    logger.error('Server error occurred', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('Client error occurred', logData);
  } else {
    logger.info('Application error occurred', logData);
  }
};

// Send error to Sentry
const sendToSentry = (error: AppError, request: FastifyRequest) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    // Set user context if available
    if (request.user) {
      scope.setUser({
        id: request.user.id,
        email: request.user.email,
        role: request.user.role,
      });
    }

    // Set request context
    scope.setContext('request', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      query: request.query,
      params: request.params,
    });

    // Set error context
    scope.setContext('error', {
      type: error.type,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      context: error.context,
    });

    // Set tags
    scope.setTag('error_type', error.type);
    scope.setTag('status_code', error.statusCode.toString());
    scope.setTag('environment', process.env.NODE_ENV || 'development');

    // Capture exception
    Sentry.captureException(error);
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await fn(request, reply);
    } catch (error) {
      errorHandler(error as FastifyError, request, reply);
    }
  };
};

// Database error handler
export const handleDatabaseError = (error: any, context?: Record<string, any>): AppError => {
  const errorMessage = error.message || 'Database operation failed';
  
  if (error.code === 'ER_DUP_ENTRY') {
    return createValidationError('Duplicate entry found', { ...context, originalError: errorMessage });
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return createValidationError('Referenced record not found', { ...context, originalError: errorMessage });
  }
  
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return createValidationError('Cannot delete referenced record', { ...context, originalError: errorMessage });
  }
  
  if (error.code === 'ER_DATA_TOO_LONG') {
    return createValidationError('Data too long for column', { ...context, originalError: errorMessage });
  }
  
  if (error.code === 'ER_BAD_NULL_ERROR') {
    return createValidationError('Null value not allowed', { ...context, originalError: errorMessage });
  }
  
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return createDatabaseError('Database access denied', { ...context, originalError: errorMessage });
  }
  
  if (error.code === 'ER_CONNECTION_ERROR') {
    return createDatabaseError('Database connection failed', { ...context, originalError: errorMessage });
  }
  
  return createDatabaseError(errorMessage, { ...context, originalError: errorMessage, code: error.code });
};

// Redis error handler
export const handleRedisError = (error: any, context?: Record<string, any>): AppError => {
  const errorMessage = error.message || 'Redis operation failed';
  
  if (error.code === 'ECONNREFUSED') {
    return createRedisError('Redis connection refused', { ...context, originalError: errorMessage });
  }
  
  if (error.code === 'ETIMEDOUT') {
    return createRedisError('Redis connection timeout', { ...context, originalError: errorMessage });
  }
  
  if (error.message?.includes('WRONGTYPE')) {
    return createRedisError('Redis data type mismatch', { ...context, originalError: errorMessage });
  }
  
  if (error.message?.includes('NOAUTH')) {
    return createRedisError('Redis authentication failed', { ...context, originalError: errorMessage });
  }
  
  return createRedisError(errorMessage, { ...context, originalError: errorMessage, code: error.code });
};

// Validation error handler
export const handleValidationError = (errors: any[], context?: Record<string, any>): AppError => {
  const errorDetails = errors.map(error => ({
    field: error.field,
    message: error.message,
    value: error.value,
  }));
  
  return createValidationError('Validation failed', {
    ...context,
    errors: errorDetails,
  });
};

// Rate limit error handler
export const handleRateLimitError = (limit: number, window: number, context?: Record<string, any>): AppError => {
  return createRateLimitError('Rate limit exceeded', {
    ...context,
    limit,
    window,
    retryAfter: Math.ceil(window / 1000),
  });
};

// Maintenance mode error handler
export const handleMaintenanceError = (message?: string, context?: Record<string, any>): AppError => {
  return createMaintenanceError(
    message || 'System is under maintenance. Please try again later.',
    context
  );
};

// Export error types for use in other modules
export { ErrorType as ErrorTypes }; 