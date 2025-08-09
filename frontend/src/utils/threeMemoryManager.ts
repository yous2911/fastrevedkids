import * as THREE from 'three';

export interface ThreeMemoryManager {
  trackGeometry: (geometry: THREE.BufferGeometry) => THREE.BufferGeometry;
  trackMaterial: (material: THREE.Material) => THREE.Material;
  trackTexture: (texture: THREE.Texture) => THREE.Texture;
  addCleanupTask: (cleanup: () => void) => void;
  disposeAll: () => void;
  getMemoryInfo: () => {
    geometries: number;
    materials: number;
    textures: number;
    cleanupTasks: number;
  };
}

export class ThreeMemoryManagerImpl implements ThreeMemoryManager {
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private cleanupTasks: (() => void)[] = [];

  trackGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    this.geometries.push(geometry);
    return geometry;
  }

  trackMaterial(material: THREE.Material): THREE.Material {
    this.materials.push(material);
    return material;
  }

  trackTexture(texture: THREE.Texture): THREE.Texture {
    this.textures.push(texture);
    return texture;
  }

  addCleanupTask(cleanup: () => void): void {
    this.cleanupTasks.push(cleanup);
  }

  disposeAll(): void {
    // Dispose geometries
    this.geometries.forEach(geometry => {
      try {
        geometry.dispose();
      } catch (error) {
        console.warn('Error disposing geometry:', error);
      }
    });
    this.geometries = [];

    // Dispose materials
    this.materials.forEach(material => {
      try {
        if (material instanceof THREE.Material) {
          material.dispose();
        }
      } catch (error) {
        console.warn('Error disposing material:', error);
      }
    });
    this.materials = [];

    // Dispose textures
    this.textures.forEach(texture => {
      try {
        texture.dispose();
      } catch (error) {
        console.warn('Error disposing texture:', error);
      }
    });
    this.textures = [];

    // Run cleanup tasks
    this.cleanupTasks.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error running cleanup task:', error);
      }
    });
    this.cleanupTasks = [];
  }

  getMemoryInfo() {
    return {
      geometries: this.geometries.length,
      materials: this.materials.length,
      textures: this.textures.length,
      cleanupTasks: this.cleanupTasks.length
    };
  }
}

// Utility functions for common Three.js optimizations
export const DeviceOptimizer = {
  isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent) ||
           window.innerWidth < 768 ||
           navigator.maxTouchPoints > 1;
  },

  getOptimalSegments(baseSegments: number, mobile: boolean = DeviceOptimizer.isMobileDevice()): number {
    return mobile ? Math.max(4, Math.floor(baseSegments * 0.5)) : baseSegments;
  },

  getOptimalRings(baseRings: number, mobile: boolean = DeviceOptimizer.isMobileDevice()): number {
    return mobile ? Math.max(4, Math.floor(baseRings * 0.5)) : baseRings;
  },

  shouldUseShadows(mobile: boolean = DeviceOptimizer.isMobileDevice()): boolean {
    return !mobile;
  },

  getOptimalPixelRatio(mobile: boolean = DeviceOptimizer.isMobileDevice()): number {
    return mobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;
  },

  getRendererConfig(mobile: boolean = DeviceOptimizer.isMobileDevice()): Partial<THREE.WebGLRendererParameters> {
    return {
      antialias: !mobile,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: mobile ? 'low-power' : 'high-performance',
      precision: mobile ? 'mediump' : 'highp'
    };
  }
};

// WebGL context management
export class WebGLContextManager {
  private canvas: HTMLCanvasElement | null = null;
  private onContextLost?: (event: Event) => void;
  private onContextRestored?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    onContextLost?: (event: Event) => void,
    onContextRestored?: () => void
  ) {
    this.canvas = canvas;
    this.onContextLost = onContextLost;
    this.onContextRestored = onContextRestored;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (this.onContextLost) {
        this.onContextLost(event);
      }
    };

    const handleContextRestored = () => {
      if (this.onContextRestored) {
        this.onContextRestored();
      }
    };

    this.canvas.addEventListener('webglcontextlost', handleContextLost);
    this.canvas.addEventListener('webglcontextrestored', handleContextRestored);
  }

  dispose(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener('webglcontextlost', this.onContextLost || (() => {}));
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored || (() => {}));
    this.canvas = null;
  }
}

// Hook for React components
export const useThreeMemoryManager = () => {
  const manager = new ThreeMemoryManagerImpl();
  
  return {
    trackGeometry: manager.trackGeometry.bind(manager),
    trackMaterial: manager.trackMaterial.bind(manager),
    trackTexture: manager.trackTexture.bind(manager),
    addCleanupTask: manager.addCleanupTask.bind(manager),
    disposeAll: manager.disposeAll.bind(manager),
    getMemoryInfo: manager.getMemoryInfo.bind(manager)
  };
};

// Performance monitoring utilities
export class ThreePerformanceMonitor {
  private static instance: ThreePerformanceMonitor;
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private memoryUsage = { used: 0, total: 0 };

  static getInstance(): ThreePerformanceMonitor {
    if (!ThreePerformanceMonitor.instance) {
      ThreePerformanceMonitor.instance = new ThreePerformanceMonitor();
    }
    return ThreePerformanceMonitor.instance;
  }

  startFrame(): void {
    const now = performance.now();
    this.frameCount++;
    
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
      
      // Update memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024)
        };
      }
    }
  }

  getMetrics() {
    return {
      fps: this.fps,
      memoryUsage: this.memoryUsage,
      timestamp: Date.now()
    };
  }
}

export default {
  ThreeMemoryManagerImpl,
  DeviceOptimizer,
  WebGLContextManager,
  useThreeMemoryManager,
  ThreePerformanceMonitor
};