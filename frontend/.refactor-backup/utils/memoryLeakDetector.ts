/**
 * Advanced Memory Leak Detection and Prevention System
 * Monitors memory usage, detects leaks, and provides automatic cleanup
 */

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  componentCount: number;
  listenerCount: number;
  intervalCount: number;
  timeoutCount: number;
}

interface MemoryLeak {
  type: 'component' | 'listener' | 'interval' | 'timeout' | 'observer' | 'three.js';
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedFix: string;
  detectedAt: number;
}

interface CleanupCallback {
  id: string;
  callback: () => void;
  source: string;
  type: 'component' | 'service' | 'utility';
}

/**
 * Memory Management and Leak Detection System
 */
export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private snapshots: MemorySnapshot[] = [];
  private detectedLeaks: MemoryLeak[] = [];
  private cleanupCallbacks = new Map<string, CleanupCallback>();
  private monitoringInterval: number | null = null;
  private componentRegistry = new WeakMap<React.Component, string>();
  private listenerRegistry = new Map<string, EventListenerOrEventListenerObject>();
  private intervalRegistry = new Map<number, string>();
  private timeoutRegistry = new Map<number, string>();
  private observerRegistry = new Map<string, any>();
  private threeJSObjects = new WeakMap<any, string>();
  
  // Memory thresholds
  private readonly MEMORY_WARNING_THRESHOLD = 50 * 1024 * 1024; // 50MB
  private readonly MEMORY_CRITICAL_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private readonly LEAK_DETECTION_SAMPLES = 10;
  private readonly MONITORING_INTERVAL = 5000; // 5 seconds

  private constructor() {
    this.setupGlobalPatching();
    this.startMonitoring();
  }

  public static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  /**
   * Start memory monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = window.setInterval(() => {
      this.takeMemorySnapshot();
      this.analyzeMemoryTrends();
      this.detectLeaks();
    }, this.MONITORING_INTERVAL);

    console.log('🔍 Memory leak detector started');
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Register cleanup callback
   */
  public registerCleanup(id: string, callback: () => void, source: string, type: 'component' | 'service' | 'utility' = 'utility'): void {
    this.cleanupCallbacks.set(id, { id, callback, source, type });
  }

  /**
   * Unregister cleanup callback
   */
  public unregisterCleanup(id: string): void {
    this.cleanupCallbacks.delete(id);
  }

  /**
   * Force cleanup of all registered callbacks
   */
  public performCleanup(): void {
    const startTime = performance.now();
    let cleanedUp = 0;

    this.cleanupCallbacks.forEach((cleanup, id) => {
      try {
        cleanup.callback();
        cleanedUp++;
        this.cleanupCallbacks.delete(id);
      } catch (error) {
        console.error(`❌ Cleanup failed for ${id}:`, error);
      }
    });

    const endTime = performance.now();
    console.log(`🧹 Cleaned up ${cleanedUp} resources in ${(endTime - startTime).toFixed(2)}ms`);
  }

  /**
   * Get current memory status
   */
  public getMemoryStatus(): {
    current: MemorySnapshot;
    trend: 'increasing' | 'stable' | 'decreasing';
    leaks: MemoryLeak[];
    recommendations: string[];
  } {
    const current = this.getCurrentMemorySnapshot();
    const trend = this.calculateMemoryTrend();
    const recommendations = this.generateRecommendations();

    return {
      current,
      trend,
      leaks: this.detectedLeaks,
      recommendations,
    };
  }

  /**
   * Generate memory report
   */
  public generateMemoryReport(): string {
    const status = this.getMemoryStatus();
    const totalLeaks = status.leaks.length;
    const criticalLeaks = status.leaks.filter(l => l.severity === 'critical').length;

    return `
# Memory Usage Report

## Current Status
- **Memory Used**: ${(status.current.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
- **Memory Limit**: ${(status.current.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
- **Usage Percentage**: ${((status.current.usedJSHeapSize / status.current.jsHeapSizeLimit) * 100).toFixed(1)}%
- **Trend**: ${status.trend}

## Leak Detection
- **Total Leaks**: ${totalLeaks}
- **Critical Leaks**: ${criticalLeaks}
- **Component Count**: ${status.current.componentCount}
- **Active Listeners**: ${status.current.listenerCount}

## Detected Issues
${status.leaks.map(leak => `
### ${leak.type.toUpperCase()} - ${leak.severity.toUpperCase()}
- **Source**: ${leak.source}
- **Description**: ${leak.description}
- **Suggested Fix**: ${leak.suggestedFix}
`).join('\n')}

## Recommendations
${status.recommendations.map(r => `- ${r}`).join('\n')}

---
Generated at: ${new Date().toISOString()}
    `;
  }

  private setupGlobalPatching(): void {
    // Patch addEventListener to track listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const key = `${this.constructor.name}:${type}:${Date.now()}`;
      MemoryLeakDetector.instance.listenerRegistry.set(key, listener);
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Patch removeEventListener to clean up tracking
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      // Find and remove from registry
      for (const [key, registeredListener] of MemoryLeakDetector.instance.listenerRegistry) {
        if (registeredListener === listener) {
          MemoryLeakDetector.instance.listenerRegistry.delete(key);
          break;
        }
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };

    // Patch setInterval to track intervals
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay, ...args) {
      const id = originalSetInterval.call(window, callback, delay, ...args);
      MemoryLeakDetector.instance.intervalRegistry.set(id, new Error().stack || 'unknown');
      return id;
    };

    // Patch clearInterval to clean up tracking
    const originalClearInterval = window.clearInterval;
    window.clearInterval = function(id) {
      MemoryLeakDetector.instance.intervalRegistry.delete(id);
      return originalClearInterval.call(window, id);
    };

    // Patch setTimeout to track timeouts
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay, ...args) {
      const id = originalSetTimeout.call(window, callback, delay, ...args);
      MemoryLeakDetector.instance.timeoutRegistry.set(id, new Error().stack || 'unknown');
      return id;
    };

    // Patch clearTimeout to clean up tracking
    const originalClearTimeout = window.clearTimeout;
    window.clearTimeout = function(id) {
      MemoryLeakDetector.instance.timeoutRegistry.delete(id);
      return originalClearTimeout.call(window, id);
    };
  }

  private takeMemorySnapshot(): void {
    const memoryInfo = (performance as any).memory;
    if (!memoryInfo) return;

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      componentCount: this.getComponentCount(),
      listenerCount: this.listenerRegistry.size,
      intervalCount: this.intervalRegistry.size,
      timeoutCount: this.timeoutRegistry.size,
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > 50) {
      this.snapshots = this.snapshots.slice(-50);
    }
  }

  private analyzeMemoryTrends(): void {
    if (this.snapshots.length < this.LEAK_DETECTION_SAMPLES) return;

    const recent = this.snapshots.slice(-this.LEAK_DETECTION_SAMPLES);
    const memoryGrowth = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const growthRate = memoryGrowth / timeSpan; // bytes per ms

    // Check for concerning growth patterns
    if (growthRate > 1000) { // More than 1KB per ms growth
      this.detectedLeaks.push({
        type: 'component',
        source: 'Memory growth analysis',
        severity: 'high',
        description: `Detected rapid memory growth: ${(memoryGrowth / 1024).toFixed(2)} KB in ${(timeSpan / 1000).toFixed(2)} seconds`,
        suggestedFix: 'Review recent component mounts and ensure proper cleanup',
        detectedAt: Date.now(),
      });
    }

    // Check absolute memory usage
    const currentUsage = recent[recent.length - 1].usedJSHeapSize;
    if (currentUsage > this.MEMORY_CRITICAL_THRESHOLD) {
      this.detectedLeaks.push({
        type: 'component',
        source: 'High memory usage',
        severity: 'critical',
        description: `Memory usage exceeds critical threshold: ${(currentUsage / 1024 / 1024).toFixed(2)} MB`,
        suggestedFix: 'Force garbage collection and review large object references',
        detectedAt: Date.now(),
      });
    }
  }

  private detectLeaks(): void {
    // Clear old leaks (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    this.detectedLeaks = this.detectedLeaks.filter(leak => leak.detectedAt > fiveMinutesAgo);

    // Check for listener leaks
    if (this.listenerRegistry.size > 100) {
      this.detectedLeaks.push({
        type: 'listener',
        source: 'Event listener analysis',
        severity: 'medium',
        description: `High number of event listeners: ${this.listenerRegistry.size}`,
        suggestedFix: 'Review components for missing removeEventListener calls',
        detectedAt: Date.now(),
      });
    }

    // Check for interval leaks
    if (this.intervalRegistry.size > 10) {
      this.detectedLeaks.push({
        type: 'interval',
        source: 'Interval analysis',
        severity: 'high',
        description: `High number of active intervals: ${this.intervalRegistry.size}`,
        suggestedFix: 'Review components for missing clearInterval calls',
        detectedAt: Date.now(),
      });
    }

    // Check for timeout leaks
    if (this.timeoutRegistry.size > 50) {
      this.detectedLeaks.push({
        type: 'timeout',
        source: 'Timeout analysis',
        severity: 'medium',
        description: `High number of active timeouts: ${this.timeoutRegistry.size}`,
        suggestedFix: 'Review components for missing clearTimeout calls',
        detectedAt: Date.now(),
      });
    }
  }

  private getCurrentMemorySnapshot(): MemorySnapshot {
    const memoryInfo = (performance as any).memory;
    
    return {
      timestamp: Date.now(),
      usedJSHeapSize: memoryInfo ? memoryInfo.usedJSHeapSize : 0,
      totalJSHeapSize: memoryInfo ? memoryInfo.totalJSHeapSize : 0,
      jsHeapSizeLimit: memoryInfo ? memoryInfo.jsHeapSizeLimit : 0,
      componentCount: this.getComponentCount(),
      listenerCount: this.listenerRegistry.size,
      intervalCount: this.intervalRegistry.size,
      timeoutCount: this.timeoutRegistry.size,
    };
  }

  private calculateMemoryTrend(): 'increasing' | 'stable' | 'decreasing' {
    if (this.snapshots.length < 5) return 'stable';

    const recent = this.snapshots.slice(-5);
    const first = recent[0].usedJSHeapSize;
    const last = recent[recent.length - 1].usedJSHeapSize;
    const change = last - first;
    const threshold = 1024 * 1024; // 1MB

    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
  }

  private getComponentCount(): number {
    // Estimate component count based on DOM elements with React properties
    return document.querySelectorAll('[data-reactroot], [data-react-*]').length;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const status = this.getCurrentMemorySnapshot();

    if (status.usedJSHeapSize > this.MEMORY_WARNING_THRESHOLD) {
      recommendations.push('Consider implementing more aggressive lazy loading');
      recommendations.push('Review large object caches and implement LRU eviction');
    }

    if (this.listenerRegistry.size > 50) {
      recommendations.push('Audit event listeners and ensure proper cleanup in useEffect');
    }

    if (this.intervalRegistry.size > 5) {
      recommendations.push('Review active intervals and timers for cleanup');
    }

    if (this.detectedLeaks.some(leak => leak.type === 'three.js')) {
      recommendations.push('Ensure Three.js geometries, materials, and textures are disposed properly');
    }

    return recommendations;
  }

  /**
   * Force garbage collection (Chrome DevTools)
   */
  public forceGarbageCollection(): void {
    if ((window as any).gc) {
      (window as any).gc();
      console.log('🗑️ Forced garbage collection');
    } else {
      console.warn('⚠️ Garbage collection not available (requires --enable-precise-memory-info flag)');
    }
  }

  /**
   * Clean up all resources and stop monitoring
   */
  public dispose(): void {
    this.stopMonitoring();
    this.performCleanup();
    this.snapshots.length = 0;
    this.detectedLeaks.length = 0;
    this.cleanupCallbacks.clear();
    this.listenerRegistry.clear();
    this.intervalRegistry.clear();
    this.timeoutRegistry.clear();
    this.observerRegistry.clear();
  }
}

/**
 * React Hook for memory management
 */
export const useMemoryManagement = (componentName: string) => {
  const detector = MemoryLeakDetector.getInstance();
  
  React.useEffect(() => {
    const cleanupId = `${componentName}-${Date.now()}`;
    
    // Register component cleanup
    detector.registerCleanup(
      cleanupId,
      () => {
        console.log(`🧹 Cleaning up ${componentName}`);
      },
      componentName,
      'component'
    );

    return () => {
      detector.unregisterCleanup(cleanupId);
    };
  }, [componentName, detector]);

  return {
    getStatus: () => detector.getMemoryStatus(),
    forceCleanup: () => detector.performCleanup(),
    generateReport: () => detector.generateMemoryReport(),
  };
};

/**
 * Memory-safe interval hook
 */
export const useMemorySafeInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = React.useRef<() => void>();
  const detector = MemoryLeakDetector.getInstance();

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      const cleanupId = `interval-${id}`;
      
      detector.registerCleanup(
        cleanupId,
        () => clearInterval(id),
        `useMemorySafeInterval-${delay}ms`,
        'component'
      );

      return () => {
        clearInterval(id);
        detector.unregisterCleanup(cleanupId);
      };
    }
  }, [delay, detector]);
};

/**
 * Memory-safe observer hook
 */
export const useMemorySafeObserver = <T extends { disconnect(): void }>(
  createObserver: () => T,
  dependencies: React.DependencyList
) => {
  const observerRef = React.useRef<T | null>(null);
  const detector = MemoryLeakDetector.getInstance();

  React.useEffect(() => {
    observerRef.current = createObserver();
    const observer = observerRef.current;
    const cleanupId = `observer-${Date.now()}`;

    detector.registerCleanup(
      cleanupId,
      () => observer?.disconnect(),
      'useMemorySafeObserver',
      'component'
    );

    return () => {
      observer?.disconnect();
      detector.unregisterCleanup(cleanupId);
      observerRef.current = null;
    };
  }, dependencies);

  return observerRef.current;
};

// Export singleton instance
export const memoryLeakDetector = MemoryLeakDetector.getInstance();