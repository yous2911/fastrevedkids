import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { browserCompat } from '../../utils/browserCompatibility';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  maxRetries?: number;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  lastErrorTime: number;
  errorType: 'webgl' | 'canvas' | 'memory' | 'unknown';
}

interface ErrorAnalysis {
  type: 'webgl' | 'canvas' | 'memory' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovery: 'retry' | 'fallback' | 'none';
  message: string;
  technicalDetails: string;
}

export class ThreeDErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private errorReportingEnabled = process.env.NODE_ENV === 'development';

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: 0,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Analyze error type
    const errorType = ThreeDErrorBoundary.analyzeErrorType(error);
    
    return {
      hasError: true,
      error,
      errorType,
      lastErrorTime: Date.now()
    };
  }

  static analyzeErrorType(error: Error): 'webgl' | 'canvas' | 'memory' | 'unknown' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('webgl') || message.includes('context lost') || 
        message.includes('gl_') || stack.includes('webgl')) {
      return 'webgl';
    }
    
    if (message.includes('canvas') || message.includes('2d context') ||
        message.includes('getcontext')) {
      return 'canvas';
    }
    
    if (message.includes('memory') || message.includes('out of memory') ||
        message.includes('allocation') || stack.includes('memory')) {
      return 'memory';
    }
    
    return 'unknown';
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const analysis = this.analyzeError(error, errorInfo);
    
    this.setState({
      errorInfo,
      errorType: analysis.type
    });

    // Log error for debugging
    if (this.errorReportingEnabled) {
      console.group('🚨 3D Component Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Analysis:', analysis);
      console.groupEnd();
    }

    // Report to parent component
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external error tracking if available
    this.reportError(error, errorInfo, analysis);
  }

  private analyzeError(error: Error, errorInfo: ErrorInfo): ErrorAnalysis {
    const { message, stack } = error;
    const componentStack = errorInfo.componentStack;
    const browserInfo = browserCompat.getBrowserInfo();
    
    // WebGL-specific errors
    if (this.state.errorType === 'webgl') {
      if (message.includes('context lost')) {
        return {
          type: 'webgl',
          severity: 'high',
          recovery: 'retry',
          message: 'WebGL context was lost. This usually happens due to GPU driver issues or system power management.',
          technicalDetails: `Browser: ${browserInfo.name} ${browserInfo.version}, Hardware: ${browserInfo.hardwareTier}`
        };
      }
      
      if (message.includes('out of memory') || message.includes('resource')) {
        return {
          type: 'webgl',
          severity: 'critical',
          recovery: 'fallback',
          message: 'WebGL ran out of memory. Switching to simplified rendering.',
          technicalDetails: `Memory limit: ${browserInfo.memoryLimit}MB, Mobile: ${browserInfo.isMobile}`
        };
      }
      
      return {
        type: 'webgl',
        severity: 'medium',
        recovery: 'fallback',
        message: 'WebGL rendering failed. Using 2D fallback instead.',
        technicalDetails: `WebGL supported: ${browserCompat.supportsWebGL()}`
      };
    }

    // Canvas-specific errors  
    if (this.state.errorType === 'canvas') {
      return {
        type: 'canvas',
        severity: 'medium',
        recovery: 'retry',
        message: 'Canvas rendering failed. This might be due to browser security restrictions.',
        technicalDetails: `Canvas2D supported: ${browserCompat.supportsCanvas2D()}, Safari fixes: ${JSON.stringify(browserCompat.getSafariCanvasFixes())}`
      };
    }

    // Memory errors
    if (this.state.errorType === 'memory') {
      return {
        type: 'memory',
        severity: 'critical',
        recovery: 'fallback',
        message: 'System is running low on memory. Reducing quality and complexity.',
        technicalDetails: `Device tier: ${browserInfo.hardwareTier}, Estimated memory: ${browserInfo.memoryLimit}MB`
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      severity: 'medium',
      recovery: 'retry',
      message: 'An unexpected error occurred with the 3D component.',
      technicalDetails: `Component: ${this.props.componentName || 'Unknown'}, Stack: ${stack?.slice(0, 200)}...`
    };
  }

  private reportError(error: Error, errorInfo: ErrorInfo, analysis: ErrorAnalysis) {
    // Here you could integrate with error reporting services like Sentry
    const ERROR_REPORT = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      analysis,
      browserInfo: browserCompat.getBrowserInfo(),
      webglCapabilities: browserCompat.getWebGLCapabilities(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentName: this.props.componentName
    };

    // Log to console in development
    if (this.errorReportingEnabled) {
      console.warn('Error report generated:', ERROR_REPORT);
    }

    // In production, you would send this to your error tracking service
    // Example: Sentry.captureException(error, { extra: ERROR_REPORT });
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount, lastErrorTime } = this.state;
    
    // Prevent rapid retries
    const timeSinceLastError = Date.now() - lastErrorTime;
    if (timeSinceLastError < 2000) {
      return;
    }

    if (retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState({ isRetrying: true });

    // Add delay before retry to allow system recovery
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false
      });
    }, 1500);
  };

  private renderFallbackUI() {
    const { error, errorType, retryCount, isRetrying } = this.state;
    const { maxRetries = 3, showRetry = true, componentName = '3D Component' } = this.props;
    
    const analysis = error ? this.analyzeError(error, this.state.errorInfo!) : null;
    const canRetry = showRetry && retryCount < maxRetries && analysis?.recovery === 'retry';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg shadow-lg"
        style={{ minHeight: '200px', minWidth: '200px' }}
      >
        {/* Error Icon */}
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-6xl mb-4"
        >
          {errorType === 'webgl' ? '🎮' : 
           errorType === 'canvas' ? '🎨' : 
           errorType === 'memory' ? '🧠' : '⚠️'}
        </motion.div>

        {/* Error Message */}
        <h3 className="text-lg font-bold text-red-800 mb-2 text-center">
          {componentName} Error
        </h3>
        
        <p className="text-sm text-red-600 text-center mb-4 max-w-xs">
          {analysis?.message || 'An unexpected error occurred'}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {canRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={this.handleRetry}
              disabled={isRetrying}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                isRetrying
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRetrying ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Retrying...
                </span>
              ) : (
                `Retry (${maxRetries - retryCount} left)`
              )}
            </motion.button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm"
          >
            Refresh Page
          </button>
        </div>

        {/* Technical Details (Development Only) */}
        {this.errorReportingEnabled && analysis && (
          <details className="mt-4 w-full">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 max-h-32 overflow-auto">
              <p><strong>Type:</strong> {analysis.type}</p>
              <p><strong>Severity:</strong> {analysis.severity}</p>
              <p><strong>Recovery:</strong> {analysis.recovery}</p>
              <p><strong>Details:</strong> {analysis.technicalDetails}</p>
              {error && <p><strong>Error:</strong> {error.message}</p>}
            </div>
          </details>
        )}
        
        {/* Retry Counter */}
        {retryCount > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Attempt {retryCount + 1} of {maxRetries + 1}
          </div>
        )}
      </motion.div>
    );
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }
      
      // Use default fallback UI
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useThreeDErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error: Error) => {
    console.error('3D Component Error:', error);
    setError(error);
  }, []);

  const retry = React.useCallback(() => {
    setIsRetrying(true);
    setTimeout(() => {
      setError(null);
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
    }, 1000);
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    error,
    retryCount,
    isRetrying,
    handleError,
    retry,
    reset
  };
};

export default ThreeDErrorBoundary;