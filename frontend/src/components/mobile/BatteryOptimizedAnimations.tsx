/**
 * Battery-Conscious Animation System
 * Power-aware animations with adaptive quality and intelligent power management
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { mobileDetector } from '../../utils/mobileOptimized';
import { mobileFrameRate } from '../../utils/mobileFrameRate';

interface PowerMode {
  name: 'maximum' | 'balanced' | 'saver' | 'ultra-saver';
  maxFPS: number;
  particleCount: number;
  animationComplexity: 'full' | 'reduced' | 'minimal' | 'static';
  enableEffects: boolean;
  enablePhysics: boolean;
  enableInterpolation: boolean;
  enableSmoothing: boolean;
  renderScale: number;
}

interface BatteryStatus {
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

interface AnimationConfig {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'elastic';
  duration: number;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  powerAware?: boolean;
  criticalAnimation?: boolean;
}

interface BatteryOptimizedAnimationsProps {
  children: React.ReactNode;
  powerMode?: 'auto' | 'maximum' | 'balanced' | 'saver' | 'ultra-saver';
  onPowerModeChange?: (mode: PowerMode) => void;
  onBatteryStatusChange?: (status: BatteryStatus) => void;
  debugMode?: boolean;
}

/**
 * Battery-optimized animation wrapper component
 */
export const BatteryOptimizedAnimations: React.FC<BatteryOptimizedAnimationsProps> = ({
  children,
  powerMode = 'auto',
  onPowerModeChange,
  onBatteryStatusChange,
  debugMode = false
}) => {
  const [currentPowerMode, setCurrentPowerMode] = useState<PowerMode | null>(null);
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const batteryManagerRef = useRef<any>(null);
  const updateBatteryStatusRef = useRef<(() => void) | null>(null);
  const powerModeHistoryRef = useRef<PowerMode[]>([]);
  const performanceMonitorRef = useRef<{
    frameDrops: number;
    averageFPS: number;
    lastUpdate: number;
  }>({
    frameDrops: 0,
    averageFPS: 30,
    lastUpdate: 0
  });

  // Power mode configurations
  const powerModes: Record<string, PowerMode> = useMemo(() => ({
    maximum: {
      name: 'maximum',
      maxFPS: 60,
      particleCount: 100,
      animationComplexity: 'full',
      enableEffects: true,
      enablePhysics: true,
      enableInterpolation: true,
      enableSmoothing: true,
      renderScale: 1.0
    },
    balanced: {
      name: 'balanced',
      maxFPS: 45,
      particleCount: 60,
      animationComplexity: 'reduced',
      enableEffects: true,
      enablePhysics: true,
      enableInterpolation: true,
      enableSmoothing: false,
      renderScale: 0.9
    },
    saver: {
      name: 'saver',
      maxFPS: 30,
      particleCount: 30,
      animationComplexity: 'minimal',
      enableEffects: false,
      enablePhysics: false,
      enableInterpolation: false,
      enableSmoothing: false,
      renderScale: 0.8
    },
    'ultra-saver': {
      name: 'ultra-saver',
      maxFPS: 15,
      particleCount: 10,
      animationComplexity: 'static',
      enableEffects: false,
      enablePhysics: false,
      enableInterpolation: false,
      enableSmoothing: false,
      renderScale: 0.6
    }
  }), []);

  // Initialize battery and performance monitoring
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize mobile detector
        await mobileDetector.detectCapabilities();
        
        // Initialize frame rate manager with battery-conscious settings
        const recommendations = mobileFrameRate.getRecommendedSettings();
        mobileFrameRate.updateConfig({
          targetFPS: recommendations.targetFPS,
          batteryThrottling: recommendations.enableBattery,
          thermalThrottling: recommendations.enableThermal,
          adaptiveThrottling: recommendations.enableAdaptive
        });

        // Setup battery monitoring
        await setupBatteryMonitoring();
        
        // Setup performance monitoring
        setupPerformanceMonitoring();
        
        // Set initial power mode
        const initialMode = await calculateOptimalPowerMode();
        setCurrentPowerMode(initialMode);
        
        setIsInitialized(true);
        console.log('🔋 Battery-optimized animations initialized');
        
      } catch (error) {
        console.warn('Battery optimization initialization failed:', error);
        // Fallback to balanced mode
        setCurrentPowerMode(powerModes.balanced);
        setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      // Cleanup
      if (batteryManagerRef.current) {
        removeEventListeners();
      }
    };
  }, []);

  // Setup battery monitoring with event listeners
  const setupBatteryMonitoring = useCallback(async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryManagerRef.current = battery;
        
        const updateBatteryStatus = () => {
          const status: BatteryStatus = {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          };
          
          setBatteryStatus(status);
          onBatteryStatusChange?.(status);
          
          // Auto-adjust power mode if needed
          if (powerMode === 'auto') {
            adjustPowerModeBasedOnBattery(status);
          }
        };

        updateBatteryStatusRef.current = updateBatteryStatus;

        // Initial update
        updateBatteryStatus();
        
        // Listen for battery changes
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
        battery.addEventListener('chargingtimechange', updateBatteryStatus);
        battery.addEventListener('dischargingtimechange', updateBatteryStatus);
        
        return true;
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
    
    // Fallback: mock battery status
    setBatteryStatus({
      level: 75,
      charging: false
    });
    
    return false;
  }, [powerMode, onBatteryStatusChange]);

  // Remove battery event listeners
  const removeEventListeners = useCallback(() => {
    const battery = batteryManagerRef.current;
    const updateBatteryStatus = updateBatteryStatusRef.current;
    if (battery && updateBatteryStatus) {
      battery.removeEventListener('levelchange', updateBatteryStatus);
      battery.removeEventListener('chargingchange', updateBatteryStatus);
      battery.removeEventListener('chargingtimechange', updateBatteryStatus);
      battery.removeEventListener('dischargingtimechange', updateBatteryStatus);
    }
  }, []);

  // Setup performance monitoring
  const setupPerformanceMonitoring = useCallback(() => {
    const monitorPerformance = () => {
      const metrics = mobileFrameRate.getMetrics();
      const monitor = performanceMonitorRef.current;
      
      monitor.averageFPS = (monitor.averageFPS * 0.9) + (metrics.currentFPS * 0.1);
      
      // Count frame drops
      if (metrics.currentFPS < (currentPowerMode?.maxFPS || 30) * 0.8) {
        monitor.frameDrops++;
      }
      
      // Auto-adjust power mode based on performance every 5 seconds
      const now = performance.now();
      if (now - monitor.lastUpdate > 5000) {
        if (powerMode === 'auto' && currentPowerMode) {
          adjustPowerModeBasedOnPerformance(monitor);
        }
        monitor.lastUpdate = now;
      }
    };

    // Register with frame rate manager
    mobileFrameRate.registerCallback('battery-performance-monitor', () => {
      monitorPerformance();
    }, {
      priority: 'low',
      canSkip: true,
      qualitySensitive: false
    });
  }, [powerMode, currentPowerMode]);

  // Calculate optimal power mode based on device and battery
  const calculateOptimalPowerMode = useCallback(async (): Promise<PowerMode> => {
    const capabilities = await mobileDetector.detectCapabilities();
    const batteryOpt = mobileDetector.getBatteryOptimization();
    
    // Manual override
    if (powerMode !== 'auto') {
      return powerModes[powerMode];
    }

    // Auto mode decision tree
    if (batteryOpt.aggressiveMode) {
      return powerModes['ultra-saver'];
    } else if (batteryOpt.enabled && !capabilities.isCharging) {
      return capabilities.batteryLevel! > 50 ? powerModes.saver : powerModes['ultra-saver'];
    } else if (capabilities.performanceTier === 'low') {
      return powerModes.saver;
    } else if (capabilities.performanceTier === 'medium') {
      return capabilities.isCharging ? powerModes.balanced : powerModes.saver;
    } else {
      return capabilities.isCharging ? powerModes.maximum : powerModes.balanced;
    }
  }, [powerMode, powerModes]);

  // Adjust power mode based on battery status
  const adjustPowerModeBasedOnBattery = useCallback((status: BatteryStatus) => {
    if (!currentPowerMode || powerMode !== 'auto') return;

    let newMode: PowerMode;

    if (status.charging) {
      // Charging: can afford higher power mode
      newMode = status.level > 80 ? powerModes.maximum : powerModes.balanced;
    } else {
      // Not charging: battery conservation
      if (status.level > 70) {
        newMode = powerModes.balanced;
      } else if (status.level > 30) {
        newMode = powerModes.saver;
      } else {
        newMode = powerModes['ultra-saver'];
      }
    }

    if (newMode.name !== currentPowerMode.name) {
      console.log(`🔋 Power mode changed: ${currentPowerMode.name} → ${newMode.name} (Battery: ${status.level}%)`);
      setCurrentPowerMode(newMode);
      onPowerModeChange?.(newMode);
      applyPowerModeSettings(newMode);
    }
  }, [currentPowerMode, powerMode, powerModes, onPowerModeChange]);

  // Adjust power mode based on performance
  const adjustPowerModeBasedOnPerformance = useCallback((monitor: typeof performanceMonitorRef.current) => {
    if (!currentPowerMode || powerMode !== 'auto') return;

    const performanceRatio = monitor.averageFPS / currentPowerMode.maxFPS;
    const frameDropRatio = monitor.frameDrops / 100; // Last 100 frames

    let newMode: PowerMode | null = null;

    // Performance is bad, need to downgrade
    if (performanceRatio < 0.7 || frameDropRatio > 0.3) {
      switch (currentPowerMode.name) {
        case 'maximum':
          newMode = powerModes.balanced;
          break;
        case 'balanced':
          newMode = powerModes.saver;
          break;
        case 'saver':
          newMode = powerModes['ultra-saver'];
          break;
      }
    }
    // Performance is good, can upgrade (but only if battery allows)
    else if (performanceRatio > 1.1 && frameDropRatio < 0.05 && batteryStatus?.level! > 30) {
      switch (currentPowerMode.name) {
        case 'ultra-saver':
          newMode = powerModes.saver;
          break;
        case 'saver':
          newMode = batteryStatus?.charging ? powerModes.balanced : null;
          break;
        case 'balanced':
          newMode = batteryStatus?.charging && batteryStatus?.level! > 70 ? powerModes.maximum : null;
          break;
      }
    }

    if (newMode && newMode.name !== currentPowerMode.name) {
      console.log(`⚡ Power mode changed for performance: ${currentPowerMode.name} → ${newMode.name} (FPS: ${monitor.averageFPS.toFixed(1)})`);
      setCurrentPowerMode(newMode);
      onPowerModeChange?.(newMode);
      applyPowerModeSettings(newMode);
    }

    // Reset frame drop counter
    monitor.frameDrops = 0;
  }, [currentPowerMode, powerMode, powerModes, batteryStatus, onPowerModeChange]);

  // Apply power mode settings to frame rate manager
  const applyPowerModeSettings = useCallback((mode: PowerMode) => {
    mobileFrameRate.updateConfig({
      targetFPS: mode.maxFPS,
      qualityScaling: mode.animationComplexity !== 'static',
      frameSkipping: mode.animationComplexity === 'minimal' || mode.animationComplexity === 'static'
    });

    mobileFrameRate.setQuality(mode.renderScale);
    
    // Store mode history for analysis
    powerModeHistoryRef.current.push(mode);
    if (powerModeHistoryRef.current.length > 10) {
      powerModeHistoryRef.current.shift();
    }
  }, []);

  // Apply power mode when it changes
  useEffect(() => {
    if (currentPowerMode) {
      applyPowerModeSettings(currentPowerMode);
    }
  }, [currentPowerMode, applyPowerModeSettings]);

  // Create CSS variables for power-aware animations
  const cssVariables = useMemo(() => {
    if (!currentPowerMode) return {};

    const COMPLEXITY_DURATIONS = {
      full: 1,
      reduced: 1.5,
      minimal: 2,
      static: 0
    };

    const complexityMultiplier = COMPLEXITY_DURATIONS[currentPowerMode.animationComplexity];

    return {
      '--battery-animation-duration-multiplier': complexityMultiplier.toString(),
      '--battery-animation-fps': `${currentPowerMode.maxFPS}`,
      '--battery-render-scale': currentPowerMode.renderScale.toString(),
      '--battery-enable-effects': currentPowerMode.enableEffects ? '1' : '0',
      '--battery-enable-physics': currentPowerMode.enablePhysics ? '1' : '0',
      '--battery-particle-count': currentPowerMode.particleCount.toString()
    } as React.CSSProperties;
  }, [currentPowerMode]);

  if (!isInitialized || !currentPowerMode) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-500">Optimizing for battery...</div>
      </div>
    );
  }

  return (
    <div 
      className="battery-optimized-animations"
      style={cssVariables}
      data-power-mode={currentPowerMode.name}
      data-battery-level={batteryStatus?.level}
      data-charging={batteryStatus?.charging}
    >
      {children}
      
      {debugMode && (
        <BatteryDebugPanel
          powerMode={currentPowerMode}
          batteryStatus={batteryStatus}
          performanceMetrics={performanceMonitorRef.current}
        />
      )}
    </div>
  );
};

/**
 * Debug panel for battery optimization
 */
const BatteryDebugPanel: React.FC<{
  powerMode: PowerMode;
  batteryStatus: BatteryStatus | null;
  performanceMetrics: any;
}> = ({ powerMode, batteryStatus, performanceMetrics }) => {
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50">
      <div className="mb-2 font-bold">🔋 Battery Optimization</div>
      
      <div className="space-y-1">
        <div>Power Mode: <span className="text-yellow-300">{powerMode.name}</span></div>
        <div>Max FPS: <span className="text-green-300">{powerMode.maxFPS}</span></div>
        <div>Complexity: <span className="text-blue-300">{powerMode.animationComplexity}</span></div>
        <div>Render Scale: <span className="text-purple-300">{powerMode.renderScale}</span></div>
        
        {batteryStatus && (
          <>
            <div className="border-t border-gray-600 pt-1 mt-2">
              <div>Battery: <span className={batteryStatus.level > 30 ? 'text-green-300' : 'text-red-300'}>
                {batteryStatus.level}%
              </span></div>
              <div>Charging: <span className="text-blue-300">
                {batteryStatus.charging ? 'Yes' : 'No'}
              </span></div>
            </div>
          </>
        )}
        
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div>Avg FPS: <span className="text-green-300">{performanceMetrics.averageFPS.toFixed(1)}</span></div>
          <div>Frame Drops: <span className="text-red-300">{performanceMetrics.frameDrops}</span></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for creating battery-conscious animations
 */
export function useBatteryOptimizedAnimation(
  config: AnimationConfig,
  dependencies: React.DependencyList = []
) {
  const [animationStyle, setAnimationStyle] = useState<React.CSSProperties>({});
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const element = document.documentElement;
    const durationMultiplier = parseFloat(
      getComputedStyle(element).getPropertyValue('--battery-animation-duration-multiplier') || '1'
    );
    const enableEffects = getComputedStyle(element).getPropertyValue('--battery-enable-effects') === '1';
    const powerMode = element.getAttribute('data-power-mode');

    // Adjust animation based on power mode
    let adjustedDuration = config.duration * durationMultiplier;
    let shouldShow = true;

    // Disable non-critical animations in ultra-saver mode
    if (powerMode === 'ultra-saver' && !config.criticalAnimation) {
      shouldShow = false;
    }

    // Disable effects if power mode doesn't support them
    if (!enableEffects && !config.criticalAnimation) {
      if (['bounce', 'elastic'].includes(config.type)) {
        shouldShow = false;
      }
    }

    setShouldAnimate(shouldShow);
    
    if (shouldShow) {
      const style: React.CSSProperties = {
        animationDuration: `${adjustedDuration}ms`,
        animationDelay: `${(config.delay || 0) * durationMultiplier}ms`,
        animationIterationCount: config.iterations || 1,
        animationDirection: config.direction || 'normal',
        animationTimingFunction: config.easing || 'ease',
      };

      // Apply power-aware animation name
      const animationName = getPowerAwareAnimationName(config.type, powerMode);
      style.animationName = animationName;

      setAnimationStyle(style);
    } else {
      setAnimationStyle({});
    }
  }, [...dependencies, config]);

  return {
    animationStyle: shouldAnimate ? animationStyle : {},
    shouldAnimate,
    isReducedMotion: shouldAnimate && animationStyle.animationDuration === '0ms'
  };
}

/**
 * Get power-aware animation name
 */
function getPowerAwareAnimationName(type: string, powerMode: string | null): string {
  const BASE_ANIMATIONS = {
    fade: 'fadeInOut',
    slide: 'slideInOut', 
    scale: 'scaleInOut',
    rotate: 'rotateInOut',
    bounce: 'bounceInOut',
    elastic: 'elasticInOut'
  };

  const animation = BASE_ANIMATIONS[type as keyof typeof BASE_ANIMATIONS] || 'fadeInOut';

  // Use simplified animations for lower power modes
  if (powerMode === 'ultra-saver' || powerMode === 'saver') {
    return animation.replace('InOut', 'Simple');
  }

  return animation;
}

/**
 * Power-aware animation variants
 */
export const BatteryAnimationVariants = {
  // Fade animations
  fadeSimple: 'fadeIn 0.3s ease-in-out',
  fadeInOut: 'fadeIn 0.5s ease-in-out',
  
  // Slide animations  
  slideSimple: 'slideUp 0.2s ease-out',
  slideInOut: 'slideUpDown 0.4s ease-in-out',
  
  // Scale animations
  scaleSimple: 'scaleIn 0.2s ease-out',
  scaleInOut: 'scaleInOut 0.3s ease-in-out',
  
  // Rotate animations (disabled in low power)
  rotateSimple: 'none',
  rotateInOut: 'rotateIn 0.6s ease-in-out',
  
  // Bounce animations (disabled in low power)
  bounceSimple: 'none',
  bounceInOut: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Elastic animations (disabled in low power)
  elasticSimple: 'none',
  elasticInOut: 'elasticIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

export default BatteryOptimizedAnimations;