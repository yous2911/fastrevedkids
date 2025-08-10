/**
 * Three.js Memory Management System
 * Prevents memory leaks in WebGL/Three.js components through proper disposal
 */

import * as THREE from 'three';
import React, { useRef, useCallback, useEffect } from 'react';

interface ThreeJSResource {
  id: string;
  type: 'geometry' | 'material' | 'texture' | 'mesh' | 'scene' | 'renderer' | 'camera';
  object: any;
  createdAt: number;
  lastUsed: number;
  disposed: boolean;
}

interface MemoryPool<T> {
  available: T[];
  inUse: T[];
  maxSize: number;
  factory: () => T;
  reset: (item: T) => void;
}

/**
 * Advanced Three.js Memory Manager
 */
export class ThreeJSMemoryManager {
  private static instance: ThreeJSMemoryManager;
  private resources = new Map<string, ThreeJSResource>();
  private disposalQueue: string[] = [];
  private memoryPools = new Map<string, MemoryPool<any>>();
  private disposalInterval: number | null = null;
  private memoryUsage = {
    GEOMETRIES: 0,
    MATERIALS: 0,
    TEXTURES: 0,
    total: 0,
  };

  // Memory limits (in bytes)
  private readonly MAX_TEXTURE_MEMORY = 100 * 1024 * 1024; // 100MB
  private readonly MAX_GEOMETRY_MEMORY = 50 * 1024 * 1024;  // 50MB
  private readonly CLEANUP_INTERVAL = 10000; // 10 seconds
  private readonly RESOURCE_TTL = 60000; // 1 minute

  private constructor() {
    this.startPeriodicCleanup();
    this.setupMemoryPools();
  }

  public static getInstance(): ThreeJSMemoryManager {
    if (!ThreeJSMemoryManager.instance) {
      ThreeJSMemoryManager.instance = new ThreeJSMemoryManager();
    }
    return ThreeJSMemoryManager.instance;
  }

  /**
   * Register a Three.js resource for memory management
   */
  public register<T>(object: T, type: ThreeJSResource['type'], id?: string): string {
    const resourceId = id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const resource: ThreeJSResource = {
      id: resourceId,
      type,
      object,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      disposed: false,
    };

    this.resources.set(resourceId, resource);
    this.updateMemoryUsage();

    console.log(`🎯 Registered ${type}: ${resourceId}`);
    return resourceId;
  }

  /**
   * Mark resource as used (updates last used timestamp)
   */
  public markUsed(id: string): void {
    const resource = this.resources.get(id);
    if (resource && !resource.disposed) {
      resource.lastUsed = Date.now();
    }
  }

  /**
   * Dispose of a specific resource
   */
  public dispose(id: string): void {
    const resource = this.resources.get(id);
    if (!resource || resource.disposed) return;

    try {
      this.disposeResource(resource);
      resource.disposed = true;
      this.updateMemoryUsage();
      console.log(`🗑️ Disposed ${resource.type}: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to dispose ${resource.type}:`, error);
    }
  }

  /**
   * Dispose of all resources of a specific type
   */
  public disposeByType(type: ThreeJSResource['type']): void {
    const resources = Array.from(this.resources.values())
      .filter(r => r.type === type && !r.disposed);

    resources.forEach(resource => this.dispose(resource.id));
  }

  /**
   * Force cleanup of all resources
   */
  public disposeAll(): void {
    const resources = Array.from(this.resources.values())
      .filter(r => !r.disposed);

    resources.forEach(resource => this.dispose(resource.id));
    
    // Clear the registry
    this.resources.clear();
    this.updateMemoryUsage();
    
    console.log('🧹 Disposed all Three.js resources');
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): {
    usage: any;
    resourceCount: { [K in ThreeJSResource['type']]: number };
    totalResources: number;
    oldestResource: ThreeJSResource | null;
    recommendations: string[];
  } {
    const resourceCount = Array.from(this.resources.values())
      .filter(r => !r.disposed)
      .reduce((acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {} as Record<ThreeJSResource['type'], number>);

    const activeResources = Array.from(this.resources.values()).filter(r => !r.disposed);
    const oldestResource = activeResources.length > 0
      ? activeResources.reduce((oldest, current) => 
          current.createdAt < oldest.createdAt ? current : oldest
        )
      : null;

    const recommendations = this.generateMemoryRecommendations();

    return {
      usage: { ...this.memoryUsage },
      resourceCount: resourceCount as { [K in ThreeJSResource['type']]: number },
      totalResources: activeResources.length,
      oldestResource,
      recommendations,
    };
  }

  /**
   * Create memory pool for frequently used objects
   */
  public createPool<T>(
    name: string,
    factory: () => T,
    reset: (item: T) => void,
    maxSize: number = 10
  ): void {
    this.memoryPools.set(name, {
      available: [],
      inUse: [],
      maxSize,
      factory,
      reset,
    });
  }

  /**
   * Get object from memory pool
   */
  public getFromPool<T>(poolName: string): T | null {
    const pool = this.memoryPools.get(poolName) as MemoryPool<T>;
    if (!pool) return null;

    if (pool.available.length > 0) {
      const item = pool.available.pop()!;
      pool.inUse.push(item);
      return item;
    }

    if (pool.inUse.length < pool.maxSize) {
      const item = pool.factory();
      pool.inUse.push(item);
      return item;
    }

    return null; // Pool exhausted
  }

  /**
   * Return object to memory pool
   */
  public returnToPool<T>(poolName: string, item: T): void {
    const pool = this.memoryPools.get(poolName) as MemoryPool<T>;
    if (!pool) return;

    const index = pool.inUse.indexOf(item);
    if (index !== -1) {
      pool.inUse.splice(index, 1);
      pool.reset(item);
      pool.available.push(item);
    }
  }

  /**
   * Automatic resource disposal for React components
   */
  public useAutoDispose() {
    const resourceIds = useRef<string[]>([]);

    const registerResource = useCallback(<T>(
      object: T,
      type: ThreeJSResource['type'],
      id?: string
    ): string => {
      const resourceId = this.register(object, type, id);
      resourceIds.current.push(resourceId);
      return resourceId;
    }, []);

    useEffect(() => {
      return () => {
        resourceIds.current.forEach(id => this.dispose(id));
        resourceIds.current = [];
      };
    }, []);

    return { registerResource };
  }

  private disposeResource(resource: ThreeJSResource): void {
    const { object, type } = resource;

    switch (type) {
      case 'geometry':
        if (object && typeof object.dispose === 'function') {
          object.dispose();
        }
        break;

      case 'material':
        if (object && typeof object.dispose === 'function') {
          // Dispose material and its TEXTURES
          if (object.map) object.map.dispose();
          if (object.lightMap) object.lightMap.dispose();
          if (object.bumpMap) object.bumpMap.dispose();
          if (object.normalMap) object.normalMap.dispose();
          if (object.specularMap) object.specularMap.dispose();
          if (object.envMap) object.envMap.dispose();
          object.dispose();
        }
        break;

      case 'texture':
        if (object && typeof object.dispose === 'function') {
          object.dispose();
        }
        break;

      case 'mesh':
        if (object) {
          if (object.geometry && typeof object.geometry.dispose === 'function') {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat: any) => {
                if (mat && typeof mat.dispose === 'function') {
                  mat.dispose();
                }
              });
            } else if (typeof object.material.dispose === 'function') {
              object.material.dispose();
            }
          }
        }
        break;

      case 'scene':
        if (object && typeof object.clear === 'function') {
          // Dispose all children recursively
          object.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          object.clear();
        }
        break;

      case 'renderer':
        if (object && typeof object.dispose === 'function') {
          object.dispose();
          if (object.forceContextLoss) {
            object.forceContextLoss();
          }
        }
        break;

      default:
        if (object && typeof object.dispose === 'function') {
          object.dispose();
        }
        break;
    }
  }

  private startPeriodicCleanup(): void {
    if (this.disposalInterval) return;

    this.disposalInterval = window.setInterval(() => {
      this.performPeriodicCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private performPeriodicCleanup(): void {
    const now = Date.now();
    const resourcesToDispose: string[] = [];

    // Find old unused resources
    this.resources.forEach((resource, id) => {
      if (!resource.disposed && (now - resource.lastUsed) > this.RESOURCE_TTL) {
        resourcesToDispose.push(id);
      }
    });

    // Check memory limits
    if (this.memoryUsage.total > (this.MAX_TEXTURE_MEMORY + this.MAX_GEOMETRY_MEMORY)) {
      // Find least recently used resources
      const lruResources = Array.from(this.resources.values())
        .filter(r => !r.disposed)
        .sort((a, b) => a.lastUsed - b.lastUsed)
        .slice(0, 10); // Dispose up to 10 LRU resources

      lruResources.forEach(resource => resourcesToDispose.push(resource.id));
    }

    // Dispose resources
    resourcesToDispose.forEach(id => this.dispose(id));

    if (resourcesToDispose.length > 0) {
      console.log(`🧹 Periodic cleanup: disposed ${resourcesToDispose.length} Three.js resources`);
    }
  }

  private setupMemoryPools(): void {
    // Common geometry pool
    this.createPool(
      'boxGeometry',
      () => new ((window as any).THREE || THREE).BoxGeometry(1, 1, 1),
      (geometry) => {
        // Reset geometry to default state
        geometry.setAttribute('position', new (window as any).THREE.Float32BufferAttribute([
          // Standard box vertices
        ], 3));
      }
    );

    // Material pool
    this.createPool(
      'basicMaterial',
      () => new ((window as any).THREE || THREE).MeshBasicMaterial(),
      (material) => {
        material.color.setHex(0xffffff);
        material.transparent = false;
        material.opacity = 1;
        material.map = null;
      }
    );
  }

  private updateMemoryUsage(): void {
    let GEOMETRIES = 0;
    let MATERIALS = 0;
    let TEXTURES = 0;

    this.resources.forEach(resource => {
      if (resource.disposed) return;

      // Estimate memory usage (rough calculations)
      switch (resource.type) {
        case 'geometry':
          GEOMETRIES += this.estimateGeometrySize(resource.object);
          break;
        case 'material':
          MATERIALS += 1000; // ~1KB per material
          break;
        case 'texture':
          TEXTURES += this.estimateTextureSize(resource.object);
          break;
      }
    });

    this.memoryUsage = {
      GEOMETRIES,
      MATERIALS,
      TEXTURES,
      total: GEOMETRIES + MATERIALS + TEXTURES,
    };
  }

  private estimateGeometrySize(geometry: any): number {
    if (!geometry || !geometry.attributes) return 0;
    
    let SIZE = 0;
    Object.values(geometry.attributes).forEach((attribute: any) => {
      if (attribute.array) {
        SIZE += attribute.array.byteLength || attribute.array.length * 4; // Assume 4 bytes per element
      }
    });
    
    return SIZE;
  }

  private estimateTextureSize(texture: any): number {
    if (!texture || !texture.image) return 0;
    
    const { width, height } = texture.image;
    const BYTES_PER_PIXEL = 4; // RGBA
    return width * height * BYTES_PER_PIXEL;
  }

  private generateMemoryRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getMemoryStats();

    if (this.memoryUsage.total > this.MAX_TEXTURE_MEMORY) {
      recommendations.push('Memory usage is high - consider reducing texture quality');
    }

    if (stats.resourceCount.texture > 20) {
      recommendations.push('High texture count - implement texture atlasing');
    }

    if (stats.resourceCount.geometry > 50) {
      recommendations.push('High geometry count - consider using instanced meshes');
    }

    if (stats.oldestResource && (Date.now() - stats.oldestResource.createdAt) > 300000) {
      recommendations.push('Some resources are very old - check for memory leaks');
    }

    return recommendations;
  }

  /**
   * Cleanup and stop monitoring
   */
  public cleanup(): void {
    if (this.disposalInterval) {
      clearInterval(this.disposalInterval);
      this.disposalInterval = null;
    }

    this.disposeAll();
    this.memoryPools.clear();
  }
}

/**
 * React hook for Three.js memory management
 */
export const useThreeJSMemory = () => {
  const manager = ThreeJSMemoryManager.getInstance();
  const { registerResource } = manager.useAutoDispose();

  return {
    register: registerResource,
    dispose: (id: string) => manager.dispose(id),
    disposeAll: () => manager.disposeAll(),
    getStats: () => manager.getMemoryStats(),
    getFromPool: <T>(poolName: string) => manager.getFromPool<T>(poolName),
    returnToPool: <T>(poolName: string, item: T) => manager.returnToPool(poolName, item),
  };
};

// Export singleton instance
export const threeJSMemoryManager = ThreeJSMemoryManager.getInstance();