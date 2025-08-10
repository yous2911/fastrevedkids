import { performanceMonitor } from './utils/analytics';

const reportWebVitals = (onPerfEntry?: any) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((webVitals) => {
      // Report to custom handler
      const enhancedHandler = (metric: any) => {
        // Send to our performance monitor
        performanceMonitor.reportMetric(metric);
        
        // Call original handler
        onPerfEntry(metric);
      };

      webVitals.onCLS(enhancedHandler);
      webVitals.onFCP(enhancedHandler);
      webVitals.onLCP(enhancedHandler);
      webVitals.onTTFB(enhancedHandler);
    });
  }
};

// Custom performance monitoring
export const monitorWebVitals = () => {
  import('web-vitals').then((webVitals) => {
    // Cumulative Layout Shift
    webVitals.onCLS((metric) => {
      performanceMonitor.reportMetric(metric);
    });

    // First Input Delay (using INP instead of FID)
    webVitals.onINP((metric) => {
      performanceMonitor.reportMetric(metric);
    });

    // First Contentful Paint
    webVitals.onFCP((metric) => {
      performanceMonitor.reportMetric(metric);
    });

    // Largest Contentful Paint
    webVitals.onLCP((metric) => {
      performanceMonitor.reportMetric(metric);
    });

    // Time to First Byte
    webVitals.onTTFB((metric) => {
      performanceMonitor.reportMetric(metric);
    });
  });
};

export default reportWebVitals;
