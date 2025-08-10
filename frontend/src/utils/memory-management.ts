/**
 * Memory Management and Leak Prevention for RevEd Kids Frontend
 * Provides hooks, utilities, and monitoring for React components
 */

import { useEffect, useRef, useCallback } from 'react';
import { getErrorTracker } from './error-tracking';
import { shouldLog } from '../config/environment';

// Memory tracking interface
interface MemoryTracker {
  componentName: string;
  mountTime: number;
  peakMemory: number;
  currentMemory: number;
  leaks: string[];
  timers: Set<NodeJS.Timeout>;
  intervals: Set<NodeJS.Timeout>;
  eventListeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }>;
  subscriptions: Set<() => void>;
  abortControllers: Set<AbortController>;
}

// Global memory tracker
const memoryTrackers = new Map<string, MemoryTracker>();

// Memory monitoring
class MemoryMonitor {
  private static instance: MemoryMonitor;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private memoryHistory: Array<{ timestamp: number; used: number }> = [];
  private maxHistorySize = 100;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 10000); // Check every 10 seconds

    if (shouldLog('info')) {
      console.log('🧠 Memory monitoring started');
    }
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;

    if (shouldLog('info')) {
      console.log('🧠 Memory monitoring stopped');
    }
  }

  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize;
      const limit = memory.jsHeapSizeLimit;
      const percentage = (used / limit) * 100;

      this.memoryHistory.push({
        timestamp: Date.now(),
        used,
      });

      // Keep history within limit
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory.shift();
      }

      // Check for memory leaks
      this.detectMemoryLeaks();

      // Alert on high memory usage
      if (percentage > 85) {
        this.handleHighMemoryUsage(used, limit, percentage);
      }

      if (shouldLog('debug')) {
        console.log(`🧠 Memory usage: ${this.formatBytes(used)} / ${this.formatBytes(limit)} (${percentage.toFixed(1)}%)`);
      }
    }
  }

  private detectMemoryLeaks(): void {
    if (this.memoryHistory.length < 10) return;

    const recent = this.memoryHistory.slice(-10);
    const trend = this.calculateMemoryTrend(recent);

    // If memory is consistently increasing, it might be a leak
    if (trend > 0.1) { // 10% increase trend
      const suspiciousComponents = this.findSuspiciousComponents();
      
      if (suspiciousComponents.length > 0) {
        this.reportMemoryLeak(suspiciousComponents, trend);
      }
    }
  }

  private calculateMemoryTrend(history: Array<{ timestamp: number; used: number }>): number {
    if (history.length < 2) return 0;

    const first = history[0].used;
    const last = history[history.length - 1].used;
    
    return (last - first) / first;
  }

  private findSuspiciousComponents(): string[] {
    const suspicious: string[] = [];
    const now = Date.now();

    for (const [componentName, tracker] of memoryTrackers) {
      const age = now - tracker.mountTime;
      
      // Component has been mounted for more than 5 minutes and has leaks
      if (age > 5 * 60 * 1000 && tracker.leaks.length > 0) {
        suspicious.push(componentName);
      }
    }

    return suspicious;
  }

  private handleHighMemoryUsage(used: number, limit: number, percentage: number): void {
    console.warn(`⚠️ High memory usage detected: ${percentage.toFixed(1)}%`);
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('🗑️ Forced garbage collection');
    }

    // Report to error tracking
    getErrorTracker().captureMessage(
      `High memory usage: ${this.formatBytes(used)} (${percentage.toFixed(1)}%)`,
      'warning',
      {
        component: 'MemoryMonitor',
        metadata: { used, limit, percentage },
        timestamp: Date.now(),
      }
    );
  }

  private reportMemoryLeak(components: string[], trend: number): void {
    const message = `Potential memory leak detected in components: ${components.join(', ')} (trend: ${(trend * 100).toFixed(1)}%)`;
    
    console.warn('🔍 ' + message);
    
    getErrorTracker().captureMessage(message, 'warning', {
      component: 'MemoryLeakDetector',
      metadata: { components, trend },
      timestamp: Date.now(),
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMemoryReport(): {
    current: number;
    history: Array<{ timestamp: number; used: number }>;
    trackedComponents: number;
    suspiciousComponents: string[];
  } {
    const current = 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0;
    
    return {
      current,
      history: [...this.memoryHistory],
      trackedComponents: memoryTrackers.size,
      suspiciousComponents: this.findSuspiciousComponents(),
    };
  }
}

// React Hooks for memory management

/**
 * Hook to track and prevent memory leaks in components
 */
export const useMemoryTracker = (componentName: string) => {
  const trackerId = `${componentName}_${Date.now()}_${Math.random()}`;
  
  useEffect(() => {
    const tracker: MemoryTracker = {
      componentName,
      mountTime: Date.now(),
      peakMemory: 0,
      currentMemory: 0,
      leaks: [],
      timers: new Set(),
      intervals: new Set(),
      eventListeners: [],
      subscriptions: new Set(),
      abortControllers: new Set(),
    };

    memoryTrackers.set(trackerId, tracker);

    if (shouldLog('debug')) {
      console.log(`🧠 Memory tracker started for ${componentName}`);
    }

    return () => {
      const tracker = memoryTrackers.get(trackerId);
      if (tracker) {
        // Check for uncleaned resources
        if (tracker.timers.size > 0) {
          tracker.leaks.push(`${tracker.timers.size} uncleaned timers`);
        }
        if (tracker.intervals.size > 0) {
          tracker.leaks.push(`${tracker.intervals.size} uncleaned intervals`);
        }
        if (tracker.eventListeners.length > 0) {
          tracker.leaks.push(`${tracker.eventListeners.length} uncleaned event listeners`);
        }
        if (tracker.subscriptions.size > 0) {
          tracker.leaks.push(`${tracker.subscriptions.size} uncleaned subscriptions`);
        }

        // Report leaks
        if (tracker.leaks.length > 0) {
          console.warn(`🔍 Memory leaks detected in ${componentName}:`, tracker.leaks);
          
          getErrorTracker().captureMessage(
            `Memory leaks in ${componentName}: ${tracker.leaks.join(', ')}`,
            'warning',
            {
              component: componentName,
              metadata: { leaks: tracker.leaks },
              timestamp: Date.now(),
            }
          );
        }

        memoryTrackers.delete(trackerId);
      }

      if (shouldLog('debug')) {
        console.log(`🧠 Memory tracker cleaned for ${componentName}`);
      }
    };
  }, [componentName, trackerId]);

  return {
    trackTimer: (timer: NodeJS.Timeout) => {
      const tracker = memoryTrackers.get(trackerId);
      if (tracker) {
        tracker.timers.add(timer);
        return () => {
          clearTimeout(timer);
          tracker.timers.delete(timer);
        };
      }
      return () => clearTimeout(timer);
    },
    
    trackInterval: (interval: NodeJS.Timeout) => {
      const tracker = memoryTrackers.get(trackerId);
      if (tracker) {
        tracker.intervals.add(interval);
        return () => {
          clearInterval(interval);
          tracker.intervals.delete(interval);
        };
      }
      return () => clearInterval(interval);
    },
    
    trackEventListener: (
      element: EventTarget,
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      const tracker = memoryTrackers.get(trackerId);
      if (tracker) {
        element.addEventListener(event, handler, options);
        tracker.eventListeners.push({ element, event, handler, options });
        
        return () => {
          element.removeEventListener(event, handler, options);
          const index = tracker.eventListeners.findIndex(
            l => l.element === element && l.event === event && l.handler === handler
          );
          if (index >= 0) {
            tracker.eventListeners.splice(index, 1);
          }
        };
      }
      
      element.addEventListener(event, handler, options);
      return () => element.removeEventListener(event, handler, options);
    },
    
    trackSubscription: (unsubscribe: () => void) => {
      const tracker = memoryTrackers.get(trackerId);
      if (tracker) {
        tracker.subscriptions.add(unsubscribe);
        return () => {
          unsubscribe();
          tracker.subscriptions.delete(unsubscribe);
        };
      }
      return unsubscribe;
    },
    
    trackAbortController: (controller: AbortController) => {
      const tracker = memoryTrackers.get(trackerId);
      if (tracker) {
        tracker.abortControllers.add(controller);
        return () => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
          tracker.abortControllers.delete(controller);
        };
      }
      return () => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      };
    },
  };
};

/**
 * Hook for safe setTimeout with automatic cleanup
 */
export const useSafeTimeout = () => {
  const { trackTimer } = useMemoryTracker('SafeTimeout');
  
  return useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay);
    return trackTimer(timer);
  }, [trackTimer]);
};

/**
 * Hook for safe setInterval with automatic cleanup
 */
export const useSafeInterval = () => {
  const { trackInterval } = useMemoryTracker('SafeInterval');
  
  return useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    return trackInterval(interval);
  }, [trackInterval]);
};

/**
 * Hook for safe event listeners with automatic cleanup
 */
export const useSafeEventListener = () => {
  const { trackEventListener } = useMemoryTracker('SafeEventListener');
  
  return useCallback((
    element: EventTarget | null,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    if (!element) return () => {};
    return trackEventListener(element, event, handler, options);
  }, [trackEventListener]);
};

/**
 * Hook for safe fetch requests with automatic abort
 */
export const useSafeFetch = () => {
  const { trackAbortController } = useMemoryTracker('SafeFetch');
  
  return useCallback(async (url: string, init?: RequestInit) => {
    const controller = new AbortController();
    const cleanup = trackAbortController(controller);
    
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch request was aborted');
      }
      throw error;
    } finally {
      cleanup();
    }
  }, [trackAbortController]);
};

/**
 * Hook to prevent memory leaks with Three.js objects
 */
export const useThreeJSMemoryManagement = () => {
  const disposableObjects = useRef<Array<{ dispose?: () => void }>>([]);
  
  const registerDisposable = useCallback((object: { dispose?: () => void }) => {
    disposableObjects.current.push(object);
    return object;
  }, []);
  
  useEffect(() => {
    return () => {
      // Dispose all registered Three.js objects
      disposableObjects.current.forEach(obj => {
        try {
          obj.dispose?.();
        } catch (error) {
          console.warn('Failed to dispose Three.js object:', error);
        }
      });
      disposableObjects.current = [];
    };
  }, []);
  
  return { registerDisposable };
};

/**
 * Hook for debounced values with cleanup
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  const setSafeTimeout = useSafeTimeout();
  
  useEffect(() => {
    const cleanup = setSafeTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return cleanup;
  }, [value, delay, setSafeTimeout]);
  
  return debouncedValue;
};

/**
 * Initialize memory monitoring
 */
export const initializeMemoryMonitoring = (): void => {
  const monitor = MemoryMonitor.getInstance();
  monitor.startMonitoring();
  
  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      monitor.stopMonitoring();
    });
  }
};

/**
 * Get memory monitoring report
 */
export const getMemoryReport = () => {
  return MemoryMonitor.getInstance().getMemoryReport();
};

/**
 * Force garbage collection (if available)
 */
export const forceGarbageCollection = (): void => {
  if ('gc' in window && typeof (window as any).gc === 'function') {
    (window as any).gc();
    console.log('🗑️ Forced garbage collection');
  } else {
    console.warn('Garbage collection not available');
  }
};

// React component wrapper for automatic memory tracking
export const withMemoryTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const TrackedComponent = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
    useMemoryTracker(name);
    
    return <Component {...props} ref={ref} />;
  });
  
  TrackedComponent.displayName = `withMemoryTracking(${componentName || Component.displayName || Component.name})`;
  
  return TrackedComponent;
};

// Export singleton instance
export const memoryMonitor = MemoryMonitor.getInstance();

// Import React for hooks
import React from 'react';