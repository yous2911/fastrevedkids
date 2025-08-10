import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  fps: number;
}

export function usePerformanceOptimization() {
  const metricsRef = useRef<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    networkLatency: 0,
    fps: 0
  });

  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());

  // Memory monitoring
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }, []);

  // FPS monitoring
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastFrameTimeRef.current >= 1000) {
      metricsRef.current.fps = Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }
    
    requestAnimationFrame(measureFPS);
  }, []);

  // Render time measurement
  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // More than 16ms (60fps threshold)
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      metricsRef.current.renderTime = renderTime;
    };
  }, []);

  // Network latency measurement
  const measureNetworkLatency = useCallback(async (url: string): Promise<number> => {
    const startTime = performance.now();
    
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      const latency = performance.now() - startTime;
      metricsRef.current.networkLatency = latency;
      return latency;
    } catch (error) {
      return -1;
    }
  }, []);

  // Optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (metricsRef.current.memoryUsage > 50) {
      suggestions.push('High memory usage detected. Consider reducing component complexity.');
    }
    
    if (metricsRef.current.renderTime > 16) {
      suggestions.push('Slow render times. Consider using React.memo or useMemo for heavy components.');
    }
    
    if (metricsRef.current.fps < 30) {
      suggestions.push('Low FPS detected. Reduce animations or use CSS transforms instead of JavaScript.');
    }
    
    if (metricsRef.current.networkLatency > 1000) {
      suggestions.push('High network latency. Implement better caching or offline capabilities.');
    }
    
    return suggestions;
  }, []);

  // Initialize monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      metricsRef.current.memoryUsage = getMemoryUsage();
    }, 5000);

    measureFPS();

    return () => clearInterval(interval);
  }, [getMemoryUsage, measureFPS]);

  return {
    metrics: metricsRef.current,
    measureRenderTime,
    measureNetworkLatency,
    getOptimizationSuggestions
  };
} 