import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useMotionPreferences } from '../../utils/reducedMotionSupport';
import '../../styles/wcagColors.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  type: 'fire' | 'water' | 'magic' | 'crystal' | 'lightning' | 'smoke' | 'sparkle' | 'heart' | 'star';
}

interface AdvancedParticleEngineProps {
  width?: number;
  height?: number;
  particleCount?: number;
  particleType: 'fire' | 'water' | 'magic' | 'crystal' | 'lightning' | 'smoke' | 'sparkle' | 'heart' | 'star';
  behavior?: 'normal' | 'spiral' | 'orbit' | 'explosion' | 'attract' | 'repel';
  intensity: 'low' | 'medium' | 'high' | 'extreme' | 'nuclear';
  isActive: boolean;
  emitterPosition?: { x: number; y: number };
  className?: string;
}

const AdvancedParticleEngine: React.FC<AdvancedParticleEngineProps> = ({
  width = 300,
  height = 200,
  particleCount = 50,
  particleType,
  behavior = 'normal',
  intensity,
  isActive,
  emitterPosition = { x: 150, y: 100 },
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const motionPreferences = useMotionPreferences();

  // Intensity configurations
  const config = useMemo(() => {
    const INTENSITY_CONFIGS = {
      low: { 
        maxParticles: Math.min(20, particleCount),
        spawnRate: 1,
        lifespan: 60,
        size: { min: 2, max: 4 }
      },
      medium: { 
        maxParticles: Math.min(50, particleCount),
        spawnRate: 2,
        lifespan: 90,
        size: { min: 3, max: 6 }
      },
      high: { 
        maxParticles: Math.min(100, particleCount),
        spawnRate: 3,
        lifespan: 120,
        size: { min: 4, max: 8 }
      },
      extreme: { 
        maxParticles: Math.min(200, particleCount),
        spawnRate: 5,
        lifespan: 180,
        size: { min: 5, max: 12 }
      },
      nuclear: { 
        maxParticles: Math.min(300, particleCount),
        spawnRate: 8,
        lifespan: 300,
        size: { min: 8, max: 20 }
      }
    };
    return INTENSITY_CONFIGS[intensity] || INTENSITY_CONFIGS.medium;
  }, [intensity, particleCount]);

  // Particle type configurations
  const getParticleConfig = useCallback((type: string) => {
    const CONFIGS = {
      fire: {
        colors: [{ r: 255, g: 69, b: 0 }, { r: 255, g: 140, b: 0 }, { r: 255, g: 215, b: 0 }],
        velocity: { x: 0, y: -2 },
        gravity: 0.1,
        friction: 0.98
      },
      water: {
        colors: [{ r: 0, g: 102, b: 204 }, { r: 0, g: 153, b: 255 }, { r: 102, g: 204, b: 255 }],
        velocity: { x: 0, y: 1 },
        gravity: 0.05,
        friction: 0.99
      },
      magic: {
        colors: [{ r: 138, g: 43, b: 226 }, { r: 147, g: 112, b: 219 }, { r: 186, g: 85, b: 211 }],
        velocity: { x: 0, y: -1 },
        gravity: 0.02,
        friction: 0.995
      },
      crystal: {
        colors: [{ r: 230, g: 230, b: 250 }, { r: 221, g: 160, b: 221 }, { r: 218, g: 112, b: 214 }],
        velocity: { x: 0, y: -0.5 },
        gravity: 0.01,
        friction: 0.999
      },
      sparkle: {
        colors: [{ r: 255, g: 215, b: 0 }, { r: 255, g: 255, b: 255 }, { r: 255, g: 182, b: 193 }],
        velocity: { x: 0, y: -1 },
        gravity: 0.03,
        friction: 0.99
      },
      star: {
        colors: [{ r: 255, g: 255, b: 255 }, { r: 255, g: 215, b: 0 }, { r: 255, g: 182, b: 193 }],
        velocity: { x: 0, y: -0.8 },
        gravity: 0.02,
        friction: 0.995
      }
    };
    return CONFIGS[type as keyof typeof CONFIGS] || CONFIGS.sparkle;
  }, []);

  // Create a new particle
  const createParticle = useCallback((x: number, y: number): Particle => {
    const particleConfig = getParticleConfig(particleType);
    const colorIndex = Math.floor(Math.random() * particleConfig.colors.length);
    const color = particleConfig.colors[colorIndex];
    
    return {
      id: Date.now() + Math.random(),
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: particleConfig.velocity.x + (Math.random() - 0.5) * 2,
      vy: particleConfig.velocity.y + (Math.random() - 0.5) * 2,
      size: Math.random() * (config.size.max - config.size.min) + config.size.min,
      life: 0,
      maxLife: config.lifespan + Math.random() * 30,
      color: { ...color, a: 1 },
      type: particleType
    };
  }, [particleType, config.size, config.lifespan, getParticleConfig]);

  // Update particle physics
  const updateParticlePhysics = useCallback((particle: Particle, deltaTime: number) => {
    const particleConfig = getParticleConfig(particle.type);
    
    // Apply velocity
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Apply gravity
    particle.vy += particleConfig.gravity;
    
    // Apply friction
    particle.vx *= particleConfig.friction;
    particle.vy *= particleConfig.friction;
    
    // Update life
    particle.life += deltaTime * 0.016; // Assuming 60fps
    
    // Update alpha based on life
    const lifeRatio = particle.life / particle.maxLife;
    particle.color.a = Math.max(0, 1 - lifeRatio);
  }, [getParticleConfig]);

  // Render particles
  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);
    
    particlesRef.current.forEach(particle => {
      const alpha = particle.color.a;
      if (alpha <= 0) return;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const size = particle.size * (1 + alpha * 0.5);
      
      switch (particle.type) {
        case 'sparkle':
        case 'star':
          // Draw star shape
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = particle.x + Math.cos(angle) * size;
            const y = particle.y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'crystal':
          // Draw diamond shape
          ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y - size);
          ctx.lineTo(particle.x + size, particle.y);
          ctx.lineTo(particle.x, particle.y + size);
          ctx.lineTo(particle.x - size, particle.y);
          ctx.closePath();
          ctx.stroke();
          break;
          
        default:
          // Draw circle
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
          ctx.fill();
      }
      
      ctx.restore();
    });
  }, [width, height]);

  // Main animation loop
  const animate = useCallback((currentTime: number) => {
    if (!isActive) return;
    
    const deltaTime = currentTime - lastTimeRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Spawn new particles
    if (particlesRef.current.length < config.maxParticles) {
      for (let i = 0; i < config.spawnRate; i++) {
        const x = emitterPosition.x + (Math.random() - 0.5) * 20;
        const y = emitterPosition.y + (Math.random() - 0.5) * 20;
        particlesRef.current.push(createParticle(x, y));
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(particle => {
      updateParticlePhysics(particle, deltaTime);
      return particle.life < particle.maxLife && 
             particle.x > -50 && particle.x < width + 50 &&
             particle.y > -50 && particle.y < height + 50;
    });

    // Render
    renderParticles(ctx);
    
    lastTimeRef.current = currentTime;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isActive, config, emitterPosition, createParticle, updateParticlePhysics, renderParticles, width, height]);

  // Initialize and cleanup
  useEffect(() => {
    if (isActive) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particlesRef.current = [];
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pointer-events-none ${className}`}
      style={{
        imageRendering: 'crisp-edges',
        background: 'transparent'
      }}
    />
  );
};

export { AdvancedParticleEngine };
export default AdvancedParticleEngine; 