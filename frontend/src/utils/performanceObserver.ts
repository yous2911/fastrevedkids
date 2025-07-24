// Additional performance monitoring for custom metrics
import { performanceMonitor } from './analytics';

export class CustomPerformanceObserver {
  private static instance: CustomPerformanceObserver;
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initObservers();
  }

  static getInstance(): CustomPerformanceObserver {
    if (!CustomPerformanceObserver.instance) {
      CustomPerformanceObserver.instance = new CustomPerformanceObserver();
    }
    return CustomPerformanceObserver.instance;
  }

  private initObservers() {
    try {
      // Long Task Observer
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            performanceMonitor.reportMetric({
              name: 'long_task',
              value: entry.duration,
              rating: entry.duration > 50 ? 'poor' : 'good',
              delta: entry.duration,
              entries: [entry],
              id: `long-task-${Date.now()}`,
              navigationType: 'reload',
            } as any);
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);

        // Largest Contentful Paint Observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          performanceMonitor.reportMetric({
            name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
            delta: lastEntry.startTime,
            entries: [lastEntry],
            id: `lcp-${Date.now()}`,
            navigationType: 'reload',
          } as any);
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      }
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize custom performance observer
export const customPerformanceObserver = CustomPerformanceObserver.getInstance(); 