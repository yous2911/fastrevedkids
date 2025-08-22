import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '../ui/Button';
import { reportError } from '../../utils/sentry';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry
    reportError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
    <div className="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-lg">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Oops! Something went wrong
      </h1>
      
      <p className="text-gray-600 mb-6">
        We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
      </p>
      
      {process.env.NODE_ENV === 'development' && error && (
        <details className="text-left mb-6 bg-gray-50 p-4 rounded text-sm">
          <summary className="cursor-pointer font-medium text-red-600 mb-2">
            Error Details (Development Only)
          </summary>
          <pre className="whitespace-pre-wrap text-xs text-gray-700">
            {error.message}
            {error.stack}
          </pre>
        </details>
      )}
      
      <div className="space-y-3">
        <Button 
          onClick={() => window.location.reload()}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Reload Page
        </Button>
        
        <Button 
          onClick={() => window.location.href = '/'}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Go Home
        </Button>
      </div>
    </div>
  </div>
);

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary; 