/**
 * Analytics System
 * Comprehensive analytics and telemetry system for tracking component usage,
 * performance metrics, user engagement, and system health
 */

import { mobileDetector } from './mobileOptimized';
import { performanceMonitoring } from './performanceMonitoringHooks';

// Core analytics interfaces
interface AnalyticsEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  type: EventType;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, any>;
  context: AnalyticsContext;
}

interface AnalyticsContext {
  deviceInfo: DeviceInfo;
  sessionInfo: SessionInfo;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  userAgent: string;
  viewport: { width: number; height: number };
  timezone: string;
  language: string;
}

interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screen: { width: number; height: number };
  performanceTier: 'high' | 'medium' | 'low';
  supportsWebGL: boolean;
  memorySize: 'high' | 'medium' | 'low';
  connectionType?: string;
  batteryLevel?: number;
  isCharging?: boolean;
}

interface SessionInfo {
  sessionId: string;
  startTime: number;
  duration: number;
  pageViews: number;
  interactions: number;
  errors: number;
  crashes: number;
}

type EventType = 
  | 'component_interaction' 
  | 'performance_metric' 
  | 'error' 
  | 'crash' 
  | 'load_time'
  | 'user_engagement'
  | 'system_health';

type EventCategory = 
  | 'xp_system'
  | 'mascot_wardrobe' 
  | 'particle_engine'
  | 'mobile_optimization'
  | 'ai_system'
  | 'debug_tools'
  | 'general';

// Component-specific analytics interfaces
interface XPSystemAnalytics {
  xpGained: number;
  levelUps: number;
  interactionRate: number;
  animationCompletions: number;
  particleInteractions: number;
  averageSessionXP: number;
  xpSourceBreakdown: Record<string, number>;
  effectivenessScore: number;
}

interface MascotWardrobeAnalytics {
  itemEquips: number;
  itemUnequips: number;
  outfitChanges: number;
  wardrobeOpenRate: number;
  favoriteItems: string[];
  timeSpentBrowsing: number;
  purchaseConversions: number;
  categoryEngagement: Record<string, number>;
  customizationDepth: number;
}

interface PerformanceAnalytics {
  loadTimes: ComponentLoadTime[];
  renderMetrics: RenderMetric[];
  memoryUsage: MemoryMetric[];
  errorRates: ErrorRate[];
  crashReports: CrashReport[];
  devicePerformance: DevicePerformance[];
  batteryImpact: BatteryMetric[];
}

interface ComponentLoadTime {
  componentName: string;
  loadTime: number;
  cacheHit: boolean;
  bundleSize: number;
  dependencies: string[];
  timestamp: number;
  deviceTier: string;
}

interface RenderMetric {
  componentName: string;
  renderTime: number;
  reRenderCount: number;
  propChanges: number;
  stateChanges: number;
  timestamp: number;
}

interface MemoryMetric {
  componentName: string;
  memoryUsed: number;
  memoryLeaks: number;
  gcPressure: number;
  timestamp: number;
}

interface ErrorRate {
  componentName: string;
  errorCount: number;
  errorTypes: Record<string, number>;
  recoverableErrors: number;
  criticalErrors: number;
  timestamp: number;
}

interface CrashReport {
  id: string;
  timestamp: number;
  error: {
    message: string;
    stack: string;
    type: string;
    component?: string;
  };
  context: AnalyticsContext;
  userActions: AnalyticsEvent[];
  systemState: any;
  reproductionSteps: string[];
}

interface DevicePerformance {
  deviceId: string;
  performanceTier: string;
  avgFPS: number;
  avgMemoryUsage: number;
  avgLoadTime: number;
  errorRate: number;
  batteryDrainRate: number;
  thermalThrottling: number;
  timestamp: number;
}

interface BatteryMetric {
  componentName: string;
  batteryDrain: number;
  powerEfficiency: number;
  thermalImpact: number;
  timestamp: number;
}

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of events to track
  batchSize: number;
  batchInterval: number; // ms
  maxEventQueueSize: number;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableCrashReporting: boolean;
  enableUserEngagement: boolean;
  storageType: 'localStorage' | 'indexedDB' | 'memory';
  endpoint?: string;
  apiKey?: string;
}

// Main Analytics System
class AnalyticsSystem {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private sessionInfo: SessionInfo;
  private deviceInfo: DeviceInfo | null = null;
  private context: AnalyticsContext | null = null;
  private batchTimer: NodeJS.Timeout | null = null;
  private componentMetrics: Map<string, any> = new Map();
  private errorBoundaryStack: Error[] = [];

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.sessionId = this.generateSessionId();
    this.sessionInfo = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      duration: 0,
      pageViews: 1,
      interactions: 0,
      errors: 0,
      crashes: 0
    };

    this.config = {
      enabled: true,
      sampleRate: 1.0,
      batchSize: 50,
      batchInterval: 30000, // 30 seconds
      maxEventQueueSize: 1000,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableCrashReporting: true,
      enableUserEngagement: true,
      storageType: 'localStorage',
      ...config
    };

    this.initialize();
  }

  private async initialize() {
    // Initialize device info
    this.deviceInfo = await this.collectDeviceInfo();
    
    // Create analytics context
    this.context = {
      deviceInfo: this.deviceInfo,
      sessionInfo: this.sessionInfo,
      appVersion: process.env.REACT_APP_VERSION || '1.0.0',
      environment: (process.env.NODE_ENV as any) || 'development',
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    // Setup error tracking
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Setup crash reporting
    if (this.config.enableCrashReporting) {
      this.setupCrashReporting();
    }

    // Setup performance tracking
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceTracking();
    }

    // Start batch processing
    this.startBatchProcessing();

    // Track session start
    this.track('system_health', 'general', 'session_start', undefined, undefined, {
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo
    });

    console.log('📊 Analytics system initialized');
  }

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    const capabilities = await mobileDetector.detectCapabilities();
    
    return {
      deviceType: capabilities.deviceType,
      os: this.detectOS(),
      browser: this.detectBrowser(),
      screen: { width: screen.width, height: screen.height },
      performanceTier: capabilities.performanceTier,
      supportsWebGL: capabilities.supportsWebGL,
      memorySize: capabilities.memorySize,
      connectionType: this.getConnectionType(),
      batteryLevel: capabilities.batteryLevel,
      isCharging: capabilities.isCharging
    };
  }

  private detectOS(): string {
    const userAgent = navigator.userAgent;
    if (/Android/.test(userAgent)) return 'Android';
    if (/iPhone|iPad/.test(userAgent)) return 'iOS';
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error, event.filename, event.lineno, event.colno);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), 'Promise', 0, 0);
    });

    // React error boundary integration
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
        this.trackReactError(args);
      }
      originalConsoleError.apply(console, args);
    };
  }

  private setupCrashReporting() {
    // Monitor for critical system failures
    let criticalErrorCount = 0;
    const originalError = window.onerror;
    
    window.onerror = (message, source, lineno, colno, error) => {
      criticalErrorCount++;
      
      if (criticalErrorCount > 5) {
        this.reportCrash(error || new Error(message as string), 'critical_errors');
      }
      
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      return false;
    };
  }

  private setupPerformanceTracking() {
    // Integrate with performance monitoring system
    performanceMonitoring.registerCallback('analytics-integration', (data) => {
      this.trackPerformanceMetrics(data);
    });

    // Track page load performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.trackLoadTime('page', entry.duration, entry);
          } else if (entry.entryType === 'paint') {
            this.trackLoadTime(entry.name, entry.startTime, entry);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint'] });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startBatchProcessing() {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.config.batchInterval);
  }

  private processBatch() {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.config.batchSize);
    this.sendBatch(batch);
  }

  private async sendBatch(events: AnalyticsEvent[]) {
    try {
      if (this.config.endpoint && this.config.apiKey) {
        // Send to external analytics service
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            events,
            sessionId: this.sessionId,
            timestamp: Date.now()
          })
        });

        if (!response.ok) {
          console.warn('Analytics batch failed to send:', response.status);
          // Re-queue events for retry
          this.eventQueue.unshift(...events);
        }
      } else {
        // Store locally for development/testing
        this.storeLocally(events);
      }
    } catch (error) {
      console.warn('Analytics batch error:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private storeLocally(events: AnalyticsEvent[]) {
    try {
      const existing = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      const combined = [...existing, ...events].slice(-5000); // Keep last 5000 events
      localStorage.setItem('analytics_events', JSON.stringify(combined));
    } catch (error) {
      console.warn('Failed to store analytics locally:', error);
    }
  }

  // Public tracking methods
  public track(
    type: EventType,
    category: EventCategory,
    action: string,
    label?: string,
    value?: number,
    properties: Record<string, any> = {}
  ) {
    if (!this.config.enabled) return;
    if (Math.random() > this.config.sampleRate) return;
    if (!this.context) return;

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      type,
      category,
      action,
      label,
      value,
      properties,
      context: { ...this.context }
    };

    // Update session info
    this.sessionInfo.interactions++;
    this.sessionInfo.duration = Date.now() - this.sessionInfo.startTime;
    this.context.sessionInfo = this.sessionInfo;

    // Add to queue
    this.eventQueue.push(event);
    
    // Prevent queue overflow
    if (this.eventQueue.length > this.config.maxEventQueueSize) {
      this.eventQueue.shift();
    }

    // Process immediately for critical events
    if (type === 'error' || type === 'crash') {
      this.processBatch();
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // XP System Analytics
  public trackXPInteraction(action: string, xpAmount?: number, properties: Record<string, any> = {}) {
    this.track('component_interaction', 'xp_system', action, undefined, xpAmount, {
      ...properties,
      componentType: 'xp_system'
    });
  }

  public trackXPGain(amount: number, source: string, level: number) {
    this.track('user_engagement', 'xp_system', 'xp_gained', source, amount, {
      level,
      source,
      timestamp: Date.now()
    });
  }

  public trackLevelUp(newLevel: number, xpRequired: number, timeTaken: number) {
    this.track('user_engagement', 'xp_system', 'level_up', undefined, newLevel, {
      previousLevel: newLevel - 1,
      xpRequired,
      timeTaken,
      achievement: true
    });
  }

  // Mascot Wardrobe Analytics
  public trackWardrobeInteraction(action: string, itemId?: string, properties: Record<string, any> = {}) {
    this.track('component_interaction', 'mascot_wardrobe', action, itemId, undefined, {
      ...properties,
      componentType: 'wardrobe'
    });
  }

  public trackItemEquip(itemId: string, category: string, rarity: string) {
    this.track('user_engagement', 'mascot_wardrobe', 'item_equipped', itemId, undefined, {
      category,
      rarity,
      timestamp: Date.now()
    });
  }

  public trackOutfitChange(outfitId: string, itemCount: number, timeSpent: number) {
    this.track('user_engagement', 'mascot_wardrobe', 'outfit_changed', outfitId, itemCount, {
      timeSpent,
      timestamp: Date.now()
    });
  }

  // Performance Analytics
  public trackLoadTime(componentName: string, loadTime: number, additionalData?: any) {
    this.track('load_time', 'general', 'component_loaded', componentName, loadTime, {
      loadTime,
      componentName,
      cacheHit: additionalData?.cacheHit || false,
      deviceTier: this.deviceInfo?.performanceTier,
      ...additionalData
    });
  }

  public trackRenderMetric(componentName: string, renderTime: number, reRenderCount: number) {
    this.track('performance_metric', 'general', 'component_render', componentName, renderTime, {
      renderTime,
      reRenderCount,
      componentName,
      timestamp: Date.now()
    });
  }

  public trackPerformanceMetrics(data: any) {
    this.track('performance_metric', 'general', 'system_performance', undefined, undefined, {
      metrics: data.metrics,
      alerts: data.alerts.length,
      recommendations: data.recommendations.length,
      timestamp: Date.now()
    });
  }

  // Error and Crash Analytics
  public trackError(error: Error, filename?: string, lineno?: number, colno?: number) {
    this.sessionInfo.errors++;
    
    this.track('error', 'general', 'runtime_error', error.name, undefined, {
      message: error.message,
      stack: error.stack,
      filename,
      lineno,
      colno,
      timestamp: Date.now()
    });
  }

  public trackReactError(args: any[]) {
    this.track('error', 'general', 'react_error', undefined, undefined, {
      errorInfo: args,
      timestamp: Date.now()
    });
  }

  public reportCrash(error: Error, reason: string) {
    this.sessionInfo.crashes++;

    const crashReport: CrashReport = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      error: {
        message: error.message,
        stack: error.stack || '',
        type: error.name,
        component: this.extractComponentFromStack(error.stack)
      },
      context: this.context!,
      userActions: this.getRecentUserActions(),
      systemState: this.getSystemState(),
      reproductionSteps: this.generateReproductionSteps()
    };

    this.track('crash', 'general', 'application_crash', reason, undefined, crashReport);
  }

  private extractComponentFromStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    
    const componentMatch = stack.match(/at (\w+Component)/);
    return componentMatch ? componentMatch[1] : undefined;
  }

  private getRecentUserActions(): AnalyticsEvent[] {
    return this.eventQueue
      .filter(event => event.type === 'component_interaction')
      .slice(-10); // Last 10 interactions
  }

  private getSystemState(): any {
    return {
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
      sessionDuration: this.sessionInfo.duration,
      deviceInfo: this.deviceInfo,
      timestamp: Date.now()
    };
  }

  private generateReproductionSteps(): string[] {
    const actions = this.getRecentUserActions();
    return actions.map(action => `${action.category}.${action.action}${action.label ? ` (${action.label})` : ''}`);
  }

  // Analytics data retrieval methods
  public getAnalyticsData(): any {
    try {
      const stored = localStorage.getItem('analytics_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getSessionInfo(): SessionInfo {
    return { ...this.sessionInfo };
  }

  public getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo ? { ...this.deviceInfo } : null;
  }

  // Component usage summaries
  public getXPSystemAnalytics(): XPSystemAnalytics {
    const events = this.getAnalyticsData().filter((e: AnalyticsEvent) => e.category === 'xp_system');
    
    return {
      xpGained: events.filter((e: AnalyticsEvent) => e.action === 'xp_gained').reduce((sum: number, e: AnalyticsEvent) => sum + (e.value || 0), 0),
      levelUps: events.filter((e: AnalyticsEvent) => e.action === 'level_up').length,
      interactionRate: events.length / (this.sessionInfo.duration / 60000), // per minute
      animationCompletions: events.filter((e: AnalyticsEvent) => e.action === 'animation_complete').length,
      particleInteractions: events.filter((e: AnalyticsEvent) => e.action === 'particle_click').length,
      averageSessionXP: events.reduce((sum: number, e: AnalyticsEvent) => sum + (e.value || 0), 0) / Math.max(1, events.length),
      xpSourceBreakdown: this.calculateXPSourceBreakdown(events),
      effectivenessScore: this.calculateEffectivenessScore(events)
    };
  }

  public getMascotWardrobeAnalytics(): MascotWardrobeAnalytics {
    const events = this.getAnalyticsData().filter((e: AnalyticsEvent) => e.category === 'mascot_wardrobe');
    
    return {
      itemEquips: events.filter((e: AnalyticsEvent) => e.action === 'item_equipped').length,
      itemUnequips: events.filter((e: AnalyticsEvent) => e.action === 'item_unequipped').length,
      outfitChanges: events.filter((e: AnalyticsEvent) => e.action === 'outfit_changed').length,
      wardrobeOpenRate: events.filter((e: AnalyticsEvent) => e.action === 'wardrobe_opened').length / Math.max(1, this.sessionInfo.interactions),
      favoriteItems: this.calculateFavoriteItems(events),
      timeSpentBrowsing: events.reduce((sum: number, e: AnalyticsEvent) => sum + (e.properties?.timeSpent || 0), 0),
      purchaseConversions: events.filter((e: AnalyticsEvent) => e.action === 'item_purchased').length,
      categoryEngagement: this.calculateCategoryEngagement(events),
      customizationDepth: this.calculateCustomizationDepth(events)
    };
  }

  private calculateXPSourceBreakdown(events: AnalyticsEvent[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    events.forEach(event => {
      if (event.properties?.source) {
        breakdown[event.properties.source] = (breakdown[event.properties.source] || 0) + (event.value || 0);
      }
    });
    return breakdown;
  }

  private calculateEffectivenessScore(events: AnalyticsEvent[]): number {
    const interactions = events.length;
    const xpPerInteraction = events.reduce((sum, e) => sum + (e.value || 0), 0) / Math.max(1, interactions);
    return Math.min(100, xpPerInteraction * 10); // Scaled to 0-100
  }

  private calculateFavoriteItems(events: AnalyticsEvent[]): string[] {
    const itemCounts: Record<string, number> = {};
    events.forEach(event => {
      if (event.label) {
        itemCounts[event.label] = (itemCounts[event.label] || 0) + 1;
      }
    });
    
    return Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([item]) => item);
  }

  private calculateCategoryEngagement(events: AnalyticsEvent[]): Record<string, number> {
    const engagement: Record<string, number> = {};
    events.forEach(event => {
      if (event.properties?.category) {
        engagement[event.properties.category] = (engagement[event.properties.category] || 0) + 1;
      }
    });
    return engagement;
  }

  private calculateCustomizationDepth(events: AnalyticsEvent[]): number {
    const uniqueItems = new Set(events.filter(e => e.action === 'item_equipped').map(e => e.label));
    return uniqueItems.size;
  }

  // Configuration methods
  public updateConfig(config: Partial<AnalyticsConfig>) {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // Cleanup
  public destroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Process remaining events
    this.processBatch();
    
    // Track session end
    this.track('system_health', 'general', 'session_end', undefined, this.sessionInfo.duration, {
      sessionInfo: this.sessionInfo
    });
  }
}

// Global analytics instance
let analyticsInstance: AnalyticsSystem | null = null;

export const analytics = {
  initialize: (config?: Partial<AnalyticsConfig>) => {
    if (!analyticsInstance) {
      analyticsInstance = new AnalyticsSystem(config);
    }
    return analyticsInstance;
  },
  
  getInstance: () => {
    if (!analyticsInstance) {
      analyticsInstance = new AnalyticsSystem();
    }
    return analyticsInstance;
  },

  track: (type: EventType, category: EventCategory, action: string, label?: string, value?: number, properties?: Record<string, any>) => {
    analytics.getInstance().track(type, category, action, label, value, properties);
  },

  // Convenience methods
  trackXP: (action: string, amount?: number, properties?: Record<string, any>) => {
    analytics.getInstance().trackXPInteraction(action, amount, properties);
  },

  trackWardrobe: (action: string, itemId?: string, properties?: Record<string, any>) => {
    analytics.getInstance().trackWardrobeInteraction(action, itemId, properties);
  },

  trackError: (error: Error, filename?: string, lineno?: number, colno?: number) => {
    analytics.getInstance().trackError(error, filename, lineno, colno);
  },

  trackLoadTime: (componentName: string, loadTime: number, additionalData?: any) => {
    analytics.getInstance().trackLoadTime(componentName, loadTime, additionalData);
  },

  // Data retrieval
  getXPAnalytics: () => analytics.getInstance().getXPSystemAnalytics(),
  getWardrobeAnalytics: () => analytics.getInstance().getMascotWardrobeAnalytics(),
  getSessionInfo: () => analytics.getInstance().getSessionInfo(),
  getDeviceInfo: () => analytics.getInstance().getDeviceInfo()
};

// React Hook for analytics
export function useAnalytics(componentName?: string) {
  const [analyticsReady, setAnalyticsReady] = React.useState(false);

  React.useEffect(() => {
    analytics.initialize();
    setAnalyticsReady(true);

    if (componentName) {
      const startTime = performance.now();
      
      return () => {
        const loadTime = performance.now() - startTime;
        analytics.trackLoadTime(componentName, loadTime);
      };
    }
  }, [componentName]);

  return {
    track: analytics.track,
    trackXP: analytics.trackXP,
    trackWardrobe: analytics.trackWardrobe,
    trackError: analytics.trackError,
    trackLoadTime: analytics.trackLoadTime,
    ready: analyticsReady
  };
}

// Higher-Order Component for automatic analytics
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    const startTime = React.useRef(performance.now());
    
    React.useEffect(() => {
      const loadTime = performance.now() - startTime.current;
      analytics.trackLoadTime(componentName, loadTime, { 
        componentName,
        propsCount: Object.keys(props as any).length
      });

      // Track component mount
      analytics.track('component_interaction', 'general', 'component_mounted', componentName);

      return () => {
        // Track component unmount
        analytics.track('component_interaction', 'general', 'component_unmounted', componentName);
      };
    }, []);

    return <Component {...props} />;
  });
}

export default analytics;