import * as Sentry from '@sentry/react';

// Sentry error reporting utility
// Initialize Sentry if DSN is available
export const initializeSentry = () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', 'api.revedkids.com'],
        }),
      ],
      beforeSend(event) {
        // Filter out development errors
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
    
    console.log('🔒 Sentry initialized for error tracking');
  } else {
    console.warn('⚠️ Sentry DSN not found, error tracking disabled');
  }
};

// Report error to Sentry
export const reportError = (
  error: Error | string,
  context?: Record<string, any>
) => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        environment: process.env.NODE_ENV,
        version: process.env.REACT_APP_VERSION || 'unknown',
      },
      extra: context,
    });
  } else {
    console.error('Error (Sentry not available):', error, context);
  }
};

// Report message to Sentry
export const reportMessage = (
  message: string,
  context?: Record<string, any>
) => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      tags: {
        environment: process.env.NODE_ENV,
        version: process.env.REACT_APP_VERSION || 'unknown',
      },
      extra: context,
    });
  } else {
    console.log(`Message (Sentry not available): ${message}`, context);
  }
};

// Set user context for Sentry
export const setUserContext = (user: {
  id?: string;
  email?: string;
  name?: string;
}) => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.setUser(user);
  }
};

// Clear user context
export const clearUserContext = () => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

// Add breadcrumb for debugging
export const addBreadcrumb = (
  message: string,
  category: string = 'general',
  data?: Record<string, any>
) => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
};

// Performance monitoring
export const startTransaction = (
  name: string,
  operation: string
) => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }
  return null;
};

// Export Sentry components
export { Sentry }; 