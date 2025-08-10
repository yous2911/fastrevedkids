import React from 'react';

export interface LazyLoadOptions {
  preload?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

export const createLazyComponent = <T = any>(
  importFunction: () => Promise<{ default: React.ComponentType<T> }>,
  options: LazyLoadOptions = {}
) => {
  const { preload = false, retryDelay = 1000, maxRetries = 3 } = options;

  const lazyComponent = React.lazy(() => {
    let RETRY_COUNT = 0;
    
    const retryImport = async (): Promise<{ default: React.ComponentType<T> }> => {
      try {
        return await importFunction();
      } catch (error) {
        console.error(`Lazy loading failed (attempt ${RETRY_COUNT + 1}):`, error);
        
        if (RETRY_COUNT < maxRetries) {
          RETRY_COUNT++;
          console.log(`Retrying lazy load in ${retryDelay}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return retryImport();
        }
        
        throw error;
      }
    };

    return retryImport();
  });

  // Preload the component if requested
  if (preload) {
    importFunction().catch(error => {
      console.warn('Preload failed:', error);
    });
  }

  return lazyComponent;
};

export const preloadComponent = (importFunction: () => Promise<any>) => {
  return importFunction().catch(error => {
    console.warn('Component preload failed:', error);
  });
};

// Utility to preload multiple components
export const preloadComponents = (importFunctions: (() => Promise<any>)[]) => {
  return Promise.allSettled(
    importFunctions.map(fn => preloadComponent(fn))
  );
};

// Route-based preloading strategy
export const preloadRouteComponents = () => {
  // Preload likely next components based on user interaction patterns
  const HIGH_PRIORITY_COMPONENTS = [
    () => import('../pages/Dashboard'),
    () => import('../pages/Exercises')
  ];

  const LOW_PRIORITY_COMPONENTS = [
    () => import('../pages/Profile'),
    () => import('../pages/Progress'),
    () => import('../pages/AdminPanel')
  ];

  // Preload high priority immediately
  preloadComponents(HIGH_PRIORITY_COMPONENTS);

  // Preload low priority after a delay
  setTimeout(() => {
    preloadComponents(LOW_PRIORITY_COMPONENTS);
  }, 2000);
};