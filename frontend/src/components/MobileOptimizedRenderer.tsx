import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { browserCompat } from '../utils/browserCompatibility';

interface MobileOptimizedRendererProps {
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  emotion: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
  equippedItems: string[];
  xpLevel: number;
  size?: 'small' | 'medium' | 'large';
  onPerformanceIssue?: (issue: string) => void;
}

interface MobileOptimizations {
  useInstancedMeshes: boolean;
  limitParticles: boolean;
  reduceTextureSize: boolean;
  disableAntialiasing: boolean;
  useSimpleMaterials: boolean;
  enableObjectPooling: boolean;
  maxRenderDistance: number;
  targetFrameRate: number;
}

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  gpuMemory: number;
}

const MobileOptimizedRenderer: React.FC<MobileOptimizedRendererProps> = ({
  mascotType,
  emotion,
  equippedItems,
  xpLevel,
  size = 'medium',
  onPerformanceIssue
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const mascotGroupRef = useRef<THREE.Group>();
  const animationRef = useRef<number>();
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    gpuMemory: 0
  });

  const [adaptiveQuality, setAdaptiveQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [thermalThrottling, setThermalThrottling] = useState(false);

  // Get browser and device information
  const browserInfo = useMemo(() => browserCompat.getBrowserInfo(), []);
  const webglCapabilities = useMemo(() => browserCompat.getWebGLCapabilities(), []);
  const isMobileDevice = browserInfo.isMobile || browserInfo.isTablet;

  // Mobile-specific optimizations based on device capabilities
  const mobileOptimizations = useMemo((): MobileOptimizations => {
    const baseOptimizations: MobileOptimizations = {
      useInstancedMeshes: true,
      limitParticles: true,
      reduceTextureSize: true,
      disableAntialiasing: true,
      useSimpleMaterials: true,
      enableObjectPooling: true,
      maxRenderDistance: 10,
      targetFrameRate: 30
    };

    // iOS optimizations
    if (browserInfo.name === 'safari' && isMobileDevice) {
      return {
        ...baseOptimizations,
        targetFrameRate: 30, // iOS has strict power management
        maxRenderDistance: 8,
        useInstancedMeshes: false, // iOS WebGL instancing issues
        disableAntialiasing: true // Always disable on iOS
      };
    }

    // Android optimizations
    if (isMobileDevice && browserInfo.name === 'chrome') {
      return {
        ...baseOptimizations,
        targetFrameRate: browserInfo.hardwareTier === 'high' ? 60 : 30,
        useInstancedMeshes: webglCapabilities.extensions.includes('ANGLE_instanced_arrays'),
        disableAntialiasing: browserInfo.hardwareTier === 'low'
      };
    }

    // Low-end device optimizations
    if (browserInfo.hardwareTier === 'low') {
      return {
        ...baseOptimizations,
        targetFrameRate: 20,
        maxRenderDistance: 5,
        useInstancedMeshes: false,
        limitParticles: true,
        useSimpleMaterials: true
      };
    }

    return baseOptimizations;
  }, [browserInfo, isMobileDevice, webglCapabilities]);

  // Thermal throttling detection for mobile devices
  const detectThermalThrottling = useCallback(() => {
    if (!isMobileDevice) return;

    // Monitor frame rate drops that indicate thermal throttling
    if (performanceMetrics.fps < mobileOptimizations.targetFrameRate * 0.7) {
      if (!thermalThrottling) {
        console.warn('Thermal throttling detected, reducing quality');
        setThermalThrottling(true);
        setAdaptiveQuality('low');
        onPerformanceIssue?.('thermal_throttling');
      }
    } else if (thermalThrottling && performanceMetrics.fps > mobileOptimizations.targetFrameRate * 0.9) {
      // Recovery from thermal throttling
      setThermalThrottling(false);
      setAdaptiveQuality('medium');
    }
  }, [performanceMetrics.fps, mobileOptimizations.targetFrameRate, thermalThrottling, isMobileDevice, onPerformanceIssue]);

  // Adaptive quality adjustment based on performance
  const adjustQualityBasedOnPerformance = useCallback(() => {
    const targetFps = mobileOptimizations.targetFrameRate;
    const currentFps = performanceMetrics.fps;
    
    if (currentFps < targetFps * 0.8 && adaptiveQuality !== 'low') {
      setAdaptiveQuality(prev => prev === 'high' ? 'medium' : 'low');
      console.log(`Reducing quality to ${adaptiveQuality} due to low FPS: ${currentFps}`);
    } else if (currentFps > targetFps * 1.1 && adaptiveQuality !== 'high') {
      setTimeout(() => {
        // Delay quality increase to ensure stable performance
        setAdaptiveQuality(prev => prev === 'low' ? 'medium' : 'high');
      }, 2000);
    }
  }, [performanceMetrics.fps, mobileOptimizations.targetFrameRate, adaptiveQuality]);

  // Create mobile-optimized geometry
  const createMobileGeometry = useCallback((type: 'sphere' | 'box' | 'cylinder', ...args: number[]) => {
    const qualityLevel = {
      high: 1.0,
      medium: 0.7,
      low: 0.5
    }[adaptiveQuality];

    switch (type) {
      case 'sphere':
        const [radius = 1] = args;
        const segments = Math.max(6, Math.floor(16 * qualityLevel));
        return new THREE.SphereGeometry(radius, segments, segments);
        
      case 'box':
        const [width = 1, height = 1, depth = 1] = args;
        return new THREE.BoxGeometry(width, height, depth, 1, 1, 1); // No subdivisions for mobile
        
      case 'cylinder':
        const [radiusTop = 1, radiusBottom = 1, cylinderHeight = 1] = args;
        const radialSegments = Math.max(6, Math.floor(12 * qualityLevel));
        return new THREE.CylinderGeometry(radiusTop, radiusBottom, cylinderHeight, radialSegments, 1);
        
      default:
        return new THREE.SphereGeometry(1, 8, 8);
    }
  }, [adaptiveQuality]);

  // Create mobile-optimized materials
  const createMobileMaterial = useCallback((color: number, options: {
    metalness?: number;
    roughness?: number;
    transparent?: boolean;
    opacity?: number;
  } = {}) => {
    // Always use simple materials on mobile for performance
    if (mobileOptimizations.useSimpleMaterials || adaptiveQuality === 'low') {
      return new THREE.MeshPhongMaterial({
        color,
        transparent: options.transparent,
        opacity: options.opacity || 1,
        shininess: 30,
        flatShading: adaptiveQuality === 'low' // Flat shading for lowest quality
      });
    }

    // Use Lambert for medium quality (cheaper than Phong)
    if (adaptiveQuality === 'medium') {
      return new THREE.MeshLambertMaterial({
        color,
        transparent: options.transparent,
        opacity: options.opacity || 1
      });
    }

    // High quality uses standard material but with optimizations
    return new THREE.MeshStandardMaterial({
      color,
      metalness: options.metalness || 0,
      roughness: options.roughness || 0.7, // Higher roughness = less reflections = better performance
      transparent: options.transparent,
      opacity: options.opacity || 1,
      // Disable expensive features on mobile
      envMapIntensity: 0,
      aoMapIntensity: 0
    });
  }, [mobileOptimizations.useSimpleMaterials, adaptiveQuality]);

  // Object pooling for mobile performance
  const objectPool = useMemo(() => {
    const pool = {
      spheres: [] as THREE.Mesh[],
      boxes: [] as THREE.Mesh[],
      cylinders: [] as THREE.Mesh[],
    };

    // Pre-create common objects
    if (mobileOptimizations.enableObjectPooling) {
      for (let i = 0; i < 10; i++) {
        pool.spheres.push(new THREE.Mesh(
          createMobileGeometry('sphere', 0.1),
          createMobileMaterial(0xffffff)
        ));
      }
    }

    return pool;
  }, [mobileOptimizations.enableObjectPooling, createMobileGeometry, createMobileMaterial]);

  // Performance monitoring specifically for mobile
  const monitorMobilePerformance = useCallback(() => {
    if (!rendererRef.current) return;

    const renderer = rendererRef.current;
    const info = renderer.info;

    // Calculate FPS
    const now = performance.now();
    const deltaTime = now - (monitorMobilePerformance as any).lastTime || 16.67;
    (monitorMobilePerformance as any).lastTime = now;
    
    const fps = Math.round(1000 / deltaTime);

    // Get memory usage (if available)
    const memory = (performance as any).memory;
    const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB

    const newMetrics: PerformanceMetrics = {
      fps,
      renderTime: deltaTime,
      memoryUsage,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      gpuMemory: info.memory.textures + info.memory.geometries // Rough estimate
    };

    setPerformanceMetrics(newMetrics);

    // Mobile-specific performance checks
    if (isMobileDevice) {
      // Check for memory pressure
      if (memoryUsage > 100) { // 100MB threshold for mobile
        onPerformanceIssue?.('high_memory_usage');
      }

      // Check for excessive draw calls
      if (info.render.calls > 50) { // Mobile GPUs are draw call limited
        onPerformanceIssue?.('excessive_draw_calls');
      }

      // Check for thermal throttling
      detectThermalThrottling();
    }

    // Auto-adjust quality based on performance
    adjustQualityBasedOnPerformance();

  }, [isMobileDevice, onPerformanceIssue, detectThermalThrottling, adjustQualityBasedOnPerformance]);

  // Touch handling for mobile devices
  const handleTouchInteraction = useCallback((event: TouchEvent) => {
    event.preventDefault(); // Prevent default touch behaviors
    
    if (event.touches.length === 1) {
      // Single touch - treat as click
      const touch = event.touches[0];
      console.log('Touch interaction at:', touch.clientX, touch.clientY);
    } else if (event.touches.length === 2) {
      // Multi-touch - could be used for rotation/zoom
      console.log('Multi-touch detected');
    }
  }, []);

  // Mobile-specific animation with frame rate limiting
  const animateMobile = useCallback((time: number) => {
    try {
      // Frame rate limiting for mobile
      const targetFrameTime = 1000 / mobileOptimizations.targetFrameRate;
      const deltaTime = time - (animateMobile as any).lastFrameTime || 0;
      
      if (deltaTime < targetFrameTime) {
        animationRef.current = requestAnimationFrame(animateMobile);
        return;
      }
      
      (animateMobile as any).lastFrameTime = time;

      // Monitor performance
      monitorMobilePerformance();

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // Simplified animations for mobile
      if (mascotGroupRef.current) {
        const emotionSpeed = {
          idle: 0.5,
          happy: 1.0,
          thinking: 0.3,
          celebrating: 1.5,
          oops: 0.8
        }[emotion];

        const animationTime = time * 0.001 * emotionSpeed;
        
        // Reduce animation complexity based on quality
        if (adaptiveQuality !== 'low') {
          mascotGroupRef.current.position.y = Math.sin(animationTime * 2) * 0.05;
        }
        
        if (adaptiveQuality === 'high') {
          mascotGroupRef.current.rotation.y = Math.sin(animationTime * 0.5) * 0.1;
        }
      }

      // Render with mobile optimizations
      rendererRef.current.render(sceneRef.current, cameraRef.current);

    } catch (error) {
      console.error('Mobile animation error:', error);
      onPerformanceIssue?.('animation_error');
    }

    animationRef.current = requestAnimationFrame(animateMobile);
  }, [emotion, mobileOptimizations.targetFrameRate, monitorMobilePerformance, adaptiveQuality, onPerformanceIssue]);

  // Initialize mobile-optimized renderer
  useEffect(() => {
    if (!mountRef.current || !isMobileDevice) return;

    try {
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera with mobile-appropriate settings
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, mobileOptimizations.maxRenderDistance);
      camera.position.set(0, 0, 3);
      cameraRef.current = camera;

      // Create mobile-optimized renderer
      const canvas = document.createElement('canvas');
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !mobileOptimizations.disableAntialiasing,
        alpha: true,
        powerPreference: 'default', // Don't request high-performance on mobile
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false, // Better performance
        failIfMajorPerformanceCaveat: false // Allow fallback
      });

      // Mobile-specific renderer settings
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio
      renderer.setSize(150, 150); // Fixed size for mobile
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      
      // Disable expensive features
      renderer.shadowMap.enabled = false; // No shadows on mobile
      renderer.toneMapping = THREE.LinearToneMapping; // Simple tone mapping
      
      rendererRef.current = renderer;

      // Mobile-optimized lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Higher ambient, no directional
      scene.add(ambientLight);

      // Create simplified mascot for mobile
      const mascotGroup = new THREE.Group();
      
      // Body
      const bodyGeometry = createMobileGeometry('sphere', 0.6);
      const bodyMaterial = createMobileMaterial(0xFF6B6B);
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      mascotGroup.add(body);

      // Head
      const headGeometry = createMobileGeometry('sphere', 0.4);
      const headMaterial = createMobileMaterial(0xFF8787);
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 1, 0);
      mascotGroup.add(head);

      // Simplified eyes
      const eyeGeometry = createMobileGeometry('sphere', 0.08);
      const eyeMaterial = createMobileMaterial(0x000000);
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.15, 1.1, 0.35);
      mascotGroup.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);  
      rightEye.position.set(0.15, 1.1, 0.35);
      mascotGroup.add(rightEye);

      scene.add(mascotGroup);
      mascotGroupRef.current = mascotGroup;

      // Add touch event listeners
      canvas.addEventListener('touchstart', handleTouchInteraction, { passive: false });
      canvas.addEventListener('touchmove', handleTouchInteraction, { passive: false });
      canvas.addEventListener('touchend', handleTouchInteraction, { passive: false });

      mountRef.current.appendChild(canvas);

      // Start mobile-optimized animation
      animationRef.current = requestAnimationFrame(animateMobile);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Remove touch listeners
        canvas.removeEventListener('touchstart', handleTouchInteraction);
        canvas.removeEventListener('touchmove', handleTouchInteraction);
        canvas.removeEventListener('touchend', handleTouchInteraction);

        if (mountRef.current?.contains(canvas)) {
          mountRef.current.removeChild(canvas);
        }

        // Dispose resources
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        renderer.dispose();
      };

    } catch (error) {
      console.error('Mobile renderer initialization error:', error);
      onPerformanceIssue?.('initialization_failed');
    }
  }, [isMobileDevice, mobileOptimizations, createMobileGeometry, createMobileMaterial, handleTouchInteraction, animateMobile, onPerformanceIssue]);

  // Don't render on desktop
  if (!isMobileDevice) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={mountRef}
        className="w-32 h-32 mx-auto"
      />
      
      {/* Mobile performance indicator */}
      <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">
        {Math.round(performanceMetrics.fps)}fps
      </div>
      
      {/* Quality indicator */}
      <div className="absolute bottom-0 left-0 bg-gray-100 text-gray-600 text-xs px-1 py-0.5 rounded">
        {adaptiveQuality}
        {thermalThrottling && ' 🔥'}
      </div>
    </div>
  );
};

export default MobileOptimizedRenderer;