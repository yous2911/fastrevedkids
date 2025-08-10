/**
 * Mobile-Optimized Particle System
 * Adaptive particle rendering with device-specific optimization
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { mobileDetector } from '../../utils/mobileOptimized';

interface MobileParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  active: boolean;
  type: 'spark' | 'bubble' | 'star' | 'heart';
}

interface ParticleSystemConfig {
  maxParticles: number;
  spawnRate: number;
  gravity: number;
  friction: number;
  enableCollisions: boolean;
  enableGlow: boolean;
  quality: 'minimal' | 'reduced' | 'full';
  batteryOptimized: boolean;
}

interface MobileParticleSystemProps {
  width: number;
  height: number;
  theme?: 'magic' | 'fire' | 'water' | 'earth' | 'air';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  onParticleClick?: (particle: MobileParticle) => void;
  onPerformanceIssue?: (issue: string, metrics: any) => void;
}

export const MobileParticleSystem: React.FC<MobileParticleSystemProps> = ({
  width,
  height,
  theme = 'magic',
  intensity = 'medium',
  interactive = true,
  onParticleClick,
  onPerformanceIssue
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<MobileParticle[]>([]);
  const particlePoolRef = useRef<MobileParticle[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const performanceMetricsRef = useRef({
    avgFrameTime: 16.67,
    droppedFrames: 0,
    particleCount: 0,
    memoryUsage: 0
  });

  const [config, setConfig] = useState<ParticleSystemConfig | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [batteryOptimization, setBatteryOptimization] = useState<any>(null);

  // Initialize mobile-optimized configuration
  useEffect(() => {
    const initializeConfig = async () => {
      const qualitySettings = await mobileDetector.getQualitySettings();
      const capabilities = await mobileDetector.detectCapabilities();
      const batteryOpt = mobileDetector.getBatteryOptimization();

      const baseParticleCount = getBaseParticleCount(intensity);
      const adjustedCount = Math.floor(baseParticleCount * getDeviceMultiplier(capabilities.performanceTier));
      
      const initialConfig: ParticleSystemConfig = {
        maxParticles: Math.min(adjustedCount, qualitySettings.maxParticles),
        spawnRate: capabilities.deviceType === 'mobile' ? 0.3 : 0.5,
        gravity: 0.1,
        friction: 0.99,
        enableCollisions: qualitySettings.physicsAccuracy !== 'low' && !batteryOpt.aggressiveMode,
        enableGlow: qualitySettings.enablePostProcessing && !batteryOpt.disableEffects,
        quality: qualitySettings.animationQuality,
        batteryOptimized: batteryOpt.enabled
      };

      setConfig(initialConfig);
      setBatteryOptimization(batteryOpt);
    };

    initializeConfig();
  }, [intensity]);

  // Listen for battery changes
  useEffect(() => {
    const handleBatteryChange = (event: any) => {
      const { level, charging } = event.detail;
      const newBatteryOpt = mobileDetector.getBatteryOptimization(level);
      
      setBatteryOptimization(newBatteryOpt);
      
      if (config) {
        setConfig(prevConfig => ({
          ...prevConfig!,
          batteryOptimized: newBatteryOpt.enabled,
          maxParticles: newBatteryOpt.reducedParticles 
            ? Math.floor(prevConfig!.maxParticles * 0.5)
            : prevConfig!.maxParticles,
          enableGlow: !newBatteryOpt.disableEffects,
          enableCollisions: !newBatteryOpt.aggressiveMode && prevConfig!.enableCollisions
        }));
      }
    };

    window.addEventListener('batterychange', handleBatteryChange);
    return () => window.removeEventListener('batterychange', handleBatteryChange);
  }, [config]);

  // Theme-based particle configuration
  const themeConfig = useMemo(() => {
    const themes = {
      magic: {
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
        particleTypes: ['spark', 'star'] as const,
        glowIntensity: 15
      },
      fire: {
        colors: ['#EF4444', '#F87171', '#FCA5A5', '#FEE2E2'],
        particleTypes: ['spark', 'bubble'] as const,
        glowIntensity: 20
      },
      water: {
        colors: ['#06B6D4', '#67E8F9', '#A5F3FC', '#CFFAFE'],
        particleTypes: ['bubble', 'heart'] as const,
        glowIntensity: 10
      },
      earth: {
        colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
        particleTypes: ['star', 'bubble'] as const,
        glowIntensity: 8
      },
      air: {
        colors: ['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF'],
        particleTypes: ['bubble', 'spark'] as const,
        glowIntensity: 12
      }
    };
    return themes[theme];
  }, [theme]);

  // Particle pool management for mobile memory efficiency
  const getParticleFromPool = useCallback((): MobileParticle => {
    if (particlePoolRef.current.length > 0) {
      const particle = particlePoolRef.current.pop()!;
      particle.active = true;
      return particle;
    }

    return createNewParticle();
  }, []);

  const returnParticleToPool = useCallback((particle: MobileParticle) => {
    particle.active = false;
    if (particlePoolRef.current.length < (config?.maxParticles || 50) * 2) {
      particlePoolRef.current.push(particle);
    }
  }, [config]);

  const createNewParticle = useCallback((): MobileParticle => {
    const colors = themeConfig.colors;
    const types = themeConfig.particleTypes;
    
    return {
      id: Math.random(),
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      maxLife: Math.random() * 3 + 2,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      active: true,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }, [width, height, themeConfig]);

  // Mobile-optimized particle updates
  const updateParticles = useCallback((deltaTime: number) => {
    if (!config) return;

    const dt = Math.min(deltaTime / 1000, 1/15); // Cap delta time for mobile
    const particles = particlesRef.current;
    const activeParticles = particles.filter(p => p.active);

    // Limit processing for battery optimization
    const maxProcessing = batteryOptimization?.aggressiveMode ? 10 : activeParticles.length;
    const particlesToUpdate = activeParticles.slice(0, maxProcessing);

    particlesToUpdate.forEach(particle => {
      // Basic physics with mobile optimization
      if (config.enableCollisions && !batteryOptimization?.aggressiveMode) {
        // Simple collision detection (only for nearby particles)
        const nearby = activeParticles.filter(other => 
          other !== particle && 
          Math.abs(other.x - particle.x) < 50 && 
          Math.abs(other.y - particle.y) < 50
        );

        nearby.forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (particle.size + other.size) / 2;

          if (distance < minDistance) {
            const force = (minDistance - distance) * 0.1;
            const angle = Math.atan2(dy, dx);
            particle.vx += Math.cos(angle) * force;
            particle.vy += Math.sin(angle) * force;
          }
        });
      }

      // Apply gravity and friction
      particle.vy += config.gravity * dt;
      particle.vx *= config.friction;
      particle.vy *= config.friction;

      // Update position
      particle.x += particle.vx * 60 * dt; // Normalize for 60fps
      particle.y += particle.vy * 60 * dt;

      // Boundary collision
      if (particle.x < 0 || particle.x > width) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(width, particle.x));
      }
      if (particle.y < 0 || particle.y > height) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(height, particle.y));
      }

      // Update life and alpha
      particle.life -= dt;
      particle.alpha = Math.max(0, particle.life / particle.maxLife);

      // Remove dead particles
      if (particle.life <= 0) {
        returnParticleToPool(particle);
      }
    });

    // Spawn new particles (throttled for mobile)
    if (activeParticles.length < config.maxParticles && Math.random() < config.spawnRate * dt) {
      const newParticle = getParticleFromPool();
      newParticle.x = Math.random() * width;
      newParticle.y = height + 10; // Start below canvas
      newParticle.vy = -Math.random() * 50 - 20; // Upward velocity
      newParticle.life = newParticle.maxLife;
      particles.push(newParticle);
    }

    // Update performance metrics
    performanceMetricsRef.current.particleCount = activeParticles.length;
  }, [config, width, height, batteryOptimization, getParticleFromPool, returnParticleToPool]);

  // Mobile-optimized rendering
  const renderParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const activeParticles = particlesRef.current.filter(p => p.active);
    
    // Batch rendering for mobile performance
    const renderBatchSize = batteryOptimization?.aggressiveMode ? 15 : 
                           config.quality === 'minimal' ? 25 : 50;
    const particlesToRender = activeParticles.slice(0, renderBatchSize);

    particlesToRender.forEach(particle => {
      if (particle.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = particle.alpha;
      
      // Mobile-optimized rendering
      if (config.enableGlow && config.quality === 'full' && !batteryOptimization?.disableEffects) {
        // Glow effect (expensive, only on high-end)
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = themeConfig.glowIntensity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Draw particle based on type
      ctx.fillStyle = particle.color;
      ctx.beginPath();

      switch (particle.type) {
        case 'spark':
          // Simple line for sparks (mobile-friendly)
          ctx.moveTo(particle.x - particle.size, particle.y);
          ctx.lineTo(particle.x + particle.size, particle.y);
          ctx.lineWidth = 2;
          ctx.strokeStyle = particle.color;
          ctx.stroke();
          break;
        
        case 'bubble':
          // Circle for bubbles
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        
        case 'star':
          if (config.quality !== 'minimal') {
            // Star shape (only for better quality)
            drawStar(ctx, particle.x, particle.y, particle.size, 5);
            ctx.fill();
          } else {
            // Fallback to circle for minimal quality
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        
        case 'heart':
          if (config.quality === 'full') {
            // Heart shape (only for full quality)
            drawHeart(ctx, particle.x, particle.y, particle.size);
            ctx.fill();
          } else {
            // Fallback to circle
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
      }

      ctx.restore();
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [config, width, height, batteryOptimization, themeConfig]);

  // Performance monitoring
  const monitorPerformance = useCallback((currentTime: number) => {
    frameCountRef.current++;
    const frameTime = currentTime - lastFrameTimeRef.current;
    
    if (frameTime > 0) {
      performanceMetricsRef.current.avgFrameTime = 
        (performanceMetricsRef.current.avgFrameTime * 0.9) + (frameTime * 0.1);
    }

    // Check for performance issues every 60 frames
    if (frameCountRef.current % 60 === 0) {
      const avgFPS = 1000 / performanceMetricsRef.current.avgFrameTime;
      const targetFPS = config?.batteryOptimized ? 20 : 30;
      
      if (avgFPS < targetFPS * 0.8) {
        onPerformanceIssue?.('low_fps', {
          fps: avgFPS,
          targetFPS,
          particleCount: performanceMetricsRef.current.particleCount,
          frameTime: performanceMetricsRef.current.avgFrameTime
        });
        
        // Auto-adjust quality
        if (config) {
          setConfig(prevConfig => ({
            ...prevConfig!,
            maxParticles: Math.max(10, Math.floor(prevConfig!.maxParticles * 0.8)),
            enableCollisions: false,
            enableGlow: false,
            quality: 'minimal'
          }));
        }
      }
    }

    lastFrameTimeRef.current = currentTime;
  }, [config, onPerformanceIssue]);

  // Main animation loop
  const animate = useCallback((currentTime: number) => {
    if (!isRunning || !config) return;

    monitorPerformance(currentTime);
    
    const deltaTime = currentTime - lastFrameTimeRef.current;
    
    // Frame rate limiting for mobile
    const targetFrameTime = config.batteryOptimized ? 50 : 33.33; // 20fps or 30fps
    if (deltaTime < targetFrameTime && lastFrameTimeRef.current > 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    updateParticles(deltaTime);
    renderParticles();

    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, config, monitorPerformance, updateParticles, renderParticles]);

  // Touch/click handling
  const handleCanvasInteraction = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!interactive || !config) return;

    event.preventDefault();
    
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      // Touch event
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Find clicked particle
    const activeParticles = particlesRef.current.filter(p => p.active);
    const clickedParticle = activeParticles.find(particle => {
      const dx = particle.x - x;
      const dy = particle.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= particle.size + 10; // Add touch tolerance
    });

    if (clickedParticle && onParticleClick) {
      onParticleClick(clickedParticle);
    }

    // Spawn particles at interaction point
    for (let i = 0; i < 5; i++) {
      const particle = getParticleFromPool();
      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y + (Math.random() - 0.5) * 20;
      particle.vx = (Math.random() - 0.5) * 100;
      particle.vy = (Math.random() - 0.5) * 100;
      particle.life = particle.maxLife;
      particlesRef.current.push(particle);
    }
  }, [interactive, config, onParticleClick, getParticleFromPool]);

  // Start animation when config is ready
  useEffect(() => {
    if (config && !isRunning) {
      setIsRunning(true);
      lastFrameTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsRunning(false);
    };
  }, [config, animate]);

  // Helper functions for drawing shapes
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, points: number) => {
    const outerRadius = radius;
    const innerRadius = radius * 0.5;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / points;

    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);

    for (let i = 0; i < points; i++) {
      const xOuter = x + Math.cos(rot) * outerRadius;
      const yOuter = y + Math.sin(rot) * outerRadius;
      ctx.lineTo(xOuter, yOuter);
      rot += step;

      const xInner = x + Math.cos(rot) * innerRadius;
      const yInner = y + Math.sin(rot) * innerRadius;
      ctx.lineTo(xInner, yInner);
      rot += step;
    }

    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const width = size;
    const height = size;

    ctx.beginPath();
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x, y + topCurveHeight);

    // Top left curve
    ctx.bezierCurveTo(
      x, y,
      x - width / 2, y,
      x - width / 2, y + topCurveHeight
    );

    // Bottom left curve
    ctx.bezierCurveTo(
      x - width / 2, y + (height + topCurveHeight) / 2,
      x, y + (height + topCurveHeight) / 2,
      x, y + height
    );

    // Bottom right curve
    ctx.bezierCurveTo(
      x, y + (height + topCurveHeight) / 2,
      x + width / 2, y + (height + topCurveHeight) / 2,
      x + width / 2, y + topCurveHeight
    );

    // Top right curve
    ctx.bezierCurveTo(
      x + width / 2, y,
      x, y,
      x, y + topCurveHeight
    );

    ctx.closePath();
  };

  const getBaseParticleCount = (intensity: string): number => {
    switch (intensity) {
      case 'low': return 20;
      case 'medium': return 50;
      case 'high': return 100;
      default: return 50;
    }
  };

  const getDeviceMultiplier = (tier: string): number => {
    switch (tier) {
      case 'high': return 1.0;
      case 'medium': return 0.7;
      case 'low': return 0.3;
      default: return 0.7;
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-gray-500">Initializing mobile particle system...</div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="touch-none select-none"
        onMouseDown={handleCanvasInteraction}
        onTouchStart={handleCanvasInteraction}
        style={{
          width: '100%',
          height: '100%',
          cursor: interactive ? 'pointer' : 'default'
        }}
      />
      
      {/* Performance indicator */}
      <div className="absolute top-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
        {Math.round(1000 / performanceMetricsRef.current.avgFrameTime)} FPS
        {batteryOptimization?.enabled && ' ⚡'}
      </div>
      
      {/* Particle count indicator */}
      <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
        {performanceMetricsRef.current.particleCount}/{config.maxParticles}
      </div>
    </div>
  );
};

export default MobileParticleSystem;