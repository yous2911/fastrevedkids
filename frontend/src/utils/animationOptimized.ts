/**
 * Optimized Animation Frame Manager
 * Reduces animation overhead through batching, throttling, and smart scheduling
 */

interface AnimationCallback {
  id: string;
  callback: (deltaTime: number, timestamp: number) => void;
  priority: 'high' | 'medium' | 'low';
  fps?: number; // Target FPS, optional throttling
  lastRun?: number;
  active: boolean;
}

interface AnimationStats {
  totalCallbacks: number;
  activeCallbacks: number;
  averageFPS: number;
  frameTime: number;
  cpuUsage: number;
}

/**
 * Centralized animation frame manager to optimize performance
 * All components should use this instead of individual requestAnimationFrame calls
 */
export class AnimationFrameManager {
  private static instance: AnimationFrameManager;
  private callbacks: Map<string, AnimationCallback> = new Map();
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsHistory: number[] = [];
  private isRunning: boolean = false;
  private performanceMode: 'performance' | 'balanced' | 'battery' = 'balanced';
  private maxFrameTime: number = 16.67; // 60fps target
  private adaptiveThrottling: boolean = true;

  private constructor() {
    this.detectPerformanceMode();
    this.setupVisibilityListener();
  }

  public static getInstance(): AnimationFrameManager {
    if (!AnimationFrameManager.instance) {
      AnimationFrameManager.instance = new AnimationFrameManager();
    }
    return AnimationFrameManager.instance;
  }

  /**
   * Register an animation callback
   */
  public registerCallback(
    id: string,
    callback: (deltaTime: number, timestamp: number) => void,
    options: {
      priority?: 'high' | 'medium' | 'low';
      fps?: number;
    } = {}
  ): void {
    const animationCallback: AnimationCallback = {
      id,
      callback,
      priority: options.priority || 'medium',
      fps: options.fps,
      lastRun: 0,
      active: true
    };

    this.callbacks.set(id, animationCallback);
    
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Unregister an animation callback
   */
  public unregisterCallback(id: string): void {
    this.callbacks.delete(id);
    
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  /**
   * Pause/resume a specific callback
   */
  public setCallbackActive(id: string, active: boolean): void {
    const callback = this.callbacks.get(id);
    if (callback) {
      callback.active = active;
    }
  }

  /**
   * Update callback priority (affects execution order)
   */
  public setCallbackPriority(id: string, priority: 'high' | 'medium' | 'low'): void {
    const callback = this.callbacks.get(id);
    if (callback) {
      callback.priority = priority;
    }
  }

  /**
   * Set performance mode
   */
  public setPerformanceMode(mode: 'performance' | 'balanced' | 'battery'): void {
    this.performanceMode = mode;
    
    switch (mode) {
      case 'performance':
        this.maxFrameTime = 16.67; // 60fps
        this.adaptiveThrottling = false;
        break;
      case 'balanced':
        this.maxFrameTime = 20; // 50fps
        this.adaptiveThrottling = true;
        break;
      case 'battery':
        this.maxFrameTime = 33.33; // 30fps
        this.adaptiveThrottling = true;
        break;
    }
  }

  /**
   * Get performance statistics
   */
  public getStats(): AnimationStats {
    const activeCallbacks = Array.from(this.callbacks.values()).filter(cb => cb.active).length;
    const averageFPS = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length 
      : 0;

    return {
      totalCallbacks: this.callbacks.size,
      activeCallbacks,
      averageFPS: Math.round(averageFPS),
      frameTime: this.maxFrameTime,
      cpuUsage: this.calculateCPUUsage()
    };
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Stop the animation loop
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
   * Main animation loop with optimizations
   */
  private animate = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastFrameTime;
    
    // Adaptive frame rate limiting
    if (this.adaptiveThrottling && deltaTime < this.maxFrameTime * 0.9) {
      this.rafId = requestAnimationFrame(this.animate);
      return;
    }

    // Update FPS tracking
    this.updateFPSTracking(deltaTime);

    // Execute callbacks in priority order
    this.executeCallbacks(deltaTime, timestamp);

    // Performance monitoring and adaptive throttling
    this.monitorPerformance(deltaTime);

    this.lastFrameTime = timestamp;
    this.rafId = requestAnimationFrame(this.animate);
  };

  /**
   * Execute animation callbacks with optimizations
   */
  private executeCallbacks(deltaTime: number, timestamp: number): void {
    // Sort callbacks by priority
    const sortedCallbacks = Array.from(this.callbacks.values())
      .filter(cb => cb.active)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    let executedCallbacks = 0;
    const maxExecutionsPerFrame = this.getMaxExecutionsForMode();

    for (const callback of sortedCallbacks) {
      // Check if we should throttle this callback based on its target FPS
      if (callback.fps && callback.lastRun) {
        const targetInterval = 1000 / callback.fps;
        if (timestamp - callback.lastRun < targetInterval) {
          continue;
        }
      }

      // Execute callback with error handling
      try {
        callback.callback(deltaTime, timestamp);
        callback.lastRun = timestamp;
        executedCallbacks++;

        // Limit executions per frame to prevent blocking
        if (executedCallbacks >= maxExecutionsPerFrame) {
          break;
        }
      } catch (error) {
        console.error(`Animation callback error for ${callback.id}:`, error);
        // Temporarily disable problematic callback
        callback.active = false;
        setTimeout(() => {
          callback.active = true;
        }, 1000);
      }
    }
  }

  /**
   * Update FPS tracking for performance monitoring
   */
  private updateFPSTracking(deltaTime: number): void {
    this.frameCount++;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.fpsHistory.push(fps);
      
      // Keep only recent FPS samples
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
    }
  }

  /**
   * Monitor performance and adjust settings automatically
   */
  private monitorPerformance(deltaTime: number): void {
    if (!this.adaptiveThrottling) return;

    // If frame time is consistently too high, reduce quality
    if (deltaTime > this.maxFrameTime * 1.5) {
      this.adaptToLowPerformance();
    }
    
    // If performance is good, we can increase quality
    if (deltaTime < this.maxFrameTime * 0.7 && this.frameCount % 300 === 0) {
      this.adaptToHighPerformance();
    }
  }

  /**
   * Adapt to low performance conditions
   */
  private adaptToLowPerformance(): void {
    // Increase frame time target (reduce FPS)
    this.maxFrameTime = Math.min(this.maxFrameTime * 1.2, 50); // Cap at 20fps
    
    // Reduce priority callback frequency
    this.throttleLowPriorityCallbacks();
  }

  /**
   * Adapt to high performance conditions
   */
  private adaptToHighPerformance(): void {
    // Decrease frame time target (increase FPS)
    const targetFPS = this.performanceMode === 'performance' ? 60 : 
                     this.performanceMode === 'balanced' ? 50 : 30;
    const targetFrameTime = 1000 / targetFPS;
    
    this.maxFrameTime = Math.max(this.maxFrameTime * 0.95, targetFrameTime);
  }

  /**
   * Throttle low priority callbacks during performance issues
   */
  private throttleLowPriorityCallbacks(): void {
    this.callbacks.forEach(callback => {
      if (callback.priority === 'low' && !callback.fps) {
        // Add throttling to low priority callbacks
        callback.fps = 15; // Limit to 15fps
      }
    });
  }

  /**
   * Detect optimal performance mode based on device capabilities
   */
  private detectPerformanceMode(): void {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      this.setPerformanceMode('battery');
      return;
    }

    // Check device characteristics
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    if (isMobile || hardwareConcurrency < 4 || deviceMemory < 4) {
      this.setPerformanceMode('battery');
    } else if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
      this.setPerformanceMode('performance');
    } else {
      this.setPerformanceMode('balanced');
    }
  }

  /**
   * Get maximum callback executions per frame based on performance mode
   */
  private getMaxExecutionsForMode(): number {
    switch (this.performanceMode) {
      case 'performance': return 20;
      case 'balanced': return 15;
      case 'battery': return 10;
      default: return 15;
    }
  }

  /**
   * Calculate estimated CPU usage
   */
  private calculateCPUUsage(): number {
    if (this.fpsHistory.length === 0) return 0;
    
    const averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    const targetFPS = 1000 / this.maxFrameTime;
    
    // Rough estimation: lower FPS relative to target indicates higher CPU usage
    return Math.max(0, Math.min(100, (1 - averageFPS / targetFPS) * 100));
  }

  /**
   * Handle page visibility changes to pause/resume animations
   */
  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, pause animations
        this.callbacks.forEach(callback => {
          callback.active = false;
        });
      } else {
        // Page is visible, resume animations
        this.callbacks.forEach(callback => {
          callback.active = true;
        });
        // Reset timing to prevent large delta jumps
        this.lastFrameTime = performance.now();
      }
    });
  }

  /**
   * Cleanup all resources
   */
  public dispose(): void {
    this.stop();
    this.callbacks.clear();
    AnimationFrameManager.instance = null as any;
  }
}

/**
 * Optimized animation utilities
 */
export class AnimationUtils {
  /**
   * Smoothed animation value using lerp
   */
  static lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * Math.min(factor, 1);
  }

  /**
   * Easing functions for smooth animations
   */
  static easing = {
    linear: (t: number): number => t,
    easeInQuad: (t: number): number => t * t,
    easeOutQuad: (t: number): number => t * (2 - t),
    easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number): number => t * t * t,
    easeOutCubic: (t: number): number => (--t) * t * t + 1,
    easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  };

  /**
   * Create a throttled animation function
   */
  static createThrottledAnimation(
    fn: (deltaTime: number) => void,
    fps: number = 30
  ): (deltaTime: number) => void {
    let lastRun = 0;
    const interval = 1000 / fps;

    return (deltaTime: number) => {
      const now = performance.now();
      if (now - lastRun >= interval) {
        fn(deltaTime);
        lastRun = now;
      }
    };
  }

  /**
   * Animation frame with automatic cleanup
   */
  static animateWithCleanup(
    id: string,
    animationFn: (deltaTime: number) => boolean, // Return false to stop animation
    options: { priority?: 'high' | 'medium' | 'low'; fps?: number } = {}
  ): () => void {
    const manager = AnimationFrameManager.getInstance();
    
    const wrappedFn = (deltaTime: number) => {
      const shouldContinue = animationFn(deltaTime);
      if (!shouldContinue) {
        manager.unregisterCallback(id);
      }
    };

    manager.registerCallback(id, wrappedFn, options);

    // Return cleanup function
    return () => manager.unregisterCallback(id);
  }
}

/**
 * Performance monitoring decorator for animation functions
 */
export function withPerformanceMonitoring(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = method.apply(this, args);
    const end = performance.now();
    
    // Log if method takes too long
    if (end - start > 5) {
      console.warn(`Animation method ${propertyName} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  };

  return descriptor;
}

// Export singleton instance for easy access
export const animationManager = AnimationFrameManager.getInstance();