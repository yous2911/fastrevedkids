import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiError } from '../../types/api.types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call onError prop if provided
    this.props.onError?.(error, errorInfo);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
      console.log('Would send to monitoring:', { error, errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Oops ! Une erreur s'est produite
              </h2>
              <p className="text-gray-600 mb-4">
                {this.state.error instanceof ApiError 
                  ? this.state.error.message 
                  : 'Une erreur inattendue est survenue'
                }
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left text-xs text-gray-500 mb-4">
                  <summary className="cursor-pointer font-medium">Détails techniques</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}

              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 