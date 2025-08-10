/**
 * Mobile Device Optimization System
 * Advanced device detection, quality settings, and performance optimization for mobile
 */

interface DeviceCapabilities {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  performanceTier: 'high' | 'medium' | 'low';
  screenSize: 'small' | 'medium' | 'large';
  memorySize: 'low' | 'medium' | 'high';
  gpuTier: 'high' | 'medium' | 'low';
  batteryLevel?: number;
  isCharging?: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  maxTextureSize: number;
  vendorInfo: string;
  modelInfo?: string;
}

interface MobileQualitySettings {
  maxParticles: number;
  targetFPS: number;
  enableShadows: boolean;
  enableLighting: boolean;
  enablePostProcessing: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  geometryComplexity: 'low' | 'medium' | 'high';
  animationQuality: 'minimal' | 'reduced' | 'full';
  physicsAccuracy: 'low' | 'medium' | 'high';
  enableAntialiasing: boolean;
  renderScale: number;
  enableBloom: boolean;
  enableParallax: boolean;
  maxLights: number;
}

interface BatteryOptimization {
  enabled: boolean;
  aggressiveMode: boolean;
  throttleAnimations: boolean;
  reducedParticles: boolean;
  staticLighting: boolean;
  disableEffects: boolean;
}

interface TouchCapabilities {
  maxTouchPoints: number;
  SUPPORTS_PRESSURE: boolean;
  supportsMultiTouch: boolean;
  HAS_GYROSCOPE: boolean;
  HAS_ACCELEROMETER: boolean;
  hasCompass: boolean;
}

/**
 * Advanced mobile device detector with performance profiling
 */
export class MobileDeviceDetector {
  private static instance: MobileDeviceDetector;
  private capabilities: DeviceCapabilities | null = null;
  private qualitySettings: MobileQualitySettings | null = null;
  private touchCapabilities: TouchCapabilities | null = null;
  private performanceProfile: Map<string, number> = new Map();
  private batteryMonitor: any | null = null;

  private constructor() {
    this.initializeBatteryMonitoring();
  }

  public static getInstance(): MobileDeviceDetector {
    if (!MobileDeviceDetector.instance) {
      MobileDeviceDetector.instance = new MobileDeviceDetector();
    }
    return MobileDeviceDetector.instance;
  }

  /**
   * Comprehensive device capability detection
   */
  public async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const deviceType = this.detectDeviceType();
    const performanceTier = await this.detectPerformanceTier();
    const screenSize = this.detectScreenSize();
    const memorySize = this.detectMemoryCapabilities();
    const gpuTier = await this.detectGPUCapabilities();
    const connectionSpeed = this.detectConnectionSpeed();
    const webglSupport = this.detectWebGLSupport();
    const batteryInfo = await this.getBatteryInfo();

    this.capabilities = {
      deviceType,
      performanceTier,
      screenSize,
      memorySize,
      gpuTier,
      batteryLevel: batteryInfo.level,
      isCharging: batteryInfo.charging,
      connectionSpeed,
      supportsWebGL: webglSupport.webgl,
      supportsWebGL2: webglSupport.webgl2,
      maxTextureSize: webglSupport.maxTextureSize,
      vendorInfo: webglSupport.vendor,
      modelInfo: this.detectDeviceModel()
    };

    return this.capabilities;
  }

  /**
   * Get optimized quality settings based on device capabilities
   */
  public async getQualitySettings(): Promise<MobileQualitySettings> {
    if (this.qualitySettings) {
      return this.qualitySettings;
    }

    const capabilities = await this.detectCapabilities();
    this.qualitySettings = this.calculateQualitySettings(capabilities);
    return this.qualitySettings;
  }

  /**
   * Detect touch capabilities for interaction optimization
   */
  public detectTouchCapabilities(): TouchCapabilities {
    if (this.touchCapabilities) {
      return this.touchCapabilities;
    }

    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const SUPPORTS_PRESSURE = 'force' in TouchEvent.prototype;
    const supportsMultiTouch = maxTouchPoints > 1;

    // Check for device sensors
    const HAS_GYROSCOPE = 'DeviceOrientationEvent' in window;
    const HAS_ACCELEROMETER = 'DeviceMotionEvent' in window;
    const hasCompass = HAS_GYROSCOPE; // Usually comes together

    this.touchCapabilities = {
      maxTouchPoints,
      SUPPORTS_PRESSURE,
      supportsMultiTouch,
      HAS_GYROSCOPE,
      HAS_ACCELEROMETER,
      hasCompass
    };

    return this.touchCapabilities;
  }

  /**
   * Get battery-conscious optimization settings
   */
  public getBatteryOptimization(batteryLevel?: number): BatteryOptimization {
    const level = batteryLevel ?? this.capabilities?.batteryLevel ?? 100;
    const isCharging = this.capabilities?.isCharging ?? true;

    // Aggressive optimization when battery is low and not charging
    const aggressiveMode = level < 20 && !isCharging;
    const moderateOptimization = level < 50 && !isCharging;

    return {
      enabled: level < 80 || !isCharging,
      aggressiveMode,
      throttleAnimations: moderateOptimization || aggressiveMode,
      reducedParticles: moderateOptimization || aggressiveMode,
      staticLighting: aggressiveMode,
      disableEffects: aggressiveMode
    };
  }

  /**
   * Profile device performance with benchmark tests
   */
  public async profilePerformance(): Promise<Map<string, number>> {
    const startTime = performance.now();

    // Canvas rendering test
    const canvasScore = await this.benchmarkCanvas();
    this.performanceProfile.set('canvas', canvasScore);

    // WebGL rendering test
    if (this.capabilities?.supportsWebGL) {
      const webglScore = await this.benchmarkWebGL();
      this.performanceProfile.set('webgl', webglScore);
    }

    // Memory allocation test
    const memoryScore = this.benchmarkMemory();
    this.performanceProfile.set('memory', memoryScore);

    // Animation smoothness test
    const animationScore = await this.benchmarkAnimation();
    this.performanceProfile.set('animation', animationScore);

    const totalTime = performance.now() - startTime;
    this.performanceProfile.set('profileTime', totalTime);

    console.log('📱 Device performance profile completed in', totalTime.toFixed(2), 'ms');
    return this.performanceProfile;
  }

  /**
   * Update quality settings based on real-time performance
   */
  public updateQualityBasedOnPerformance(currentFPS: number, memoryUsage: number): MobileQualitySettings {
    if (!this.qualitySettings) {
      throw new Error('Quality settings not initialized');
    }

    const settings = { ...this.qualitySettings };

    // Adjust based on FPS
    if (currentFPS < settings.targetFPS * 0.8) {
      // Significantly below target FPS
      settings.maxParticles = Math.floor(settings.maxParticles * 0.7);
      settings.enablePostProcessing = false;
      settings.animationQuality = 'reduced';
      settings.renderScale = Math.max(0.5, settings.renderScale * 0.9);
    } else if (currentFPS < settings.targetFPS * 0.9) {
      // Slightly below target FPS
      settings.maxParticles = Math.floor(settings.maxParticles * 0.85);
      settings.animationQuality = 'reduced';
    }

    // Adjust based on memory usage
    if (memoryUsage > 100) { // MB
      settings.textureQuality = 'low';
      settings.maxParticles = Math.floor(settings.maxParticles * 0.8);
      settings.geometryComplexity = 'low';
    }

    this.qualitySettings = settings;
    return settings;
  }

  /**
   * Detect device type with enhanced mobile detection
   */
  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const IS_TOUCH_DEVICE = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // More sophisticated detection
    const screenWidth = Math.min(screen.width, screen.height);
    const screenHeight = Math.max(screen.width, screen.height);
    const aspectRatio = screenHeight / screenWidth;

    if (!isMobileUA && !IS_TOUCH_DEVICE) {
      return 'desktop';
    }

    // Distinguish between tablet and mobile
    if (screenWidth >= 768 || (aspectRatio < 1.6 && screenWidth >= 600)) {
      return 'tablet';
    }

    return 'mobile';
  }

  /**
   * Detect performance tier with hardware profiling
   */
  private async detectPerformanceTier(): Promise<'high' | 'medium' | 'low'> {
    const deviceType = this.detectDeviceType();
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const userAgent = navigator.userAgent.toLowerCase();

    // High-end device indicators
    const isHighEnd = 
      cores >= 8 || 
      memory >= 8 || 
      /iphone.*os 1[5-9]|iphone.*os 2\d/i.test(userAgent) ||
      /pixel [6-9]|galaxy s2[0-9]|oneplus [9-9]/i.test(userAgent);

    // Low-end device indicators
    const isLowEnd = 
      cores < 4 || 
      memory < 3 || 
      /android [4-6]\.|ios [9-12]\./i.test(userAgent) ||
      deviceType === 'mobile' && screen.width < 400;

    if (isHighEnd && deviceType !== 'mobile') return 'high';
    if (isLowEnd) return 'low';
    return 'medium';
  }

  /**
   * Detect screen size category
   */
  private detectScreenSize(): 'small' | 'medium' | 'large' {
    const width = Math.min(screen.width, screen.height);
    
    if (width < 400) return 'small';
    if (width < 800) return 'medium';
    return 'large';
  }

  /**
   * Detect memory capabilities
   */
  private detectMemoryCapabilities(): 'low' | 'medium' | 'high' {
    const deviceMemory = (navigator as any).deviceMemory;
    
    if (deviceMemory) {
      if (deviceMemory >= 8) return 'high';
      if (deviceMemory >= 4) return 'medium';
      return 'low';
    }

    // Fallback based on device type and user agent
    const userAgent = navigator.userAgent.toLowerCase();
    const isHighEndDevice = /iphone.*os 1[4-9]|pixel [5-9]|galaxy s1[5-9]/i.test(userAgent);
    const isLowEndDevice = /android [4-6]\.|ios [9-11]\./i.test(userAgent);

    if (isHighEndDevice) return 'high';
    if (isLowEndDevice) return 'low';
    return 'medium';
  }

  /**
   * Detect GPU capabilities
   */
  private async detectGPUCapabilities(): Promise<'high' | 'medium' | 'low'> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'low';

    const webglContext = gl as WebGLRenderingContext;
    const renderer = webglContext.getParameter(webglContext.RENDERER);
    const vendor = webglContext.getParameter(webglContext.VENDOR);
    
    // High-end GPU indicators
    if (/adreno [6-7]\d\d|mali-g\d{2,}|apple gpu|nvidia|radeon/i.test(renderer)) {
      return 'high';
    }

    // Low-end GPU indicators  
    if (/adreno [2-4]\d\d|mali-[4-5]\d\d|powervr/i.test(renderer)) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Detect connection speed
   */
  private detectConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    if (!connection) return 'unknown';

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;

    if (effectiveType === '4g' && downlink > 10) return 'fast';
    if (effectiveType === '3g' || downlink < 1.5) return 'slow';
    
    return 'fast';
  }

  /**
   * Detect WebGL support and capabilities
   */
  private detectWebGLSupport(): {
    webgl: boolean;
    webgl2: boolean;
    maxTextureSize: number;
    vendor: string;
  } {
    const canvas = document.createElement('canvas');
    
    // Test WebGL 2.0
    let gl2 = canvas.getContext('webgl2');
    let webgl2Support = !!gl2;
    
    // Test WebGL 1.0
    let gl = gl2 || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    let webglSupport = !!gl;
    
    if (!gl) {
      return {
        webgl: false,
        webgl2: false,
        maxTextureSize: 0,
        vendor: 'unknown'
      };
    }

    const webglContext = gl as WebGLRenderingContext;
    const maxTextureSize = webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE);
    const vendor = webglContext.getParameter(webglContext.VENDOR);

    return {
      webgl: webglSupport,
      webgl2: webgl2Support,
      maxTextureSize,
      vendor
    };
  }

  /**
   * Detect specific device model
   */
  private detectDeviceModel(): string | undefined {
    const userAgent = navigator.userAgent;
    
    // iPhone models
    const iPhoneMatch = userAgent.match(/iPhone(\d+,\d+)/);
    if (iPhoneMatch) return `iPhone ${iPhoneMatch[1]}`;
    
    // Android models
    const androidMatch = userAgent.match(/Android.*?;\s*([^;]+)/);
    if (androidMatch) return androidMatch[1].trim();
    
    return undefined;
  }

  /**
   * Calculate quality settings based on capabilities
   */
  private calculateQualitySettings(capabilities: DeviceCapabilities): MobileQualitySettings {
    const baseSettings = this.getBaseQualitySettings(capabilities.performanceTier);
    
    // Adjust for device type
    if (capabilities.deviceType === 'mobile') {
      baseSettings.maxParticles = Math.floor(baseSettings.maxParticles * 0.6);
      baseSettings.targetFPS = Math.min(baseSettings.targetFPS, 30);
      baseSettings.renderScale = Math.min(baseSettings.renderScale, 0.8);
      baseSettings.enableAntialiasing = false;
    } else if (capabilities.deviceType === 'tablet') {
      baseSettings.maxParticles = Math.floor(baseSettings.maxParticles * 0.8);
      baseSettings.targetFPS = Math.min(baseSettings.targetFPS, 45);
    }

    // Adjust for memory
    if (capabilities.memorySize === 'low') {
      baseSettings.maxParticles = Math.floor(baseSettings.maxParticles * 0.5);
      baseSettings.textureQuality = 'low';
      baseSettings.geometryComplexity = 'low';
    }

    // Adjust for GPU
    if (capabilities.gpuTier === 'low') {
      baseSettings.enableShadows = false;
      baseSettings.enablePostProcessing = false;
      baseSettings.enableBloom = false;
      baseSettings.maxLights = 2;
    }

    // Adjust for screen size
    if (capabilities.screenSize === 'small') {
      baseSettings.renderScale = Math.min(baseSettings.renderScale, 0.7);
      baseSettings.textureQuality = 'low';
    }

    return baseSettings;
  }

  /**
   * Get base quality settings for performance tier
   */
  private getBaseQualitySettings(tier: 'high' | 'medium' | 'low'): MobileQualitySettings {
    const settings = {
      high: {
        maxParticles: 200,
        targetFPS: 60,
        enableShadows: true,
        enableLighting: true,
        enablePostProcessing: true,
        textureQuality: 'high' as const,
        geometryComplexity: 'high' as const,
        animationQuality: 'full' as const,
        physicsAccuracy: 'high' as const,
        enableAntialiasing: true,
        renderScale: 1.0,
        enableBloom: true,
        enableParallax: true,
        maxLights: 8
      },
      medium: {
        maxParticles: 100,
        targetFPS: 45,
        enableShadows: true,
        enableLighting: true,
        enablePostProcessing: false,
        textureQuality: 'medium' as const,
        geometryComplexity: 'medium' as const,
        animationQuality: 'reduced' as const,
        physicsAccuracy: 'medium' as const,
        enableAntialiasing: false,
        renderScale: 0.8,
        enableBloom: false,
        enableParallax: false,
        maxLights: 4
      },
      low: {
        maxParticles: 30,
        targetFPS: 30,
        enableShadows: false,
        enableLighting: false,
        enablePostProcessing: false,
        textureQuality: 'low' as const,
        geometryComplexity: 'low' as const,
        animationQuality: 'minimal' as const,
        physicsAccuracy: 'low' as const,
        enableAntialiasing: false,
        renderScale: 0.6,
        enableBloom: false,
        enableParallax: false,
        maxLights: 2
      }
    };

    return settings[tier];
  }

  /**
   * Benchmark canvas performance
   */
  private async benchmarkCanvas(): Promise<number> {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d')!;

    const startTime = performance.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      ctx.fillStyle = `hsl(${i % 360}, 50%, 50%)`;
      ctx.fillRect(Math.random() * 500, Math.random() * 500, 20, 20);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Higher score is better (operations per ms)
    return iterations / duration;
  }

  /**
   * Benchmark WebGL performance
   */
  private async benchmarkWebGL(): Promise<number> {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const gl = canvas.getContext('webgl')!;

    if (!gl) return 0;

    const startTime = performance.now();
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      gl.clearColor(Math.random(), Math.random(), Math.random(), 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.flush();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return iterations / duration;
  }

  /**
   * Benchmark memory allocation
   */
  private benchmarkMemory(): number {
    const startTime = performance.now();
    const arrays: number[][] = [];
    
    try {
      // Allocate memory in chunks
      for (let i = 0; i < 100; i++) {
        arrays.push(new Array(10000).fill(i));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Clean up
      arrays.length = 0;
      
      return 100 / duration; // Allocations per ms
    } catch (error) {
      return 0; // Memory allocation failed
    }
  }

  /**
   * Benchmark animation smoothness
   */
  private async benchmarkAnimation(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let FRAME_COUNT = 0;
      let lastTime = startTime;
      
      const animate = (currentTime: number) => {
        FRAME_COUNT++;
        
        if (currentTime - startTime < 1000) { // Run for 1 second
          requestAnimationFrame(animate);
        } else {
          const avgFPS = (FRAME_COUNT * 1000) / (currentTime - startTime);
          resolve(avgFPS);
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  /**
   * Initialize battery monitoring
   */
  private async initializeBatteryMonitoring(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        this.batteryMonitor = await (navigator as any).getBattery();
        
        // Listen for battery events
        this.batteryMonitor?.addEventListener('levelchange', () => {
          this.onBatteryChange();
        });
        
        this.batteryMonitor?.addEventListener('chargingchange', () => {
          this.onBatteryChange();
        });
      }
    } catch (error) {
      console.warn('Battery monitoring not available:', error);
    }
  }

  /**
   * Get current battery information
   */
  private async getBatteryInfo(): Promise<{ level: number; charging: boolean }> {
    try {
      if (this.batteryMonitor) {
        return {
          level: Math.round(this.batteryMonitor.level * 100),
          charging: this.batteryMonitor.charging
        };
      }
      
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging
        };
      }
    } catch (error) {
      console.warn('Cannot get battery info:', error);
    }
    
    return { level: 100, charging: true }; // Default assumption
  }

  /**
   * Handle battery level changes
   */
  private onBatteryChange(): void {
    if (!this.batteryMonitor) return;
    
    const level = Math.round(this.batteryMonitor.level * 100);
    const charging = this.batteryMonitor.charging;
    
    // Update capabilities
    if (this.capabilities) {
      this.capabilities.batteryLevel = level;
      this.capabilities.isCharging = charging;
    }
    
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('batterychange', {
      detail: { level, charging }
    }));
    
    console.log(`🔋 Battery: ${level}% ${charging ? '(charging)' : ''}`);
  }
}

// Export singleton instance
export const mobileDetector = MobileDeviceDetector.getInstance();