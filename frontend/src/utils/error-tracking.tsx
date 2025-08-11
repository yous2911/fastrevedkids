/**
 * Comprehensive Error Tracking System for RevEd Kids Frontend
 * Integrates with Sentry and provides custom error handling
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import { getConfig, getCurrentEnvironment, isProduction } from '../config/environment';

interface ErrorContext {
  userId?: string;
  userRole?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  breadcrumbs?: string[];
  timestamp: number;
}

interface CustomError extends Error {
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'ui' | 'api' | 'performance' | '3d' | 'audio' | 'security' | 'accessibility';
  context?: ErrorContext;
  recoverable?: boolean;
}

class ErrorTracker {
  private config = getConfig();
  private isInitialized = false;
  private errorQueue: CustomError[] = [];
  private maxQueueSize = 100;
  private breadcrumbs: string[] = [];
  private maxBreadcrumbs = 50;

  constructor() {
    this.initializeSentry();
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupConsoleErrorCapture();
  }

  private initializeSentry() {
    if (!this.config.sentryDsn) {
      console.warn('Sentry DSN not configured - error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.sentryDsn,
        environment: getCurrentEnvironment(),
        integrations: [
          new BrowserTracing({
            // Set up automatic route change tracking
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              React.useEffect,
              useLocation,
              useNavigationType,
              createRoutesFromChildren,
              matchRoutes
            ),
          }),
          new Sentry.Replay({
            // Capture 10% of sessions in production, 100% in development
            sessionSampleRate: isProduction() ? 0.1 : 1.0,
            // If a session is not sampled for replay, sample errors at 100% rate
            errorSampleRate: 1.0,
          }),
        ],
        tracesSampleRate: isProduction() ? 0.1 : 1.0,
        replaysSessionSampleRate: isProduction() ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
        
        beforeSend: (event, hint) => {
          // Filter out non-critical errors in production
          if (isProduction() && hint.originalException) {
            const error = hint.originalException as CustomError;
            if (error.severity === 'low') {
              return null; // Don't send low severity errors in production
            }
          }
          
          return event;
        },
        
        beforeBreadcrumb: (breadcrumb) => {
          // Filter out noisy breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
          }
          
          return breadcrumb;
        },
      });

      this.isInitialized = true;
      console.log('✅ Error tracking initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  private setupGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      const error: CustomError = new Error(event.message);
      error.name = 'GlobalError';
      error.stack = event.error?.stack;
      error.category = 'ui';
      error.severity = 'medium';
      error.context = {
        component: 'Global',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        timestamp: Date.now(),
      };

      this.captureError(error);
    });
  }

  private setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      const error: CustomError = new Error(`Unhandled Promise Rejection: ${event.reason}`);
      error.name = 'UnhandledPromiseRejection';
      error.category = 'api';
      error.severity = 'high';
      error.context = {
        component: 'Promise',
        metadata: {
          reason: event.reason,
          promise: event.promise,
        },
        timestamp: Date.now(),
      };

      this.captureError(error);
    });
  }

  private setupConsoleErrorCapture() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);

      // Capture as breadcrumb
      this.addBreadcrumb(`Console Error: ${args.join(' ')}`);

      // If it's a React error, capture it
      const errorMessage = args[0];
      if (typeof errorMessage === 'string' && (
        errorMessage.includes('React') || 
        errorMessage.includes('Warning') ||
        errorMessage.includes('Error')
      )) {
        const error: CustomError = new Error(errorMessage);
        error.name = 'ConsoleError';
        error.category = 'ui';
        error.severity = 'low';
        error.context = {
          component: 'Console',
          metadata: { args },
          timestamp: Date.now(),
        };
        
        this.captureError(error, false); // Don't re-log to console
      }
    };
  }

  public captureError(error: CustomError, logToConsole = true): void {
    try {
      // Add breadcrumbs to error context
      if (this.breadcrumbs.length > 0) {
        error.context = error.context || { timestamp: Date.now() };
        error.context.breadcrumbs = [...this.breadcrumbs];
      }

      // Log to console (unless disabled)
      if (logToConsole) {
        this.logError(error);
      }

      // Send to Sentry if initialized
      if (this.isInitialized) {
        Sentry.withScope((scope) => {
          // Set error level based on severity
          switch (error.severity) {
            case 'critical':
              scope.setLevel('fatal');
              break;
            case 'high':
              scope.setLevel('error');
              break;
            case 'medium':
              scope.setLevel('warning');
              break;
            case 'low':
              scope.setLevel('info');
              break;
          }

          // Add tags
          scope.setTag('category', error.category || 'unknown');
          scope.setTag('recoverable', error.recoverable ? 'yes' : 'no');
          
          if (error.code) {
            scope.setTag('error_code', error.code);
          }

          // Add context
          if (error.context) {
            scope.setContext('error_context', error.context as Record<string, any>);
            
            if (error.context.userId) {
              scope.setUser({ id: error.context.userId });
            }
            
            if (error.context.component) {
              scope.setTag('component', error.context.component);
            }
          }

          // Capture the error
          Sentry.captureException(error);
        });
      } else {
        // Queue errors if Sentry not initialized
        this.queueError(error);
      }

      // Track error metrics
      this.trackErrorMetrics(error);

    } catch (trackingError) {
      console.error('❌ Failed to track error:', trackingError);
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    try {
      if (this.isInitialized) {
        Sentry.withScope((scope) => {
          scope.setLevel(level);
          
          if (context) {
            scope.setContext('message_context', context as Record<string, any>);
          }
          
          Sentry.captureMessage(message);
        });
      }

      this.addBreadcrumb(`Message (${level}): ${message}`);
    } catch (error) {
      console.error('❌ Failed to capture message:', error);
    }
  }

  public addBreadcrumb(message: string, category?: string): void {
    const timestamp = new Date().toISOString();
    const breadcrumb = `[${timestamp}] ${category ? `[${category}] ` : ''}${message}`;
    
    this.breadcrumbs.push(breadcrumb);
    
    // Keep breadcrumbs within limit
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // Add to Sentry if initialized
    if (this.isInitialized) {
      Sentry.addBreadcrumb({
        message,
        category: category || 'custom',
        level: 'info',
      });
    }
  }

  public setUserContext(userId: string, userRole?: string, metadata?: Record<string, any>): void {
    try {
      if (this.isInitialized) {
        Sentry.setUser({
          id: userId,
          ...(userRole && { role: userRole }),
          ...(metadata && metadata),
        });
      }
      
      this.addBreadcrumb(`User context set: ${userId} (${userRole || 'unknown role'})`);
    } catch (error) {
      console.error('❌ Failed to set user context:', error);
    }
  }

  public clearUserContext(): void {
    try {
      if (this.isInitialized) {
        Sentry.setUser(null);
      }
      
      this.addBreadcrumb('User context cleared');
    } catch (error) {
      console.error('❌ Failed to clear user context:', error);
    }
  }

  private queueError(error: CustomError): void {
    this.errorQueue.push(error);
    
    // Keep queue within limit
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private processErrorQueue(): void {
    if (!this.isInitialized || this.errorQueue.length === 0) return;

    const queuedErrors = [...this.errorQueue];
    this.errorQueue = [];

    queuedErrors.forEach(error => {
      this.captureError(error, false); // Don't log again
    });

    console.log(`📤 Processed ${queuedErrors.length} queued errors`);
  }

  private logError(error: CustomError): void {
    const emoji = this.getSeverityEmoji(error.severity);
    const category = error.category ? `[${error.category.toUpperCase()}]` : '';
    
    console.group(`${emoji} ${category} ${error.name}: ${error.message}`);
    
    if (error.context) {
      console.log('Context:', error.context);
    }
    
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
    
    console.groupEnd();
  }

  private getSeverityEmoji(severity?: string): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  }

  private trackErrorMetrics(error: CustomError): void {
    // Track error patterns for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: error.severity === 'critical',
        error_category: error.category,
        error_code: error.code,
      });
    }
  }

  // Helper methods for specific error types
  public captureAPIError(error: Error, endpoint: string, method: string, statusCode?: number): void {
    const apiError: CustomError = error as CustomError;
    apiError.category = 'api';
    apiError.severity = statusCode && statusCode >= 500 ? 'high' : 'medium';
    apiError.code = statusCode ? `HTTP_${statusCode}` : 'API_ERROR';
    apiError.context = {
      component: 'API',
      action: `${method} ${endpoint}`,
      metadata: { endpoint, method, statusCode },
      timestamp: Date.now(),
    };
    
    this.captureError(apiError);
  }

  public capture3DError(error: Error, component: string, action: string): void {
    const threeDError: CustomError = error as CustomError;
    threeDError.category = '3d';
    threeDError.severity = 'medium';
    threeDError.context = {
      component,
      action,
      timestamp: Date.now(),
    };
    
    this.captureError(threeDError);
  }

  public captureAudioError(error: Error, audioFile: string, action: string): void {
    const audioError: CustomError = error as CustomError;
    audioError.category = 'audio';
    audioError.severity = 'low';
    audioError.context = {
      component: 'AudioManager',
      action,
      metadata: { audioFile },
      timestamp: Date.now(),
    };
    
    this.captureError(audioError);
  }

  public captureAccessibilityError(error: Error, element: string, issue: string): void {
    const a11yError: CustomError = error as CustomError;
    a11yError.category = 'accessibility';
    a11yError.severity = 'medium';
    a11yError.context = {
      component: 'A11Y',
      action: issue,
      metadata: { element, issue },
      timestamp: Date.now(),
    };
    
    this.captureError(a11yError);
  }

  public createErrorBoundaryHandler() {
    return (error: Error, errorInfo: { componentStack: string }) => {
      const boundaryError: CustomError = error as CustomError;
      boundaryError.category = 'ui';
      boundaryError.severity = 'high';
      boundaryError.context = {
        component: 'ErrorBoundary',
        metadata: { componentStack: errorInfo.componentStack },
        timestamp: Date.now(),
      };
      
      this.captureError(boundaryError);
    };
  }

  // Initialization check and queue processing
  public checkInitialization(): void {
    if (this.isInitialized && this.errorQueue.length > 0) {
      this.processErrorQueue();
    }
  }

  public getErrorSummary(): {
    totalErrors: number;
    queuedErrors: number;
    recentBreadcrumbs: string[];
  } {
    return {
      totalErrors: this.errorQueue.length,
      queuedErrors: this.errorQueue.length,
      recentBreadcrumbs: this.breadcrumbs.slice(-10),
    };
  }
}

// Singleton instance
let errorTracker: ErrorTracker | null = null;

export const getErrorTracker = (): ErrorTracker => {
  if (!errorTracker) {
    errorTracker = new ErrorTracker();
  }
  return errorTracker;
};

// Export convenience functions
export const captureError = (error: Error, context?: Partial<ErrorContext>): void => {
  const customError = error as CustomError;
  if (context) {
    customError.context = { ...customError.context, ...context, timestamp: Date.now() };
  }
  getErrorTracker().captureError(customError);
};

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error'): void => {
  getErrorTracker().captureMessage(message, level);
};

export const addBreadcrumb = (message: string, category?: string): void => {
  getErrorTracker().addBreadcrumb(message, category);
};

// React Error Boundary HOC
import React from 'react';

export const withErrorTracking = <P extends object>(Component: React.ComponentType<P>) => {
  return React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      addBreadcrumb(`Component mounted: ${Component.displayName || Component.name}`);
      
      return () => {
        addBreadcrumb(`Component unmounted: ${Component.displayName || Component.name}`);
      };
    }, []);

    return <Component {...(props as any)} ref={ref} />;
  });
};