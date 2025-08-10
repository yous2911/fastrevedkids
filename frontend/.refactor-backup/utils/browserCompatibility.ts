// Browser compatibility detection and fallback utilities

export interface BrowserInfo {
  name: string;
  version: string;
  isMobile: boolean;
  isTablet: boolean;
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  devicePixelRatio: number;
  hardwareTier: 'low' | 'medium' | 'high';
  memoryLimit: number; // Estimated in MB
}

export interface WebGLCapabilities {
  supported: boolean;
  version: 1 | 2 | null;
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  extensions: string[];
  floatTextures: boolean;
  depthTextures: boolean;
  vertexTextureUnits: number;
  fragmentTextureUnits: number;
}

export class BrowserCompatibilityManager {
  private static instance: BrowserCompatibilityManager;
  private browserInfo: BrowserInfo;
  private webglCapabilities: WebGLCapabilities;
  private canvas2DSupported: boolean = true;

  private constructor() {
    this.browserInfo = this.detectBrowser();
    this.webglCapabilities = this.detectWebGLCapabilities();
    this.testCanvas2DSupport();
  }

  public static getInstance(): BrowserCompatibilityManager {
    if (!BrowserCompatibilityManager.instance) {
      BrowserCompatibilityManager.instance = new BrowserCompatibilityManager();
    }
    return BrowserCompatibilityManager.instance;
  }

  private detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Browser detection
    let browserName = 'unknown';
    let browserVersion = '0';
    
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edge') === -1) {
      browserName = 'chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || '0';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || '0';
    } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      browserName = 'safari';
      browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || '0';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'edge';
      browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || '0';
    }

    // Device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Tablet)|Windows(?=.*Touch)/i.test(userAgent);
    
    // WebGL support detection
    const supportsWebGL = this.checkWebGLSupport(1);
    const supportsWebGL2 = this.checkWebGLSupport(2);

    // Hardware tier estimation
    const hardwareTier = this.estimateHardwareTier(userAgent, isMobile);
    
    // Memory estimation (rough approximation)
    const memoryLimit = this.estimateMemoryLimit(hardwareTier, isMobile);

    return {
      name: browserName,
      version: browserVersion,
      isMobile,
      isTablet,
      supportsWebGL,
      supportsWebGL2,
      maxTextureSize: 0, // Will be set by WebGL detection
      maxRenderbufferSize: 0, // Will be set by WebGL detection
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareTier,
      memoryLimit
    };
  }

  private checkWebGLSupport(version: 1 | 2): boolean {
    try {
      const canvas = document.createElement('canvas');
      const contextName = version === 2 ? 'webgl2' : 'webgl';
      const context = canvas.getContext(contextName) || canvas.getContext('experimental-webgl');
      return !!context;
    } catch (e) {
      return false;
    }
  }

  private detectWebGLCapabilities(): WebGLCapabilities {
    const canvas = document.createElement('canvas');
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    let version: 1 | 2 | null = null;

    // Try WebGL2 first, then fallback to WebGL1
    try {
      gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
      if (gl) {
        version = 2;
      } else {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        if (gl) {
          version = 1;
        }
      }
    } catch (e) {
      console.warn('WebGL detection failed:', e);
    }

    if (!gl || !version) {
      return {
        supported: false,
        version: null,
        renderer: 'none',
        vendor: 'none',
        maxTextureSize: 0,
        maxRenderbufferSize: 0,
        extensions: [],
        floatTextures: false,
        depthTextures: false,
        vertexTextureUnits: 0,
        fragmentTextureUnits: 0
      };
    }

    // Get renderer info and cast to WebGL context for proper typing
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const webglContext = gl as WebGLRenderingContext;
    const renderer = debugInfo ? webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
    const vendor = debugInfo ? webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';

    // Get capabilities
    const maxTextureSize = webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE);
    const maxRenderbufferSize = webglContext.getParameter(webglContext.MAX_RENDERBUFFER_SIZE);
    const vertexTextureUnits = webglContext.getParameter(webglContext.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    const fragmentTextureUnits = webglContext.getParameter(webglContext.MAX_TEXTURE_IMAGE_UNITS);

    // Get extensions
    const extensions = gl.getSupportedExtensions() || [];
    const floatTextures = extensions.includes('OES_texture_float') || version === 2;
    const depthTextures = extensions.includes('WEBGL_depth_texture') || version === 2;

    // Update browser info with texture sizes
    this.browserInfo.maxTextureSize = maxTextureSize;
    this.browserInfo.maxRenderbufferSize = maxRenderbufferSize;

    return {
      supported: true,
      version,
      renderer,
      vendor,
      maxTextureSize,
      maxRenderbufferSize,
      extensions,
      floatTextures,
      depthTextures,
      vertexTextureUnits,
      fragmentTextureUnits
    };
  }

  private estimateHardwareTier(userAgent: string, isMobile: boolean): 'low' | 'medium' | 'high' {
    if (isMobile) {
      // Mobile device detection
      if (userAgent.includes('iPhone')) {
        // iPhone detection based on model
        if (userAgent.includes('iPhone OS 1') || userAgent.includes('iPhone OS 9')) {
          return 'low';
        } else if (userAgent.includes('iPhone OS 1[0-2]')) {
          return 'medium';
        }
        return 'high';
      } else if (userAgent.includes('Android')) {
        // Android detection is harder, use general heuristics
        if (userAgent.includes('Android 4') || userAgent.includes('Android 5')) {
          return 'low';
        } else if (userAgent.includes('Android 6') || userAgent.includes('Android 7')) {
          return 'medium';
        }
        return 'medium'; // Conservative estimate for Android
      }
      return 'medium'; // Default for mobile
    } else {
      // Desktop detection
      const memory = (navigator as any).deviceMemory;
      if (memory) {
        if (memory <= 2) return 'low';
        if (memory <= 4) return 'medium';
        return 'high';
      }
      
      // Fallback heuristics for desktop
      const cores = navigator.hardwareConcurrency || 4;
      if (cores <= 2) return 'low';
      if (cores <= 4) return 'medium';
      return 'high';
    }
  }

  private estimateMemoryLimit(hardwareTier: string, isMobile: boolean): number {
    const baseMemory = isMobile ? 512 : 1024; // MB
    
    switch (hardwareTier) {
      case 'low': return baseMemory * 0.5;
      case 'medium': return baseMemory * 1;
      case 'high': return baseMemory * 2;
      default: return baseMemory;
    }
  }

  private testCanvas2DSupport(): void {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      this.canvas2DSupported = !!ctx;
      
      // Test Safari-specific issues
      if (this.browserInfo.name === 'safari' && ctx) {
        // Test for Safari canvas rendering issues
        canvas.width = 100;
        canvas.height = 100;
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 50, 50);
        
        // Safari sometimes has issues with getImageData
        try {
          ctx.getImageData(0, 0, 1, 1);
        } catch (e) {
          console.warn('Safari Canvas2D has getImageData restrictions');
        }
      }
    } catch (e) {
      this.canvas2DSupported = false;
      console.warn('Canvas2D support test failed:', e);
    }
  }

  // Public API methods
  public getBrowserInfo(): BrowserInfo {
    return { ...this.browserInfo };
  }

  public getWebGLCapabilities(): WebGLCapabilities {
    return { ...this.webglCapabilities };
  }

  public supportsWebGL(): boolean {
    return this.webglCapabilities.supported;
  }

  public supportsCanvas2D(): boolean {
    return this.canvas2DSupported;
  }

  public getOptimalSettings(): {
    pixelRatio: number;
    antialias: boolean;
    shadowMapEnabled: boolean;
    shadowMapSize: number;
    maxLights: number;
    particleCount: number;
    animationQuality: 'low' | 'medium' | 'high';
  } {
    const { hardwareTier, isMobile, devicePixelRatio } = this.browserInfo;
    const { maxTextureSize } = this.webglCapabilities;

    // Conservative settings for different hardware tiers
    const settings = {
      low: {
        pixelRatio: Math.min(devicePixelRatio, 1),
        antialias: false,
        shadowMapEnabled: false,
        shadowMapSize: 256,
        maxLights: 2,
        particleCount: 50,
        animationQuality: 'low' as const
      },
      medium: {
        pixelRatio: Math.min(devicePixelRatio, isMobile ? 1.5 : 2),
        antialias: !isMobile,
        shadowMapEnabled: !isMobile,
        shadowMapSize: 512,
        maxLights: 4,
        particleCount: 100,
        animationQuality: 'medium' as const
      },
      high: {
        pixelRatio: Math.min(devicePixelRatio, 2),
        antialias: true,
        shadowMapEnabled: true,
        shadowMapSize: Math.min(1024, maxTextureSize / 4),
        maxLights: 6,
        particleCount: 200,
        animationQuality: 'high' as const
      }
    };

    return settings[hardwareTier];
  }

  public isLowEndDevice(): boolean {
    return this.browserInfo.hardwareTier === 'low' || 
           (this.browserInfo.isMobile && this.browserInfo.memoryLimit < 512);
  }

  public requiresFallback(): boolean {
    return !this.supportsWebGL() || this.isLowEndDevice();
  }

  // Browser-specific fixes
  public getSafariCanvasFixes(): {
    useOffscreenCanvas: boolean;
    forceContextRestore: boolean;
    avoidGetImageData: boolean;
  } {
    const isSafari = this.browserInfo.name === 'safari';
    return {
      useOffscreenCanvas: false, // Safari doesn't fully support OffscreenCanvas
      forceContextRestore: isSafari, // Safari has context loss issues
      avoidGetImageData: isSafari && this.browserInfo.isMobile // Mobile Safari restrictions
    };
  }

  public getChromeOptimizations(): {
    useHardwareAcceleration: boolean;
    preferWebGL2: boolean;
    enableGPUMemoryOptimization: boolean;
  } {
    const isChrome = this.browserInfo.name === 'chrome';
    const version = parseInt(this.browserInfo.version);
    
    return {
      useHardwareAcceleration: isChrome && version >= 80,
      preferWebGL2: isChrome && version >= 90,
      enableGPUMemoryOptimization: isChrome && version >= 88
    };
  }

  public getFirefoxCompatibility(): {
    usePolyfills: boolean;
    limitConcurrentTextures: boolean;
    avoidComplexShaders: boolean;
  } {
    const isFirefox = this.browserInfo.name === 'firefox';
    const version = parseInt(this.browserInfo.version);
    
    return {
      usePolyfills: isFirefox && version < 85,
      limitConcurrentTextures: isFirefox, // Firefox has texture memory limits
      avoidComplexShaders: isFirefox && version < 90
    };
  }

  // Performance monitoring
  public measurePerformance(callback: () => void): {
    duration: number;
    memoryUsed?: number;
  } {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize;
    
    callback();
    
    const duration = performance.now() - startTime;
    const endMemory = (performance as any).memory?.usedJSHeapSize;
    const memoryUsed = startMemory && endMemory ? endMemory - startMemory : undefined;
    
    return { duration, memoryUsed };
  }

  // Cleanup and error recovery
  public handleWebGLContextLoss(canvas: HTMLCanvasElement, onRestore: () => void): void {
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost, attempting recovery...');
    });

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      onRestore();
    });
  }
}

// Utility functions for easy access
export const browserCompat = BrowserCompatibilityManager.getInstance();

export function isWebGLSupported(): boolean {
  return browserCompat.supportsWebGL();
}

export function isLowEndDevice(): boolean {
  return browserCompat.isLowEndDevice();
}

export function getOptimalRenderSettings() {
  return browserCompat.getOptimalSettings();
}

export function requiresFallback(): boolean {
  return browserCompat.requiresFallback();
}