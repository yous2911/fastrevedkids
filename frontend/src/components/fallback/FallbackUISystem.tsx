import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { browserCompat } from '../../utils/browserCompatibility';
import Canvas2DRenderer from './Canvas2DRenderer';

interface FallbackUIProps {
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  emotion: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
  equippedItems?: string[];
  xpLevel?: number;
  size?: 'small' | 'medium' | 'large';
  reason?: 'webgl_unavailable' | 'canvas_failed' | 'memory_low' | 'performance_poor' | 'context_lost' | 'unknown';
  onRetry?: () => void;
  onFallbackAccept?: () => void;
  showUpgrade?: boolean;
}

interface LoadingStateProps {
  message?: string;
  progress?: number;
  canCancel?: boolean;
  onCancel?: () => void;
}

interface ErrorMessageProps {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// Main Fallback UI Component
export const FallbackUISystem: React.FC<FallbackUIProps> = ({
  mascotType,
  emotion,
  equippedItems = [],
  xpLevel = 1,
  size = 'medium',
  reason = 'unknown',
  onRetry,
  onFallbackAccept,
  showUpgrade = true
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [userChoice, setUserChoice] = useState<'fallback' | 'retry' | null>(null);
  
  const browserInfo = useMemo(() => browserCompat.getBrowserInfo(), []);
  const webglCapabilities = useMemo(() => browserCompat.getWebGLCapabilities(), []);

  const fallbackInfo = useMemo(() => {
    switch (reason) {
      case 'webgl_unavailable':
        return {
          icon: '🎮',
          title: 'WebGL Not Available',
          message: 'Your browser doesn\'t support WebGL or it\'s disabled. Using 2D graphics instead.',
          severity: 'medium' as const,
          canRetry: false,
          upgradeHelp: 'Try updating your browser or enabling hardware acceleration.'
        };
      
      case 'canvas_failed':
        return {
          icon: '🎨',
          title: 'Canvas Rendering Failed',
          message: 'Graphics rendering encountered an issue. This might be due to browser security settings.',
          severity: 'high' as const,
          canRetry: true,
          upgradeHelp: 'Check if hardware acceleration is enabled in your browser settings.'
        };
      
      case 'memory_low':
        return {
          icon: '🧠',
          title: 'Low Memory Detected',
          message: 'Your device is running low on memory. Using simplified graphics for better performance.',
          severity: 'high' as const,
          canRetry: false,
          upgradeHelp: 'Close other browser tabs or applications to free up memory.'
        };
      
      case 'performance_poor':
        return {
          icon: '⚡',
          title: 'Performance Optimization',
          message: 'Switching to simpler graphics for smoother performance on your device.',
          severity: 'low' as const,
          canRetry: true,
          upgradeHelp: 'This is normal for older devices and helps maintain smooth animations.'
        };
      
      case 'context_lost':
        return {
          icon: '🔄',
          title: 'Graphics Context Lost',
          message: 'The graphics system needs to restart. This can happen due to driver issues.',
          severity: 'medium' as const,
          canRetry: true,
          upgradeHelp: 'Try refreshing the page or updating your graphics drivers.'
        };
      
      default:
        return {
          icon: '⚠️',
          title: 'Fallback Mode',
          message: 'Using simplified graphics for compatibility with your system.',
          severity: 'low' as const,
          canRetry: true,
          upgradeHelp: 'This ensures the app works on all devices and browsers.'
        };
    }
  }, [reason]);

  const handleAcceptFallback = useCallback(() => {
    setUserChoice('fallback');
    onFallbackAccept?.();
  }, [onFallbackAccept]);

  const handleRetry = useCallback(() => {
    setUserChoice('retry');
    onRetry?.();
  }, [onRetry]);

  const SIZE_CONFIG = {
    small: { width: 120, height: 120 },
    medium: { width: 150, height: 150 },
    large: { width: 200, height: 200 }
  };

  const { width, height } = SIZE_CONFIG[size];

  return (
    <div className="relative">
      {/* Fallback Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative rounded-lg overflow-hidden ${
          fallbackInfo.severity === 'high' ? 'border-2 border-red-200' :
          fallbackInfo.severity === 'medium' ? 'border-2 border-yellow-200' :
          'border-2 border-blue-200'
        }`}
        style={{ width, height }}
      >
        {/* Background */}
        <div className={`absolute inset-0 ${
          fallbackInfo.severity === 'high' ? 'bg-gradient-to-br from-red-50 to-orange-50' :
          fallbackInfo.severity === 'medium' ? 'bg-gradient-to-br from-yellow-50 to-orange-50' :
          'bg-gradient-to-br from-blue-50 to-purple-50'
        }`} />

        {/* Canvas2D Renderer */}
        <div className="relative z-10">
          <Canvas2DRenderer
            width={width}
            height={height}
            mascotType={mascotType}
            emotion={emotion}
            equippedItems={equippedItems}
            xpLevel={xpLevel}
            onRenderError={(error) => {
              console.error('Canvas2D fallback error:', error);
            }}
          />
        </div>

        {/* Fallback Indicator */}
        <div className="absolute top-2 right-2 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              fallbackInfo.severity === 'high' ? 'bg-red-500 text-white' :
              fallbackInfo.severity === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
            title={fallbackInfo.title}
          >
            {fallbackInfo.icon}
          </motion.div>
        </div>

        {/* Action Overlay */}
        <AnimatePresence>
          {userChoice === null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-20"
            >
              <div className="flex gap-2 justify-center">
                {fallbackInfo.canRetry && onRetry && (
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium"
                  >
                    Retry 3D
                  </button>
                )}
                <button
                  onClick={handleAcceptFallback}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg font-medium"
                >
                  Use 2D
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Detailed Information Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-30"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{fallbackInfo.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-1">{fallbackInfo.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{fallbackInfo.message}</p>
                
                {showUpgrade && fallbackInfo.upgradeHelp && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Tip:</strong> {fallbackInfo.upgradeHelp}
                    </p>
                  </div>
                )}

                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">System Information</summary>
                  <div className="mt-2 font-mono bg-gray-50 p-2 rounded">
                    <p>Browser: {browserInfo.name} {browserInfo.version}</p>
                    <p>Device: {browserInfo.isMobile ? 'Mobile' : 'Desktop'}</p>
                    <p>Hardware: {browserInfo.hardwareTier}</p>
                    <p>WebGL: {webglCapabilities.supported ? `v${webglCapabilities.version}` : 'Not supported'}</p>
                    <p>Memory: ~{browserInfo.memoryLimit}MB</p>
                  </div>
                </details>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600"
        title="Show details"
      >
        ℹ️
      </button>
    </div>
  );
};

// Loading State Component  
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading 3D graphics...',
  progress,
  canCancel = false,
  onCancel
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200"
    >
      {/* Loading Spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full mb-4"
      />

      {/* Loading Message */}
      <p className="text-gray-700 font-medium mb-2">
        {message}{dots}
      </p>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-blue-500 h-2 rounded-full"
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Cancel Button */}
      {canCancel && onCancel && (
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Cancel
        </button>
      )}
    </motion.div>
  );
};

// Error Message Component
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type,
  title,
  message,
  actions = [],
  dismissible = false,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  const TYPE_CONFIG = {
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconBg: 'bg-yellow-100'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconBg: 'bg-red-100'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconBg: 'bg-blue-100'
    }
  };

  const config = TYPE_CONFIG[type];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 shadow-sm`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`${config.iconBg} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>
            <span className="text-sm">{config.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className={`font-bold ${config.textColor} mb-1`}>{title}</h3>
            <p className={`text-sm ${config.textColor} opacity-90`}>{message}</p>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-3 py-1 text-xs rounded font-medium ${
                      action.variant === 'primary'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : action.variant === 'danger'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className={`${config.textColor} opacity-50 hover:opacity-100 text-lg leading-none`}
            >
              ×
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Context Creation Error Handler
export const handleCanvasContextError = (
  canvasElement: HTMLCanvasElement,
  contextType: 'webgl' | 'webgl2' | '2d',
  onError: (error: Error) => void
): CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext | null => {
  try {
    let context: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext | null = null;

    if (contextType === '2d') {
      context = canvasElement.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2D rendering context. Canvas2D might be disabled.');
      }
    } else {
      // Try WebGL contexts
      const CONTEXT_OPTIONS = {
        alpha: true,
        antialias: false, // Start without antialiasing for compatibility
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'default' as WebGLPowerPreference,
        failIfMajorPerformanceCaveat: false
      };

      if (contextType === 'webgl2') {
        context = canvasElement.getContext('webgl2', CONTEXT_OPTIONS) as WebGL2RenderingContext;
      }
      
      if (!context) {
        context = (canvasElement.getContext('webgl', CONTEXT_OPTIONS) || 
                   canvasElement.getContext('experimental-webgl', CONTEXT_OPTIONS)) as WebGLRenderingContext;
      }

      if (!context) {
        throw new Error(`Failed to get ${contextType} rendering context. WebGL might not be supported or is disabled.`);
      }

      // Test if context is working
      (context as any).viewport(0, 0, canvasElement.width, canvasElement.height);
      const error = (context as any).getError();
      if (error !== (context as any).NO_ERROR) {
        throw new Error(`WebGL context error: ${error}`);
      }
    }

    return context;
  } catch (error) {
    onError(error as Error);
    return null;
  }
};

export default FallbackUISystem;