import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { browserCompat } from '../../utils/browserCompatibility';

interface PhysicsConfig {
  enabled: boolean;
  quality: 'low' | 'medium' | 'high';
  maxParticles: number;
  collisionDetection: boolean;
  gravityStrength: number;
  dampening: number;
  bounceEnabled: boolean;
  waveSimulation: boolean;
  particlePooling: boolean;
  frameRateTarget: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  life: number;
  maxLife: number;
  active: boolean;
  type: 'bubble' | 'spark' | 'drop' | 'smoke';
}

interface PhysicsPerformanceMetrics {
  particleCount: number;
  activeCollisions: number;
  physicsTime: number;
  frameRate: number;
  memoryUsage: number;
}

interface PhysicsSystemProps {
  width: number;
  height: number;
  onPerformanceIssue?: (issue: string, metrics: PhysicsPerformanceMetrics) => void;
  onConfigChange?: (config: PhysicsConfig) => void;
  initialQuality?: 'low' | 'medium' | 'high';
  enableFallback?: boolean;
}

export const PhysicsSystemManager: React.FC<PhysicsSystemProps> = ({
  width,
  height,
  onPerformanceIssue,
  onConfigChange,
  initialQuality = 'medium',
  enableFallback = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const particlePoolRef = useRef<Particle[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const performanceRef = useRef<PhysicsPerformanceMetrics>({
    particleCount: 0,
    activeCollisions: 0,
    physicsTime: 0,
    frameRate: 60,
    memoryUsage: 0
  });

  const [config, setConfig] = useState<PhysicsConfig>(() => {
    const browserInfo = browserCompat.getBrowserInfo();
    const baseConfig = getPhysicsConfigForDevice(browserInfo.hardwareTier, initialQuality);
    
    // Additional mobile optimizations
    if (browserInfo.isMobile) {
      baseConfig.maxParticles = Math.floor(baseConfig.maxParticles * 0.6);
      baseConfig.frameRateTarget = Math.min(baseConfig.frameRateTarget, 30);
      baseConfig.collisionDetection = baseConfig.quality !== 'low';
    }
    
    return baseConfig;
  });

  const [physicsState, setPhysicsState] = useState<'running' | 'degraded' | 'fallback' | 'disabled'>('running');
  const [errorCount, setErrorCount] = useState(0);

  // Physics quality configurations
  function getPhysicsConfigForDevice(hardwareTier: string, quality: 'low' | 'medium' | 'high'): PhysicsConfig {
    const CONFIGS = {
      low: {
        enabled: true,
        quality: 'low' as const,
        maxParticles: hardwareTier === 'low' ? 20 : 50,
        collisionDetection: false,
        gravityStrength: 0.3,
        dampening: 0.98,
        bounceEnabled: false,
        waveSimulation: false,
        particlePooling: true,
        frameRateTarget: 20
      },
      medium: {
        enabled: true,
        quality: 'medium' as const,
        maxParticles: hardwareTier === 'low' ? 50 : 100,
        collisionDetection: hardwareTier !== 'low',
        gravityStrength: 0.5,
        dampening: 0.99,
        bounceEnabled: true,
        waveSimulation: hardwareTier === 'high',
        particlePooling: true,
        frameRateTarget: hardwareTier === 'low' ? 30 : 60
      },
      high: {
        enabled: true,
        quality: 'high' as const,
        maxParticles: hardwareTier === 'low' ? 80 : hardwareTier === 'medium' ? 150 : 200,
        collisionDetection: true,
        gravityStrength: 0.8,
        dampening: 0.995,
        bounceEnabled: true,  
        waveSimulation: true,
        particlePooling: true,
        frameRateTarget: hardwareTier === 'low' ? 30 : 60
      }
    };
    
    return CONFIGS[quality];
  }

  // Particle pool management for memory efficiency
  const getParticleFromPool = useCallback((): Particle => {
    if (particlePoolRef.current.length > 0) {
      const particle = particlePoolRef.current.pop()!;
      particle.active = true;
      return particle;
    }
    
    return {
      id: Math.random(),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 5,
      mass: 1,
      color: '#ffffff',
      life: 1,
      maxLife: 1,
      active: true,
      type: 'bubble'
    };
  }, []);

  const returnParticleToPool = useCallback((particle: Particle) => {
    particle.active = false;
    if (particlePoolRef.current.length < config.maxParticles * 2) {
      particlePoolRef.current.push(particle);
    }
  }, [config.maxParticles]);

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTimeRef.current;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      const activeParticles = particlesRef.current.filter(p => p.active).length;
      
      performanceRef.current = {
        particleCount: activeParticles,
        activeCollisions: config.collisionDetection ? Math.floor(activeParticles * 0.3) : 0,
        physicsTime: deltaTime,
        frameRate: fps,
        memoryUsage: particlesRef.current.length + particlePoolRef.current.length
      };

      // Check for performance issues
      if (fps < config.frameRateTarget * 0.7) {
        handlePerformanceIssue('low_fps');
      }
      
      if (activeParticles > config.maxParticles * 1.2) {
        handlePerformanceIssue('particle_overflow');
      }
      
      if (deltaTime > 50) { // Frame time too high
        handlePerformanceIssue('high_frame_time');
      }
    }
    
    lastFrameTimeRef.current = now;
  }, [config]);

  // Handle performance degradation
  const handlePerformanceIssue = useCallback((issue: string) => {
    setErrorCount(prev => prev + 1);
    
    if (onPerformanceIssue) {
      onPerformanceIssue(issue, performanceRef.current);
    }

    // Automatic degradation logic
    if (errorCount > 5 && physicsState === 'running') {
      console.warn('Physics performance issues detected, degrading quality');
      degradePhysicsQuality();
    } else if (errorCount > 15 && physicsState === 'degraded') {
      console.warn('Severe physics performance issues, switching to fallback');
      switchToFallback();
    }
  }, [errorCount, physicsState, onPerformanceIssue]);

  const degradePhysicsQuality = useCallback(() => {
    setPhysicsState('degraded');
    
    const degradedConfig: PhysicsConfig = {
      ...config,
      quality: config.quality === 'high' ? 'medium' : 'low',
      maxParticles: Math.floor(config.maxParticles * 0.6),
      collisionDetection: config.quality === 'high' ? config.collisionDetection : false,
      waveSimulation: false,
      frameRateTarget: Math.min(config.frameRateTarget, 30)
    };
    
    setConfig(degradedConfig);
    onConfigChange?.(degradedConfig);
  }, [config, onConfigChange]);

  const switchToFallback = useCallback(() => {
    if (!enableFallback) return;
    
    setPhysicsState('fallback');
    
    const fallbackConfig: PhysicsConfig = {
      ...config,
      enabled: false,
      quality: 'low',
      maxParticles: 10,
      collisionDetection: false,
      waveSimulation: false,
      bounceEnabled: false,
      frameRateTarget: 20
    };
    
    setConfig(fallbackConfig);
    onConfigChange?.(fallbackConfig);
  }, [config, enableFallback, onConfigChange]);

  // Simplified physics calculations for degraded mode
  const updatePhysicsSimplified = useCallback((particles: Particle[], deltaTime: number) => {
    const dt = Math.min(deltaTime / 1000, 1/30); // Cap delta time
    
    particles.forEach(particle => {
      if (!particle.active) return;
      
      // Simple gravity
      particle.vy += config.gravityStrength * dt;
      
      // Update position
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      
      // Simple boundary bounce
      if (particle.y > height - particle.radius) {
        particle.y = height - particle.radius;
        if (config.bounceEnabled) {
          particle.vy *= -0.7;
        } else {
          particle.vy = 0;
        }
      }
      
      if (particle.x < particle.radius || particle.x > width - particle.radius) {
        particle.vx *= -0.8;
        particle.x = Math.max(particle.radius, Math.min(width - particle.radius, particle.x));
      }
      
      // Apply dampening
      particle.vx *= config.dampening;
      particle.vy *= config.dampening;
      
      // Update life
      particle.life -= dt;
      if (particle.life <= 0) {
        returnParticleToPool(particle);
      }
    });
  }, [config, width, height, returnParticleToPool]);

  // Full physics calculations
  const updatePhysicsFull = useCallback((particles: Particle[], deltaTime: number) => {
    const dt = Math.min(deltaTime / 1000, 1/60);
    const activeParticles = particles.filter(p => p.active);
    
    // Update particle physics
    activeParticles.forEach((particle, index) => {
      // Gravity
      particle.vy += config.gravityStrength * dt * particle.mass;
      
      // Collision detection (expensive operation)
      if (config.collisionDetection) {
        for (let i = index + 1; i < activeParticles.length; i++) {
          const other = activeParticles[i];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = particle.radius + other.radius;
          
          if (distance < minDistance) {
            // Simple elastic collision
            const angle = Math.atan2(dy, dx);
            const targetX = particle.x + Math.cos(angle) * minDistance;
            const targetY = particle.y + Math.sin(angle) * minDistance;
            const ax = (targetX - other.x) * 0.05;
            const ay = (targetY - other.y) * 0.05;
            
            particle.vx += ax / particle.mass;
            particle.vy += ay / particle.mass;
            other.vx -= ax / other.mass;
            other.vy -= ay / other.mass;
          }
        }
      }
      
      // Update position
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      
      // Boundary collision with bounce
      if (particle.y > height - particle.radius) {
        particle.y = height - particle.radius;
        particle.vy *= -0.8 * (config.bounceEnabled ? 1 : 0.2);
      }
      
      if (particle.x < particle.radius) {
        particle.x = particle.radius;
        particle.vx *= -0.8;
      } else if (particle.x > width - particle.radius) {
        particle.x = width - particle.radius;
        particle.vx *= -0.8;
      }
      
      // Apply dampening
      particle.vx *= config.dampening;
      particle.vy *= config.dampening;
      
      // Update life and remove dead particles
      particle.life -= dt;
      if (particle.life <= 0) {
        returnParticleToPool(particle);
      }
    });
  }, [config, width, height, returnParticleToPool]);

  // Main physics update
  const updatePhysics = useCallback((deltaTime: number) => {
    try {
      if (!config.enabled || physicsState === 'disabled') {
        return;
      }
      
      const particles = particlesRef.current;
      
      if (physicsState === 'fallback' || config.quality === 'low') {
        updatePhysicsSimplified(particles, deltaTime);
      } else {
        updatePhysicsFull(particles, deltaTime);
      }
      
      // Remove inactive particles
      particlesRef.current = particles.filter(p => p.active);
      
    } catch (error) {
      console.error('Physics update error:', error);
      handlePerformanceIssue('physics_error');
    }
  }, [config, physicsState, updatePhysicsSimplified, updatePhysicsFull, handlePerformanceIssue]);

  // Rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (physicsState === 'disabled') {
        // Show static message
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Physics Disabled', width / 2, height / 2);
        return;
      }
      
      // Render particles
      const activeParticles = particlesRef.current.filter(p => p.active);
      
      activeParticles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        
        // Color based on life
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.includes('rgba') 
          ? particle.color.replace(/[\d\.]+\)$/g, `${alpha})`)
          : `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
          
        ctx.fill();
        
        // Add glow effect for higher quality
        if (config.quality === 'high') {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = particle.radius * 0.5;
        }
      });
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
    } catch (error) {
      console.error('Render error:', error);
      handlePerformanceIssue('render_error');
    }
  }, [width, height, config, physicsState, handlePerformanceIssue]);

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    try {
      const deltaTime = currentTime - lastFrameTimeRef.current;
      
      // Frame rate limiting
      const TARGET_FRAME_TIME = 1000 / config.frameRateTarget;
      if (deltaTime < TARGET_FRAME_TIME * 0.9) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      monitorPerformance();
      updatePhysics(deltaTime);
      render();
      
    } catch (error) {
      console.error('Animation error:', error);
      setErrorCount(prev => prev + 1);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [config.frameRateTarget, monitorPerformance, updatePhysics, render]);

  // Add particles (for testing)
  const addParticle = useCallback((x: number, y: number, type: Particle['type'] = 'bubble') => {
    if (particlesRef.current.filter(p => p.active).length >= config.maxParticles) {
      return; // Prevent overflow
    }
    
    const particle = getParticleFromPool();
    particle.x = x;
    particle.y = y;
    particle.vx = (Math.random() - 0.5) * 100;
    particle.vy = (Math.random() - 0.5) * 50 - 25;
    particle.radius = Math.random() * 8 + 3;
    particle.mass = particle.radius * 0.1;
    particle.life = Math.random() * 3 + 2;
    particle.maxLife = particle.life;
    particle.type = type;
    
    const COLORS = {
      bubble: 'rgba(100, 200, 255, 0.8)',
      spark: 'rgba(255, 200, 50, 0.9)',
      drop: 'rgba(50, 150, 255, 0.7)',
      smoke: 'rgba(100, 100, 100, 0.6)'
    };
    particle.color = COLORS[type];
    
    particlesRef.current.push(particle);
  }, [config.maxParticles, getParticleFromPool]);

  // Initialize and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = width;
    canvas.height = height;
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Add some initial particles for demo
    for (let i = 0; i < Math.min(10, config.maxParticles); i++) {
      setTimeout(() => {
        addParticle(Math.random() * width, Math.random() * height * 0.3);
      }, i * 100);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, animate, addParticle, config.maxParticles]);

  // Click handler for adding particles
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    addParticle(x, y);
  }, [addParticle]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="border border-gray-300 rounded cursor-pointer"
        style={{ width, height }}
      />
      
      {/* Status Indicator */}
      <div className="absolute top-2 right-2 flex gap-2">
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          physicsState === 'running' ? 'bg-green-100 text-green-800' :
          physicsState === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
          physicsState === 'fallback' ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }`}>
          {physicsState.toUpperCase()}
        </div>
        
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
          {config.quality.toUpperCase()}
        </div>
      </div>
      
      {/* Performance Info */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        Particles: {performanceRef.current.particleCount} | 
        FPS: {Math.round(performanceRef.current.frameRate)}
      </div>
    </div>
  );
};

export default PhysicsSystemManager;