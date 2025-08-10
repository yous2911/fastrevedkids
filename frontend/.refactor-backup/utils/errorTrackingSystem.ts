/**
 * Error Tracking and Crash Reporting System
 * Comprehensive error monitoring, crash detection, and automated reporting
 */

import { analytics } from './analyticsSystem';
import { crossDeviceTracker } from './crossDevicePerformanceTracker';

// Error tracking interfaces
interface ErrorEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  type: ErrorType;
  severity: ErrorSeverity;
  component?: string;
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  userAgent: string;
  url: string;
  context: ErrorContext;
  recovered: boolean;
  reproduced: boolean;
}

interface ErrorContext {
  deviceInfo: any;
  performanceState: any;
  userActions: any[];
  componentState: Record<string, any>;
  networkState: any;
  memoryState: any;
  renderingState: any;
  customData: Record<string, any>;
}

interface CrashReport {
  id: string;
  timestamp: number;
  sessionId: string;
  errorChain: ErrorEvent[];
  systemState: SystemState;
  userJourney: UserAction[];
  reproductionSteps: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: CrashImpact;
  resolution: CrashResolution | null;
}

interface SystemState {
  memory: {
    used: number;
    available: number;
    pressure: 'low' | 'medium' | 'high';
  };
  performance: {
    fps: number;
    frameTime: number;
    renderTime: number;
  };
  network: {
    online: boolean;
    effectiveType: string;
    rtt: number;
  };
  battery?: {
    level: number;
    charging: boolean;
  };
  thermal?: {
    state: string;
    throttling: boolean;
  };
}

interface UserAction {
  timestamp: number;
  type: string;
  target: string;
  data: any;
}

interface CrashImpact {
  usersAffected: number;
  sessionsAffected: number;
  featuresImpacted: string[];
  businessMetricsImpact: Record<string, number>;
}

interface CrashResolution {
  status: 'identified' | 'fixed' | 'workaround' | 'wont-fix';
  description: string;
  implementedAt: number;
  verifiedAt?: number;
}

type ErrorType = 
  | 'javascript'
  | 'network'
  | 'rendering' 
  | 'memory'
  | 'performance'
  | 'security'
  | 'api'
  | 'user-input'
  | 'third-party';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error rate tracking interfaces
interface ComponentErrorRates {
  componentName: string;
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsByTimeOfDay: Record<string, number>;
  errorsByDeviceType: Record<string, number>;
  meanTimeBetweenErrors: number;
  errorTrends: {
    increasing: boolean;
    rate: number;
  };
  topErrors: {
    message: string;
    count: number;
    lastSeen: number;
  }[];
}

interface ErrorAnalytics {
  overallErrorRate: number;
  crashRate: number;
  recoveryRate: number;
  errorDistribution: Record<ErrorType, number>;
  componentErrorRates: ComponentErrorRates[];
  criticalErrors: ErrorEvent[];
  errorTrends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  deviceSpecificErrors: Record<string, number>;
  networkRelatedErrors: number;
  performanceRelatedErrors: number;
}

// Main error tracking system
class ErrorTrackingSystem {
  private errors: ErrorEvent[] = [];
  private crashes: CrashReport[] = [];
  private userActions: UserAction[] = [];
  private componentErrorRates: Map<string, ComponentErrorRates> = new Map();
  private errorThresholds: Record<ErrorType, number> = {};
  private sessionId: string;
  private isInitialized = false;
  private errorBoundaryStack: Error[] = [];
  private lastErrorTime = 0;
  private consecutiveErrors = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorThresholds();
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    // Global error handlers
    this.setupGlobalErrorHandlers();
    
    // React error boundary integration
    this.setupReactErrorHandling();
    
    // Performance monitoring integration
    this.setupPerformanceErrorDetection();
    
    // Network error monitoring
    this.setupNetworkErrorMonitoring();
    
    // Memory leak detection
    this.setupMemoryLeakDetection();
    
    // User action tracking
    this.setupUserActionTracking();
    
    this.isInitialized = true;
    console.log('🚨 Error tracking system initialized');
  }

  private setupErrorThresholds() {
    this.errorThresholds = {
      javascript: 10, // 10 JS errors per session before escalation
      network: 5,     // 5 network errors per session
      rendering: 3,   // 3 rendering errors per session
      memory: 2,      // 2 memory errors per session
      performance: 5, // 5 performance errors per session
      security: 1,    // 1 security error per session
      api: 5,         // 5 API errors per session
      'user-input': 10, // 10 user input errors per session
      'third-party': 5  // 5 third-party errors per session
    };
  }

  private setupGlobalErrorHandlers() {
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        severity: this.determineSeverity(event.error),
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'javascript',
        severity: 'high',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          type: 'network',
          severity: 'medium',
          message: `Resource failed to load: ${(event.target as any)?.src || (event.target as any)?.href}`,
          source: (event.target as any)?.src || (event.target as any)?.href
        });
      }
    }, true);
  }

  private setupReactErrorHandling() {
    // Enhanced console.error capturing for React errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args.length > 0 && typeof args[0] === 'string') {
        const message = args[0];
        
        // React error patterns
        if (message.includes('React') || message.includes('render') || message.includes('component')) {
          const componentMatch = message.match(/in (\w+)/);
          this.handleError({
            type: 'javascript',
            severity: 'high',
            message,
            component: componentMatch ? componentMatch[1] : undefined,
            error: args[1] instanceof Error ? args[1] : new Error(message)
          });
        }
      }
      
      originalConsoleError.apply(console, args);
    };
  }

  private setupPerformanceErrorDetection() {
    // Monitor for performance degradation that could indicate errors
    setInterval(() => {
      const performanceData = crossDeviceTracker.getCurrentDeviceProfile();
      if (performanceData) {
        const metrics = performanceData.realWorldMetrics;
        
        // Detect severe performance issues
        if (metrics.averageFPS < 15) {
          this.handleError({
            type: 'performance',
            severity: 'high',
            message: `Severe FPS degradation: ${metrics.averageFPS.toFixed(1)} FPS`,
            context: { performanceMetrics: metrics }
          });
        }
        
        if (metrics.memoryUsagePeak > 200) { // 200MB threshold
          this.handleError({
            type: 'memory',
            severity: 'medium',
            message: `High memory usage detected: ${metrics.memoryUsagePeak.toFixed(1)}MB`,
            context: { memoryMetrics: metrics }
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private setupNetworkErrorMonitoring() {
    // Monitor fetch failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.handleError({
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            message: `HTTP ${response.status}: ${response.statusText}`,
            source: args[0]?.toString()
          });
        }
        
        return response;
      } catch (error) {
        this.handleError({
          type: 'network',
          severity: 'high',
          message: `Network request failed: ${error}`,
          source: args[0]?.toString(),
          error: error as Error
        });
        throw error;
      }
    };

    // Monitor online/offline status
    window.addEventListener('offline', () => {
      this.handleError({
        type: 'network',
        severity: 'medium',
        message: 'Device went offline'
      });
    });
  }

  private setupMemoryLeakDetection() {
    if ((performance as any).memory) {
      let baselineMemory = (performance as any).memory.usedJSHeapSize;
      
      setInterval(() => {
        const currentMemory = (performance as any).memory.usedJSHeapSize;
        const memoryGrowth = currentMemory - baselineMemory;
        
        // Detect potential memory leaks (>50MB growth without cleanup)
        if (memoryGrowth > 50 * 1024 * 1024) {
          this.handleError({
            type: 'memory',
            severity: 'high',
            message: `Potential memory leak detected: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB growth`,
            context: {
              baselineMemory: baselineMemory / 1024 / 1024,
              currentMemory: currentMemory / 1024 / 1024,
              growth: memoryGrowth / 1024 / 1024
            }
          });
          
          baselineMemory = currentMemory; // Reset baseline
        }
      }, 60000); // Check every minute
    }
  }

  private setupUserActionTracking() {
    // Track user interactions for crash reproduction
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.trackUserAction({
          timestamp: Date.now(),
          type: eventType,
          target: this.getElementSelector(event.target as Element),
          data: this.extractEventData(event)
        });
      });
    });
  }

  private handleError(errorData: Partial<ErrorEvent>) {
    const now = Date.now();
    
    // Detect error storms (multiple errors in quick succession)
    if (now - this.lastErrorTime < 1000) {
      this.consecutiveErrors++;
    } else {
      this.consecutiveErrors = 1;
    }
    this.lastErrorTime = now;
    
    const error: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: now,
      sessionId: this.sessionId,
      type: errorData.type || 'javascript',
      severity: errorData.severity || this.determineSeverity(errorData.error),
      component: errorData.component,
      message: errorData.message || 'Unknown error',
      stack: errorData.stack || errorData.error?.stack,
      source: errorData.source,
      line: errorData.line,
      column: errorData.column,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: this.buildErrorContext(errorData),
      recovered: false,
      reproduced: false
    };

    // Store error
    this.errors.push(error);
    this.updateComponentErrorRates(error);
    
    // Check for crash conditions
    if (this.shouldReportAsCrash(error)) {
      this.reportCrash(error);
    }
    
    // Send to analytics
    this.sendErrorToAnalytics(error);
    
    // Check error thresholds
    this.checkErrorThresholds(error.type);
    
    console.warn('🚨 Error tracked:', error);
  }

  private determineSeverity(error?: Error): ErrorSeverity {
    if (!error) return 'medium';
    
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    // Critical errors
    if (message.includes('out of memory') || message.includes('maximum call stack')) {
      return 'critical';
    }
    
    // High severity errors
    if (message.includes('cannot read') || message.includes('undefined') || 
        stack.includes('react') || message.includes('chunk load')) {
      return 'high';
    }
    
    // Network or resource errors are usually medium
    if (message.includes('network') || message.includes('failed to fetch')) {
      return 'medium';
    }
    
    return 'low';
  }

  private buildErrorContext(errorData: Partial<ErrorEvent>): ErrorContext {
    return {
      deviceInfo: crossDeviceTracker.getCurrentDeviceProfile(),
      performanceState: this.getCurrentPerformanceState(),
      userActions: this.userActions.slice(-10), // Last 10 actions
      componentState: this.getCurrentComponentState(),
      networkState: this.getCurrentNetworkState(),
      memoryState: this.getCurrentMemoryState(),
      renderingState: this.getCurrentRenderingState(),
      customData: errorData.context || {}
    };
  }

  private shouldReportAsCrash(error: ErrorEvent): boolean {
    // Crash criteria
    return (
      error.severity === 'critical' ||
      this.consecutiveErrors >= 5 ||
      error.type === 'memory' && error.severity === 'high' ||
      this.errors.filter(e => e.timestamp > Date.now() - 30000).length >= 10 // 10 errors in 30 seconds
    );
  }

  private reportCrash(triggerError: ErrorEvent) {
    const crashReport: CrashReport = {
      id: this.generateCrashId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      errorChain: this.errors.slice(-5), // Last 5 errors leading to crash
      systemState: this.getCurrentSystemState(),
      userJourney: this.userActions.slice(-20), // Last 20 user actions
      reproductionSteps: this.generateReproductionSteps(),
      severity: this.calculateCrashSeverity(triggerError),
      impact: this.calculateCrashImpact(),
      resolution: null
    };

    this.crashes.push(crashReport);
    
    // Send critical crash report immediately
    analytics.track('crash', 'general', 'application_crash', triggerError.component, undefined, crashReport);
    
    console.error('💥 CRASH REPORTED:', crashReport);
  }

  private updateComponentErrorRates(error: ErrorEvent) {
    if (!error.component) return;
    
    const existing = this.componentErrorRates.get(error.component) || {
      componentName: error.component,
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsByTimeOfDay: {},
      errorsByDeviceType: {},
      meanTimeBetweenErrors: 0,
      errorTrends: { increasing: false, rate: 0 },
      topErrors: []
    };

    existing.totalErrors++;
    existing.errorsByType[error.type] = (existing.errorsByType[error.type] || 0) + 1;
    
    const hour = new Date(error.timestamp).getHours().toString();
    existing.errorsByTimeOfDay[hour] = (existing.errorsByTimeOfDay[hour] || 0) + 1;
    
    const deviceType = crossDeviceTracker.getCurrentDeviceProfile()?.hardware.displaySpecs?.resolution ? 
      'desktop' : 'mobile';
    existing.errorsByDeviceType[deviceType] = (existing.errorsByDeviceType[deviceType] || 0) + 1;
    
    this.componentErrorRates.set(error.component, existing);
  }

  private sendErrorToAnalytics(error: ErrorEvent) {
    analytics.track('error', 'general', `${error.type}_error`, error.component, undefined, {
      errorId: error.id,
      severity: error.severity,
      message: error.message,
      stack: error.stack?.substring(0, 500), // Truncate stack for storage
      consecutiveErrors: this.consecutiveErrors,
      sessionErrors: this.errors.length,
      deviceInfo: error.context.deviceInfo?.hardware,
      timestamp: error.timestamp
    });
  }

  private checkErrorThresholds(errorType: ErrorType) {
    const threshold = this.errorThresholds[errorType];
    const recentErrors = this.errors.filter(
      e => e.type === errorType && e.timestamp > Date.now() - 300000 // Last 5 minutes
    );

    if (recentErrors.length >= threshold) {
      analytics.track('error', 'general', 'error_threshold_exceeded', errorType, threshold, {
        errorType,
        threshold,
        actualCount: recentErrors.length,
        timeWindow: 300000
      });
    }
  }

  // Public methods for error recovery and reporting
  public markErrorAsRecovered(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.recovered = true;
      analytics.track('error', 'general', 'error_recovered', error.component, undefined, {
        errorId,
        timToRecovery: Date.now() - error.timestamp
      });
    }
  }

  public reportUserFeedback(errorId: string, feedback: string, reproduced: boolean) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.reproduced = reproduced;
      analytics.track('error', 'general', 'error_feedback', error.component, undefined, {
        errorId,
        feedback,
        reproduced,
        userAgent: navigator.userAgent
      });
    }
  }

  // Analytics and reporting methods
  public getErrorAnalytics(): ErrorAnalytics {
    const now = Date.now();
    const sessionDuration = now - (this.errors[0]?.timestamp || now);
    
    return {
      overallErrorRate: (this.errors.length / (sessionDuration / 60000)) || 0, // Errors per minute
      crashRate: (this.crashes.length / (sessionDuration / 60000)) || 0, // Crashes per minute
      recoveryRate: this.errors.filter(e => e.recovered).length / Math.max(1, this.errors.length),
      errorDistribution: this.calculateErrorDistribution(),
      componentErrorRates: Array.from(this.componentErrorRates.values()),
      criticalErrors: this.errors.filter(e => e.severity === 'critical'),
      errorTrends: this.calculateErrorTrends(),
      deviceSpecificErrors: this.calculateDeviceSpecificErrors(),
      networkRelatedErrors: this.errors.filter(e => e.type === 'network').length,
      performanceRelatedErrors: this.errors.filter(e => e.type === 'performance').length
    };
  }

  public getTopErrors(limit = 10) {
    const errorCounts = new Map<string, { count: number; lastSeen: number; severity: ErrorSeverity }>();
    
    this.errors.forEach(error => {
      const key = error.message;
      const existing = errorCounts.get(key);
      if (existing) {
        existing.count++;
        existing.lastSeen = Math.max(existing.lastSeen, error.timestamp);
      } else {
        errorCounts.set(key, { count: 1, lastSeen: error.timestamp, severity: error.severity });
      }
    });

    return Array.from(errorCounts.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, limit)
      .map(([message, data]) => ({ message, ...data }));
  }

  public getCrashReports(): CrashReport[] {
    return [...this.crashes];
  }

  public exportErrorData() {
    return {
      errors: this.errors,
      crashes: this.crashes,
      componentErrorRates: Array.from(this.componentErrorRates.entries()),
      analytics: this.getErrorAnalytics()
    };
  }

  // Helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trackUserAction(action: UserAction) {
    this.userActions.push(action);
    if (this.userActions.length > 100) {
      this.userActions.shift(); // Keep only last 100 actions
    }
  }

  private getElementSelector(element: Element): string {
    if (!element) return 'unknown';
    
    let selector = element.tagName.toLowerCase();
    if (element.id) selector += `#${element.id}`;
    if (element.className) selector += `.${element.className.split(' ').join('.')}`;
    
    return selector;
  }

  private extractEventData(event: Event): any {
    const data: any = { type: event.type };
    
    if (event instanceof MouseEvent) {
      data.clientX = event.clientX;
      data.clientY = event.clientY;
      data.button = event.button;
    } else if (event instanceof KeyboardEvent) {
      data.key = event.key;
      data.code = event.code;
    }
    
    return data;
  }

  // Context gathering methods
  private getCurrentPerformanceState() {
    return crossDeviceTracker.getCurrentDeviceProfile()?.realWorldMetrics;
  }

  private getCurrentComponentState(): Record<string, any> {
    // This would integrate with React DevTools or similar
    return {};
  }

  private getCurrentNetworkState() {
    const connection = (navigator as any).connection;
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      downlink: connection?.downlink
    };
  }

  private getCurrentMemoryState() {
    const memory = (performance as any).memory;
    return memory ? {
      used: memory.usedJSHeapSize / 1024 / 1024,
      total: memory.totalJSHeapSize / 1024 / 1024,
      limit: memory.jsHeapSizeLimit / 1024 / 1024
    } : null;
  }

  private getCurrentRenderingState() {
    return {
      pixelRatio: window.devicePixelRatio,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      webGL: !!this.getWebGLContext()
    };
  }

  private getCurrentSystemState(): SystemState {
    return {
      memory: this.getCurrentMemoryState() || { used: 0, available: 0, pressure: 'low' },
      performance: this.getCurrentPerformanceState() || { fps: 60, frameTime: 16.67, renderTime: 5 },
      network: this.getCurrentNetworkState(),
      battery: this.getBatteryState(),
      thermal: this.getThermalState()
    };
  }

  private getBatteryState() {
    // Would use Battery API if available
    return undefined;
  }

  private getThermalState() {
    // Would use thermal monitoring if available
    return undefined;
  }

  private generateReproductionSteps(): string[] {
    return this.userActions.slice(-10).map(action => 
      `${action.type} on ${action.target}`
    );
  }

  private calculateCrashSeverity(triggerError: ErrorEvent): CrashReport['severity'] {
    if (triggerError.severity === 'critical') return 'critical';
    if (this.consecutiveErrors >= 10) return 'critical';
    if (triggerError.type === 'memory') return 'high';
    return 'medium';
  }

  private calculateCrashImpact(): CrashImpact {
    return {
      usersAffected: 1, // Current user
      sessionsAffected: 1, // Current session
      featuresImpacted: this.getAffectedFeatures(),
      businessMetricsImpact: {}
    };
  }

  private getAffectedFeatures(): string[] {
    const components = [...new Set(this.errors.map(e => e.component).filter(Boolean))];
    return components as string[];
  }

  private calculateErrorDistribution(): Record<ErrorType, number> {
    const distribution = {} as Record<ErrorType, number>;
    this.errors.forEach(error => {
      distribution[error.type] = (distribution[error.type] || 0) + 1;
    });
    return distribution;
  }

  private calculateErrorTrends() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    return {
      daily: Array.from({ length: 7 }, (_, i) => {
        const start = now - (i + 1) * day;
        const end = now - i * day;
        return this.errors.filter(e => e.timestamp >= start && e.timestamp < end).length;
      }).reverse(),
      weekly: [],
      monthly: []
    };
  }

  private calculateDeviceSpecificErrors(): Record<string, number> {
    const deviceErrors: Record<string, number> = {};
    
    this.errors.forEach(error => {
      const deviceType = error.context.deviceInfo?.hardware?.deviceType || 'unknown';
      deviceErrors[deviceType] = (deviceErrors[deviceType] || 0) + 1;
    });
    
    return deviceErrors;
  }

  private getWebGLContext(): WebGLRenderingContext | null {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }
}

// Global error tracking instance
const errorTracker = new ErrorTrackingSystem();

// React Error Boundary integration
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName?: string },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    errorTracker['handleError']({
      type: 'javascript',
      severity: 'high',
      message: error.message,
      stack: error.stack,
      component: this.props.componentName || 'ErrorBoundary',
      error,
      context: { errorInfo }
    });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: { 
          padding: '20px', 
          border: '1px solid #ff6b6b', 
          borderRadius: '4px', 
          backgroundColor: '#fff5f5' 
        }
      }, 'Something went wrong. Please refresh the page.');
    }

    return this.props.children;
  }
}

// Hook for component-level error tracking
export function useErrorTracking(componentName: string) {
  React.useEffect(() => {
    const handleError = (error: Error) => {
      errorTracker['handleError']({
        type: 'javascript',
        severity: 'medium',
        message: error.message,
        stack: error.stack,
        component: componentName,
        error
      });
    };

    // Track component mount
    analytics.track('component_interaction', 'general', 'component_mounted', componentName);

    return () => {
      // Track component unmount
      analytics.track('component_interaction', 'general', 'component_unmounted', componentName);
    };
  }, [componentName]);

  return {
    reportError: (error: Error, context?: any) => {
      errorTracker['handleError']({
        type: 'javascript',
        severity: 'medium',
        message: error.message,
        stack: error.stack,
        component: componentName,
        error,
        context
      });
    },
    markRecovered: (errorId: string) => {
      errorTracker.markErrorAsRecovered(errorId);
    }
  };
}

export { errorTracker, ErrorTrackingSystem };
export type { ErrorEvent, CrashReport, ErrorAnalytics, ComponentErrorRates };