import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { browserCompat, isWebGLSupported, requiresFallback } from '../utils/browserCompatibility';
import Canvas2DRenderer from './fallback/Canvas2DRenderer';

interface CrossBrowserMascot3DProps {
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  emotion?: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
  equippedItems?: string[];
  xpLevel?: number;
  size?: 'small' | 'medium' | 'large';
  enableInteraction?: boolean;
  onMascotClick?: () => void;
  onItemConflict?: (conflictingItems: string[]) => void;
  studentStats?: {
    xp: number;
    streak: number;
    exercisesCompleted: number;
    achievementsUnlocked: number;
  };
  studentData?: {
    level: number;
    xp: number;
    currentStreak: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    recentPerformance: any;
  };
  currentActivity?: string;
  items?: string[];
  onMascotInteraction?: (interaction: any) => void;
  onEmotionalStateChange?: (state: any) => void;
}

// Enhanced size configurations with performance tiers
const SIZE_CONFIG = {
  small: { scale: 0.8, containerSize: 120, complexity: 'low' },
  medium: { scale: 1.0, containerSize: 150, complexity: 'medium' },
  large: { scale: 1.2, containerSize: 200, complexity: 'high' }
};

const CrossBrowserMascot3D: React.FC<CrossBrowserMascot3DProps> = ({
  mascotType,
  emotion = 'idle',
  equippedItems = [],
  xpLevel = 0,
  size = 'medium',
  enableInteraction = false,
  onMascotClick,
  onItemConflict,
  studentStats,
  studentData,
  currentActivity,
  items,
  onMascotInteraction,
  onEmotionalStateChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>();
  const rendererRef = useRef<any>();
  const cameraRef = useRef<any>();
  const mascotGroupRef = useRef<any>();
  const animationRef = useRef<number>();
  const [renderError, setRenderError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  
  // Browser compatibility information
  const browserInfo = useMemo(() => browserCompat.getBrowserInfo(), []);
  const webglCapabilities = useMemo(() => browserCompat.getWebGLCapabilities(), []);
  const optimalSettings = useMemo(() => browserCompat.getOptimalSettings(), []);
  const chromeOptimizations = useMemo(() => browserCompat.getChromeOptimizations(), []);
  const firefoxCompatibility = useMemo(() => browserCompat.getFirefoxCompatibility(), []);
  const safariFixes = useMemo(() => browserCompat.getSafariCanvasFixes(), []);

  // Performance monitoring
  const performanceRef = useRef({
    frameCount: 0,
    lastFpsCheck: Date.now(),
    averageFps: 60,
    dropFrameThreshold: 30
  });

  // Check if we should use fallback immediately
  useEffect(() => {
    if (requiresFallback() || !isWebGLSupported()) {
      setUseFallback(true);
      return;
    }

    // Additional checks for specific browser issues
    if (browserInfo.name === 'safari' && browserInfo.isMobile) {
      // Mobile Safari has limited WebGL memory
      if (studentStats && studentStats.xp > 3000) {
        console.warn('High complexity scene on mobile Safari, using fallback');
        setUseFallback(true);
        return;
      }
    }

    if (browserInfo.name === 'firefox' && firefoxCompatibility.avoidComplexShaders) {
      if (equippedItems.length > 3) {
        console.warn('Too many items for older Firefox, using fallback');
        setUseFallback(true);
        return;
      }
    }
  }, [browserInfo, firefoxCompatibility, equippedItems.length, studentStats]);

  // Create optimized Three.js renderer based on browser capabilities
  const createOptimizedRenderer = useCallback((canvas: HTMLCanvasElement) => {
    try {
      const rendererConfig: THREE.WebGLRendererParameters = {
        canvas,
        antialias: optimalSettings.antialias && !browserInfo.isMobile,
        alpha: true,
        powerPreference: chromeOptimizations.useHardwareAcceleration ? 'high-performance' : 'default',
        failIfMajorPerformanceCaveat: browserInfo.hardwareTier === 'low',
        preserveDrawingBuffer: safariFixes.forceContextRestore,
        stencil: false, // Disable stencil buffer for performance
        depth: true
      };

      // Try WebGL2 if supported and beneficial
      if (webglCapabilities.version === 2 && chromeOptimizations.preferWebGL2) {
        rendererConfig.context = canvas.getContext('webgl2') as WebGL2RenderingContext;
      }

      const renderer = new THREE.WebGLRenderer(rendererConfig);
      
      // Configure renderer settings
      renderer.setPixelRatio(optimalSettings.pixelRatio);
      renderer.setSize(SIZE_CONFIG[size].containerSize, SIZE_CONFIG[size].containerSize);
      
      // Shadow settings based on performance tier
      if (optimalSettings.shadowMapEnabled) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = browserInfo.hardwareTier === 'high' 
          ? THREE.PCFSoftShadowMap 
          : THREE.BasicShadowMap;
        renderer.shadowMap.autoUpdate = false; // Manual updates for performance
      }

      // Color space and tone mapping
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = browserInfo.hardwareTier === 'high' 
        ? THREE.ACESFilmicToneMapping 
        : THREE.LinearToneMapping;
      
      // Firefox-specific optimizations
      if (browserInfo.name === 'firefox') {
        renderer.info.autoReset = false; // Prevent memory leaks in Firefox
      }

      // Chrome-specific optimizations
      if (browserInfo.name === 'chrome' && chromeOptimizations.enableGPUMemoryOptimization) {
        // Enable efficient memory usage
        renderer.capabilities.maxTextures = Math.min(16, webglCapabilities.fragmentTextureUnits);
      }

      return renderer;
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      setRenderError(`WebGL initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUseFallback(true);
      return null;
    }
  }, [optimalSettings, browserInfo, chromeOptimizations, safariFixes, webglCapabilities, size]);

  // Create performance-optimized geometry
  const createOptimizedGeometry = useCallback((type: 'sphere' | 'box' | 'cylinder', ...args: number[]) => {
    const QUALITY_MULTIPLIER = {
      low: 0.5,
      medium: 1.0,
      high: 1.5
    }[browserInfo.hardwareTier];

    switch (type) {
      case 'sphere':
        const [radius = 1] = args;
        const segments = Math.max(8, Math.floor(16 * QUALITY_MULTIPLIER));
        return new THREE.SphereGeometry(radius, segments, segments);
        
      case 'box':
        const [width = 1, height = 1, depth = 1] = args;
        return new THREE.BoxGeometry(width, height, depth);
        
      case 'cylinder':
        const [radiusTop = 1, radiusBottom = 1, cylinderHeight = 1] = args;
        const radialSegments = Math.max(8, Math.floor(12 * QUALITY_MULTIPLIER));
        const heightSegments = Math.max(1, Math.floor(4 * QUALITY_MULTIPLIER));
        return new THREE.CylinderGeometry(radiusTop, radiusBottom, cylinderHeight, radialSegments, heightSegments);
        
      default:
        return new THREE.SphereGeometry(1, 16, 16);
    }
  }, [browserInfo.hardwareTier]);

  // Create browser-optimized materials
  const createOptimizedMaterial = useCallback((color: number, options: {
    metalness?: number;
    roughness?: number;
    transparent?: boolean;
    opacity?: number;
  } = {}) => {
    // Use simpler materials for low-end devices
    if (browserInfo.hardwareTier === 'low' || firefoxCompatibility.avoidComplexShaders) {
      return new THREE.MeshPhongMaterial({
        color,
        transparent: options.transparent,
        opacity: options.opacity || 1,
        shininess: 30
      });
    }

    // Use advanced materials for high-end devices
    return new THREE.MeshStandardMaterial({
      color,
      metalness: options.metalness || 0,
      roughness: options.roughness || 0.5,
      transparent: options.transparent,
      opacity: options.opacity || 1
    });
  }, [browserInfo.hardwareTier, firefoxCompatibility.avoidComplexShaders]);

  // Performance monitoring with automatic fallback
  const monitorPerformance = useCallback(() => {
    const now = Date.now();
    performanceRef.current.frameCount++;
    
    if (now - performanceRef.current.lastFpsCheck >= 1000) {
      const fps = performanceRef.current.frameCount;
      performanceRef.current.averageFps = (performanceRef.current.averageFps + fps) / 2;
      performanceRef.current.frameCount = 0;
      performanceRef.current.lastFpsCheck = now;
      
      // Automatic fallback if performance is poor
      if (performanceRef.current.averageFps < performanceRef.current.dropFrameThreshold) {
        console.warn(`Poor performance detected (${fps} FPS), switching to fallback`);
        setUseFallback(true);
      }
    }
  }, []);

  // Create mascot 3D model with cross-browser optimizations
  const createMascot3D = useCallback(() => {
    const group = new THREE.Group();
    
    try {
      // Base COLORS for different mascot types
      const COLORS = {
        dragon: 0xFF6B6B,
        fairy: 0x8B5CF6,
        robot: 0x06B6D4,
        cat: 0xF59E0B,
        owl: 0x6366F1
      };

      // Body
      const bodyGeometry = createOptimizedGeometry('sphere', 0.6);
      const bodyMaterial = createOptimizedMaterial(COLORS[mascotType], {
        roughness: 0.3,
        metalness: mascotType === 'robot' ? 0.8 : 0.1
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0, 0, 0);
      body.castShadow = optimalSettings.shadowMapEnabled;
      body.receiveShadow = optimalSettings.shadowMapEnabled;
      group.add(body);

      // Head
      const headGeometry = createOptimizedGeometry('sphere', 0.4);
      const headMaterial = createOptimizedMaterial(COLORS[mascotType], {
        roughness: 0.2,
        metalness: mascotType === 'robot' ? 0.9 : 0.05
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 1, 0);
      head.castShadow = optimalSettings.shadowMapEnabled;
      group.add(head);

      // Eyes (simplified for performance)
      const eyeGeometry = createOptimizedGeometry('sphere', 0.08);
      const eyeMaterial = createOptimizedMaterial(0x000000);
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.15, 1.1, 0.35);
      group.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.15, 1.1, 0.35);
      group.add(rightEye);

      // Mascot-specific features (simplified)
      switch (mascotType) {
        case 'dragon':
          // Simple wings
          const wingGeometry = createOptimizedGeometry('box', 0.3, 0.6, 0.1);
          const wingMaterial = createOptimizedMaterial(0xFF8787, { opacity: 0.8, transparent: true });
          
          const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
          leftWing.position.set(-0.8, 0.3, -0.2);
          leftWing.rotation.z = Math.PI / 6;
          group.add(leftWing);
          
          const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
          rightWing.position.set(0.8, 0.3, -0.2);
          rightWing.rotation.z = -Math.PI / 6;
          group.add(rightWing);
          break;

        case 'robot':
          // Antenna
          const antennaGeometry = createOptimizedGeometry('cylinder', 0.02, 0.02, 0.3);
          const antennaMaterial = createOptimizedMaterial(0x444444, { metalness: 0.9 });
          const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
          antenna.position.set(0, 1.5, 0);
          group.add(antenna);
          break;

        case 'cat':
          // Ears
          const earGeometry = createOptimizedGeometry('sphere', 0.15);
          const earMaterial = createOptimizedMaterial(COLORS[mascotType]);
          
          const leftEar = new THREE.Mesh(earGeometry, earMaterial);
          leftEar.position.set(-0.25, 1.35, 0);
          leftEar.scale.set(1, 1.5, 0.8);
          group.add(leftEar);
          
          const rightEar = new THREE.Mesh(earGeometry, earMaterial);
          rightEar.position.set(0.25, 1.35, 0);
          rightEar.scale.set(1, 1.5, 0.8);
          group.add(rightEar);
          break;
      }

      // Add equipped items (simplified for performance)
      equippedItems.forEach(itemId => {
        try {
          switch (itemId) {
            case 'wizard_hat':
              const hatGeometry = createOptimizedGeometry('cylinder', 0.1, 0.3, 0.6);
              const hatMaterial = createOptimizedMaterial(0x8B5CF6);
              const hat = new THREE.Mesh(hatGeometry, hatMaterial);
              hat.position.set(0, 1.7, 0);
              group.add(hat);
              break;

            case 'crown_gold':
              const crownGeometry = createOptimizedGeometry('cylinder', 0.35, 0.3, 0.2);
              const crownMaterial = createOptimizedMaterial(0xFFD700, { metalness: 0.9 });
              const crown = new THREE.Mesh(crownGeometry, crownMaterial);
              crown.position.set(0, 1.5, 0);
              group.add(crown);
              break;
          }
        } catch (itemError) {
          console.warn(`Failed to create item ${itemId}:`, itemError);
        }
      });

    } catch (error) {
      console.error('Error creating 3D mascot:', error);
      setRenderError(`3D model creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUseFallback(true);
    }

    return group;
  }, [mascotType, equippedItems, createOptimizedGeometry, createOptimizedMaterial, optimalSettings]);

  // Animation loop with performance monitoring
  const animate = useCallback((time: number) => {
    try {
      monitorPerformance();

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        return;
      }

      // Simple emotion-based animations
      if (mascotGroupRef.current) {
        const EMOTION_MULTIPLIERS = {
          idle: { bounce: 0.02, speed: 1 },
          happy: { bounce: 0.08, speed: 1.5 },
          thinking: { bounce: 0.01, speed: 0.8 },
          celebrating: { bounce: 0.15, speed: 2 },
          oops: { bounce: 0.05, speed: 1.2 }
        };

        const multiplier = EMOTION_MULTIPLIERS[emotion];
        const animationTime = time * 0.001 * multiplier.speed;
        
        mascotGroupRef.current.position.y = Math.sin(animationTime * 2) * multiplier.bounce;
        mascotGroupRef.current.rotation.y = Math.sin(animationTime * 0.5) * 0.1;
      }

      // Render with error handling
      try {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      } catch (renderError) {
        console.error('Render error:', renderError);
        setRenderError(`Rendering failed: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`);
        setUseFallback(true);
        return;
      }

    } catch (error) {
      console.error('Animation error:', error);
      setUseFallback(true);
      return;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [emotion, monitorPerformance]);

  // Initialize 3D scene with browser compatibility
  useEffect(() => {
    if (useFallback || !mountRef.current) return;

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = null; // Transparent background
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(0, 0, 3);
      cameraRef.current = camera;

      // Create canvas and renderer
      const canvas = document.createElement('canvas');
      const renderer = createOptimizedRenderer(canvas);
      
      if (!renderer) {
        setUseFallback(true);
        return;
      }

      rendererRef.current = renderer;

      // Setup WebGL context loss handling
      browserCompat.handleWebGLContextLoss(canvas, () => {
        console.log('Attempting to restore WebGL context...');
        // Recreate scene after context restore
        const newMascot = createMascot3D();
        scene.clear();
        scene.add(newMascot);
        mascotGroupRef.current = newMascot;
      });

      // Create lighting optimized for browser
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      if (optimalSettings.maxLights > 1) {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        
        if (optimalSettings.shadowMapEnabled) {
          directionalLight.castShadow = true;
          directionalLight.shadow.mapSize.width = optimalSettings.shadowMapSize;
          directionalLight.shadow.mapSize.height = optimalSettings.shadowMapSize;
        }
        
        scene.add(directionalLight);
      }

      // Create mascot
      const mascot = createMascot3D();
      scene.add(mascot);
      mascotGroupRef.current = mascot;

      // Add to DOM
      mountRef.current.appendChild(renderer.domElement);

      // Start animation
      animationRef.current = requestAnimationFrame(animate);

      // Cleanup function
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        if (mountRef.current && renderer.domElement) {
          try {
            mountRef.current.removeChild(renderer.domElement);
          } catch (e) {
            // Element might have been removed already
          }
        }

        // Dispose of Three.js resources
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
      console.error('3D initialization error:', error);
      setRenderError(`3D initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUseFallback(true);
    }
  }, [useFallback, createOptimizedRenderer, createMascot3D, optimalSettings, animate]);

  // Handle click interactions
  const handleClick = useCallback(() => {
    if (enableInteraction && onMascotClick) {
      onMascotClick();
    }
  }, [enableInteraction, onMascotClick]);

  // Render fallback if needed
  if (useFallback || renderError) {
    return (
      <div className="relative">
        <Canvas2DRenderer
          width={SIZE_CONFIG[size].containerSize}
          height={SIZE_CONFIG[size].containerSize}
          mascotType={mascotType}
          emotion={emotion}
          equippedItems={equippedItems}
          xpLevel={xpLevel}
          onRenderError={(error) => {
            console.error('Canvas2D fallback error:', error);
          }}
          className={enableInteraction ? 'cursor-pointer' : ''}
        />
        {renderError && (
          <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
            2D Mode
          </div>
        )}
      </div>
    );
  }

  // Render 3D version
  return (
    <div
      ref={mountRef}
      className={`relative ${enableInteraction ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      style={{
        width: SIZE_CONFIG[size].containerSize,
        height: SIZE_CONFIG[size].containerSize
      }}
    >
      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
          3D - {browserInfo.hardwareTier}
        </div>
      )}
    </div>
  );
};

export default CrossBrowserMascot3D;