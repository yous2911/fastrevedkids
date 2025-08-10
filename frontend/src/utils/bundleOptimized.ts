/**
 * Bundle Optimization Configuration
 * Central configuration for all optimization strategies
 */

import { animationManager } from './animationOptimized';
import { assetManager } from './assetOptimized';
import { styleManager } from './cssOptimized';
import { lazyManager } from './lazyOptimized';

interface OptimizationConfig {
  animations: {
    enabled: boolean;
    performanceMode: 'performance' | 'balanced' | 'battery';
    maxConcurrentAnimations: number;
    throttleFrameRate: boolean;
  };
  assets: {
    compressionEnabled: boolean;
    maxCacheSize: number; // MB
    preloadCriticalAssets: boolean;
    lazyLoadThreshold: number; // viewport percentage
  };
  styles: {
    cssInJsCaching: boolean;
    staticExtraction: boolean;
    criticalCSSInline: boolean;
    themeOptimization: boolean;
  };
  chunks: {
    routeSplitting: boolean;
    componentSplitting: boolean;
    preloadCritical: boolean;
    prefetchOnIdle: boolean;
  };
  general: {
    enableServiceWorker: boolean;
    enableGzip: boolean;
    enableBrotli: boolean;
    treeshaking: boolean;
  };
}

interface BundleStats {
  totalSize: number; // KB
  gzippedSize: number; // KB
  chunkCount: number;
  optimizationSavings: number; // KB
  loadTime: number; // ms
  renderTime: number; // ms
}

/**
 * Central bundle optimization manager
 */
export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private config: OptimizationConfig;
  private stats: BundleStats;
  private initialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.stats = this.initStats();
  }

  public static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer();
    }
    return BundleOptimizer.instance;
  }

  /**
   * Initialize all optimization systems
   */
  public async initialize(customConfig?: Partial<OptimizationConfig>): Promise<void> {
    if (this.initialized) return;

    // Merge custom config
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    console.log('🚀 Initializing bundle optimizations...');

    // Initialize animation system
    if (this.config.animations.enabled) {
      animationManager.setPerformanceMode(this.config.animations.performanceMode);
      console.log('✅ Animation optimization initialized');
    }

    // Initialize asset management
    if (this.config.assets.compressionEnabled) {
      assetManager.setCacheLimit(this.config.assets.maxCacheSize);
      await this.preloadCriticalAssets();
      console.log('✅ Asset optimization initialized');
    }

    // Initialize CSS optimization
    if (this.config.styles.cssInJsCaching) {
      // CSS system is initialized on first use
      console.log('✅ CSS optimization initialized');
    }

    // Initialize lazy loading
    if (this.config.chunks.componentSplitting) {
      // Lazy loading system is initialized on first use
      console.log('✅ Lazy loading optimization initialized');
    }

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    this.initialized = true;
    console.log('🎉 All optimizations initialized successfully!');
    
    // Log initial stats
    this.logOptimizationStats();
  }

  /**
   * Get current optimization configuration
   */
  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update optimization configuration
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyConfigChanges();
  }

  /**
   * Get current bundle statistics
   */
  public getStats(): BundleStats {
    return { ...this.stats };
  }

  /**
   * Get optimization recommendations based on current performance
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Animation recommendations
    const animStats = animationManager.getStats();
    if (animStats.averageFPS < 30) {
      recommendations.push('Consider reducing animation complexity or enabling battery mode');
    }

    // Asset recommendations
    const assetStats = assetManager.getStats();
    if (assetStats.cacheSize > this.config.assets.maxCacheSize * 0.9) {
      recommendations.push('Asset cache is nearly full, consider increasing cache size or clearing unused assets');
    }

    // CSS recommendations
    const styleStats = styleManager.getStats();
    if (styleStats.cacheSize > 100) {
      recommendations.push('Large number of cached styles, consider enabling static extraction');
    }

    // Lazy loading recommendations
    const lazyStats = lazyManager.getStats();
    if (lazyStats.averageLoadTime > 1000) {
      recommendations.push('Slow component loading detected, consider preloading critical components');
    }

    // Bundle size recommendations
    if (this.stats.totalSize > 1000) {
      recommendations.push('Large bundle size detected, consider enabling more aggressive code splitting');
    }

    return recommendations;
  }

  /**
   * Run optimization analysis and return report
   */
  public async runOptimizationAnalysis(): Promise<{
    currentStats: BundleStats;
    recommendations: string[];
    potentialSavings: number;
    criticalIssues: string[];
  }> {
    const recommendations = this.getRecommendations();
    const criticalIssues = this.getCriticalIssues();
    const potentialSavings = this.calculatePotentialSavings();

    return {
      currentStats: this.getStats(),
      recommendations,
      potentialSavings,
      criticalIssues
    };
  }

  /**
   * Export optimization configuration for webpack/build tools
   */
  public exportWebpackConfig(): any {
    return {
      optimization: {
        splitChunks: this.config.chunks.routeSplitting ? {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            three: {
              test: /[\\/]node_modules[\\/]three[\\/]/,
              name: 'three',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        } : false,
        usedExports: this.config.general.treeshaking,
        sideEffects: false,
      },
      resolve: {
        alias: {
          // Use optimized Three.js imports
          'three': './src/utils/threeOptimized',
        },
      },
      module: {
        rules: [
          // CSS optimization rules
          {
            test: /\.css$/,
            use: this.config.styles.staticExtraction ? [
              'style-loader',
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: [
                      'autoprefixer',
                      'cssnano',
                    ],
                  },
                },
              },
            ] : ['style-loader', 'css-loader'],
          },
        ],
      },
      plugins: [
        // Bundle analyzer plugin configuration
        ...(process.env.ANALYZE ? [
          {
            apply: (compiler: any) => {
              compiler.hooks.done.tap('BundleAnalyzer', () => {
                this.logBundleAnalysis();
              });
            }
          }
        ] : []),
      ],
    };
  }

  /**
   * Get default optimization configuration
   */
  private getDefaultConfig(): OptimizationConfig {
    // Detect device capabilities for optimal defaults
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = (navigator as any).deviceMemory < 4 || navigator.hardwareConcurrency < 4;

    return {
      animations: {
        enabled: true,
        performanceMode: isLowEnd ? 'battery' : isMobile ? 'balanced' : 'performance',
        maxConcurrentAnimations: isLowEnd ? 5 : 10,
        throttleFrameRate: isLowEnd || isMobile,
      },
      assets: {
        compressionEnabled: true,
        maxCacheSize: isLowEnd ? 25 : 50,
        preloadCriticalAssets: !isMobile,
        lazyLoadThreshold: 0.1,
      },
      styles: {
        cssInJsCaching: true,
        staticExtraction: true,
        criticalCSSInline: true,
        themeOptimization: true,
      },
      chunks: {
        routeSplitting: true,
        componentSplitting: true,
        preloadCritical: !isMobile,
        prefetchOnIdle: true,
      },
      general: {
        enableServiceWorker: 'serviceWorker' in navigator,
        enableGzip: true,
        enableBrotli: true,
        treeshaking: true,
      },
    };
  }

  /**
   * Initialize bundle statistics
   */
  private initStats(): BundleStats {
    return {
      totalSize: 0,
      gzippedSize: 0,
      chunkCount: 0,
      optimizationSavings: 0,
      loadTime: 0,
      renderTime: 0,
    };
  }

  /**
   * Preload critical assets
   */
  private async preloadCriticalAssets(): Promise<void> {
    if (!this.config.assets.preloadCriticalAssets) return;

    // Define critical assets
    const CRITICAL_ASSETS = [
      'wizard_hat',
      'magic_glasses',
      'superhero_cape'
    ];

    // Import asset configurations
    const { WARDROBE_ASSETS } = await import('./assetOptimized');
    
    // Preload critical assets
    assetManager.preloadAssets(CRITICAL_ASSETS, WARDROBE_ASSETS);
  }

  /**
   * Apply configuration changes to all systems
   */
  private applyConfigChanges(): void {
    // Update animation system
    animationManager.setPerformanceMode(this.config.animations.performanceMode);
    
    // Update asset system
    assetManager.setCacheLimit(this.config.assets.maxCacheSize);
    
    // Style system updates are applied automatically through the config
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    if ('web-vitals' in window) {
      // This would integrate with web-vitals library
      console.log('📊 Performance monitoring enabled');
    }

    // Monitor bundle loading
    if (performance.mark) {
      performance.mark('bundle-optimization-start');
      
      setTimeout(() => {
        performance.mark('bundle-optimization-end');
        performance.measure('bundle-optimization', 'bundle-optimization-start', 'bundle-optimization-end');
        
        const measure = performance.getEntriesByName('bundle-optimization')[0];
        if (measure) {
          console.log(`⚡ Bundle optimization completed in ${measure.duration.toFixed(2)}ms`);
        }
      }, 100);
    }
  }

  /**
   * Get critical performance issues
   */
  private getCriticalIssues(): string[] {
    const issues: string[] = [];
    
    // Check animation performance
    const animStats = animationManager.getStats();
    if (animStats.averageFPS < 20) {
      issues.push('Critical: Very low frame rate detected');
    }

    // Check memory usage
    const assetStats = assetManager.getStats();
    if (assetStats.cacheSize > this.config.assets.maxCacheSize) {
      issues.push('Critical: Asset cache limit exceeded');
    }

    // Check bundle size
    if (this.stats.totalSize > 2000) {
      issues.push('Critical: Bundle size is very large (>2MB)');
    }

    return issues;
  }

  /**
   * Calculate potential SAVINGS from optimizations
   */
  private calculatePotentialSavings(): number {
    let SAVINGS = 0;

    // Estimate SAVINGS from tree-shaking Three.js
    if (!this.config.general.treeshaking) {
      SAVINGS += 420; // KB saved from Three.js optimization
    }

    // Estimate SAVINGS from asset compression
    if (!this.config.assets.compressionEnabled) {
      SAVINGS += 200; // Estimated asset compression SAVINGS
    }

    // Estimate SAVINGS from CSS optimization
    if (!this.config.styles.staticExtraction) {
      SAVINGS += 50; // CSS optimization SAVINGS
    }

    return SAVINGS;
  }

  /**
   * Log comprehensive optimization statistics
   */
  private logOptimizationStats(): void {
    const animStats = animationManager.getStats();
    const assetStats = assetManager.getStats();
    const styleStats = styleManager.getStats();
    const lazyStats = lazyManager.getStats();

    console.group('📈 Bundle Optimization Stats');
    console.log('Animations:', {
      activeCallbacks: animStats.activeCallbacks,
      averageFPS: animStats.averageFPS,
      cpuUsage: animStats.cpuUsage + '%'
    });
    console.log('Assets:', {
      loadedAssets: assetStats.loadedAssets,
      cacheSize: assetStats.cacheSize + 'MB',
      hitRate: assetStats.hitRate + '%'
    });
    console.log('Styles:', {
      cacheSize: styleStats.cacheSize,
      hitRate: styleStats.cacheHitRate + '%'
    });
    console.log('Lazy Loading:', {
      loadedChunks: lazyStats.loadedChunks,
      averageLoadTime: lazyStats.averageLoadTime + 'ms',
      cacheHitRate: lazyStats.cacheHitRate + '%'
    });
    console.groupEnd();
  }

  /**
   * Log bundle analysis information
   */
  private logBundleAnalysis(): void {
    console.group('📦 Bundle Analysis');
    console.log('Total Size:', this.stats.totalSize + 'KB');
    console.log('Gzipped Size:', this.stats.gzippedSize + 'KB');
    console.log('Chunk Count:', this.stats.chunkCount);
    console.log('Optimization Savings:', this.stats.optimizationSavings + 'KB');
    console.groupEnd();
  }
}

/**
 * Optimization presets for different scenarios
 */
export const OptimizationPresets = {
  // Maximum performance for high-end devices
  performance: {
    animations: {
      enabled: true,
      performanceMode: 'performance' as const,
      maxConcurrentAnimations: 15,
      throttleFrameRate: false,
    },
    assets: {
      compressionEnabled: true,
      maxCacheSize: 100,
      preloadCriticalAssets: true,
      lazyLoadThreshold: 0.2,
    },
    styles: {
      cssInJsCaching: true,
      staticExtraction: true,
      criticalCSSInline: true,
      themeOptimization: true,
    },
    chunks: {
      routeSplitting: true,
      componentSplitting: true,
      preloadCritical: true,
      prefetchOnIdle: true,
    },
  },

  // Balanced for most devices
  balanced: {
    animations: {
      enabled: true,
      performanceMode: 'balanced' as const,
      maxConcurrentAnimations: 10,
      throttleFrameRate: true,
    },
    assets: {
      compressionEnabled: true,
      maxCacheSize: 50,
      preloadCriticalAssets: true,
      lazyLoadThreshold: 0.1,
    },
    styles: {
      cssInJsCaching: true,
      staticExtraction: true,
      criticalCSSInline: true,
      themeOptimization: true,
    },
    chunks: {
      routeSplitting: true,
      componentSplitting: true,
      preloadCritical: false,
      prefetchOnIdle: true,
    },
  },

  // Battery optimized for low-end devices
  battery: {
    animations: {
      enabled: true,
      performanceMode: 'battery' as const,
      maxConcurrentAnimations: 5,
      throttleFrameRate: true,
    },
    assets: {
      compressionEnabled: true,
      maxCacheSize: 25,
      preloadCriticalAssets: false,
      lazyLoadThreshold: 0.05,
    },
    styles: {
      cssInJsCaching: true,
      staticExtraction: true,
      criticalCSSInline: true,
      themeOptimization: false,
    },
    chunks: {
      routeSplitting: true,
      componentSplitting: true,
      preloadCritical: false,
      prefetchOnIdle: false,
    },
  },
};

// Export singleton instance
export const bundleOptimizer = BundleOptimizer.getInstance();

/**
 * Initialize optimizations with auto-detected preset
 */
// Add initialization function here if needed

/**
 * Utility to measure and log performance impact
 */
export const measureOptimizationImpact = (name: string, fn: () => void | Promise<void>) => {
  return async () => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    console.log(`⚡ ${name} completed in ${(end - start).toFixed(2)}ms`);
  };
};