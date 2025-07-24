// Custom hook for component-level performance tracking
import { useEffect, useRef } from 'react';
import { performanceMonitor } from '../utils/analytics';

export const usePerformanceTracking = (componentName: string) => {
  const mountTime = useRef<number | undefined>(undefined);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    renderCount.current++;

    return () => {
      if (mountTime.current) {
        const duration = performance.now() - mountTime.current;
        
        // Report component lifecycle performance
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎯 Component ${componentName} lifecycle: ${duration.toFixed(2)}ms`);
        }

        // Send custom metric
        performanceMonitor.reportMetric({
          name: 'component_lifecycle',
          value: duration,
          rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
          delta: duration,
          entries: [],
          id: `${componentName}-${Date.now()}`,
          navigationType: 'reload',
        } as any);
      }
    };
  }, [componentName]);

  const trackUserInteraction = (action: string, duration?: number) => {
    performanceMonitor.reportMetric({
      name: 'user_interaction',
      value: duration || 0,
      rating: 'good',
      delta: 0,
      entries: [],
      id: `${componentName}-${action}-${Date.now()}`,
      navigationType: 'reload',
    } as any);
  };

  return { trackUserInteraction, renderCount: renderCount.current };
}; 