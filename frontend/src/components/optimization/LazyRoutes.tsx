/**
 * Advanced Lazy Loading Route System
 * Implements intelligent preloading, error boundaries, and performance monitoring
 */

import React, { Suspense, ComponentType, Component, ReactNode } from 'react';
import { LazyLoadManager } from '../../utils/lazyOptimized';

interface LazyRouteConfig {
  component: () => Promise<{ default: ComponentType<any> }>;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  fallback?: ComponentType;
  errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  chunkName?: string;
}

/**
 * High-performance lazy loading components
 */
const lazyManager = LazyLoadManager.getInstance();

// Loading fallback components
const QuickLoader = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  </div>
);

const DetailedLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-600 animate-pulse">Loading component...</p>
  </div>
);

const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-400">
    <div className="text-center text-white">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
      <h2 className="text-2xl font-bold mb-2">Loading...</h2>
      <p className="text-purple-100">Preparing your experience</p>
    </div>
  </div>
);

// Error boundary for lazy loaded components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error!}
            retry={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Component</h3>
          <p className="text-gray-600 mb-4">There was an error loading this part of the application.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Create optimized lazy component
 */
function createLazyRoute(config: LazyRouteConfig) {
  const LazyComponent = lazyManager.createLazyComponent(config.component, {
    preload: config.preload,
    priority: config.priority,
    chunkName: config.chunkName,
  });

  const fallback = config.fallback || DetailedLoader;

  return function LazyRoute(props: any) {
    return (
      <LazyErrorBoundary fallback={config.errorBoundary}>
        <Suspense fallback={<fallback />}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyErrorBoundary>
    );
  };
}

/**
 * Optimized lazy route components
 */

// Core Pages (high priority, preloaded)
export const DashboardLazy = createLazyRoute({
  component: () => import('../../pages/Dashboard'),
  preload: true,
  priority: 'high',
  chunkName: 'dashboard',
  fallback: FullScreenLoader,
});

export const ExercisesLazy = createLazyRoute({
  component: () => import('../../pages/Exercises'),
  preload: true,
  priority: 'high',
  chunkName: 'exercises',
  fallback: DetailedLoader,
});

// Secondary Pages (medium priority)
export const ProfileLazy = createLazyRoute({
  component: () => import('../../pages/Profile'),
  priority: 'medium',
  chunkName: 'profile',
  fallback: DetailedLoader,
});

export const ProgressLazy = createLazyRoute({
  component: () => import('../../pages/Progress'),
  priority: 'medium',
  chunkName: 'progress',
  fallback: DetailedLoader,
});

// Admin Panel (low priority, admin only)
export const AdminPanelLazy = createLazyRoute({
  component: () => import('../../pages/AdminPanel'),
  priority: 'low',
  chunkName: 'admin',
  fallback: FullScreenLoader,
});

// Heavy 3D Components (lazy loaded on demand)
export const MascotSystemLazy = createLazyRoute({
  component: () => import('../../components/CrossBrowserMascot3D'),
  priority: 'low',
  chunkName: 'mascot-3d',
  fallback: DetailedLoader,
});

export const WardrobeSystemLazy = createLazyRoute({
  component: () => import('../../components/WardrobeSystem'),
  priority: 'low',
  chunkName: 'wardrobe-3d',
  fallback: DetailedLoader,
});

export const CrossBrowserMascot3DLazy = createLazyRoute({
  component: () => import('../../components/CrossBrowserMascot3D'),
  priority: 'low',
  chunkName: 'mascot-cross-browser',
  fallback: DetailedLoader,
});

// Test Suites (development only, very low priority)
export const ExerciseEngineTestLazy = createLazyRoute({
  component: () => import('../../pages/ExerciseEngineTest'),
  priority: 'low',
  chunkName: 'test-exercise-engine',
  fallback: QuickLoader,
});

export const XPSystemThemeTestLazy = createLazyRoute({
  component: () => import('../../pages/XPSystemThemeTest'),
  priority: 'low',
  chunkName: 'test-xp-theme',
  fallback: QuickLoader,
});

export const WardrobeSystemTestLazy = createLazyRoute({
  component: () => import('../../pages/WardrobeSystemTest'),
  priority: 'low',
  chunkName: 'test-wardrobe',
  fallback: QuickLoader,
});

export const ComprehensiveTestSuiteLazy = createLazyRoute({
  component: () => import('../../pages/ComprehensiveTestSuite'),
  priority: 'low',
  chunkName: 'test-comprehensive',
  fallback: QuickLoader,
});

export const CrossBrowserTestSuiteLazy = createLazyRoute({
  component: () => import('../../pages/CrossBrowserTestSuite'),
  priority: 'low',
  chunkName: 'test-cross-browser',
  fallback: QuickLoader,
});

export const ErrorHandlingTestSuiteLazy = createLazyRoute({
  component: () => import('../../pages/ErrorHandlingTestSuite'),
  priority: 'low',
  chunkName: 'test-error-handling',
  fallback: QuickLoader,
});

// Analytics and Debug Components (admin/dev only)
export const AnalyticsDashboardLazy = createLazyRoute({
  component: () => import('../../components/analytics/AnalyticsDashboard'),
  priority: 'low',
  chunkName: 'analytics-dashboard',
  fallback: DetailedLoader,
});

export const AIStateVisualizationLazy = createLazyRoute({
  component: () => import('../../components/debug/AIStateVisualizationDashboard'),
  priority: 'low',
  chunkName: 'ai-debug',
  fallback: DetailedLoader,
});

export const Scene3DInspectorLazy = createLazyRoute({
  component: () => import('../../components/debug/Scene3DInspector'),
  priority: 'low',
  chunkName: '3d-inspector',
  fallback: DetailedLoader,
});

/**
 * Preloading strategies
 */

// Preload critical components immediately
export const preloadCriticalComponents = () => {
  lazyManager.preloadComponent('dashboard', 'high');
  lazyManager.preloadComponent('exercises', 'high');
};

// Preload based on user role
export const preloadRoleBasedComponents = (userRole: 'student' | 'teacher' | 'admin') => {
  const componentMap = {
    student: ['profile', 'progress'],
    teacher: ['profile', 'progress', 'analytics-dashboard'],
    admin: ['profile', 'progress', 'analytics-dashboard', 'admin', 'ai-debug'],
  };

  const components = componentMap[userRole] || [];
  components.forEach(component => {
    lazyManager.preloadComponent(component, 'medium');
  });
};

// Preload based on user interaction patterns
export const preloadBasedOnInteraction = (interactionHistory: string[]) => {
  // Analyze patterns and preload likely next components
  const frequentComponents = interactionHistory
    .filter(action => action.includes('navigate'))
    .map(action => action.split(':')[1])
    .reduce((acc, component) => {
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  Object.entries(frequentComponents)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3) // Top 3 most accessed
    .forEach(([component]) => {
      lazyManager.preloadComponent(component, 'medium');
    });
};

/**
 * Performance monitoring
 */
export const monitorLazyLoadingPerformance = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.entryType === 'navigation') {
        console.log('📊 Page load time:', entry.duration);
      }
      if (entry.entryType === 'resource' && entry.name.includes('chunk')) {
        console.log('📦 Chunk load time:', entry.name, entry.duration);
      }
    });
  });

  observer.observe({ entryTypes: ['navigation', 'resource'] });
  
  return () => observer.disconnect();
};