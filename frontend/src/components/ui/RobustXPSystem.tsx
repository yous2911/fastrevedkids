import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeDErrorBoundary from '../error/ThreeDErrorBoundary';
import { FallbackUISystem, LoadingState, ErrorMessage } from '../fallback/FallbackUISystem';
import PhysicsSystemManager from '../physics/PhysicsSystemManager';
import { browserCompat, isWebGLSupported } from '../../utils/browserCompatibility';

interface RobustXPSystemProps {
  currentXP: number;
  maxXP: number;
  level: number;
  xpGained?: number;
  bonusMultiplier?: number;
  streakActive?: boolean;
  recentAchievements?: string[];
  onLevelUp?: (newLevel: number) => void;
  onMilestone?: (milestone: number) => void;
  size?: 'compact' | 'normal' | 'large' | 'massive';
  theme?: 'default' | 'magic' | 'fire' | 'water' | 'crystal' | 'rainbow';
  enablePhysics?: boolean;
  interactive?: boolean;
  enableFallback?: boolean;
  onError?: (error: Error) => void;
}

interface SystemState {
  status: 'loading' | 'ready' | 'error' | 'fallback';
  physicsEnabled: boolean;
  renderMode: '3d' | '2d' | 'static';
  errorMessage: string | null;
  retryCount: number;
  loadingProgress: number;
}

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  particleCount: number;
}

const RobustXPSystem: React.FC<RobustXPSystemProps> = ({
  currentXP,
  maxXP,
  level,
  xpGained = 0,
  bonusMultiplier = 1,
  streakActive = false,
  recentAchievements = [],
  onLevelUp,
  onMilestone,
  size = 'normal',
  theme = 'default',
  enablePhysics = true,
  interactive = false,
  enableFallback = true,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [systemState, setSystemState] = useState<SystemState>({
    status: 'loading',
    physicsEnabled: enablePhysics,
    renderMode: '3d',
    errorMessage: null,
    retryCount: 0,
    loadingProgress: 0
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    particleCount: 0
  });

  // Browser compatibility assessment
  const compatibility = useMemo(() => {
    const browserInfo = browserCompat.getBrowserInfo();
    const webglSupported = isWebGLSupported();
    const canvasSupported = browserCompat.supportsCanvas2D();
    
    return {
      webglSupported,
      canvasSupported,
      hardwareTier: browserInfo.hardwareTier,
      isMobile: browserInfo.isMobile,
      recommendedMode: (webglSupported && browserInfo.hardwareTier !== 'low' ? '3d' : 
                        canvasSupported ? '2d' : 'static') as '3d' | '2d' | 'static'
    };
  }, []);

  // Size configuration
  const sizeConfig = useMemo(() => {
    const CONFIGS = {
      compact: { width: 120, height: 120, scale: 0.8 },
      normal: { width: 200, height: 200, scale: 1.0 },
      large: { width: 300, height: 300, scale: 1.4 },
      massive: { width: 400, height: 400, scale: 1.8 }
    };
    return CONFIGS[size];
  }, [size]);

  // Initialize system with progressive enhancement
  const initializeSystem = useCallback(async () => {
    try {
      setSystemState(prev => ({ ...prev, status: 'loading', loadingProgress: 0 }));
      
      // Step 1: Check browser compatibility
      setSystemState(prev => ({ ...prev, loadingProgress: 20 }));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!compatibility.webglSupported && !compatibility.canvasSupported) {
        throw new Error('Neither WebGL nor Canvas2D is supported');
      }
      
      // Step 2: Determine optimal render mode
      setSystemState(prev => ({ ...prev, loadingProgress: 40 }));
      let renderMode: '3d' | '2d' | 'static' = compatibility.recommendedMode;
      
      // Override for low-end devices
      if (compatibility.hardwareTier === 'low' || compatibility.isMobile) {
        renderMode = compatibility.canvasSupported ? '2d' : 'static';
      }
      
      // Step 3: Initialize physics system
      setSystemState(prev => ({ ...prev, loadingProgress: 60 }));
      let physicsEnabled = enablePhysics && renderMode !== 'static';
      
      if (compatibility.hardwareTier === 'low') {
        physicsEnabled = false;
      }
      
      // Step 4: Test rendering capabilities
      setSystemState(prev => ({ ...prev, loadingProgress: 80 }));
      await testRenderingCapabilities(renderMode);
      
      // Step 5: Finalize setup
      setSystemState(prev => ({ 
        ...prev, 
        status: 'ready',
        renderMode,
        physicsEnabled,
        loadingProgress: 100,
        errorMessage: null
      }));
      
    } catch (error) {
      console.error('System initialization failed:', error);
      handleSystemError(error as Error);
    }
  }, [compatibility, enablePhysics]);

  // Test rendering capabilities
  const testRenderingCapabilities = useCallback(async (mode: '3d' | '2d' | 'static') => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas element not available');
    
    if (mode === '3d') {
      // Test WebGL
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) throw new Error('WebGL context creation failed');
      
      // Basic WebGL test
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        throw new Error(`WebGL error: ${error}`);
      }
    } else if (mode === '2d') {
      // Test Canvas2D
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas2D context creation failed');
      
      // Basic Canvas2D test
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 10, 10);
      
      // Test if we can read pixels (Safari restriction check)
      try {
        ctx.getImageData(0, 0, 1, 1);
      } catch (e) {
        console.warn('Canvas2D getImageData restricted, using workaround');
      }
    }
  }, []);

  // Handle system errors with progressive fallback
  const handleSystemError = useCallback((error: Error) => {
    const { retryCount } = systemState;
    
    console.error('XP System Error:', error);
    onError?.(error);
    
    // Progressive fallback strategy
    if (retryCount === 0 && systemState.renderMode === '3d') {
      // First failure: fallback to 2D
      console.log('Falling back to 2D rendering');
      setSystemState(prev => ({
        ...prev,
        renderMode: '2d',
        physicsEnabled: false,
        retryCount: 1,
        errorMessage: 'Switched to 2D mode for compatibility'
      }));
      
      retryTimeoutRef.current = setTimeout(() => {
        initializeSystem();
      }, 1000);
      
    } else if (retryCount === 1 && systemState.renderMode === '2d') {
      // Second failure: use static fallback
      console.log('Falling back to static mode');
      setSystemState(prev => ({
        ...prev,
        renderMode: 'static',
        physicsEnabled: false,
        retryCount: 2,
        errorMessage: 'Using simplified display for maximum compatibility'
      }));
      
      retryTimeoutRef.current = setTimeout(() => {
        setSystemState(prev => ({ ...prev, status: 'ready' }));
      }, 500);
      
    } else {
      // Final failure: show error state
      setSystemState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: error.message || 'Failed to initialize XP system'
      }));
    }
  }, [systemState, onError, initializeSystem]);

  // Performance monitoring
  const handlePerformanceIssue = useCallback((issue: string, metrics: any) => {
    console.warn('Performance issue detected:', issue, metrics);
    
    setPerformanceMetrics(prev => ({
      ...prev,
      ...metrics
    }));
    
    // Auto-degrade if performance is poor
    if (metrics.frameRate < 20 && systemState.physicsEnabled) {
      console.log('Disabling physics due to poor performance');
      setSystemState(prev => ({
        ...prev,
        physicsEnabled: false,
        errorMessage: 'Physics disabled to improve performance'
      }));
    }
  }, [systemState.physicsEnabled]);

  // Retry functionality
  const handleRetry = useCallback(() => {
    setSystemState(prev => ({
      ...prev,
      status: 'loading',
      retryCount: 0,
      errorMessage: null
    }));
    initializeSystem();
  }, [initializeSystem]);

  // Initialize on mount
  useEffect(() => {
    initializeSystem();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [initializeSystem]);

  // Calculate XP percentage
  const xpPercentage = useMemo(() => {
    return Math.min((currentXP / maxXP) * 100, 100);
  }, [currentXP, maxXP]);

  // Theme colors
  const themeColors = useMemo(() => {
    const THEMES = {
      default: { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' },
      magic: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
      fire: { primary: '#EF4444', secondary: '#F87171', accent: '#FCA5A5' },
      water: { primary: '#06B6D4', secondary: '#67E8F9', accent: '#A5F3FC' },
      crystal: { primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7' },
      rainbow: { primary: '#EC4899', secondary: '#F472B6', accent: '#F9A8D4' }
    };
    return THEMES[theme];
  }, [theme]);

  // Render loading state
  if (systemState.status === 'loading') {
    return (
      <div style={{ width: sizeConfig.width, height: sizeConfig.height }}>
        <LoadingState
          message="Initializing XP System..."
          progress={systemState.loadingProgress}
          canCancel={false}
        />
      </div>
    );
  }

  // Render error state
  if (systemState.status === 'error') {
    return (
      <div style={{ width: sizeConfig.width, height: sizeConfig.height }}>
        <ErrorMessage
          type="error"
          title="XP System Error"
          message={systemState.errorMessage || 'Failed to initialize'}
          actions={[
            {
              label: 'Retry',
              onClick: handleRetry,
              variant: 'primary'
            },
            {
              label: 'Use Simple Mode',
              onClick: () => {
                setSystemState(prev => ({
                  ...prev,
                  status: 'ready',
                  renderMode: 'static',
                  physicsEnabled: false
                }));
              },
              variant: 'secondary'
            }
          ]}
        />
      </div>
    );
  }

  // Render static fallback
  if (systemState.renderMode === 'static') {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-4"
        style={{ width: sizeConfig.width, height: sizeConfig.height }}
      >
        {/* Static XP Bar */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-gray-800">Level {level}</div>
          <div className="text-sm text-gray-600">{currentXP} / {maxXP} XP</div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-4 rounded-full"
            style={{ backgroundColor: themeColors.primary }}
          />
        </div>
        
        {/* XP Gained */}
        {xpGained > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-600 font-bold"
          >
            +{xpGained} XP
          </motion.div>
        )}
        
        {/* Compatibility Notice */}
        <div className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Simple Mode
        </div>
      </div>
    );
  }

  // Render 2D version
  if (systemState.renderMode === '2d') {
    return (
      <ThreeDErrorBoundary
        componentName="XP System 2D"
        onError={handleSystemError}
        showRetry={true}
        maxRetries={2}
      >
        <div className="relative" style={{ width: sizeConfig.width, height: sizeConfig.height }}>
          {/* Canvas2D Renderer */}
          <canvas
            ref={canvasRef}
            width={sizeConfig.width}
            height={sizeConfig.height}
            className="rounded-lg border border-gray-200"
          />
          
          {/* Physics System (if enabled) */}
          {systemState.physicsEnabled && (
            <div className="absolute inset-0 pointer-events-none">
              <PhysicsSystemManager
                width={sizeConfig.width}
                height={sizeConfig.height}
                onPerformanceIssue={handlePerformanceIssue}
                initialQuality="medium"
                enableFallback={true}
              />
            </div>
          )}
          
          {/* Status Indicators */}
          <div className="absolute top-2 right-2 flex gap-1">
            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              2D
            </div>
            {systemState.physicsEnabled && (
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Physics
              </div>
            )}
          </div>
        </div>
      </ThreeDErrorBoundary>
    );
  }

  // Render 3D version (wrapped in error boundary)
  return (
    <ThreeDErrorBoundary
      componentName="XP System 3D"
      onError={handleSystemError}
      showRetry={true}
      maxRetries={3}
      fallbackComponent={
        enableFallback ? (
          <FallbackUISystem
            mascotType="dragon"
            emotion="happy"
            reason="webgl_unavailable"
            size={size === 'compact' ? 'small' : size === 'normal' ? 'medium' : 'large'}
            onRetry={handleRetry}
            onFallbackAccept={() => {
              setSystemState(prev => ({ ...prev, renderMode: '2d' }));
            }}
          />
        ) : undefined
      }
    >
      <div className="relative" style={{ width: sizeConfig.width, height: sizeConfig.height }}>
        {/* WebGL Canvas */}
        <canvas
          ref={canvasRef}
          width={sizeConfig.width}
          height={sizeConfig.height}
          className="rounded-lg"
        />
        
        {/* Physics System Overlay */}
        {systemState.physicsEnabled && (
          <div className="absolute inset-0 pointer-events-none">
            <PhysicsSystemManager
              width={sizeConfig.width}
              height={sizeConfig.height}
              onPerformanceIssue={handlePerformanceIssue}
              initialQuality="high"
              enableFallback={true}
            />
          </div>
        )}
        
        {/* Performance Info */}
        <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
          3D | {Math.round(performanceMetrics.fps)} FPS
        </div>
        
        {/* Error Messages */}
        <AnimatePresence>
          {systemState.errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 left-2 right-2"
            >
              <ErrorMessage
                type="warning"
                title="Notice"
                message={systemState.errorMessage}
                dismissible={true}
                onDismiss={() => setSystemState(prev => ({ ...prev, errorMessage: null }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThreeDErrorBoundary>
  );
};

export { RobustXPSystem };
export default RobustXPSystem;