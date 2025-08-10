/**
 * Optimized Asset Management System
 * Handles texture compression, lazy loading, and efficient caching
 */

interface AssetConfig {
  url: string;
  priority: 'high' | 'medium' | 'low';
  format: 'webp' | 'jpg' | 'png';
  sizes?: number[]; // Different resolutions
  compressed?: boolean;
  lazy?: boolean;
}

interface TextureAsset {
  id: string;
  texture: any; // Three.js Texture
  size: number;
  loaded: boolean;
  loading: boolean;
  error?: Error;
  lastUsed: number;
  references: number;
}

interface AssetStats {
  totalAssets: number;
  loadedAssets: number;
  cacheSize: number; // in MB
  hitRate: number;
  compressionRatio: number;
}

/**
 * Optimized texture loader with compression and caching
 */
export class OptimizedAssetManager {
  private static instance: OptimizedAssetManager;
  private assetCache = new Map<string, TextureAsset>();
  private loadingPromises = new Map<string, Promise<any>>();
  private preloadQueue: string[] = [];
  private maxCacheSize = 50; // MB
  private compressionLevel = 0.8;
  private supportedFormats: string[] = [];
  private loadingStats = {
    totalRequests: 0,
    cacheHits: 0,
    compressionSavings: 0
  };

  private constructor() {
    this.detectSupportedFormats();
    this.setupMemoryManagement();
  }

  public static getInstance(): OptimizedAssetManager {
    if (!OptimizedAssetManager.instance) {
      OptimizedAssetManager.instance = new OptimizedAssetManager();
    }
    return OptimizedAssetManager.instance;
  }

  /**
   * Load texture with optimization
   */
  public async loadTexture(
    id: string,
    config: AssetConfig
  ): Promise<any> {
    this.loadingStats.totalRequests++;

    // Check cache first
    const cached = this.assetCache.get(id);
    if (cached?.loaded) {
      cached.lastUsed = Date.now();
      cached.references++;
      this.loadingStats.cacheHits++;
      return cached.texture;
    }

    // Check if already loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id);
    }

    // Start loading
    const loadingPromise = this.performAssetLoad(id, config);
    this.loadingPromises.set(id, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(id);
      return result;
    } catch (error) {
      this.loadingPromises.delete(id);
      throw error;
    }
  }

  /**
   * Preload assets for better performance
   */
  public preloadAssets(assetIds: string[], configs: Record<string, AssetConfig>): void {
    // Sort by priority
    const sortedIds = assetIds.sort((a, b) => {
      const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
      const aPriority = configs[a]?.priority || 'medium';
      const bPriority = configs[b]?.priority || 'medium';
      return PRIORITY_ORDER[aPriority] - PRIORITY_ORDER[bPriority];
    });

    this.preloadQueue.push(...sortedIds);
    this.processPreloadQueue(configs);
  }

  /**
   * Get optimized texture URL based on device capabilities
   */
  public getOptimizedUrl(baseUrl: string, config: AssetConfig): string {
    // Detect optimal format
    const format = this.getOptimalFormat(config.format);
    
    // Detect optimal size based on device
    const optimalSize = this.getOptimalSize(config.sizes);
    
    // Build optimized URL
    let optimizedUrl = baseUrl;
    
    // Replace extension with optimal format
    if (format !== config.format) {
      optimizedUrl = optimizedUrl.replace(/\.\w+$/, `.${format}`);
    }
    
    // Add size suffix if needed
    if (optimalSize && config.sizes) {
      optimizedUrl = optimizedUrl.replace(/(\.\w+)$/, `_${optimalSize}$1`);
    }
    
    return optimizedUrl;
  }

  /**
   * Release texture and clean up references
   */
  public releaseTexture(id: string): void {
    const asset = this.assetCache.get(id);
    if (asset) {
      asset.references = Math.max(0, asset.references - 1);
      
      // If no more references, mark for cleanup
      if (asset.references === 0) {
        setTimeout(() => {
          if (asset.references === 0) {
            this.disposeAsset(id);
          }
        }, 30000); // 30 second grace period
      }
    }
  }

  /**
   * Get asset loading statistics
   */
  public getStats(): AssetStats {
    const totalAssets = this.assetCache.size;
    const loadedAssets = Array.from(this.assetCache.values()).filter(a => a.loaded).length;
    const cacheSize = this.calculateCacheSize();
    const hitRate = this.loadingStats.totalRequests > 0 
      ? (this.loadingStats.cacheHits / this.loadingStats.totalRequests) * 100 
      : 0;

    return {
      totalAssets,
      loadedAssets,
      cacheSize,
      hitRate: Math.round(hitRate),
      compressionRatio: this.loadingStats.compressionSavings
    };
  }

  /**
   * Clear cache and free memory
   */
  public clearCache(): void {
    this.assetCache.forEach((asset, id) => {
      this.disposeAsset(id);
    });
    this.assetCache.clear();
    this.loadingPromises.clear();
    this.preloadQueue.length = 0;
  }

  /**
   * Set cache size limit
   */
  public setCacheLimit(sizeInMB: number): void {
    this.maxCacheSize = sizeInMB;
    this.enforceMemoryLimits();
  }

  /**
   * Perform the actual asset loading with optimization
   */
  private async performAssetLoad(id: string, config: AssetConfig): Promise<any> {
    const optimizedUrl = this.getOptimizedUrl(config.url, config);
    
    try {
      // Create asset entry
      const asset: TextureAsset = {
        id,
        texture: null,
        size: 0,
        loaded: false,
        loading: true,
        lastUsed: Date.now(),
        references: 1
      };
      this.assetCache.set(id, asset);

      // Load with compression if supported
      const texture = await this.loadWithCompression(optimizedUrl, config);
      
      // Update asset
      asset.texture = texture;
      asset.loaded = true;
      asset.loading = false;
      asset.size = this.estimateTextureSize(texture);

      // Enforce memory limits
      this.enforceMemoryLimits();

      return texture;

    } catch (error) {
      // Handle loading error
      const asset = this.assetCache.get(id);
      if (asset) {
        asset.loading = false;
        asset.error = error as Error;
      }
      
      console.error(`Failed to load asset ${id}:`, error);
      throw error;
    }
  }

  /**
   * Load texture with compression optimization
   */
  private async loadWithCompression(url: string, config: AssetConfig): Promise<any> {
    // For web, we'll use canvas-based compression
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          let texture;
          
          if (config.compressed && this.shouldCompress(img)) {
            texture = this.compressImage(img);
          } else {
            // Create texture directly from image
            texture = this.createTextureFromImage(img);
          }
          
          resolve(texture);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }

  /**
   * Compress image using canvas
   */
  private compressImage(img: HTMLImageElement): any {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return this.createTextureFromImage(img);
    }

    // Calculate optimal size
    const maxSize = this.getMaxTextureSize();
    let { width, height } = this.calculateOptimalDimensions(
      img.width,
      img.height,
      maxSize
    );

    canvas.width = width;
    canvas.height = height;
    
    // Draw with antialiasing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to compressed format
    const compressedDataUrl = canvas.toDataURL('image/jpeg', this.compressionLevel);
    
    // Calculate compression savings
    const originalSize = img.width * img.height * 4; // Assume 4 bytes per pixel
    const compressedSize = width * height * 3; // JPEG is 3 bytes per pixel
    this.loadingStats.compressionSavings += (originalSize - compressedSize) / 1024 / 1024;
    
    return this.createTextureFromDataUrl(compressedDataUrl);
  }

  /**
   * Create Three.js texture from image
   */
  private createTextureFromImage(img: HTMLImageElement): any {
    // This would create a Three.js texture in a real implementation
    // For now, returning a mock texture object
    return {
      image: img,
      needsUpdate: true,
      format: 'RGBA',
      type: 'UnsignedByte',
      generateMipmaps: true,
      minFilter: 'LinearMipmapLinear',
      magFilter: 'Linear',
      wrapS: 'ClampToEdge',
      wrapT: 'ClampToEdge',
      dispose: () => {
        // Cleanup logic would go here
      }
    };
  }

  /**
   * Create texture from data URL
   */
  private createTextureFromDataUrl(dataUrl: string): any {
    const img = new Image();
    img.src = dataUrl;
    return this.createTextureFromImage(img);
  }

  /**
   * Process preload queue
   */
  private async processPreloadQueue(configs: Record<string, AssetConfig>): Promise<void> {
    const CONCURRENT_LOADS = 3; // Limit concurrent preloads
    
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, CONCURRENT_LOADS);
      
      const loadPromises = batch.map(id => {
        const config = configs[id];
        if (config && !this.assetCache.has(id)) {
          return this.loadTexture(id, config).catch(error => {
            console.warn(`Preload failed for ${id}:`, error);
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(loadPromises);
      
      // Small delay between batches to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Detect supported image FORMATS
   */
  private detectSupportedFormats(): void {
    const canvas = document.createElement('canvas');
    const FORMATS = ['webp', 'jpg', 'png'];
    
    this.supportedFormats = FORMATS.filter(format => {
      try {
        return canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`);
      } catch {
        return false;
      }
    });
  }

  /**
   * Get optimal format based on support and config
   */
  private getOptimalFormat(preferredFormat: string): string {
    // Prefer WebP if supported for better compression
    if (this.supportedFormats.includes('webp') && preferredFormat !== 'png') {
      return 'webp';
    }
    
    return this.supportedFormats.includes(preferredFormat) 
      ? preferredFormat 
      : 'jpg'; // Fallback
  }

  /**
   * Get optimal size based on device capabilities
   */
  private getOptimalSize(sizes?: number[]): number | undefined {
    if (!sizes || sizes.length === 0) return undefined;
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    const maxTextureSize = this.getMaxTextureSize();
    
    // Choose size based on device capabilities
    if (devicePixelRatio >= 3) {
      return Math.min(sizes[sizes.length - 1], maxTextureSize); // Highest quality
    } else if (devicePixelRatio >= 2) {
      return Math.min(sizes[Math.floor(sizes.length / 2)], maxTextureSize); // Medium quality
    } else {
      return Math.min(sizes[0], maxTextureSize); // Lowest quality
    }
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    width: number, 
    height: number, 
    maxSize: number
  ): { width: number; height: number } {
    if (width <= maxSize && height <= maxSize) {
      return { width, height };
    }
    
    const aspectRatio = width / height;
    
    if (width > height) {
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio)
      };
    } else {
      return {
        width: Math.round(maxSize * aspectRatio),
        height: maxSize
      };
    }
  }

  /**
   * Get maximum texture size for current device
   */
  private getMaxTextureSize(): number {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl && 'getParameter' in gl) {
      const webglContext = gl as WebGLRenderingContext;
      return webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE);
    }
    
    // Fallback for non-WebGL devices
    return 1024;
  }

  /**
   * Determine if image should be compressed
   */
  private shouldCompress(img: HTMLImageElement): boolean {
    const SIZE_THRESHOLD = 512; // Compress images larger than 512px
    const FILE_SIZE_THRESHOLD = 100 * 1024; // Compress if estimated size > 100KB
    
    const estimatedSize = img.width * img.height * 4; // 4 bytes per pixel
    
    return (img.width > SIZE_THRESHOLD || img.height > SIZE_THRESHOLD) ||
           estimatedSize > FILE_SIZE_THRESHOLD;
  }

  /**
   * Estimate texture memory usage
   */
  private estimateTextureSize(texture: any): number {
    if (!texture.image) return 0;
    
    const { width, height } = texture.image;
    const BYTES_PER_PIXEL = 4; // RGBA
    return (width * height * BYTES_PER_PIXEL) / 1024 / 1024; // Size in MB
  }

  /**
   * Calculate total cache size
   */
  private calculateCacheSize(): number {
    let TOTAL_SIZE = 0;
    this.assetCache.forEach(asset => {
      if (asset.loaded) {
        TOTAL_SIZE += asset.size;
      }
    });
    return Math.round(TOTAL_SIZE * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Enforce memory limits by removing least recently used assets
   */
  private enforceMemoryLimits(): void {
    const currentSize = this.calculateCacheSize();
    
    if (currentSize <= this.maxCacheSize) return;
    
    // Sort by last used time and reference count
    const sortedAssets = Array.from(this.assetCache.entries())
      .filter(([_, asset]) => asset.loaded && asset.references === 0)
      .sort(([_, a], [__, b]) => a.lastUsed - b.lastUsed);
    
    // Remove assets until under limit
    let REMOVED_SIZE = 0;
    for (const [id, asset] of sortedAssets) {
      if (currentSize - REMOVED_SIZE <= this.maxCacheSize) break;
      
      REMOVED_SIZE += asset.size;
      this.disposeAsset(id);
    }
  }

  /**
   * Dispose of an asset and free memory
   */
  private disposeAsset(id: string): void {
    const asset = this.assetCache.get(id);
    if (asset) {
      if (asset.texture && asset.texture.dispose) {
        asset.texture.dispose();
      }
      this.assetCache.delete(id);
    }
  }

  /**
   * Setup memory management listeners
   */
  private setupMemoryManagement(): void {
    // Listen for memory pressure events
    if ('memory' in performance && 'addEventListener' in performance) {
      (performance as any).addEventListener('memory', () => {
        this.maxCacheSize = Math.max(10, this.maxCacheSize * 0.7);
        this.enforceMemoryLimits();
      });
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.clearCache();
    });
  }
}

/**
 * Wardrobe asset configurations with optimization
 */
export const WARDROBE_ASSETS: Record<string, AssetConfig> = {
  // Hats
  wizard_hat: {
    url: '/assets/wardrobe/hats/wizard_hat.png',
    priority: 'high',
    format: 'png',
    sizes: [128, 256, 512],
    compressed: true,
    lazy: false
  },
  graduation_cap: {
    url: '/assets/wardrobe/hats/graduation_cap.png',
    priority: 'medium',
    format: 'png',
    sizes: [128, 256, 512],
    compressed: true,
    lazy: true
  },
  baseball_cap: {
    url: '/assets/wardrobe/hats/baseball_cap.png',
    priority: 'medium',
    format: 'png',
    sizes: [128, 256, 512],
    compressed: true,
    lazy: true
  },
  
  // Accessories
  magic_glasses: {
    url: '/assets/wardrobe/accessories/magic_glasses.png',
    priority: 'high',
    format: 'png',
    sizes: [64, 128, 256],
    compressed: false, // Keep transparency
    lazy: false
  },
  bow_tie: {
    url: '/assets/wardrobe/accessories/bow_tie.png',
    priority: 'low',
    format: 'png',
    sizes: [64, 128, 256],
    compressed: true,
    lazy: true
  },
  
  // Clothing
  superhero_cape: {
    url: '/assets/wardrobe/clothing/superhero_cape.png',
    priority: 'high',
    format: 'png',
    sizes: [256, 512, 1024],
    compressed: true,
    lazy: false
  },
  lab_coat: {
    url: '/assets/wardrobe/clothing/lab_coat.png',
    priority: 'medium',
    format: 'jpg',
    sizes: [256, 512, 1024],
    compressed: true,
    lazy: true
  },
  
  // Shoes
  magic_boots: {
    url: '/assets/wardrobe/shoes/magic_boots.png',
    priority: 'medium',
    format: 'png',
    sizes: [128, 256, 512],
    compressed: true,
    lazy: true
  },
  sneakers: {
    url: '/assets/wardrobe/shoes/sneakers.png',
    priority: 'low',
    format: 'jpg',
    sizes: [128, 256, 512],
    compressed: true,
    lazy: true
  }
};

// Export singleton instance
export const assetManager = OptimizedAssetManager.getInstance();