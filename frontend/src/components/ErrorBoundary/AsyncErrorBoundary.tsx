// For handling async errors that don't get caught by regular error boundaries
import React, { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { reportError } from '../../utils/sentry';

const AsyncErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setAsyncError(new Error(event.reason));
      reportError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'unhandledRejection',
        reason: event.reason,
      });
    };

    const handleError = (event: ErrorEvent) => {
      setAsyncError(new Error(event.message));
      reportError(new Error(`Global Error: ${event.message}`), {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (asyncError) {
    throw asyncError;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export { AsyncErrorBoundary }; 