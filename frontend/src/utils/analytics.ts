import { Metric } from 'web-vitals';
import * as Sentry from "@sentry/react";

interface PerformanceData {
  metric: Metric;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class PerformanceMonitor {
  private sessionId: string;
  private userId?: string;
  private apiEndpoint: string;
  private buffer: PerformanceData[] = [];
  private bufferSize = 10;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.apiEndpoint = `${process.env.REACT_APP_API_URL}/analytics/performance`;
    
    // Auto-flush buffer periodically
    setInterval(() => this.flush(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush(true));
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  reportMetric(metric: Metric) {
    const data: PerformanceData = {
      metric,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    // Add to buffer
    this.buffer.push(data);

    // Send to Sentry for error tracking
    if (process.env.NODE_ENV === 'production') {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.name}: ${metric.value}`,
        level: this.getMetricLevel(metric),
        data: {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        },
      });

      // Report poor metrics as issues
      if (metric.rating === 'poor') {
        Sentry.captureMessage(`Poor ${metric.name} performance: ${metric.value}`, 'warning');
      }
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', metric.name, {
        custom_parameter_1: metric.value,
        custom_parameter_2: metric.rating,
      });
    }

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  private getMetricLevel(metric: Metric): 'info' | 'warning' | 'error' {
    switch (metric.rating) {
      case 'good': return 'info';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'error';
      default: return 'info';
    }
  }

  private async flush(isUnloading = false) {
    if (this.buffer.length === 0) return;

    const data = [...this.buffer];
    this.buffer = [];

    try {
      const method = isUnloading ? 'sendBeacon' : 'fetch';
      
      if (method === 'sendBeacon' && navigator.sendBeacon) {
        navigator.sendBeacon(
          this.apiEndpoint,
          JSON.stringify({ metrics: data })
        );
      } else {
        await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ metrics: data }),
          keepalive: isUnloading,
        });
      }
    } catch (error) {
      console.error('Failed to send performance data:', error);
      // Put data back in buffer for retry
      this.buffer = [...data, ...this.buffer];
    }
  }

  // Manual flush method
  async flushNow() {
    await this.flush();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor(); 