/**
 * Component Load Time Monitor
 * Comprehensive monitoring of component loading, rendering, and performance metrics
 */

import React from 'react';
import { analytics } from './analyticsSystem';
import { crossDeviceTracker } from './crossDevicePerformanceTracker';

// Load time monitoring interfaces
interface ComponentLoadMetrics {
  componentName: string;
  loadStartTime: number;
  loadEndTime: number;
  totalLoadTime: number;
  phases: LoadPhase[];
  dependencies: DependencyMetric[];
  cacheStatus: CacheMetric;
  renderMetrics: RenderMetric;
  resourceMetrics: ResourceMetric[];
  errorsDuringLoad: LoadError[];
  userPerceptionScore: number; // 0-100 perceived performance
  deviceOptimized: boolean;
}

interface LoadPhase {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  blocking: boolean;
  critical: boolean;
  resources?: string[];
}

interface DependencyMetric {
  name: string;
  type: 'script' | 'style' | 'image' | 'font' | 'component' | 'api';
  size: number;
  loadTime: number;
  cached: boolean;
  blocking: boolean;
  critical: boolean;
  source: 'local' | 'cdn' | 'external';
}

interface CacheMetric {
  hit: boolean;
  strategy: 'memory' | 'disk' | 'network' | 'service-worker';
  freshness: 'fresh' | 'stale' | 'expired';
  bytesSaved: number;
  timeSaved: number;
}

interface RenderMetric {
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  renderBlockingResources: string[];
  criticalRenderingPath: number;
  reflows: number;
  repaints: number;
}

interface ResourceMetric {
  name: string;
  type: string;
  size: number;
  transferSize: number;
  duration: number;
  startTime: number;
  responseStart: number;
  responseEnd: number;
  fromCache: boolean;
  protocol: string;
}

interface LoadError {
  phase: string;
  error: string;
  impact: 'low' | 'medium' | 'high';
  recovery: 'automatic' | 'manual' | 'none';
}

interface ComponentLoadAnalytics {
  componentMetrics: Map<string, ComponentLoadMetrics[]>;
  performanceDistribution: {
    fast: number;    // <100ms
    medium: number;  // 100-300ms
    slow: number;    // >300ms
  };
  averageLoadTimes: Record<string, number>;
  bottlenecks: LoadBottleneck[];
  deviceSpecificMetrics: Map<string, ComponentLoadMetrics[]>;
  optimizationOpportunities: OptimizationOpportunity[];
  loadTimeHistogram: number[];
  userExperienceImpact: UserExperienceMetric[];
}

interface LoadBottleneck {
  componentName: string;
  bottleneckType: 'network' | 'rendering' | 'javascript' | 'dependency';
  phase: string;
  duration: number;
  frequency: number;
  impact: number;
  recommendation: string;
}

interface OptimizationOpportunity {
  type: 'code-splitting' | 'lazy-loading' | 'caching' | 'preloading' | 'compression';
  components: string[];
  potentialSavings: number;
  complexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  description: string;
}

interface UserExperienceMetric {
  componentName: string;
  perceivedPerformance: number;
  userSatisfaction: number;
  bounceRateImpact: number;
  conversionImpact: number;
}

// Main component load time monitor
class ComponentLoadTimeMonitor {
  private loadMetrics: Map<string, ComponentLoadMetrics[]> = new Map();
  private activeLoads: Map<string, Partial<ComponentLoadMetrics>> = new Map();
  private performanceObserver: PerformanceObserver | null = null;
  private resourceObserver: PerformanceObserver | null = null;
  private navigationObserver: PerformanceObserver | null = null;
  private loadTimeThresholds = {
    fast: 100,      // <100ms is fast
    medium: 300,    // 100-300ms is medium
    slow: 300       // >300ms is slow
  };

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.setupPerformanceObservers();
    this.setupResourceMonitoring();
    this.setupNavigationTiming();
    this.setupCacheMonitoring();
    
    console.log('📊 Component load time monitor initialized');
  }

  private setupPerformanceObservers() {
    if ('PerformanceObserver' in window) {
      // Paint timing observer
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processPaintEntry(entry as PerformanceEntry);
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['paint', 'measure', 'mark'] });
      } catch (error) {
        console.warn('Performance Observer setup failed:', error);
      }

      // Resource timing observer
      this.resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processResourceEntry(entry as PerformanceResourceTiming);
        });
      });

      try {
        this.resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource Observer setup failed:', error);
      }

      // Navigation timing observer
      this.navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processNavigationEntry(entry as PerformanceNavigationTiming);
        });
      });

      try {
        this.navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Navigation Observer setup failed:', error);
      }
    }
  }

  private setupResourceMonitoring() {
    // Monitor script loading
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(document, tagName);
      
      if (tagName.toLowerCase() === 'script') {
        const script = element as HTMLScriptElement;
        const originalOnLoad = script.onload;
        const originalOnError = script.onerror;
        
        script.onload = function(event) {
          // Track successful script load
          if (originalOnLoad) originalOnLoad.call(script, event);
        };
        
        script.onerror = function(event) {
          // Track script load error
          if (originalOnError) originalOnError.call(script, event);
        };
      }
      
      return element;
    };
  }

  private setupNavigationTiming() {
    // Track page navigation performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPageLoadMetrics(navigation);
        }
      }, 100);
    });
  }

  private setupCacheMonitoring() {
    // Monitor cache effectiveness
    if ('caches' in window) {
      // Track cache hits/misses for service worker caches
    }
  }

  // Public methods for component load tracking
  public startLoadTracking(componentName: string, options: {
    critical?: boolean;
    lazy?: boolean;
    dependencies?: string[];
  } = {}) {
    const startTime = performance.now();
    
    const loadMetric: Partial<ComponentLoadMetrics> = {
      componentName,
      loadStartTime: startTime,
      phases: [{
        name: 'initialization',
        startTime,
        endTime: 0,
        duration: 0,
        blocking: !options.lazy,
        critical: options.critical || false,
        resources: options.dependencies
      }],
      dependencies: [],
      resourceMetrics: [],
      errorsDuringLoad: [],
      deviceOptimized: this.isDeviceOptimized()
    };

    this.activeLoads.set(componentName, loadMetric);
    
    // Mark performance timeline
    performance.mark(`${componentName}-load-start`);
    
    return {
      endPhase: (phaseName: string) => this.endLoadPhase(componentName, phaseName),
      addDependency: (dep: Partial<DependencyMetric>) => this.addDependency(componentName, dep),
      reportError: (error: Partial<LoadError>) => this.reportLoadError(componentName, error),
      completeLoad: () => this.completeLoadTracking(componentName)
    };
  }

  public completeLoadTracking(componentName: string) {
    const activeLoad = this.activeLoads.get(componentName);
    if (!activeLoad || !activeLoad.loadStartTime) return;

    const endTime = performance.now();
    const totalLoadTime = endTime - activeLoad.loadStartTime;
    
    // Mark performance timeline
    performance.mark(`${componentName}-load-end`);
    performance.measure(`${componentName}-load`, `${componentName}-load-start`, `${componentName}-load-end`);
    
    // Complete the load metric
    const completeMetric: ComponentLoadMetrics = {
      ...activeLoad as ComponentLoadMetrics,
      loadEndTime: endTime,
      totalLoadTime,
      cacheStatus: this.getCacheStatus(componentName),
      renderMetrics: this.getRenderMetrics(componentName),
      userPerceptionScore: this.calculateUserPerceptionScore(totalLoadTime, activeLoad.phases || [])
    };

    // Store metrics
    const existing = this.loadMetrics.get(componentName) || [];
    existing.push(completeMetric);
    this.loadMetrics.set(componentName, existing.slice(-50)); // Keep last 50 loads
    
    // Clean up active load
    this.activeLoads.delete(componentName);
    
    // Send to analytics
    this.sendLoadMetricsToAnalytics(completeMetric);
    
    console.log(`📊 Component ${componentName} loaded in ${totalLoadTime.toFixed(2)}ms`);
  }

  private endLoadPhase(componentName: string, phaseName: string) {
    const activeLoad = this.activeLoads.get(componentName);
    if (!activeLoad || !activeLoad.phases) return;

    const currentPhase = activeLoad.phases.find(p => p.name === phaseName && p.endTime === 0);
    if (currentPhase) {
      const endTime = performance.now();
      currentPhase.endTime = endTime;
      currentPhase.duration = endTime - currentPhase.startTime;
    }
  }

  private addDependency(componentName: string, dependency: Partial<DependencyMetric>) {
    const activeLoad = this.activeLoads.get(componentName);
    if (!activeLoad) return;

    if (!activeLoad.dependencies) activeLoad.dependencies = [];
    
    const completeDep: DependencyMetric = {
      name: dependency.name || 'unknown',
      type: dependency.type || 'component',
      size: dependency.size || 0,
      loadTime: dependency.loadTime || 0,
      cached: dependency.cached || false,
      blocking: dependency.blocking || false,
      critical: dependency.critical || false,
      source: dependency.source || 'local'
    };

    activeLoad.dependencies.push(completeDep);
  }

  private reportLoadError(componentName: string, error: Partial<LoadError>) {
    const activeLoad = this.activeLoads.get(componentName);
    if (!activeLoad) return;

    if (!activeLoad.errorsDuringLoad) activeLoad.errorsDuringLoad = [];
    
    activeLoad.errorsDuringLoad.push({
      phase: error.phase || 'unknown',
      error: error.error || 'Unknown error',
      impact: error.impact || 'medium',
      recovery: error.recovery || 'none'
    });
  }

  // Performance observers processing
  private processPaintEntry(entry: PerformanceEntry) {
    // Process paint timing entries for render metrics
    if (entry.name === 'first-paint' || entry.name === 'first-contentful-paint') {
      // Update active loads with paint timing data
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming) {
    const resourceMetric: ResourceMetric = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      size: entry.transferSize || entry.decodedBodySize || 0,
      transferSize: entry.transferSize || 0,
      duration: entry.duration,
      startTime: entry.startTime,
      responseStart: entry.responseStart,
      responseEnd: entry.responseEnd,
      fromCache: entry.transferSize === 0 && entry.decodedBodySize > 0,
      protocol: this.extractProtocol(entry.name)
    };

    // Associate with active loads
    this.activeLoads.forEach((load, componentName) => {
      if (load.resourceMetrics && this.isResourceRelated(entry.name, componentName)) {
        load.resourceMetrics.push(resourceMetric);
      }
    });
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    // Process navigation timing for overall page performance
    this.trackNavigationMetrics(entry);
  }

  // Metrics calculation methods
  private getCacheStatus(componentName: string): CacheMetric {
    // Analyze cache effectiveness for the component
    const resourceMetrics = this.activeLoads.get(componentName)?.resourceMetrics || [];
    const cachedResources = resourceMetrics.filter(r => r.fromCache);
    
    return {
      hit: cachedResources.length > 0,
      strategy: cachedResources.length > 0 ? 'memory' : 'network',
      freshness: 'fresh',
      bytesSaved: cachedResources.reduce((sum, r) => sum + r.size, 0),
      timeSaved: cachedResources.reduce((sum, r) => sum + r.duration, 0)
    };
  }

  private getRenderMetrics(componentName: string): RenderMetric {
    // Get paint and render metrics for the component
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(e => e.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(e => e.name === 'first-contentful-paint');
    
    return {
      firstPaint: firstPaint?.startTime || 0,
      firstContentfulPaint: firstContentfulPaint?.startTime || 0,
      largestContentfulPaint: this.getLCP(),
      firstInputDelay: this.getFID(),
      cumulativeLayoutShift: this.getCLS(),
      renderBlockingResources: this.getRenderBlockingResources(),
      criticalRenderingPath: this.calculateCriticalRenderingPath(),
      reflows: 0, // Would need more sophisticated tracking
      repaints: 0 // Would need more sophisticated tracking
    };
  }

  private calculateUserPerceptionScore(loadTime: number, phases: LoadPhase[]): number {
    let score = 100;
    
    // Penalize based on total load time
    if (loadTime > 100) score -= Math.min(50, (loadTime - 100) / 10);
    
    // Penalize for blocking phases
    const blockingTime = phases.filter(p => p.blocking).reduce((sum, p) => sum + p.duration, 0);
    if (blockingTime > 50) score -= Math.min(25, (blockingTime - 50) / 5);
    
    // Bonus for caching
    const activeLoad = Array.from(this.activeLoads.values())[0];
    if (activeLoad?.cacheStatus?.hit) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private sendLoadMetricsToAnalytics(metric: ComponentLoadMetrics) {
    analytics.trackLoadTime(metric.componentName, metric.totalLoadTime, {
      phases: metric.phases,
      dependencies: metric.dependencies.length,
      cached: metric.cacheStatus.hit,
      userPerceptionScore: metric.userPerceptionScore,
      deviceOptimized: metric.deviceOptimized,
      renderMetrics: metric.renderMetrics,
      errorCount: metric.errorsDuringLoad.length,
      deviceType: crossDeviceTracker.getCurrentDeviceProfile()?.hardware.deviceType,
      performanceTier: crossDeviceTracker.getCurrentDeviceProfile()?.capabilities.performanceTier
    });
  }

  // Analytics and reporting methods
  public getComponentLoadAnalytics(): ComponentLoadAnalytics {
    const allMetrics = Array.from(this.loadMetrics.values()).flat();
    
    return {
      componentMetrics: this.loadMetrics,
      performanceDistribution: this.calculatePerformanceDistribution(allMetrics),
      averageLoadTimes: this.calculateAverageLoadTimes(),
      bottlenecks: this.identifyBottlenecks(),
      deviceSpecificMetrics: this.groupByDevice(),
      optimizationOpportunities: this.identifyOptimizationOpportunities(),
      loadTimeHistogram: this.createLoadTimeHistogram(allMetrics),
      userExperienceImpact: this.calculateUserExperienceImpact()
    };
  }

  public getComponentMetrics(componentName: string): ComponentLoadMetrics[] {
    return this.loadMetrics.get(componentName) || [];
  }

  public getSlowComponents(threshold = 300): Array<{name: string; averageLoadTime: number}> {
    const averages = this.calculateAverageLoadTimes();
    
    return Object.entries(averages)
      .filter(([, time]) => time > threshold)
      .map(([name, time]) => ({ name, averageLoadTime: time }))
      .sort((a, b) => b.averageLoadTime - a.averageLoadTime);
  }

  public getOptimizationRecommendations(componentName?: string): OptimizationOpportunity[] {
    const opportunities = this.identifyOptimizationOpportunities();
    
    if (componentName) {
      return opportunities.filter(opp => opp.components.includes(componentName));
    }
    
    return opportunities;
  }

  // Helper methods
  private isDeviceOptimized(): boolean {
    const profile = crossDeviceTracker.getCurrentDeviceProfile();
    return profile?.capabilities.performanceTier !== 'low';
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'style';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.gif')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private extractProtocol(url: string): string {
    try {
      return new URL(url).protocol;
    } catch {
      return 'unknown';
    }
  }

  private isResourceRelated(resourceUrl: string, componentName: string): boolean {
    // Simple heuristic - would be enhanced with actual component-resource mapping
    return resourceUrl.toLowerCase().includes(componentName.toLowerCase()) ||
           resourceUrl.includes('chunk') ||
           resourceUrl.includes('bundle');
  }

  private trackPageLoadMetrics(navigation: PerformanceNavigationTiming) {
    analytics.track('load_time', 'general', 'page_load', undefined, navigation.loadEventEnd, {
      domContentLoaded: navigation.domContentLoadedEventEnd,
      domInteractive: navigation.domInteractive,
      domComplete: navigation.domComplete,
      loadEventStart: navigation.loadEventStart,
      loadEventEnd: navigation.loadEventEnd,
      transferSize: navigation.transferSize,
      type: navigation.type
    });
  }

  private trackNavigationMetrics(navigation: PerformanceNavigationTiming) {
    // Track detailed navigation timing
    const metrics = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      processing: navigation.loadEventStart - navigation.responseEnd,
      load: navigation.loadEventEnd - navigation.loadEventStart
    };

    analytics.track('performance_metric', 'general', 'navigation_timing', undefined, undefined, metrics);
  }

  private calculatePerformanceDistribution(metrics: ComponentLoadMetrics[]) {
    const total = metrics.length;
    if (total === 0) return { fast: 0, medium: 0, slow: 0 };

    const fast = metrics.filter(m => m.totalLoadTime < this.loadTimeThresholds.fast).length;
    const slow = metrics.filter(m => m.totalLoadTime > this.loadTimeThresholds.slow).length;
    const medium = total - fast - slow;

    return {
      fast: fast / total,
      medium: medium / total,
      slow: slow / total
    };
  }

  private calculateAverageLoadTimes(): Record<string, number> {
    const averages: Record<string, number> = {};
    
    this.loadMetrics.forEach((metrics, componentName) => {
      const totalTime = metrics.reduce((sum, m) => sum + m.totalLoadTime, 0);
      averages[componentName] = totalTime / metrics.length;
    });
    
    return averages;
  }

  private identifyBottlenecks(): LoadBottleneck[] {
    const bottlenecks: LoadBottleneck[] = [];
    
    this.loadMetrics.forEach((metrics, componentName) => {
      const averageLoadTime = metrics.reduce((sum, m) => sum + m.totalLoadTime, 0) / metrics.length;
      
      if (averageLoadTime > this.loadTimeThresholds.slow) {
        // Analyze phases to find bottlenecks
        const phaseAnalysis = this.analyzePhaseBottlenecks(metrics);
        phaseAnalysis.forEach(bottleneck => {
          bottlenecks.push({
            componentName,
            ...bottleneck
          });
        });
      }
    });
    
    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  private analyzePhaseBottlenecks(metrics: ComponentLoadMetrics[]) {
    // Analyze which phases are consistently slow
    return []; // Implementation would analyze phase durations
  }

  private groupByDevice(): Map<string, ComponentLoadMetrics[]> {
    const deviceMetrics = new Map<string, ComponentLoadMetrics[]>();
    
    this.loadMetrics.forEach((metrics, componentName) => {
      metrics.forEach(metric => {
        const deviceKey = metric.deviceOptimized ? 'optimized' : 'standard';
        const existing = deviceMetrics.get(deviceKey) || [];
        existing.push(metric);
        deviceMetrics.set(deviceKey, existing);
      });
    });
    
    return deviceMetrics;
  }

  private identifyOptimizationOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    
    // Identify components that would benefit from code splitting
    const slowComponents = this.getSlowComponents();
    if (slowComponents.length > 0) {
      opportunities.push({
        type: 'code-splitting',
        components: slowComponents.slice(0, 5).map(c => c.name),
        potentialSavings: slowComponents.reduce((sum, c) => sum + c.averageLoadTime, 0) * 0.3,
        complexity: 'medium',
        priority: 'high',
        description: 'Split large components into smaller chunks to improve initial load time'
      });
    }

    return opportunities;
  }

  private createLoadTimeHistogram(metrics: ComponentLoadMetrics[]): number[] {
    const histogram = new Array(10).fill(0);
    const maxTime = Math.max(...metrics.map(m => m.totalLoadTime));
    const bucketSize = maxTime / 10;
    
    metrics.forEach(metric => {
      const bucket = Math.min(9, Math.floor(metric.totalLoadTime / bucketSize));
      histogram[bucket]++;
    });
    
    return histogram;
  }

  private calculateUserExperienceImpact(): UserExperienceMetric[] {
    return Array.from(this.loadMetrics.entries()).map(([componentName, metrics]) => {
      const avgPerception = metrics.reduce((sum, m) => sum + m.userPerceptionScore, 0) / metrics.length;
      
      return {
        componentName,
        perceivedPerformance: avgPerception,
        userSatisfaction: avgPerception > 80 ? 0.9 : avgPerception > 60 ? 0.7 : 0.5,
        bounceRateImpact: avgPerception < 50 ? 0.3 : 0,
        conversionImpact: avgPerception < 50 ? -0.2 : avgPerception > 80 ? 0.1 : 0
      };
    });
  }

  // Web Vitals helpers
  private getLCP(): number {
    return 0; // Would use actual LCP measurement
  }

  private getFID(): number {
    return 0; // Would use actual FID measurement
  }

  private getCLS(): number {
    return 0; // Would use actual CLS measurement
  }

  private getRenderBlockingResources(): string[] {
    return []; // Would identify render-blocking resources
  }

  private calculateCriticalRenderingPath(): number {
    return 0; // Would calculate critical rendering path length
  }

  public destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
    }
    if (this.navigationObserver) {
      this.navigationObserver.disconnect();
    }
  }
}

// Global load time monitor instance
const loadTimeMonitor = new ComponentLoadTimeMonitor();

// React hook for component load monitoring
export function useLoadTimeMonitoring(componentName: string, options: {
  critical?: boolean;
  lazy?: boolean;
  dependencies?: string[];
} = {}) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadTime, setLoadTime] = React.useState<number | null>(null);
  const trackerRef = React.useRef<any>(null);

  React.useEffect(() => {
    // Start tracking
    trackerRef.current = loadTimeMonitor.startLoadTracking(componentName, options);
    
    return () => {
      // Complete tracking on unmount
      if (trackerRef.current) {
        trackerRef.current.completeLoad();
        const metrics = loadTimeMonitor.getComponentMetrics(componentName);
        const lastMetric = metrics[metrics.length - 1];
        if (lastMetric) {
          setLoadTime(lastMetric.totalLoadTime);
        }
        setIsLoading(false);
      }
    };
  }, [componentName]);

  return {
    isLoading,
    loadTime,
    endPhase: (phaseName: string) => trackerRef.current?.endPhase(phaseName),
    addDependency: (dep: Partial<DependencyMetric>) => trackerRef.current?.addDependency(dep),
    reportError: (error: Partial<LoadError>) => trackerRef.current?.reportError(error)
  };
}

// Higher-order component for automatic load time monitoring
export function withLoadTimeMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  options: { critical?: boolean; lazy?: boolean; dependencies?: string[] } = {}
) {
  return React.memo((props: P) => {
    const { isLoading, loadTime } = useLoadTimeMonitoring(componentName, options);
    
    // Add load time data to props
    const enhancedProps = {
      ...props,
      loadTime,
      isLoading
    } as P & { loadTime: number | null; isLoading: boolean };
    
    return <Component {...enhancedProps} />;
  });
}

export { loadTimeMonitor, ComponentLoadTimeMonitor };
export type { ComponentLoadMetrics, ComponentLoadAnalytics, LoadBottleneck, OptimizationOpportunity };