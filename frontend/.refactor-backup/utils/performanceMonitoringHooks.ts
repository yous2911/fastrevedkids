/**
 * Performance Monitoring Hooks
 * Provides utilities for monitoring and tracking performance metrics
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  eventLatency: number;
}

export interface PerformanceThresholds {
  minFPS: number;
  maxMemoryUsage: number;
  maxLoadTime: number;
  maxRenderTime: number;
  maxEventLatency: number;
}

class PerformanceMonitoring {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = {
    minFPS: 30,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxLoadTime: 3000, // 3 seconds
    maxRenderTime: 16, // 16ms for 60fps
    maxEventLatency: 100 // 100ms
  };
  private listeners: Array<(metrics: PerformanceMetrics) => void> = [];

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metric));
  }

  getLatestMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        fps: acc.fps + metric.fps,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        loadTime: acc.loadTime + metric.loadTime,
        renderTime: acc.renderTime + metric.renderTime,
        eventLatency: acc.eventLatency + metric.eventLatency
      }),
      { fps: 0, memoryUsage: 0, loadTime: 0, renderTime: 0, eventLatency: 0 }
    );

    const count = this.metrics.length;
    return {
      fps: totals.fps / count,
      memoryUsage: totals.memoryUsage / count,
      loadTime: totals.loadTime / count,
      renderTime: totals.renderTime / count,
      eventLatency: totals.eventLatency / count
    };
  }

  checkThresholds(metric: PerformanceMetrics): { 
    isHealthy: boolean; 
    issues: string[] 
  } {
    const issues: string[] = [];

    if (metric.fps < this.thresholds.minFPS) {
      issues.push(`Low FPS: ${metric.fps} (min: ${this.thresholds.minFPS})`);
    }

    if (metric.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${Math.round(metric.memoryUsage / 1024 / 1024)}MB`);
    }

    if (metric.loadTime > this.thresholds.maxLoadTime) {
      issues.push(`Slow load time: ${metric.loadTime}ms`);
    }

    if (metric.renderTime > this.thresholds.maxRenderTime) {
      issues.push(`Slow render time: ${metric.renderTime}ms`);
    }

    if (metric.eventLatency > this.thresholds.maxEventLatency) {
      issues.push(`High event latency: ${metric.eventLatency}ms`);
    }

    return {
      isHealthy: issues.length === 0,
      issues
    };
  }

  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  registerCallback(name: string, callback: (data: any) => void): void {
    // For backwards compatibility - map to subscribe
    this.subscribe(callback);
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getCurrentPerformanceInfo(): PerformanceMetrics {
    const now = performance.now();
    
    // Get memory info if available
    let memoryUsage = 0;
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // Estimate FPS from recent frame timings
    let fps = 60; // Default assumption
    if ('getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      if (paintEntries.length > 0) {
        // Simple FPS estimation based on paint timing
        const lastPaint = paintEntries[paintEntries.length - 1];
        if (lastPaint.startTime > 0) {
          fps = Math.min(60, Math.max(1, 1000 / (now - lastPaint.startTime)));
        }
      }
    }

    return {
      fps,
      memoryUsage,
      loadTime: now,
      renderTime: 16, // Assumed 16ms for 60fps
      eventLatency: 0 // Would need to be measured per event
    };
  }
}

// Singleton instance
export const performanceMonitoring = new PerformanceMonitoring();

// Helper hooks for React components
export const usePerformanceMonitoring = () => {
  const recordMetric = (metric: PerformanceMetrics) => {
    performanceMonitoring.recordMetric(metric);
  };

  const getMetrics = () => {
    return performanceMonitoring.getLatestMetrics();
  };

  const subscribe = (listener: (metrics: PerformanceMetrics) => void) => {
    return performanceMonitoring.subscribe(listener);
  };

  return {
    recordMetric,
    getMetrics,
    subscribe,
    getCurrentInfo: performanceMonitoring.getCurrentPerformanceInfo.bind(performanceMonitoring)
  };
};