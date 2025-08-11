/**
 * Performance Monitoring System for RevEd Kids Frontend
 * Tracks Web Vitals, custom metrics, and performance budgets
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { getConfig, shouldLog } from '../config/environment';

interface PerformanceMetrics {
  // Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte

  // Custom Metrics
  componentLoadTimes: Map<string, number>;
  chunkLoadTimes: Map<string, number>;
  imageLoadTimes: Map<string, number>;
  audioLoadTimes: Map<string, number>;
  threeJsLoadTimes: Map<string, number>;
  
  // Memory Usage
  memoryUsage: {
    used: number;
    limit: number;
    percentage: number;
  } | null;

  // Network Information
  networkInfo: {
    type: string;
    downlink: number;
    effectiveType: string;
    rtt: number;
  } | null;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    componentLoadTimes: new Map(),
    chunkLoadTimes: new Map(),
    imageLoadTimes: new Map(),
    audioLoadTimes: new Map(),
    threeJsLoadTimes: new Map(),
    memoryUsage: null,
    networkInfo: null,
  };

  private observers: PerformanceObserver[] = [];
  private config = getConfig();
  private startTime = performance.now();

  constructor() {
    this.initializeWebVitals();
    this.initializeResourceObserver();
    this.initializeMemoryMonitoring();
    this.initializeNetworkMonitoring();
    this.initializeBudgetMonitoring();
  }

  private initializeWebVitals() {
    // Collect Web Vitals with new API
    onCLS(this.onMetric.bind(this));
    onINP(this.onMetric.bind(this)); // INP replaces FID
    onFCP(this.onMetric.bind(this));
    onLCP(this.onMetric.bind(this));
    onTTFB(this.onMetric.bind(this));
  }

  private onMetric(metric: Metric) {
    switch (metric.name) {
      case 'CLS':
        this.metrics.cls = metric.value;
        this.checkThreshold('cls', metric.value, this.config.performance.thresholds.cumulativeLayoutShift);
        break;
      case 'INP':
        this.metrics.fid = metric.value;
        this.checkThreshold('fid', metric.value, this.config.performance.thresholds.firstInputDelay);
        break;
      case 'FCP':
        this.metrics.fcp = metric.value;
        this.checkThreshold('fcp', metric.value, this.config.performance.thresholds.firstContentfulPaint);
        break;
      case 'LCP':
        this.metrics.lcp = metric.value;
        this.checkThreshold('lcp', metric.value, this.config.performance.thresholds.largestContentfulPaint);
        break;
      case 'TTFB':
        this.metrics.ttfb = metric.value;
        break;
    }

    this.sendMetricToAnalytics(metric);
  }

  private initializeResourceObserver() {
    if ('PerformanceObserver' in window) {
      // Resource loading observer
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.trackResourceLoad(entry as PerformanceResourceTiming);
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Navigation observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackNavigationTiming(entry as PerformanceNavigationTiming);
          }
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Paint observer
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPaintTiming(entry as PerformancePaintTiming);
        }
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    }
  }

  private trackResourceLoad(entry: PerformanceResourceTiming) {
    const name = entry.name;
    const loadTime = entry.responseEnd - entry.requestStart;

    if (name.includes('chunk') || name.includes('.js')) {
      this.metrics.chunkLoadTimes.set(name, loadTime);
      this.checkBudget('chunk', entry.transferSize || 0);
    } else if (name.includes('.png') || name.includes('.jpg') || name.includes('.webp')) {
      this.metrics.imageLoadTimes.set(name, loadTime);
      this.checkBudget('image', entry.transferSize || 0);
    } else if (name.includes('.mp3') || name.includes('.wav') || name.includes('.ogg')) {
      this.metrics.audioLoadTimes.set(name, loadTime);
      this.checkBudget('audio', entry.transferSize || 0);
    } else if (name.includes('.gltf') || name.includes('.glb') || name.includes('three')) {
      this.metrics.threeJsLoadTimes.set(name, loadTime);
    }

    if (shouldLog('debug')) {
      console.log(`📊 Resource loaded: ${name} in ${loadTime.toFixed(2)}ms`);
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming) {
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
    const loadComplete = entry.loadEventEnd - entry.loadEventStart;
    
    if (shouldLog('info')) {
      console.log('📊 Navigation Timing:', {
        domContentLoaded: `${domContentLoaded.toFixed(2)}ms`,
        loadComplete: `${loadComplete.toFixed(2)}ms`,
        dns: `${(entry.domainLookupEnd - entry.domainLookupStart).toFixed(2)}ms`,
        tcp: `${(entry.connectEnd - entry.connectStart).toFixed(2)}ms`,
        request: `${(entry.responseStart - entry.requestStart).toFixed(2)}ms`,
        response: `${(entry.responseEnd - entry.responseStart).toFixed(2)}ms`,
        processing: `${(entry.domComplete - (entry as any).domLoading).toFixed(2)}ms`,
      });
    }
  }

  private trackPaintTiming(entry: PerformancePaintTiming) {
    if (shouldLog('info')) {
      console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
    }
  }

  private initializeMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = {
          used: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        };

        // Alert on high memory usage
        if (this.metrics.memoryUsage.percentage > 85) {
          this.alertHighMemoryUsage(this.metrics.memoryUsage);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private initializeNetworkMonitoring() {
    if ('connection' in navigator) {
      const updateNetworkInfo = () => {
        const connection = (navigator as any).connection;
        this.metrics.networkInfo = {
          type: connection.type || 'unknown',
          downlink: connection.downlink || 0,
          effectiveType: connection.effectiveType || 'unknown',
          rtt: connection.rtt || 0,
        };
      };

      updateNetworkInfo();
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
    }
  }

  private initializeBudgetMonitoring() {
    // Check bundle size on load
    setTimeout(() => {
      this.checkBundleSize();
    }, 5000);
  }

  private checkThreshold(metric: string, value: number, threshold: number) {
    if (value > threshold) {
      console.warn(`⚠️ Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`);
      
      this.sendPerformanceAlert({
        type: 'threshold_exceeded',
        metric,
        value,
        threshold,
        timestamp: Date.now(),
      });
    }
  }

  private checkBudget(type: 'chunk' | 'image' | 'audio', size: number) {
    const budgets = this.config.performance.budgets;
    let budget: number;
    
    switch (type) {
      case 'chunk':
        budget = budgets.chunkSize * 1024 * 1024; // Convert MB to bytes
        break;
      case 'image':
        budget = budgets.imageSize * 1024; // Convert KB to bytes
        break;
      case 'audio':
        budget = budgets.audioSize * 1024; // Convert KB to bytes
        break;
    }

    if (size > budget) {
      console.warn(`⚠️ Size budget exceeded: ${type} = ${this.formatBytes(size)} (budget: ${this.formatBytes(budget)})`);
      
      this.sendPerformanceAlert({
        type: 'budget_exceeded',
        category: type,
        size,
        budget,
        timestamp: Date.now(),
      });
    }
  }

  private async checkBundleSize() {
    try {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsEntries = entries.filter(entry => entry.name.includes('.js'));
      
      let totalSize = 0;
      for (const entry of jsEntries) {
        totalSize += entry.transferSize || 0;
      }

      const budgetBytes = this.config.performance.budgets.bundleSize * 1024 * 1024;
      
      if (totalSize > budgetBytes) {
        console.warn(`⚠️ Bundle size budget exceeded: ${this.formatBytes(totalSize)} (budget: ${this.formatBytes(budgetBytes)})`);
        
        this.sendPerformanceAlert({
          type: 'bundle_size_exceeded',
          totalSize,
          budget: budgetBytes,
          timestamp: Date.now(),
        });
      }

      if (shouldLog('info')) {
        console.log(`📦 Total bundle size: ${this.formatBytes(totalSize)}`);
      }
    } catch (error) {
      console.error('Failed to check bundle size:', error);
    }
  }

  private alertHighMemoryUsage(memoryInfo: NonNullable<PerformanceMetrics['memoryUsage']>) {
    console.warn(`⚠️ High memory usage: ${memoryInfo.percentage.toFixed(1)}%`);
    
    this.sendPerformanceAlert({
      type: 'high_memory_usage',
      percentage: memoryInfo.percentage,
      used: memoryInfo.used,
      limit: memoryInfo.limit,
      timestamp: Date.now(),
    });
  }

  private sendMetricToAnalytics(metric: Metric) {
    if (this.config.analyticsId) {
      // Send to your analytics platform
      if (shouldLog('debug')) {
        console.log('📊 Sending metric to analytics:', metric);
      }
    }
  }

  private sendPerformanceAlert(alert: any) {
    if (this.config.sentryDsn) {
      // Send to error tracking (Sentry, etc.)
      if (shouldLog('debug')) {
        console.log('🚨 Sending performance alert:', alert);
      }
    }
  }

  // Public methods
  public trackComponentLoad(componentName: string) {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      this.metrics.componentLoadTimes.set(componentName, loadTime);
      
      if (shouldLog('debug')) {
        console.log(`🧩 Component loaded: ${componentName} in ${loadTime.toFixed(2)}ms`);
      }
    };
  }

  public markMilestone(name: string) {
    performance.mark(name);
    const currentTime = performance.now();
    
    if (shouldLog('debug')) {
      console.log(`🏁 Milestone: ${name} at ${(currentTime - this.startTime).toFixed(2)}ms`);
    }
  }

  public measureUserTiming(name: string, startMark: string, endMark?: string) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (shouldLog('debug')) {
        console.log(`⏱️ Measurement: ${name} = ${measure.duration.toFixed(2)}ms`);
      }
      
      return measure.duration;
    } catch (error) {
      console.error(`Failed to measure ${name}:`, error);
      return 0;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public generateReport(): string {
    const metrics = this.getMetrics();
    const report = [
      '📊 Performance Report',
      '==================',
      '',
      'Web Vitals:',
      `  FCP: ${metrics.fcp?.toFixed(2) || 'N/A'}ms`,
      `  LCP: ${metrics.lcp?.toFixed(2) || 'N/A'}ms`,
      `  FID: ${metrics.fid?.toFixed(2) || 'N/A'}ms`,
      `  CLS: ${metrics.cls?.toFixed(3) || 'N/A'}`,
      `  TTFB: ${metrics.ttfb?.toFixed(2) || 'N/A'}ms`,
      '',
      'Memory Usage:',
      metrics.memoryUsage 
        ? `  ${this.formatBytes(metrics.memoryUsage.used)} / ${this.formatBytes(metrics.memoryUsage.limit)} (${metrics.memoryUsage.percentage.toFixed(1)}%)`
        : '  Not available',
      '',
      'Network:',
      metrics.networkInfo
        ? `  Type: ${metrics.networkInfo.type}, Speed: ${metrics.networkInfo.downlink}Mbps, RTT: ${metrics.networkInfo.rtt}ms`
        : '  Not available',
      '',
      `Components Loaded: ${metrics.componentLoadTimes.size}`,
      `Chunks Loaded: ${metrics.chunkLoadTimes.size}`,
      `Images Loaded: ${metrics.imageLoadTimes.size}`,
      `Audio Files Loaded: ${metrics.audioLoadTimes.size}`,
      `Three.js Assets Loaded: ${metrics.threeJsLoadTimes.size}`,
    ];

    return report.join('\n');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor && getConfig().enablePerformanceMonitoring) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor!;
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (performanceMonitor) {
      performanceMonitor.cleanup();
    }
  });
}