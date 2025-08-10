/**
 * Optimized Three.js Asset Loading and Memory Management for Sparky Mascot
 * Provides efficient loading, caching, and disposal of 3D assets
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module';
import { getConfig, getCdnUrl } from '../config/environment';
import { getErrorTracker } from './error-tracking';
import { getPerformanceMonitor } from './performance-monitoring';

interface AssetCacheEntry {
  asset: any;
  lastUsed: number;
  size: number;
  refs: number;
  type: 'gltf' | 'texture' | 'geometry' | 'material' | 'audio';
}

interface LoadingProgress {
  total: number;
  loaded: number;
  percentage: number;
  currentItem: string;
}

interface OptimizationSettings {
  maxTextureSize: number;
  enableInstancing: boolean;
  enableLOD: boolean;
  enableOcclusion: boolean;
  enableCompression: boolean;
  maxCacheSize: number; // in MB
  cacheTimeout: number; // in ms
  enableWorkerLoader: boolean;
}

class ThreeJSAssetManager {
  private static instance: ThreeJSAssetManager;
  private cache = new Map<string, AssetCacheEntry>();
  private loaders: {
    gltf: GLTFLoader;
    draco: DRACOLoader;
    ktx2: KTX2Loader;
    texture: THREE.TextureLoader;
  };
  private renderer?: THREE.WebGLRenderer;
  private config = getConfig();
  private settings: OptimizationSettings;
  private loadingManager: THREE.LoadingManager;
  private disposableObjects = new Set<{ dispose?: () => void }>();
  private workerPool: Worker[] = [];
  private loadingQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  private constructor() {
    this.settings = {
      maxTextureSize: this.getOptimalTextureSize(),
      enableInstancing: true,
      enableLOD: true,
      enableOcclusion: true,
      enableCompression: true,
      maxCacheSize: 100, // 100MB cache
      cacheTimeout: 30 * 60 * 1000, // 30 minutes
      enableWorkerLoader: 'Worker' in window,
    };

    this.loadingManager = this.createLoadingManager();
    this.loaders = this.initializeLoaders();
    this.setupCacheCleanup();
    this.initializeWorkerPool();
  }

  static getInstance(): ThreeJSAssetManager {
    if (!ThreeJSAssetManager.instance) {
      ThreeJSAssetManager.instance = new ThreeJSAssetManager();
    }
    return ThreeJSAssetManager.instance;
  }

  private createLoadingManager(): THREE.LoadingManager {
    const manager = new THREE.LoadingManager();
    
    manager.onLoad = () => {
      console.log('✅ All Three.js assets loaded');
      getPerformanceMonitor().markMilestone('threejs-assets-loaded');
    };

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      console.log(`📦 Loading progress: ${progress.toFixed(1)}% (${url})`);
    };

    manager.onError = (url) => {
      console.error('❌ Failed to load Three.js asset:', url);
      getErrorTracker().capture3DError(
        new Error(`Failed to load asset: ${url}`),
        'AssetManager',
        'load'
      );
    };

    return manager;
  }

  private initializeLoaders() {
    // DRACO Loader for compressed geometry
    const dracoLoader = new DRACOLoader(this.loadingManager);
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.preload();

    // KTX2 Loader for compressed textures
    const ktx2Loader = new KTX2Loader(this.loadingManager);
    ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/libs/basis/');

    // GLTF Loader with extensions
    const gltfLoader = new GLTFLoader(this.loadingManager);
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.setKTX2Loader(ktx2Loader);
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader(this.loadingManager);

    return {
      gltf: gltfLoader,
      draco: dracoLoader,
      ktx2: ktx2Loader,
      texture: textureLoader,
    };
  }

  private getOptimalTextureSize(): number {
    // Determine optimal texture size based on device capabilities
    if (typeof window === 'undefined') return 1024;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 1024;

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    
    // Use device pixel ratio to determine appropriate size
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width * devicePixelRatio;
    
    // Conservative approach for mobile devices
    if (screenWidth < 1920) {
      return Math.min(maxTextureSize, 1024);
    } else if (screenWidth < 3840) {
      return Math.min(maxTextureSize, 2048);
    } else {
      return Math.min(maxTextureSize, 4096);
    }
  }

  private setupCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  private initializeWorkerPool(): void {
    if (!this.settings.enableWorkerLoader) return;

    const workerCount = Math.min(navigator.hardwareConcurrency || 4, 4);
    
    for (let i = 0; i < workerCount; i++) {
      try {
        const worker = new Worker('/workers/three-loader.js');
        this.workerPool.push(worker);
      } catch (error) {
        console.warn('Failed to create Three.js worker:', error);
        this.settings.enableWorkerLoader = false;
        break;
      }
    }

    console.log(`🧵 Initialized ${this.workerPool.length} Three.js workers`);
  }

  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.loaders.ktx2.detectSupport(renderer);
  }

  public async loadSparkyModel(variant: string = 'default'): Promise<THREE.Group> {
    const cacheKey = `sparky-${variant}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached.clone();
    }

    const modelUrl = getCdnUrl(`/models/sparky/${variant}.gltf`);
    
    try {
      console.log(`📦 Loading Sparky model: ${variant}`);
      const startTime = performance.now();
      
      const gltf = await this.loadGLTF(modelUrl);
      const model = gltf.scene;
      
      // Optimize the model
      this.optimizeModel(model);
      
      // Cache the model
      this.addToCache(cacheKey, model, 'gltf');
      
      const loadTime = performance.now() - startTime;
      console.log(`✅ Sparky model loaded in ${loadTime.toFixed(2)}ms`);
      
      return model.clone();
    } catch (error) {
      getErrorTracker().capture3DError(
        error as Error,
        'SparkyLoader',
        `load-${variant}`
      );
      throw error;
    }
  }

  public async loadTexture(
    path: string, 
    options: {
      flipY?: boolean;
      wrapS?: THREE.Wrapping;
      wrapT?: THREE.Wrapping;
      minFilter?: THREE.TextureFilter;
      magFilter?: THREE.TextureFilter;
    } = {}
  ): Promise<THREE.Texture> {
    const cacheKey = `texture-${path}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      cached.lastUsed = Date.now();
      cached.refs++;
      return cached.asset;
    }

    const textureUrl = getCdnUrl(path);
    
    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        this.loaders.texture.load(
          textureUrl,
          resolve,
          undefined,
          reject
        );
      });

      // Apply options
      if (options.flipY !== undefined) texture.flipY = options.flipY;
      if (options.wrapS) texture.wrapS = options.wrapS;
      if (options.wrapT) texture.wrapT = options.wrapT;
      if (options.minFilter) texture.minFilter = options.minFilter;
      if (options.magFilter) texture.magFilter = options.magFilter;

      // Optimize texture
      this.optimizeTexture(texture);
      
      // Cache the texture
      this.addToCache(cacheKey, texture, 'texture');
      
      return texture;
    } catch (error) {
      getErrorTracker().capture3DError(
        error as Error,
        'TextureLoader',
        `load-${path}`
      );
      throw error;
    }
  }

  private async loadGLTF(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loaders.gltf.load(url, resolve, undefined, reject);
    });
  }

  private optimizeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.optimizeMesh(child);
      }
    });

    // Enable frustum culling
    model.frustumCulled = true;
  }

  private optimizeMesh(mesh: THREE.Mesh): void {
    const geometry = mesh.geometry;
    const material = mesh.material;

    // Optimize geometry
    if (geometry) {
      // Compute bounding box and sphere for efficient culling
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      
      // Merge vertices if possible (reduces draw calls)
      if (typeof geometry.mergeVertices === 'function') {
        geometry.mergeVertices();
      }
      
      // Dispose of unused attributes
      this.cleanupGeometry(geometry);
    }

    // Optimize materials
    if (material) {
      if (Array.isArray(material)) {
        material.forEach(mat => this.optimizeMaterial(mat));
      } else {
        this.optimizeMaterial(material);
      }
    }

    // Enable instancing for repeated meshes
    if (this.settings.enableInstancing) {
      this.setupInstancing(mesh);
    }

    // Set up LOD if enabled
    if (this.settings.enableLOD) {
      this.setupLOD(mesh);
    }
  }

  private optimizeMaterial(material: THREE.Material): void {
    // Enable material culling
    if (material instanceof THREE.MeshBasicMaterial || 
        material instanceof THREE.MeshLambertMaterial ||
        material instanceof THREE.MeshPhongMaterial ||
        material instanceof THREE.MeshStandardMaterial) {
      
      // Enable backface culling by default
      material.side = THREE.FrontSide;
      
      // Optimize for child-safe content (no transparent materials that are too complex)
      if (material.transparent && material.opacity > 0.95) {
        material.transparent = false;
        material.opacity = 1;
      }
    }

    // Register for disposal
    this.disposableObjects.add(material);
  }

  private optimizeTexture(texture: THREE.Texture): void {
    // Set appropriate texture settings for children's content
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // Optimize for mobile devices
    if (this.settings.maxTextureSize < 2048) {
      texture.minFilter = THREE.LinearFilter; // Avoid mipmaps on low-end devices
    }

    // Register for disposal
    this.disposableObjects.add(texture);
  }

  private cleanupGeometry(geometry: THREE.BufferGeometry): void {
    // Remove unused attributes to save memory
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const uv = geometry.getAttribute('uv');
    
    // Keep only essential attributes for Sparky
    const attributesToKeep = ['position', 'normal', 'uv', 'color'];
    const attributesToRemove: string[] = [];
    
    Object.keys(geometry.attributes).forEach(attributeName => {
      if (!attributesToKeep.includes(attributeName)) {
        attributesToRemove.push(attributeName);
      }
    });
    
    attributesToRemove.forEach(attributeName => {
      geometry.deleteAttribute(attributeName);
    });

    // Register for disposal
    this.disposableObjects.add(geometry);
  }

  private setupInstancing(mesh: THREE.Mesh): void {
    // This would be implemented based on specific use cases
    // For Sparky, we might instance common elements like sparkles or particles
  }

  private setupLOD(mesh: THREE.Mesh): void {
    // Create LOD levels for complex meshes
    // This would create simplified versions of Sparky for different distances
  }

  private getFromCache(key: string): AssetCacheEntry | null {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastUsed = Date.now();
      entry.refs++;
      return entry;
    }
    return null;
  }

  private addToCache(key: string, asset: any, type: AssetCacheEntry['type']): void {
    const size = this.estimateAssetSize(asset);
    
    this.cache.set(key, {
      asset,
      lastUsed: Date.now(),
      size,
      refs: 1,
      type,
    });

    console.log(`💾 Cached ${type}: ${key} (${this.formatBytes(size)})`);
  }

  private estimateAssetSize(asset: any): number {
    // Rough estimation of asset memory usage
    if (asset instanceof THREE.BufferGeometry) {
      let size = 0;
      Object.values(asset.attributes).forEach((attribute: any) => {
        size += attribute.array.byteLength;
      });
      return size;
    } else if (asset instanceof THREE.Texture) {
      const image = asset.image;
      if (image && image.width && image.height) {
        return image.width * image.height * 4; // RGBA
      }
    } else if (asset instanceof THREE.Group) {
      let size = 0;
      asset.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            size += this.estimateAssetSize(child.geometry);
          }
        }
      });
      return size;
    }
    
    return 1024; // Default 1KB estimation
  }

  private cleanupCache(): void {
    const now = Date.now();
    let totalSize = 0;
    const entries = Array.from(this.cache.entries());
    
    // Calculate total cache size
    entries.forEach(([, entry]) => {
      totalSize += entry.size;
    });

    console.log(`🧹 Cache cleanup: ${entries.length} entries, ${this.formatBytes(totalSize)}`);

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      const age = now - entry.lastUsed;
      if (age > this.settings.cacheTimeout && entry.refs === 0) {
        this.disposeAsset(entry.asset);
        this.cache.delete(key);
        console.log(`🗑️ Removed expired cache entry: ${key}`);
      }
    });

    // If cache is still too large, remove least recently used
    const maxSizeBytes = this.settings.maxCacheSize * 1024 * 1024;
    if (totalSize > maxSizeBytes) {
      const sortedEntries = entries
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      
      for (const [key, entry] of sortedEntries) {
        if (totalSize <= maxSizeBytes) break;
        if (entry.refs === 0) {
          this.disposeAsset(entry.asset);
          this.cache.delete(key);
          totalSize -= entry.size;
          console.log(`🗑️ Removed LRU cache entry: ${key}`);
        }
      }
    }
  }

  private disposeAsset(asset: any): void {
    if (asset && typeof asset.dispose === 'function') {
      asset.dispose();
    } else if (asset instanceof THREE.Group) {
      asset.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }

  public releaseAsset(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.refs = Math.max(0, entry.refs - 1);
    }
  }

  public preloadSparkyAssets(): Promise<void[]> {
    const assetsToPreload = [
      'sparky/default.gltf',
      'sparky/happy.gltf', 
      'sparky/excited.gltf',
      'textures/sparky-base.png',
      'textures/sparky-eyes.png',
    ];

    const loadPromises = assetsToPreload.map(async (asset) => {
      try {
        if (asset.endsWith('.gltf')) {
          const variant = asset.split('/')[1].replace('.gltf', '');
          await this.loadSparkyModel(variant);
        } else if (asset.includes('texture')) {
          await this.loadTexture(asset);
        }
      } catch (error) {
        console.warn(`Failed to preload asset: ${asset}`, error);
      }
    });

    return Promise.all(loadPromises);
  }

  public dispose(): void {
    // Dispose all cached assets
    this.cache.forEach((entry, key) => {
      this.disposeAsset(entry.asset);
    });
    this.cache.clear();

    // Dispose all registered objects
    this.disposableObjects.forEach(obj => {
      try {
        obj.dispose?.();
      } catch (error) {
        console.warn('Failed to dispose object:', error);
      }
    });
    this.disposableObjects.clear();

    // Terminate workers
    this.workerPool.forEach(worker => {
      worker.terminate();
    });
    this.workerPool = [];

    console.log('🧹 Three.js Asset Manager disposed');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public getCacheStats(): {
    entries: number;
    totalSize: string;
    breakdown: Record<string, number>;
  } {
    let totalSize = 0;
    const breakdown: Record<string, number> = {};
    
    this.cache.forEach(entry => {
      totalSize += entry.size;
      breakdown[entry.type] = (breakdown[entry.type] || 0) + 1;
    });

    return {
      entries: this.cache.size,
      totalSize: this.formatBytes(totalSize),
      breakdown,
    };
  }
}

// Singleton instance
export const threeJSAssetManager = ThreeJSAssetManager.getInstance();

// React hook for Three.js asset management
export const useThreeJSAssets = () => {
  const manager = threeJSAssetManager;
  
  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      manager.dispose();
    };
  }, [manager]);

  return {
    loadSparkyModel: manager.loadSparkyModel.bind(manager),
    loadTexture: manager.loadTexture.bind(manager),
    releaseAsset: manager.releaseAsset.bind(manager),
    preloadAssets: manager.preloadSparkyAssets.bind(manager),
    setRenderer: manager.setRenderer.bind(manager),
    getCacheStats: manager.getCacheStats.bind(manager),
  };
};

// Import React for hooks
import React from 'react';