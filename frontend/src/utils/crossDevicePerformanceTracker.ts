/**
 * Cross-Device Performance Tracker
 * Comprehensive performance monitoring and analysis across different device types and capabilities
 */

import { mobileDetector } from './mobileOptimized';
import { mobileFrameRate } from './mobileFrameRate';
import { performanceMonitoring } from './performanceMonitoringHooks';
import { analytics } from './analyticsSystem';

// Performance tracking interfaces
interface DevicePerformanceProfile {
  deviceId: string;
  deviceFingerprint: string;
  hardware: HardwareSpecs;
  software: SoftwareSpecs;
  capabilities: DeviceCapabilities;
  benchmarks: PerformanceBenchmarks;
  realWorldMetrics: RealWorldMetrics;
  limitations: DeviceLimitations;
  optimizations: DeviceOptimizations;
}

interface HardwareSpecs {
  cpuCores: number;
  estimatedRAM: 'low' | 'medium' | 'high'; // <4GB, 4-8GB, >8GB
  gpuTier: 'low' | 'medium' | 'high';
  displaySpecs: {
    resolution: { width: number; height: number };
    pixelRatio: number;
    refreshRate: number;
    colorDepth: number;
  };
  inputMethods: ('touch' | 'mouse' | 'keyboard')[];
  sensors: string[];
  connectivity: {
    types: string[];
    speed: string;
    reliability: number; // 0-1
  };
}

interface SoftwareSpecs {
  os: {
    name: string;
    version: string;
    architecture: string;
  };
  browser: {
    name: string;
    version: string;
    engine: string;
  };
  features: {
    webGL: boolean;
    webGL2: boolean;
    webAssembly: boolean;
    serviceWorkers: boolean;
    webWorkers: boolean;
    offscreenCanvas: boolean;
  };
  apis: {
    battery: boolean;
    deviceMemory: boolean;
    hardwareConcurrency: boolean;
    performance: boolean;
  };
}

interface DeviceCapabilities {
  performanceTier: 'low' | 'medium' | 'high';
  renderingCapability: number; // 0-100 score
  memoryCapability: number; // 0-100 score
  networkCapability: number; // 0-100 score
  batteryEfficiency: number; // 0-100 score
  thermalManagement: number; // 0-100 score
  multitaskingCapability: number; // 0-100 score
}

interface PerformanceBenchmarks {
  cpuScore: number;
  gpuScore: number;
  memoryScore: number;
  renderingScore: number;
  animationScore: number;
  networkScore: number;
  overallScore: number;
  testDate: number;
  testDuration: number;
}

interface RealWorldMetrics {
  averageFPS: number;
  frameTimeP95: number; // 95th percentile frame time
  memoryUsagePeak: number;
  memoryUsageAverage: number;
  loadTimes: {
    initial: number;
    component: Record<string, number>;
    resource: Record<string, number>;
  };
  errorRates: {
    javascript: number;
    rendering: number;
    network: number;
    memory: number;
  };
  batteryDrainRate: number; // %/hour
  thermalThrottling: {
    frequency: number;
    duration: number;
    impact: number;
  };
  userExperience: {
    responsiveness: number; // 0-100
    smoothness: number; // 0-100
    stability: number; // 0-100
  };
}

interface DeviceLimitations {
  maxParticles: number;
  maxTextures: number;
  maxShaders: number;
  maxAnimations: number;
  recommendedFPS: number;
  memoryBudget: number; // MB
  batteryAwareness: boolean;
  thermalAwareness: boolean;
  networkAwareness: boolean;
}

interface DeviceOptimizations {
  recommendedSettings: {
    quality: 'low' | 'medium' | 'high';
    particles: number;
    fps: number;
    renderScale: number;
    enableEffects: boolean;
    enablePhysics: boolean;
  };
  adaptiveSettings: {
    enableFrameSkipping: boolean;
    enableLOD: boolean;
    enableOcclusion: boolean;
    enableCompression: boolean;
  };
  powerManagement: {
    batteryMode: 'performance' | 'balanced' | 'saver';
    thermalMode: 'performance' | 'balanced' | 'cool';
  };
}

// Performance comparison and analysis
interface CrossDeviceAnalysis {
  deviceProfiles: DevicePerformanceProfile[];
  performanceDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  commonIssues: PerformanceIssue[];
  optimizationRecommendations: OptimizationRecommendation[];
  deviceSpecificTuning: Record<string, DeviceOptimizations>;
}

interface PerformanceIssue {
  deviceTypes: string[];
  issue: string;
  frequency: number;
  impact: 'low' | 'medium' | 'high';
  solution: string;
  affectedComponents: string[];
}

interface OptimizationRecommendation {
  targetDevices: string[];
  optimization: string;
  expectedImprovement: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
}

// Main cross-device performance tracking class
class CrossDevicePerformanceTracker {
  private deviceProfiles: Map<string, DevicePerformanceProfile> = new Map();
  private currentProfile: DevicePerformanceProfile | null = null;
  private metricCollectionInterval: NodeJS.Timeout | null = null;
  private benchmarkRunning = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Create device profile for current device
    this.currentProfile = await this.createDeviceProfile();
    
    if (this.currentProfile) {
      this.deviceProfiles.set(this.currentProfile.deviceId, this.currentProfile);
      
      // Start continuous monitoring
      this.startContinuousMonitoring();
      
      // Run initial benchmarks
      await this.runBenchmarks();
      
      console.log('📊 Cross-device performance tracking initialized');
    }
  }

  private async createDeviceProfile(): Promise<DevicePerformanceProfile> {
    const deviceCapabilities = await mobileDetector.detectCapabilities();
    const deviceFingerprint = await this.generateDeviceFingerprint();
    
    return {
      deviceId: deviceFingerprint,
      deviceFingerprint,
      hardware: await this.detectHardwareSpecs(),
      software: this.detectSoftwareSpecs(),
      capabilities: this.mapDeviceCapabilities(deviceCapabilities),
      benchmarks: {
        cpuScore: 0,
        gpuScore: 0,
        memoryScore: 0,
        renderingScore: 0,
        animationScore: 0,
        networkScore: 0,
        overallScore: 0,
        testDate: Date.now(),
        testDuration: 0
      },
      realWorldMetrics: {
        averageFPS: 60,
        frameTimeP95: 16.67,
        memoryUsagePeak: 0,
        memoryUsageAverage: 0,
        loadTimes: {
          initial: 0,
          component: {},
          resource: {}
        },
        errorRates: {
          javascript: 0,
          rendering: 0,
          network: 0,
          memory: 0
        },
        batteryDrainRate: 0,
        thermalThrottling: {
          frequency: 0,
          duration: 0,
          impact: 0
        },
        userExperience: {
          responsiveness: 100,
          smoothness: 100,
          stability: 100
        }
      },
      limitations: this.calculateDeviceLimitations(deviceCapabilities),
      optimizations: this.generateOptimizationSettings(deviceCapabilities)
    };
  }

  private async generateDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency || 0,
      navigator.language,
      new Date().getTimezoneOffset(),
      navigator.platform
    ];

    // Add WebGL fingerprint
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      components.push(renderer, vendor);
    }

    return btoa(components.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private async detectHardwareSpecs(): Promise<HardwareSpecs> {
    return {
      cpuCores: navigator.hardwareConcurrency || 1,
      estimatedRAM: this.estimateRAM(),
      gpuTier: await this.detectGPUTier(),
      displaySpecs: {
        resolution: { width: screen.width, height: screen.height },
        pixelRatio: window.devicePixelRatio || 1,
        refreshRate: this.detectRefreshRate(),
        colorDepth: screen.colorDepth
      },
      inputMethods: this.detectInputMethods(),
      sensors: this.detectAvailableSensors(),
      connectivity: await this.detectConnectivity()
    };
  }

  private detectSoftwareSpecs(): SoftwareSpecs {
    const userAgent = navigator.userAgent;
    
    return {
      os: this.parseOS(userAgent),
      browser: this.parseBrowser(userAgent),
      features: {
        webGL: !!this.getWebGLContext(),
        webGL2: !!this.getWebGL2Context(),
        webAssembly: typeof WebAssembly !== 'undefined',
        serviceWorkers: 'serviceWorker' in navigator,
        webWorkers: typeof Worker !== 'undefined',
        offscreenCanvas: typeof OffscreenCanvas !== 'undefined'
      },
      apis: {
        battery: 'getBattery' in navigator,
        deviceMemory: 'deviceMemory' in navigator,
        hardwareConcurrency: 'hardwareConcurrency' in navigator,
        performance: 'performance' in window
      }
    };
  }

  private async runBenchmarks(): Promise<void> {
    if (this.benchmarkRunning) return;
    this.benchmarkRunning = true;

    const startTime = performance.now();
    
    try {
      const [cpuScore, gpuScore, memoryScore, renderingScore, animationScore, networkScore] = await Promise.all([
        this.benchmarkCPU(),
        this.benchmarkGPU(),
        this.benchmarkMemory(),
        this.benchmarkRendering(),
        this.benchmarkAnimation(),
        this.benchmarkNetwork()
      ]);

      const overallScore = (cpuScore + gpuScore + memoryScore + renderingScore + animationScore + networkScore) / 6;
      const testDuration = performance.now() - startTime;

      if (this.currentProfile) {
        this.currentProfile.benchmarks = {
          cpuScore,
          gpuScore,
          memoryScore,
          renderingScore,
          animationScore,
          networkScore,
          overallScore,
          testDate: Date.now(),
          testDuration
        };

        // Update device capabilities based on benchmarks
        this.updateCapabilitiesFromBenchmarks();
        
        // Track benchmark results
        analytics.track('performance_metric', 'general', 'device_benchmark', undefined, overallScore, {
          deviceFingerprint: this.currentProfile.deviceFingerprint,
          benchmarks: this.currentProfile.benchmarks,
          hardwareSpecs: this.currentProfile.hardware
        });
      }
    } finally {
      this.benchmarkRunning = false;
    }
  }

  private async benchmarkCPU(): Promise<number> {
    const startTime = performance.now();
    const iterations = 100000;
    
    // CPU-intensive calculation
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    
    const duration = performance.now() - startTime;
    // Score based on operations per millisecond
    return Math.min(100, (iterations / duration) * 10);
  }

  private async benchmarkGPU(): Promise<number> {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 0;

    const startTime = performance.now();
    
    // Simple GPU test - draw many triangles
    const triangleCount = 1000;
    for (let i = 0; i < triangleCount; i++) {
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    
    const duration = performance.now() - startTime;
    return Math.min(100, (triangleCount / duration) * 10);
  }

  private async benchmarkMemory(): Promise<number> {
    if (!(performance as any).memory) return 50; // Default score if API not available
    
    const memory = (performance as any).memory;
    const memoryEfficiency = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    // Score based on memory efficiency (lower usage = higher score)
    return Math.max(0, Math.min(100, (1 - memoryEfficiency) * 100));
  }

  private async benchmarkRendering(): Promise<number> {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const startTime = performance.now();
    const iterations = 100;
    
    // Rendering benchmark
    for (let i = 0; i < iterations; i++) {
      ctx.clearRect(0, 0, 400, 400);
      
      // Draw complex shapes
      for (let j = 0; j < 50; j++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 400, Math.random() * 400, 10, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
        ctx.fill();
      }
    }
    
    const duration = performance.now() - startTime;
    return Math.min(100, (iterations * 50) / duration);
  }

  private async benchmarkAnimation(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let frameCount = 0;
      
      const animate = () => {
        frameCount++;
        
        if (frameCount < 60) { // Test for 60 frames
          requestAnimationFrame(animate);
        } else {
          const duration = performance.now() - startTime;
          const fps = (frameCount * 1000) / duration;
          resolve(Math.min(100, fps * 1.67)); // 60 FPS = 100 points
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  private async benchmarkNetwork(): Promise<number> {
    if (!navigator.onLine) return 0;
    
    const startTime = performance.now();
    
    try {
      // Test with small data request
      const response = await fetch('data:text/plain;base64,SGVsbG8gV29ybGQ='); // "Hello World"
      await response.text();
      
      const duration = performance.now() - startTime;
      return Math.max(0, Math.min(100, (1000 / duration) * 10)); // Lower duration = higher score
    } catch {
      return 0;
    }
  }

  private startContinuousMonitoring() {
    this.metricCollectionInterval = setInterval(() => {
      this.collectRealWorldMetrics();
    }, 5000); // Collect every 5 seconds
  }

  private collectRealWorldMetrics() {
    if (!this.currentProfile) return;

    const performanceData = performanceMonitoring.getPerformanceData();
    const frameMetrics = mobileFrameRate.getMetrics();
    
    if (performanceData && frameMetrics) {
      const metrics = this.currentProfile.realWorldMetrics;
      
      // Update FPS metrics
      metrics.averageFPS = (metrics.averageFPS * 0.9) + (frameMetrics.currentFPS * 0.1);
      metrics.frameTimeP95 = Math.max(metrics.frameTimeP95, frameMetrics.frameTime);
      
      // Update memory metrics
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const currentMemoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        metrics.memoryUsagePeak = Math.max(metrics.memoryUsagePeak, currentMemoryUsage);
        metrics.memoryUsageAverage = (metrics.memoryUsageAverage * 0.9) + (currentMemoryUsage * 0.1);
      }
      
      // Update thermal throttling
      if (frameMetrics.thermalState !== 'normal') {
        metrics.thermalThrottling.frequency++;
        metrics.thermalThrottling.impact = this.calculateThermalImpact(frameMetrics.thermalState);
      }
      
      // Update user experience scores
      this.updateUserExperienceScores(frameMetrics);
      
      // Track device-specific performance
      this.trackDeviceSpecificMetrics();
    }
  }

  private updateUserExperienceScores(frameMetrics: any) {
    if (!this.currentProfile) return;
    
    const ux = this.currentProfile.realWorldMetrics.userExperience;
    
    // Responsiveness based on FPS and frame time
    const responsiveness = Math.min(100, (frameMetrics.currentFPS / 60) * 100);
    ux.responsiveness = (ux.responsiveness * 0.9) + (responsiveness * 0.1);
    
    // Smoothness based on frame time consistency
    const smoothness = Math.max(0, 100 - (frameMetrics.frameTime - 16.67) * 5);
    ux.smoothness = (ux.smoothness * 0.9) + (smoothness * 0.1);
    
    // Stability based on error rates and crashes
    const stability = Math.max(0, 100 - (this.currentProfile.realWorldMetrics.errorRates.javascript * 100));
    ux.stability = (ux.stability * 0.9) + (stability * 0.1);
  }

  private trackDeviceSpecificMetrics() {
    if (!this.currentProfile) return;
    
    analytics.track('performance_metric', 'general', 'device_performance', undefined, undefined, {
      deviceId: this.currentProfile.deviceId,
      performanceTier: this.currentProfile.capabilities.performanceTier,
      realWorldMetrics: this.currentProfile.realWorldMetrics,
      hardwareSpecs: this.currentProfile.hardware,
      timestamp: Date.now()
    });
  }

  // Public methods for getting performance data
  public getCurrentDeviceProfile(): DevicePerformanceProfile | null {
    return this.currentProfile;
  }

  public getAllDeviceProfiles(): DevicePerformanceProfile[] {
    return Array.from(this.deviceProfiles.values());
  }

  public getCrossDeviceAnalysis(): CrossDeviceAnalysis {
    const profiles = this.getAllDeviceProfiles();
    
    return {
      deviceProfiles: profiles,
      performanceDistribution: this.calculatePerformanceDistribution(profiles),
      commonIssues: this.identifyCommonIssues(profiles),
      optimizationRecommendations: this.generateOptimizationRecommendations(profiles),
      deviceSpecificTuning: this.generateDeviceSpecificTuning(profiles)
    };
  }

  public getOptimalSettingsForDevice(deviceId?: string): DeviceOptimizations | null {
    const profile = deviceId ? this.deviceProfiles.get(deviceId) : this.currentProfile;
    return profile ? profile.optimizations : null;
  }

  // Helper methods (implementations for various detection and calculation methods)
  private estimateRAM(): 'low' | 'medium' | 'high' {
    const memory = (navigator as any).deviceMemory;
    if (memory !== undefined) {
      if (memory < 4) return 'low';
      if (memory < 8) return 'medium';
      return 'high';
    }
    
    // Fallback estimation based on other factors
    const cores = navigator.hardwareConcurrency || 1;
    if (cores < 2) return 'low';
    if (cores < 6) return 'medium';
    return 'high';
  }

  private async detectGPUTier(): Promise<'low' | 'medium' | 'high'> {
    const gl = this.getWebGLContext();
    if (!gl) return 'low';
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    // Simple GPU tier detection based on renderer string
    if (renderer.includes('Adreno') || renderer.includes('Mali')) {
      return 'medium'; // Mobile GPUs
    }
    if (renderer.includes('GeForce') || renderer.includes('Radeon')) {
      return 'high'; // Desktop GPUs
    }
    
    return 'medium'; // Default
  }

  private detectRefreshRate(): number {
    // Try to detect refresh rate, fallback to 60Hz
    return 60; // Most devices, could be enhanced with proper detection
  }

  private detectInputMethods(): ('touch' | 'mouse' | 'keyboard')[] {
    const methods: ('touch' | 'mouse' | 'keyboard')[] = [];
    
    if ('ontouchstart' in window) methods.push('touch');
    if ('onmousemove' in window) methods.push('mouse');
    if ('onkeydown' in window) methods.push('keyboard');
    
    return methods;
  }

  private detectAvailableSensors(): string[] {
    const sensors = [];
    
    if ('DeviceMotionEvent' in window) sensors.push('accelerometer');
    if ('DeviceOrientationEvent' in window) sensors.push('gyroscope');
    if ('AmbientLightSensor' in window) sensors.push('ambient-light');
    
    return sensors;
  }

  private async detectConnectivity(): Promise<HardwareSpecs['connectivity']> {
    const connection = (navigator as any).connection;
    
    return {
      types: connection ? [connection.effectiveType] : ['unknown'],
      speed: connection ? connection.effectiveType : 'unknown',
      reliability: connection ? Math.min(1, connection.downlink / 10) : 0.5
    };
  }

  // Additional helper methods would be implemented here...
  private getWebGLContext(): WebGLRenderingContext | null {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }

  private getWebGL2Context(): WebGL2RenderingContext | null {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2');
  }

  private parseOS(userAgent: string) {
    // Implementation for OS detection
    return { name: 'Unknown', version: '0.0', architecture: 'unknown' };
  }

  private parseBrowser(userAgent: string) {
    // Implementation for browser detection
    return { name: 'Unknown', version: '0.0', engine: 'unknown' };
  }

  private mapDeviceCapabilities(capabilities: any): DeviceCapabilities {
    return {
      performanceTier: capabilities.performanceTier,
      renderingCapability: 75,
      memoryCapability: 75,
      networkCapability: 75,
      batteryEfficiency: 75,
      thermalManagement: 75,
      multitaskingCapability: 75
    };
  }

  private calculateDeviceLimitations(capabilities: any): DeviceLimitations {
    return {
      maxParticles: capabilities.performanceTier === 'high' ? 200 : capabilities.performanceTier === 'medium' ? 100 : 50,
      maxTextures: 32,
      maxShaders: 16,
      maxAnimations: 10,
      recommendedFPS: capabilities.performanceTier === 'high' ? 60 : 30,
      memoryBudget: capabilities.memorySize === 'high' ? 200 : capabilities.memorySize === 'medium' ? 100 : 50,
      batteryAwareness: true,
      thermalAwareness: true,
      networkAwareness: true
    };
  }

  private generateOptimizationSettings(capabilities: any): DeviceOptimizations {
    const tier = capabilities.performanceTier;
    
    return {
      recommendedSettings: {
        quality: tier === 'high' ? 'high' : tier === 'medium' ? 'medium' : 'low',
        particles: tier === 'high' ? 150 : tier === 'medium' ? 75 : 30,
        fps: tier === 'high' ? 60 : 30,
        renderScale: tier === 'high' ? 1.0 : tier === 'medium' ? 0.8 : 0.6,
        enableEffects: tier !== 'low',
        enablePhysics: tier === 'high'
      },
      adaptiveSettings: {
        enableFrameSkipping: tier === 'low',
        enableLOD: tier !== 'high',
        enableOcclusion: tier === 'high',
        enableCompression: tier !== 'high'
      },
      powerManagement: {
        batteryMode: tier === 'high' ? 'performance' : 'balanced',
        thermalMode: tier === 'high' ? 'balanced' : 'cool'
      }
    };
  }

  private updateCapabilitiesFromBenchmarks() {
    // Update device capabilities based on benchmark results
  }

  private calculateThermalImpact(thermalState: string): number {
    switch (thermalState) {
      case 'fair': return 0.2;
      case 'serious': return 0.5;
      case 'critical': return 0.8;
      default: return 0;
    }
  }

  private calculatePerformanceDistribution(profiles: DevicePerformanceProfile[]) {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    profiles.forEach(profile => {
      distribution[profile.capabilities.performanceTier]++;
    });
    
    const total = profiles.length;
    return {
      low: total > 0 ? distribution.low / total : 0,
      medium: total > 0 ? distribution.medium / total : 0,
      high: total > 0 ? distribution.high / total : 0
    };
  }

  private identifyCommonIssues(profiles: DevicePerformanceProfile[]): PerformanceIssue[] {
    // Analyze profiles to identify common performance issues
    return [];
  }

  private generateOptimizationRecommendations(profiles: DevicePerformanceProfile[]): OptimizationRecommendation[] {
    // Generate recommendations based on cross-device analysis
    return [];
  }

  private generateDeviceSpecificTuning(profiles: DevicePerformanceProfile[]): Record<string, DeviceOptimizations> {
    const tuning: Record<string, DeviceOptimizations> = {};
    
    profiles.forEach(profile => {
      tuning[profile.deviceId] = profile.optimizations;
    });
    
    return tuning;
  }

  // Cleanup
  public destroy() {
    if (this.metricCollectionInterval) {
      clearInterval(this.metricCollectionInterval);
    }
  }
}

// Global instance
const crossDeviceTracker = new CrossDevicePerformanceTracker();

// Export for use in other modules
export { crossDeviceTracker, CrossDevicePerformanceTracker };
export type { DevicePerformanceProfile, CrossDeviceAnalysis, DeviceOptimizations };