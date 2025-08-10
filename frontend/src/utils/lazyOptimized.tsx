/**
 * Optimized Lazy Loading System
 * Handles component chunking, preloading, and intelligent loading strategies
 */

import React, { ComponentType, LazyExoticComponent, Suspense } from 'react';

interface LazyLoadConfig {
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  chunkName?: string;
  fallback?: ComponentType;
  retryCount?: number;
  timeout?: number;
  prefetch?: boolean;
}

interface ChunkInfo {
  component: LazyExoticComponent<ComponentType<any>>;
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  preloaded: boolean;
  lastUsed: number;
  loadTime: number;
}

interface LoadingStats {
  totalChunks: number;
  loadedChunks: number;
  failedChunks: number;
  averageLoadTime: number;
  cacheHitRate: number;
}

/**
 * Optimized lazy loading manager with intelligent preloading
 */
export class LazyLoadManager {
  private static instance: LazyLoadManager;
  private chunks = new Map<string, ChunkInfo>();
  private preloadQueue: string[] = [];
  private loadingPromises = new Map<string, Promise<any>>();
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    loadTimes: [] as number[]
  };

  private constructor() {
    this.setupIntersectionObserver();
    this.setupIdlePreloading();
  }

  public static getInstance(): LazyLoadManager {
    if (!LazyLoadManager.instance) {
      LazyLoadManager.instance = new LazyLoadManager();
    }
    return LazyLoadManager.instance;
  }

  /**
   * Create optimized lazy component with intelligent loading
   */
  public createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    config: LazyLoadConfig = {}
  ): LazyExoticComponent<T> {
    const {
      preload = false,
      priority = 'medium',
      chunkName = `chunk_${this.chunks.size}`,
      retryCount = 3,
      timeout = 10000,
      prefetch = false
    } = config;

    // Create lazy component with retry logic
    const lazyComponent = React.lazy(() => this.loadWithRetry(importFn, retryCount, timeout));

    // Store chunk info
    const chunkInfo: ChunkInfo = {
      component: lazyComponent,
      loaded: false,
      loading: false,
      error: null,
      preloaded: false,
      lastUsed: 0,
      loadTime: 0
    };

    this.chunks.set(chunkName, chunkInfo);

    // Handle preloading
    if (preload) {
      this.preloadComponent(chunkName, priority);
    }

    // Handle prefetching
    if (prefetch) {
      this.prefetchComponent(chunkName);
    }

    return lazyComponent;
  }

  /**
   * Preload component for faster loading
   */
  public async preloadComponent(chunkName: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const chunk = this.chunks.get(chunkName);
    if (!chunk || chunk.preloaded || chunk.loading) {
      return;
    }

    // Add to preload queue based on priority
    if (priority === 'high') {
      this.preloadQueue.unshift(chunkName);
    } else {
      this.preloadQueue.push(chunkName);
    }

    this.processPreloadQueue();
  }

  /**
   * Prefetch component for future use
   */
  public prefetchComponent(chunkName: string): void {
    const chunk = this.chunks.get(chunkName);
    if (!chunk || chunk.preloaded) return;

    // Use requestIdleCallback for prefetching
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadComponent(chunkName, 'low');
      });
    } else {
      setTimeout(() => {
        this.preloadComponent(chunkName, 'low');
      }, 1000);
    }
  }

  /**
   * Get loading statistics
   */
  public getStats(): LoadingStats {
    const chunks = Array.from(this.chunks.values());
    const averageLoadTime = this.stats.loadTimes.length > 0
      ? this.stats.loadTimes.reduce((sum, time) => sum + time, 0) / this.stats.loadTimes.length
      : 0;

    return {
      totalChunks: chunks.length,
      loadedChunks: chunks.filter(c => c.loaded).length,
      failedChunks: chunks.filter(c => c.error).length,
      averageLoadTime: Math.round(averageLoadTime),
      cacheHitRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100)
        : 0
    };
  }

  /**
   * Clear unused components from memory
   */
  public cleanup(maxAge: number = 300000): void { // 5 minutes default
    const now = Date.now();
    
    this.chunks.forEach((chunk, name) => {
      if (chunk.loaded && now - chunk.lastUsed > maxAge) {
        // Component hasn't been used recently, mark for cleanup
        // Note: We can't actually unload React lazy components,
        // but we can remove our tracking
        this.chunks.delete(name);
      }
    });
  }

  /**
   * Load component with retry logic
   */
  private async loadWithRetry<T>(
    importFn: () => Promise<{ default: T }>,
    retryCount: number,
    timeout: number
  ): Promise<{ default: T }> {
    const startTime = performance.now();
    
    for (let ATTEMPT = 0; ATTEMPT < retryCount; ATTEMPT++) {
      try {
        // Add timeout to the import
        const loadPromise = importFn();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Component load timeout')), timeout);
        });

        const result = await Promise.race([loadPromise, timeoutPromise]);
        
        // Track loading time
        const loadTime = performance.now() - startTime;
        this.stats.loadTimes.push(loadTime);

        return result;
      } catch (error) {
        console.warn(`Component load ATTEMPT ${ATTEMPT + 1} failed:`, error);
        
        if (ATTEMPT === retryCount - 1) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, ATTEMPT) * 1000));
      }
    }

    throw new Error('Component load failed after all retries');
  }

  /**
   * Process preload queue with CONCURRENCY control
   */
  private async processPreloadQueue(): Promise<void> {
    const CONCURRENCY = 2; // Load 2 components at a time
    
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, CONCURRENCY);
      
      const loadPromises = batch.map(async (chunkName) => {
        const chunk = this.chunks.get(chunkName);
        if (!chunk || chunk.preloaded || chunk.loading) return;

        chunk.loading = true;
        
        try {
          // Preload the component
          await (chunk.component as any)._payload._result;
          chunk.preloaded = true;
          chunk.loaded = true;
        } catch (error) {
          chunk.error = error as Error;
          console.warn(`Failed to preload component ${chunkName}:`, error);
        } finally {
          chunk.loading = false;
        }
      });

      await Promise.all(loadPromises);
      
      // Small delay between batches
      if (this.preloadQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Setup intersection observer for viewport-based loading
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const chunkName = entry.target.getAttribute('data-chunk');
            if (chunkName) {
              this.preloadComponent(chunkName, 'high');
            }
          }
        });
      },
      {
        rootMargin: '50px', // Load 50px before entering viewport
        threshold: 0.1
      }
    );

    // Make observer available globally for components to use
    (window as any).__lazyObserver = observer;
  }

  /**
   * Setup idle time preloading
   */
  private setupIdlePreloading(): void {
    if (typeof window === 'undefined') return;

    const preloadOnIdle = () => {
      // Preload medium priority components when browser is idle
      this.chunks.forEach((chunk, name) => {
        if (!chunk.preloaded && !chunk.loading) {
          this.preloadComponent(name, 'low');
        }
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadOnIdle, { timeout: 5000 });
    } else {
      setTimeout(preloadOnIdle, 2000);
    }
  }
}

/**
 * Higher-order component for optimized lazy loading
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  config: LazyLoadConfig & { 
    fallback?: ComponentType;
    errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  } = {}
) {
  const manager = LazyLoadManager.getInstance();
  const LazyComponent = manager.createLazyComponent(importFn, config);
  
  const fallback = config.fallback || (() => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  ));

  return function LazyWrapper(props: P) {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const handleRetry = React.useCallback(() => {
      setError(null);
      setRetryCount(prev => prev + 1);
    }, []);

    if (error && config.errorBoundary) {
      const ErrorBoundary = config.errorBoundary;
      return <ErrorBoundary error={error} retry={handleRetry} />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">Failed to load component</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <Suspense fallback={React.createElement(fallback)}>
        <LazyComponent key={retryCount} {...(props as any)} />
      </Suspense>
    );
  };
}

/**
 * Hook for viewport-based lazy loading
 */
export function useViewportLazyLoad(chunkName: string) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    const observer = (window as any).__lazyObserver;
    
    if (element && observer) {
      element.setAttribute('data-chunk', chunkName);
      observer.observe(element);
      
      return () => {
        observer.unobserve(element);
      };
    }
  }, [chunkName]);

  return ref;
}

/**
 * Pre-configured lazy components for common use cases
 */
export const LazyComponents = {
  // Heavy 3D components
  ThreeDMascot: withLazyLoading(
    () => import('../components/CrossBrowserMascot3D'),
    {
      chunkName: 'threeDMascot',
      priority: 'high',
      preload: false,
      prefetch: true
    }
  ),

  // Wardrobe system
  WardrobeSystem: withLazyLoading(
    () => import('../components/WardrobeSystem'),
    {
      chunkName: 'wardrobeSystem',
      priority: 'medium',
      preload: false,
      prefetch: true
    }
  ),

  // Physics system
  PhysicsSystem: withLazyLoading(
    () => import('../components/physics/PhysicsSystemManager'),
    {
      chunkName: 'physicsSystem',
      priority: 'medium',
      preload: false,
      prefetch: false
    }
  ),

  // Advanced particle engine
  ParticleEngine: withLazyLoading(
    () => import('../components/ui/AdvancedParticleEngine'),
    {
      chunkName: 'particleEngine',
      priority: 'low',
      preload: false,
      prefetch: true
    }
  ),

  // XP system with animations
  XPSystem: withLazyLoading(
    () => import('../components/ui/RobustXPSystem'),
    {
      chunkName: 'xpSystem',
      priority: 'high',
      preload: true,
      prefetch: false
    }
  ),

  // Test suites (only load when needed)
  CrossBrowserTest: withLazyLoading(
    () => import('../pages/CrossBrowserTestSuite'),
    {
      chunkName: 'crossBrowserTest',
      priority: 'low',
      preload: false,
      prefetch: false
    }
  ),

  ErrorHandlingTest: withLazyLoading(
    () => import('../pages/ErrorHandlingTestSuite'),
    {
      chunkName: 'errorHandlingTest',
      priority: 'low',
      preload: false,
      prefetch: false
    }
  ),

  ComprehensiveTest: withLazyLoading(
    () => import('../pages/ComprehensiveTestSuite'),
    {
      chunkName: 'comprehensiveTest',
      priority: 'low',
      preload: false,
      prefetch: false
    }
  )
};

/**
 * Bundle analyzer helper
 */
export const BundleAnalyzer = {
  getChunkSizes: (): Record<string, number> => {
    // This would integrate with webpack-bundle-analyzer in a real setup
    return {
      'threeDMascot': 150, // KB
      'wardrobeSystem': 80,
      'physicsSystem': 60,
      'particleEngine': 45,
      'xpSystem': 70,
      'crossBrowserTest': 25,
      'errorHandlingTest': 30,
      'comprehensiveTest': 35
    };
  },

  getOptimizationSuggestions: (): string[] => {
    const SUGGESTIONS = [];
    const chunkSizes = BundleAnalyzer.getChunkSizes();
    
    Object.entries(chunkSizes).forEach(([chunk, size]) => {
      if (size > 100) {
        (SUGGESTIONS as string[]).push(`Consider splitting ${chunk} (${size}KB) into smaller chunks`);
      }
    });

    return SUGGESTIONS;
  },

  getTotalBundleSize: (): number => {
    const chunkSizes = BundleAnalyzer.getChunkSizes();
    return Object.values(chunkSizes).reduce((total, size) => total + size, 0);
  }
};

// Export singleton instance
export const lazyManager = LazyLoadManager.getInstance();

/**
 * Utility for creating route-based code splitting
 */
export const createLazyRoute = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  routeName: string
) => {
  return withLazyLoading(importFn, {
    chunkName: `route_${routeName}`,
    priority: 'high',
    preload: false,
    prefetch: true,
    fallback: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {routeName}...</p>
        </div>
      </div>
    )
  });
};