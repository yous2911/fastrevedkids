/**
 * Mobile Frame Rate Optimization System
 * Adaptive frame rate management for mobile devices with thermal and battery awareness
 */

interface FrameRateConfig {
  targetFPS: number;
  minFPS: number;
  maxFPS: number;
  adaptiveThrottling: boolean;
  thermalThrottling: boolean;
  batteryThrottling: boolean;
  qualityScaling: boolean;
  frameSkipping: boolean;
}

interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  frameTime: number;
  droppedFrames: number;
  jankFrames: number;
  cpuUsage: number;
  memoryUsage: number;
  thermalState: 'normal' | 'fair' | 'serious' | 'critical';
  batteryLevel: number;
  isCharging: boolean;
}

interface FrameRateCallback {
  id: string;
  callback: (deltaTime: number, shouldSkip: boolean, quality: number) => void;
  priority: 'critical' | 'high' | 'medium' | 'low';
  minFPS: number;
  canSkip: boolean;
  qualitySensitive: boolean;
}

interface AdaptiveSettings {
  currentQuality: number; // 0.1 to 1.0
  frameSkipRatio: number; // 0 to 0.5
  throttleLevel: number; // 0 to 1.0
  enableEffects: boolean;
  enableParticles: boolean;
  enableAnimations: boolean;
  reducedRendering: boolean;
}

/**
 * Intelligent mobile frame rate manager with adaptive optimization
 */
export class MobileFrameRateManager {
  private static instance: MobileFrameRateManager;
  private callbacks = new Map<string, FrameRateCallback>();
  private config: FrameRateConfig;
  private metrics: PerformanceMetrics;
  private adaptiveSettings: AdaptiveSettings;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private frameTimeHistory: number[] = [];
  private frameCounter = 0;
  private lastFPSUpdate = 0;
  private thermalObserver: any = null;
  private batteryManager: any = null;
  private isRunning = false;

  // Thermal throttling detection
  private thermalThrottleHistory: number[] = [];
  private performanceObserver: PerformanceObserver | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.adaptiveSettings = this.initializeAdaptiveSettings();
    
    this.setupPerformanceMonitoring();
    this.setupThermalMonitoring();
    this.setupBatteryMonitoring();
  }

  public static getInstance(): MobileFrameRateManager {
    if (!MobileFrameRateManager.instance) {
      MobileFrameRateManager.instance = new MobileFrameRateManager();
    }
    return MobileFrameRateManager.instance;
  }

  /**
   * Register animation callback with mobile optimization parameters
   */
  public registerCallback(
    id: string,
    callback: (deltaTime: number, shouldSkip: boolean, quality: number) => void,
    options: {
      priority?: 'critical' | 'high' | 'medium' | 'low';
      minFPS?: number;
      canSkip?: boolean;
      qualitySensitive?: boolean;
    } = {}
  ): void {
    const frameRateCallback: FrameRateCallback = {
      id,
      callback,
      priority: options.priority || 'medium',
      minFPS: options.minFPS || 15,
      canSkip: options.canSkip !== false, // Default to true
      qualitySensitive: options.qualitySensitive !== false // Default to true
    };

    this.callbacks.set(id, frameRateCallback);

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Unregister animation callback
   */
  public unregisterCallback(id: string): void {
    this.callbacks.delete(id);
    
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  /**
   * Update frame rate configuration
   */
  public updateConfig(newConfig: Partial<FrameRateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.recalculateAdaptiveSettings();
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current adaptive settings
   */
  public getAdaptiveSettings(): AdaptiveSettings {
    return { ...this.adaptiveSettings };
  }

  /**
   * Force quality adjustment
   */
  public setQuality(quality: number): void {
    this.adaptiveSettings.currentQuality = Math.max(0.1, Math.min(1.0, quality));
    this.updateAdaptiveSettings();
  }

  /**
   * Enable/disable thermal throttling
   */
  public setThermalThrottling(enabled: boolean): void {
    this.config.thermalThrottling = enabled;
  }

  /**
   * Enable/disable battery throttling
   */
  public setBatteryThrottling(enabled: boolean): void {
    this.config.batteryThrottling = enabled;
  }

  /**
   * Get recommended settings for current device
   */
  public getRecommendedSettings(): {
    targetFPS: number;
    enableAdaptive: boolean;
    enableThermal: boolean;
    enableBattery: boolean;
  } {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = (navigator as any).deviceMemory < 4 || navigator.hardwareConcurrency < 4;
    const isVeryLowEnd = (navigator as any).deviceMemory < 2 || navigator.hardwareConcurrency < 2;

    if (isVeryLowEnd) {
      return {
        targetFPS: 20,
        enableAdaptive: true,
        enableThermal: true,
        enableBattery: true
      };
    } else if (isLowEnd || isMobile) {
      return {
        targetFPS: 30,
        enableAdaptive: true,
        enableThermal: true,
        enableBattery: true
      };
    } else {
      return {
        targetFPS: 60,
        enableAdaptive: false,
        enableThermal: false,
        enableBattery: false
      };
    }
  }

  /**
   * Start the frame rate manager
   */
  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Stop the frame rate manager
   */
  private stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main animation loop with mobile optimizations
   */
  private animate = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;
    
    // Adaptive frame rate limiting
    if (this.shouldSkipFrame(deltaTime, currentTime)) {
      this.rafId = requestAnimationFrame(this.animate);
      return;
    }

    // Update performance metrics
    this.updatePerformanceMetrics(deltaTime, currentTime);

    // Adaptive quality adjustment
    if (this.config.adaptiveThrottling) {
      this.updateAdaptiveSettings();
    }

    // Execute callbacks with mobile optimizations
    this.executeCallbacks(deltaTime, currentTime);

    this.lastFrameTime = currentTime;
    this.rafId = requestAnimationFrame(this.animate);
  };

  /**
   * Determine if frame should be skipped for performance
   */
  private shouldSkipFrame(deltaTime: number, currentTime: number): boolean {
    // Always render first frame
    if (this.frameCounter === 0) return false;

    // Calculate target frame time
    const targetFrameTime = 1000 / this.config.targetFPS;
    
    // Skip if frame is coming too early (unless critical callbacks exist)
    const hasCriticalCallbacks = Array.from(this.callbacks.values())
      .some(cb => cb.priority === 'critical');
    
    if (!hasCriticalCallbacks && deltaTime < targetFrameTime * 0.9) {
      return true;
    }

    // Dynamic frame skipping based on performance
    if (this.config.frameSkipping && this.adaptiveSettings.frameSkipRatio > 0) {
      const skipModulo = Math.round(1 / this.adaptiveSettings.frameSkipRatio);
      if (this.frameCounter % skipModulo === 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(deltaTime: number, currentTime: number): void {
    this.frameCounter++;
    
    // Track frame times
    this.frameTimeHistory.push(deltaTime);
    if (this.frameTimeHistory.length > 120) { // Keep 2 seconds at 60fps
      this.frameTimeHistory.shift();
    }

    // Calculate FPS every second
    if (currentTime - this.lastFPSUpdate > 1000) {
      const validFrameTimes = this.frameTimeHistory.filter(ft => ft > 0);
      
      if (validFrameTimes.length > 0) {
        const avgFrameTime = validFrameTimes.reduce((sum, ft) => sum + ft, 0) / validFrameTimes.length;
        this.metrics.currentFPS = 1000 / avgFrameTime;
        this.metrics.averageFPS = (this.metrics.averageFPS * 0.9) + (this.metrics.currentFPS * 0.1);
        this.metrics.frameTime = avgFrameTime;
      }

      // Count dropped frames (>33ms = dropped frame at 30fps)
      this.metrics.droppedFrames = this.frameTimeHistory.filter(ft => ft > 33).length;
      
      // Count jank frames (>16ms = jank at 60fps)
      this.metrics.jankFrames = this.frameTimeHistory.filter(ft => ft > 16).length;
      
      this.lastFPSUpdate = currentTime;
    }

    // Thermal throttling detection
    if (this.config.thermalThrottling) {
      this.detectThermalThrottling(deltaTime);
    }
  }

  /**
   * Execute animation callbacks with mobile optimizations
   */
  private executeCallbacks(deltaTime: number, currentTime: number): void {
    // Sort callbacks by priority
    const sortedCallbacks = Array.from(this.callbacks.values())
      .sort((a, b) => {
        const priorities = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorities[a.priority] - priorities[b.priority];
      });

    // Determine how many callbacks to execute this frame
    const maxCallbacksPerFrame = this.getMaxCallbacksPerFrame();
    const callbacksToExecute = sortedCallbacks.slice(0, maxCallbacksPerFrame);

    callbacksToExecute.forEach((callbackInfo, index) => {
      const shouldSkip = this.shouldSkipCallback(callbackInfo, index);
      const quality = this.getCallbackQuality(callbackInfo);

      try {
        callbackInfo.callback(deltaTime, shouldSkip, quality);
      } catch (error) {
        console.error(`Frame rate callback error for ${callbackInfo.id}:`, error);
      }
    });
  }

  /**
   * Determine if specific callback should be skipped
   */
  private shouldSkipCallback(callbackInfo: FrameRateCallback, index: number): boolean {
    // Never skip critical callbacks
    if (callbackInfo.priority === 'critical') return false;
    
    // Skip based on current FPS and callback's minimum FPS requirement
    if (this.metrics.currentFPS < callbackInfo.minFPS && callbackInfo.canSkip) {
      return true;
    }

    // Skip low priority callbacks during performance issues
    if (callbackInfo.priority === 'low' && this.metrics.currentFPS < this.config.targetFPS * 0.8) {
      return index % 2 === 0; // Skip every other low priority callback
    }

    // Skip based on adaptive frame skipping
    if (callbackInfo.canSkip && this.adaptiveSettings.frameSkipRatio > 0) {
      const skipChance = this.adaptiveSettings.frameSkipRatio * 
                        (callbackInfo.priority === 'low' ? 2 : 1);
      return Math.random() < skipChance;
    }

    return false;
  }

  /**
   * Get quality level for callback
   */
  private getCallbackQuality(callbackInfo: FrameRateCallback): number {
    if (!callbackInfo.qualitySensitive) return 1.0;
    
    let quality = this.adaptiveSettings.currentQuality;

    // Reduce quality for lower priority callbacks
    switch (callbackInfo.priority) {
      case 'critical': break; // No reduction
      case 'high': quality *= 0.95; break;
      case 'medium': quality *= 0.85; break;
      case 'low': quality *= 0.7; break;
    }

    // Additional reduction based on performance
    if (this.metrics.currentFPS < this.config.targetFPS * 0.7) {
      quality *= 0.8;
    }

    return Math.max(0.1, Math.min(1.0, quality));
  }

  /**
   * Get maximum callbacks to execute per frame
   */
  private getMaxCallbacksPerFrame(): number {
    const baseMax = 10;
    
    // Reduce based on performance
    const performanceRatio = this.metrics.currentFPS / this.config.targetFPS;
    const performanceMultiplier = Math.max(0.3, Math.min(1.0, performanceRatio));
    
    // Reduce based on thermal state
    const thermalMultiplier = this.getThermalMultiplier();
    
    // Reduce based on battery
    const batteryMultiplier = this.getBatteryMultiplier();
    
    return Math.max(1, Math.floor(baseMax * performanceMultiplier * thermalMultiplier * batteryMultiplier));
  }

  /**
   * Update adaptive settings based on current performance
   */
  private updateAdaptiveSettings(): void {
    const currentFPS = this.metrics.currentFPS;
    const targetFPS = this.config.targetFPS;
    const performanceRatio = currentFPS / targetFPS;

    // Adjust quality based on FPS
    if (performanceRatio < 0.7) {
      // Significant performance issues
      this.adaptiveSettings.currentQuality = Math.max(0.3, this.adaptiveSettings.currentQuality * 0.9);
      this.adaptiveSettings.frameSkipRatio = Math.min(0.5, this.adaptiveSettings.frameSkipRatio + 0.1);
      this.adaptiveSettings.enableEffects = false;
      this.adaptiveSettings.enableParticles = false;
      this.adaptiveSettings.reducedRendering = true;
    } else if (performanceRatio < 0.85) {
      // Minor performance issues
      this.adaptiveSettings.currentQuality = Math.max(0.5, this.adaptiveSettings.currentQuality * 0.95);
      this.adaptiveSettings.frameSkipRatio = Math.min(0.3, this.adaptiveSettings.frameSkipRatio + 0.05);
      this.adaptiveSettings.enableParticles = currentFPS > 25;
    } else if (performanceRatio > 1.1) {
      // Good performance, can increase quality
      this.adaptiveSettings.currentQuality = Math.min(1.0, this.adaptiveSettings.currentQuality * 1.02);
      this.adaptiveSettings.frameSkipRatio = Math.max(0, this.adaptiveSettings.frameSkipRatio - 0.02);
      this.adaptiveSettings.enableEffects = true;
      this.adaptiveSettings.enableParticles = true;
      this.adaptiveSettings.reducedRendering = false;
    }

    // Thermal adjustments
    if (this.config.thermalThrottling) {
      this.applyThermalAdjustments();
    }

    // Battery adjustments
    if (this.config.batteryThrottling) {
      this.applyBatteryAdjustments();
    }
  }

  /**
   * Apply thermal-based adjustments
   */
  private applyThermalAdjustments(): void {
    const thermalMultiplier = this.getThermalMultiplier();
    
    if (thermalMultiplier < 0.8) {
      this.adaptiveSettings.currentQuality *= thermalMultiplier;
      this.adaptiveSettings.enableEffects = false;
      this.adaptiveSettings.enableParticles = false;
      this.adaptiveSettings.reducedRendering = true;
      this.config.targetFPS = Math.max(15, this.config.targetFPS * 0.8);
    }
  }

  /**
   * Apply battery-based adjustments
   */
  private applyBatteryAdjustments(): void {
    const batteryMultiplier = this.getBatteryMultiplier();
    
    if (batteryMultiplier < 0.8) {
      this.adaptiveSettings.currentQuality *= batteryMultiplier;
      this.adaptiveSettings.enableAnimations = this.metrics.batteryLevel > 20;
      this.adaptiveSettings.enableParticles = this.metrics.batteryLevel > 30;
      this.adaptiveSettings.enableEffects = this.metrics.batteryLevel > 50;
    }
  }

  /**
   * Get thermal performance multiplier
   */
  private getThermalMultiplier(): number {
    switch (this.metrics.thermalState) {
      case 'normal': return 1.0;
      case 'fair': return 0.9;
      case 'serious': return 0.7;
      case 'critical': return 0.5;
      default: return 1.0;
    }
  }

  /**
   * Get battery performance multiplier
   */
  private getBatteryMultiplier(): number {
    if (this.metrics.isCharging) return 1.0;
    
    const batteryLevel = this.metrics.batteryLevel;
    
    if (batteryLevel > 50) return 1.0;
    if (batteryLevel > 30) return 0.9;
    if (batteryLevel > 15) return 0.7;
    return 0.5;
  }

  /**
   * Detect thermal throttling through performance degradation
   */
  private detectThermalThrottling(frameTime: number): void {
    this.thermalThrottleHistory.push(frameTime);
    if (this.thermalThrottleHistory.length > 300) { // 5 seconds at 60fps
      this.thermalThrottleHistory.shift();
    }

    // Analyze thermal patterns
    if (this.thermalThrottleHistory.length >= 60) {
      const recentAvg = this.thermalThrottleHistory.slice(-60).reduce((sum, ft) => sum + ft, 0) / 60;
      const overallAvg = this.thermalThrottleHistory.reduce((sum, ft) => sum + ft, 0) / this.thermalThrottleHistory.length;
      
      const degradationRatio = recentAvg / overallAvg;
      
      if (degradationRatio > 1.5) {
        this.metrics.thermalState = 'serious';
      } else if (degradationRatio > 1.3) {
        this.metrics.thermalState = 'fair';
      } else if (degradationRatio > 2.0) {
        this.metrics.thermalState = 'critical';
      } else {
        this.metrics.thermalState = 'normal';
      }
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            // Track performance measures
            this.metrics.cpuUsage = Math.min(100, (entry.duration / 16.67) * 100);
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }

  /**
   * Setup thermal monitoring
   */
  private setupThermalMonitoring(): void {
    // Currently no standard thermal API, using heuristics
    console.log('🌡️ Thermal monitoring initialized (heuristic-based)');
  }

  /**
   * Setup battery monitoring
   */
  private setupBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryManager = battery;
        
        const updateBatteryInfo = () => {
          this.metrics.batteryLevel = Math.round(battery.level * 100);
          this.metrics.isCharging = battery.charging;
        };

        updateBatteryInfo();
        
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
      }).catch(() => {
        console.warn('Battery monitoring not available');
      });
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): FrameRateConfig {
    return {
      targetFPS: 30,
      minFPS: 15,
      maxFPS: 60,
      adaptiveThrottling: true,
      thermalThrottling: true,
      batteryThrottling: true,
      qualityScaling: true,
      frameSkipping: true
    };
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      currentFPS: 30,
      averageFPS: 30,
      frameTime: 33.33,
      droppedFrames: 0,
      jankFrames: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      thermalState: 'normal',
      batteryLevel: 100,
      isCharging: true
    };
  }

  /**
   * Initialize adaptive settings
   */
  private initializeAdaptiveSettings(): AdaptiveSettings {
    return {
      currentQuality: 1.0,
      frameSkipRatio: 0,
      throttleLevel: 0,
      enableEffects: true,
      enableParticles: true,
      enableAnimations: true,
      reducedRendering: false
    };
  }

  /**
   * Recalculate adaptive settings
   */
  private recalculateAdaptiveSettings(): void {
    // Reset to defaults and let adaptive system adjust
    this.adaptiveSettings = this.initializeAdaptiveSettings();
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stop();
    this.callbacks.clear();
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.batteryManager) {
      // Remove battery event listeners if possible
    }
  }
}

// Export singleton instance
export const mobileFrameRate = MobileFrameRateManager.getInstance();