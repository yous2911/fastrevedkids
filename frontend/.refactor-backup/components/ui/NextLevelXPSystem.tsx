import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateXPSystemProps, checkRateLimit } from '../../utils/securityValidation';
import { 
  useScreenReader, 
  useReducedMotion, 
  generateAriaLabel, 
  getAccessibleColor, 
  getAnimationProps, 
  useHighContrast 
} from '../../utils/accessibility';
import '../../styles/wcagColors.css';

// Type definitions
type ThemeType = 'default' | 'magic' | 'fire' | 'water' | 'crystal' | 'rainbow';

interface ThemeConfig {
  name: string;
  liquidGradient: string[];
  glowColor: string;
  bubbleColor: string;
  particleColors: string[];
  backgroundColor: string;
  shadowColor: string;
  textColor: string;
  borderColor: string;
}

interface LiquidDrop {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  type: 'xp' | 'bonus' | 'streak' | 'achievement';
}

interface LiquidBubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
}

interface NextLevelXPSystemProps {
  currentXP: number;
  maxXP: number;
  level: number;
  xpGained?: number;
  bonusMultiplier?: number;
  streakActive?: boolean;
  recentAchievements?: string[];
  onLevelUp?: (newLevel: number) => void;
  onMilestone?: (milestone: number) => void;
  size?: 'compact' | 'normal' | 'large' | 'massive';
  theme?: ThemeType;
  enablePhysics?: boolean;
  interactive?: boolean;
}

const NextLevelXPSystem: React.FC<NextLevelXPSystemProps> = ({
  currentXP,
  maxXP,
  level,
  xpGained = 0,
  bonusMultiplier = 1,
  streakActive = false,
  recentAchievements = [],
  onLevelUp,
  onMilestone,
  size = 'normal',
  theme = 'magic',
  enablePhysics = true,
  interactive = true
}) => {
  // Security validation of props
  const validatedProps = useMemo(() => {
    const validation = validateXPSystemProps({
      currentXP,
      maxXP,
      level,
      xpGained,
      bonusMultiplier
    });
    
    if (!validation.isValid) {
      console.warn('XP System validation errors:', validation.errors);
    }
    
    return validation;
  }, [currentXP, maxXP, level, xpGained, bonusMultiplier]);

  // Use validated values
  const safeCurrentXP = validatedProps.currentXP;
  const safeMaxXP = validatedProps.maxXP;
  const safeLevel = validatedProps.level;
  const safeXPGained = validatedProps.xpGained;
  const safeBonusMultiplier = validatedProps.bonusMultiplier;

  // Accessibility hooks
  const { announce } = useScreenReader();
  const reduceMotion = useReducedMotion();
  const highContrast = useHighContrast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const liquidDropsRef = useRef<LiquidDrop[]>([]);
  const bubblesRef = useRef<LiquidBubble[]>([]);
  const waveOffsetRef = useRef(0);
  const lastXPRef = useRef(currentXP);
  const lastLevelRef = useRef(level);
  const lastFrameTimeRef = useRef(0);
  const bubblePoolRef = useRef<LiquidBubble[]>([]);
  const dropPoolRef = useRef<LiquidDrop[]>([]);
  const isUnmountedRef = useRef(false);
  const waveSpeedRef = useRef(0.05);
  const previousThemeRef = useRef<ThemeType>((theme || 'default') as ThemeType);
  const themeTransitionRef = useRef(0);

  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<Array<{
    id: number;
    value: number;
    x: number;
    y: number;
    color: string;
    type: string;
  }>>([]);

  // Size configurations
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'compact':
        return { width: 200, height: 20, fontSize: '12px', bubbleCount: 8 };
      case 'normal':
        return { width: 300, height: 30, fontSize: '14px', bubbleCount: 12 };
      case 'large':
        return { width: 400, height: 40, fontSize: '16px', bubbleCount: 16 };
      case 'massive':
        return { width: 500, height: 60, fontSize: '20px', bubbleCount: 24 };
      default:
        return { width: 300, height: 30, fontSize: '14px', bubbleCount: 12 };
    }
  }, [size]);

  // Enhanced theme configurations with complete color schemes and fallbacks
  const getThemeConfig = useCallback((themeName: string) => {
    const themes = {
      fire: {
        name: 'fire',
        liquidGradient: ['#FF4500', '#FF6347', '#FFD700', '#FFA500'],
        glowColor: '#FF4500',
        bubbleColor: '#FFA500',
        particleColors: ['#FF0000', '#FF4500', '#FFD700', '#FFA500'],
        backgroundColor: 'rgba(255, 69, 0, 0.1)',
        shadowColor: 'rgba(255, 69, 0, 0.3)',
        textColor: '#FFFFFF',
        borderColor: '#FF4500'
      },
      water: {
        name: 'water',
        liquidGradient: ['#0066CC', '#0099FF', '#66CCFF', '#87CEEB'],
        glowColor: '#0099FF',
        bubbleColor: '#66CCFF',
        particleColors: ['#0066CC', '#0099FF', '#66CCFF', '#87CEEB'],
        backgroundColor: 'rgba(0, 153, 255, 0.1)',
        shadowColor: 'rgba(0, 153, 255, 0.3)',
        textColor: '#FFFFFF',
        borderColor: '#0099FF'
      },
      crystal: {
        name: 'crystal',
        liquidGradient: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3'],
        glowColor: '#DDA0DD',
        bubbleColor: '#E6E6FA',
        particleColors: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3'],
        backgroundColor: 'rgba(221, 160, 221, 0.1)',
        shadowColor: 'rgba(221, 160, 221, 0.3)',
        textColor: '#FFFFFF',
        borderColor: '#DDA0DD'
      },
      rainbow: {
        name: 'rainbow',
        liquidGradient: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8A2BE2'],
        glowColor: '#8A2BE2',
        bubbleColor: '#FFFFFF',
        particleColors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8A2BE2'],
        backgroundColor: 'rgba(138, 43, 226, 0.1)',
        shadowColor: 'rgba(138, 43, 226, 0.3)',
        textColor: '#FFFFFF',
        borderColor: '#8A2BE2'
      },
      magic: {
        name: 'magic',
        liquidGradient: ['#8A2BE2', '#9370DB', '#BA55D3', '#DDA0DD'],
        glowColor: '#8A2BE2',
        bubbleColor: '#DDA0DD',
        particleColors: ['#8A2BE2', '#9370DB', '#BA55D3', '#DDA0DD'],
        backgroundColor: 'rgba(138, 43, 226, 0.1)',
        shadowColor: 'rgba(138, 43, 226, 0.3)',
        textColor: '#FFFFFF',
        borderColor: '#8A2BE2'
      },
      default: {
        name: 'default',
        liquidGradient: ['#8A2BE2', '#9370DB', '#BA55D3', '#DDA0DD'],
        glowColor: '#8A2BE2',
        bubbleColor: '#DDA0DD',
        particleColors: ['#8A2BE2', '#9370DB', '#BA55D3', '#DDA0DD'],
        backgroundColor: 'rgba(138, 43, 226, 0.1)',
        shadowColor: 'rgba(138, 43, 226, 0.3)',
        textColor: '#FFFFFF',
        borderColor: '#8A2BE2'
      }
    };
    
    // Return theme config with fallback to default
    return themes[themeName as keyof typeof themes] || themes.default;
  }, []);
  
  const themeConfig = useMemo(() => getThemeConfig(theme), [theme, getThemeConfig]);

  const progress = Math.min((safeCurrentXP / safeMaxXP) * 100, 100);

  // Generate accessible labels
  const progressAriaLabel = generateAriaLabel.progress(safeCurrentXP, safeMaxXP, 'Points d\'expérience');
  const levelAriaLabel = generateAriaLabel.level(safeLevel, safeCurrentXP, safeMaxXP);
  const xpToNextLevel = Math.max(0, safeMaxXP - safeCurrentXP);

  // Create liquid drop physics with pool management
  const createLiquidDrop = useCallback((x: number, y: number, type: 'xp' | 'bonus' | 'streak' | 'achievement', value: number) => {
    // Try to reuse from pool
    const pooledDrop = dropPoolRef.current.pop();
    if (pooledDrop) {
      // Reset pooled drop properties
      const colors = themeConfig.particleColors;
      pooledDrop.x = x + (Math.random() - 0.5) * 20;
      pooledDrop.y = y + (Math.random() - 0.5) * 10;
      pooledDrop.vx = (Math.random() - 0.5) * 4;
      pooledDrop.vy = -Math.random() * 8 - 5;
      pooledDrop.size = Math.random() * 8 + 4;
      pooledDrop.color = colors[Math.floor(Math.random() * colors.length)];
      pooledDrop.life = 0;
      pooledDrop.type = type;
      return pooledDrop;
    }
    
    // Create new drop if pool is empty
    const colors = themeConfig.particleColors;
    return {
      id: Date.now() + Math.random(),
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 8 - 5,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      type
    };
  }, [themeConfig]);

  // Create liquid bubbles inside the XP bar with pool management
  const createBubble = useCallback(() => {
    // Try to reuse from pool
    const pooledBubble = bubblePoolRef.current.pop();
    if (pooledBubble) {
      // Reset pooled bubble properties
      pooledBubble.x = Math.random() * sizeConfig.width;
      pooledBubble.y = sizeConfig.height * 0.7 + Math.random() * (sizeConfig.height * 0.3);
      pooledBubble.radius = Math.random() * 4 + 2;
      pooledBubble.vx = (Math.random() - 0.5) * 0.5;
      pooledBubble.vy = -Math.random() * 2 - 1;
      pooledBubble.life = 0;
      pooledBubble.maxLife = 60 + Math.random() * 60;
      pooledBubble.alpha = 0.3 + Math.random() * 0.4;
      return pooledBubble;
    }
    
    // Create new bubble if pool is empty
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * sizeConfig.width,
      y: sizeConfig.height * 0.7 + Math.random() * (sizeConfig.height * 0.3),
      radius: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 2 - 1,
      life: 0,
      maxLife: 60 + Math.random() * 60,
      alpha: 0.3 + Math.random() * 0.4
    };
  }, [sizeConfig]);

  // Advanced liquid rendering with realistic physics
  const renderLiquidXP = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = sizeConfig;
    const fillWidth = (progress / 100) * width;
    
    ctx.clearRect(0, 0, width, height);

    // Background container
    ctx.fillStyle = themeConfig.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Enhanced border with responsive glow effect
    const glowIntensity = Math.min(width / 100, 5); // Responsive glow based on size
    ctx.strokeStyle = themeConfig.borderColor || themeConfig.glowColor;
    ctx.lineWidth = Math.max(1, Math.min(width / 150, 3)); // Responsive line width
    ctx.shadowColor = themeConfig.shadowColor || themeConfig.glowColor;
    ctx.shadowBlur = glowIntensity * 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.shadowBlur = 0;

    if (fillWidth > 0) {
      // Create liquid gradient
      const gradient = ctx.createLinearGradient(0, 0, fillWidth, 0);
      themeConfig.liquidGradient.forEach((color, index) => {
        gradient.addColorStop(index / (themeConfig.liquidGradient.length - 1), color);
      });

      // Liquid wave effect
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      
      // Bottom of liquid (mostly straight)
      ctx.lineTo(fillWidth, height);
      
      // Enhanced liquid surface with smoother wave physics
      const waveHeight = Math.min(height * 0.12, 5);
      const waveFrequency = 0.015;
      const numPoints = Math.max(Math.ceil(fillWidth / 1.5), 20); // More points for smoother curves
      
      // Create smooth wave with multiple harmonics
      const wavePoints: Array<{x: number, y: number}> = [];
      
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * fillWidth;
        const normalizedX = x / fillWidth;
        
        // Multiple wave layers for realistic liquid motion
        const wave1 = Math.sin(normalizedX * Math.PI * 4 + waveOffsetRef.current) * waveHeight;
        const wave2 = Math.sin(normalizedX * Math.PI * 8 + waveOffsetRef.current * 1.3) * (waveHeight * 0.4);
        const wave3 = Math.sin(normalizedX * Math.PI * 12 + waveOffsetRef.current * 0.7) * (waveHeight * 0.2);
        const wave4 = Math.sin(normalizedX * Math.PI * 16 + waveOffsetRef.current * 2.1) * (waveHeight * 0.1);
        
        // Smooth interpolation for wave combining
        const combinedWave = wave1 + wave2 + wave3 + wave4;
        const y = height * 0.08 + combinedWave;
        
        wavePoints.push({x, y});
      }
      
      // Draw smooth curve using quadratic curves
      for (let i = 0; i < wavePoints.length; i++) {
        const point = wavePoints[i];
        
        if (i === 0) {
          ctx.lineTo(point.x, point.y);
        } else if (i === wavePoints.length - 1) {
          ctx.lineTo(point.x, point.y);
        } else {
          // Use quadratic curve for smoother interpolation
          const nextPoint = wavePoints[i + 1];
          const cpX = (point.x + nextPoint.x) / 2;
          const cpY = (point.y + nextPoint.y) / 2;
          ctx.quadraticCurveTo(point.x, point.y, cpX, cpY);
        }
      }
      
      ctx.lineTo(0, height * 0.1);
      ctx.closePath();
      
      // Fill liquid
      ctx.fillStyle = gradient;
      ctx.fill();

      // Liquid surface reflection
      const reflectionGradient = ctx.createLinearGradient(0, 0, 0, height * 0.3);
      reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = reflectionGradient;
      ctx.fillRect(0, 0, fillWidth, height * 0.3);

      // Render bubbles inside liquid
      bubblesRef.current.forEach(bubble => {
        if (bubble.x < fillWidth) {
          ctx.save();
          ctx.globalAlpha = bubble.alpha * (1 - bubble.life / bubble.maxLife);
          
          // Bubble with realistic lighting
          const bubbleGradient = ctx.createRadialGradient(
            bubble.x, bubble.y, 0,
            bubble.x, bubble.y, bubble.radius
          );
          bubbleGradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.alpha})`);
          bubbleGradient.addColorStop(0.7, `rgba(255, 255, 255, ${bubble.alpha * 0.3})`);
          bubbleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = bubbleGradient;
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Bubble highlight
          ctx.fillStyle = `rgba(255, 255, 255, ${bubble.alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(
            bubble.x - bubble.radius * 0.3, 
            bubble.y - bubble.radius * 0.3, 
            bubble.radius * 0.3, 
            0, Math.PI * 2
          );
          ctx.fill();
          
          ctx.restore();
        }
      });

      // Level up particle explosion
      if (isLevelingUp) {
        liquidDropsRef.current.forEach(drop => {
          ctx.save();
          ctx.globalAlpha = 1 - (drop.life / 100);
          
          // Particle glow
          ctx.shadowColor = drop.color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = drop.color;
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        });
      }
    }

    // XP Text overlay with 3D effect
    ctx.save();
    ctx.font = `bold ${sizeConfig.fontSize} Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for 3D effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(`${safeCurrentXP} / ${safeMaxXP} XP`, width / 2 + 1, height / 2 + 1);
    
    // Main text with theme-aware colors
    ctx.fillStyle = themeConfig.textColor || 'white';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = Math.max(0.5, width / 300); // Responsive stroke width
    ctx.strokeText(`${safeCurrentXP} / ${safeMaxXP} XP`, width / 2, height / 2);
    ctx.fillText(`${safeCurrentXP} / ${safeMaxXP} XP`, width / 2, height / 2);
    
    ctx.restore();
  }, [progress, sizeConfig, themeConfig, safeCurrentXP, safeMaxXP, isLevelingUp]);

  // Enhanced physics simulation with collision detection and boundary checking
  const updatePhysics = useCallback(() => {
    // Skip physics if component is unmounting
    if (isUnmountedRef.current) return;
    
    // Handle theme transitions
    const currentTheme = (theme || 'default') as ThemeType;
    if (previousThemeRef.current !== currentTheme) {
      themeTransitionRef.current = 1; // Start transition
      previousThemeRef.current = currentTheme;
    }
    
    // Smooth theme transition
    if (themeTransitionRef.current > 0) {
      themeTransitionRef.current = Math.max(0, themeTransitionRef.current - 0.02);
    }
    
    // Smooth wave animation with variable speed
    waveOffsetRef.current += waveSpeedRef.current;
    
    // Gradually slow down wave for smoother animation
    if (waveSpeedRef.current > 0.02) {
      waveSpeedRef.current *= 0.999;
    }

    // Update bubbles with collision detection
    const activeBubbles: LiquidBubble[] = [];
    for (let i = 0; i < bubblesRef.current.length; i++) {
      const bubble = bubblesRef.current[i];
      
      // Store previous position for collision detection
      const prevX = bubble.x;
      const prevY = bubble.y;
      
      // Apply physics
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;
      bubble.life++;
      
      // Enhanced bubble physics with proper buoyancy
      bubble.vy -= 0.08; // Stronger buoyancy for more realistic rising
      bubble.vx *= 0.995; // Realistic water friction
      
      // Collision detection with container edges
      const containerWidth = sizeConfig.width;
      const containerHeight = sizeConfig.height;
      
      // Left and right wall collisions
      if (bubble.x - bubble.radius <= 0) {
        bubble.x = bubble.radius;
        bubble.vx = Math.abs(bubble.vx) * 0.5; // Bounce with energy loss
      } else if (bubble.x + bubble.radius >= containerWidth) {
        bubble.x = containerWidth - bubble.radius;
        bubble.vx = -Math.abs(bubble.vx) * 0.5; // Bounce with energy loss
      }
      
      // Bottom collision (liquid surface)
      if (bubble.y + bubble.radius >= containerHeight) {
        bubble.y = containerHeight - bubble.radius;
        bubble.vy = -Math.abs(bubble.vy) * 0.3; // Small bounce
      }
      
      // Top boundary (bubble escapes)
      if (bubble.y + bubble.radius <= 0) {
        bubble.vy = Math.abs(bubble.vy) * 0.2; // Slow descent back
      }
      
      // Check if bubble should be recycled
      if (bubble.life >= bubble.maxLife || bubble.y <= -bubble.radius * 2) {
        // Return to pool for reuse
        if (bubblePoolRef.current.length < 50) {
          bubblePoolRef.current.push(bubble);
        }
      } else {
        activeBubbles.push(bubble);
      }
    }
    bubblesRef.current = activeBubbles;

    // Add new bubbles with controlled spawning
    if (Math.random() < 0.08 && bubblesRef.current.length < sizeConfig.bubbleCount && !isUnmountedRef.current) {
      bubblesRef.current.push(createBubble());
    }

    // Update liquid drops with enhanced physics and boundary checking
    const activeDrops: LiquidDrop[] = [];
    for (let i = 0; i < liquidDropsRef.current.length; i++) {
      const drop = liquidDropsRef.current[i];
      
      // Apply realistic gravity and air resistance
      drop.vy += 0.4; // More realistic gravity acceleration
      drop.vx *= 0.985; // Air resistance
      
      // Update position
      drop.x += drop.vx;
      drop.y += drop.vy;
      drop.life++;
      
      // Boundary checking for drops
      const containerWidth = sizeConfig.width + 100; // Allow some overflow for visual effect
      const containerHeight = sizeConfig.height + 150;
      
      // Horizontal boundaries with bounce
      if (drop.x <= 0) {
        drop.x = 0;
        drop.vx = Math.abs(drop.vx) * 0.6;
      } else if (drop.x >= containerWidth) {
        drop.x = containerWidth;
        drop.vx = -Math.abs(drop.vx) * 0.6;
      }
      
      // Ground collision with splash effect
      if (drop.y >= containerHeight - drop.size) {
        drop.y = containerHeight - drop.size;
        drop.vy = -Math.abs(drop.vy) * 0.4; // Bounce
        drop.vx *= 0.8; // Friction on ground
      }
      
      // Terminal velocity limit
      if (drop.vy > 12) {
        drop.vy = 12;
      }
      
      // Check if drop should be recycled
      if (drop.life >= 150 || 
          drop.y >= containerHeight + 50 || 
          drop.x < -50 || 
          drop.x > containerWidth + 50) {
        // Return to pool for reuse
        if (dropPoolRef.current.length < 100) {
          dropPoolRef.current.push(drop);
        }
      } else {
        activeDrops.push(drop);
      }
    }
    liquidDropsRef.current = activeDrops;
  }, [sizeConfig, createBubble]);

  // Animation loop with frame rate limiting and unmount checking
  const animate = useCallback((currentTime: number) => {
    // Stop animation if component is unmounted
    if (isUnmountedRef.current) return;
    
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Frame rate limiting to 60fps (16.67ms per frame)
    if (currentTime - lastFrameTimeRef.current < 16.67) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    
    lastFrameTimeRef.current = currentTime;

    if (enablePhysics && !isUnmountedRef.current) {
      updatePhysics();
    }
    
    renderLiquidXP(ctx);
    
    // Only continue animation if not unmounted
    if (!isUnmountedRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [enablePhysics, updatePhysics, renderLiquidXP]);

  // Handle XP changes and level ups
  useEffect(() => {
    // Rate limiting for XP updates to prevent rapid manipulation
    if (!checkRateLimit('xp-update', 50, 10000)) {
      console.warn('XP update rate limit exceeded');
      return;
    }

    // Detect XP gain using validated values
    if (safeCurrentXP > lastXPRef.current && safeXPGained > 0) {
      setShowXPGain(true);
      
      // Announce XP gain to screen readers
      let xpMessage = `Vous avez gagné ${safeXPGained} points d'expérience.`;
      if (streakActive) {
        xpMessage += ' Série active!';
      }
      if (safeBonusMultiplier > 1) {
        xpMessage += ` Bonus x${safeBonusMultiplier}!`;
      }
      announce(xpMessage);
      
      // Create floating number with validated values
      const newFloating = {
        id: Date.now(),
        value: safeXPGained,
        x: 50 + Math.random() * 100,
        y: 50,
        color: streakActive ? '#FFD700' : themeConfig.glowColor,
        type: streakActive ? 'streak' : safeBonusMultiplier > 1 ? 'bonus' : 'normal'
      };
      
      setFloatingNumbers(prev => [...prev, newFloating]);
      
      // Create liquid drops for visual feedback with validated values
      for (let i = 0; i < Math.min(safeXPGained / 10, 20); i++) {
        liquidDropsRef.current.push(
          createLiquidDrop(
            sizeConfig.width * 0.8, 
            sizeConfig.height * 0.5, 
            streakActive ? 'streak' : 'xp',
            safeXPGained
          )
        );
      }
      
      setTimeout(() => {
        setShowXPGain(false);
        setFloatingNumbers(prev => prev.filter(f => f.id !== newFloating.id));
      }, 2000);
    }

    // Detect level up using validated values
    if (safeLevel > lastLevelRef.current) {
      setIsLevelingUp(true);
      
      // Announce level up to screen readers
      announce(`Félicitations! Vous avez atteint le niveau ${safeLevel}! Incroyable progression!`, 'assertive');
      
      // Massive particle explosion
      for (let i = 0; i < 50; i++) {
        liquidDropsRef.current.push(
          createLiquidDrop(
            sizeConfig.width / 2 + (Math.random() - 0.5) * sizeConfig.width,
            sizeConfig.height / 2,
            'achievement',
            safeLevel
          )
        );
      }

      onLevelUp?.(safeLevel);
      
      setTimeout(() => {
        setIsLevelingUp(false);
      }, 3000);
    }

    // Check for milestones using validated values
    const milestones = [25, 50, 75, 90, 95, 99];
    milestones.forEach(milestone => {
      if (progress >= milestone && lastXPRef.current / safeMaxXP * 100 < milestone) {
        announce(`Étape importante atteinte: ${milestone}% de progression vers le niveau suivant!`);
        onMilestone?.(milestone);
      }
    });

    lastXPRef.current = safeCurrentXP;
    lastLevelRef.current = safeLevel;
  }, [safeCurrentXP, safeLevel, safeXPGained, streakActive, safeBonusMultiplier, progress, safeMaxXP, themeConfig, sizeConfig, createLiquidDrop, onLevelUp, onMilestone, announce]);

  // Initialize animation with enhanced cleanup and physics pause
  useEffect(() => {
    isUnmountedRef.current = false;
    waveSpeedRef.current = 0.05; // Reset wave speed
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      // Signal unmount to stop physics
      isUnmountedRef.current = true;
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear canvas with proper context check
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Reset canvas transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      
      // Clear particle arrays immediately
      liquidDropsRef.current = [];
      bubblesRef.current = [];
      
      // Clear pools to free memory
      bubblePoolRef.current = [];
      dropPoolRef.current = [];
      
      // Reset wave offset
      waveOffsetRef.current = 0;
    };
  }, [animate]);

  // Handle canvas click for interaction with rate limiting
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    
    // Rate limit interactions to prevent abuse
    if (!checkRateLimit('canvas-interaction', 30, 10000)) {
      console.warn('Canvas interaction rate limit exceeded');
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Validate click coordinates to prevent potential issues
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      console.warn('Invalid click coordinates detected');
      return;
    }
    
    // Create ripple effect
    for (let i = 0; i < 10; i++) {
      liquidDropsRef.current.push(createLiquidDrop(x, y, 'xp', 1));
    }
    
    // Add some bonus bubbles
    for (let i = 0; i < 5; i++) {
      const bubble = createBubble();
      bubble.x = x + (Math.random() - 0.5) * 20;
      bubble.y = y + (Math.random() - 0.5) * 20;
      bubblesRef.current.push(bubble);
    }
  }, [interactive, createLiquidDrop, createBubble]);

  return (
    <div 
      className="relative inline-block"
      role="region"
      aria-label="Système d'expérience et de niveau"
    >
      {/* Skip link for screen readers */}
      <a 
        href="#xp-details" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white"
      >
        Passer aux détails d'expérience
      </a>
      
      {/* Level Display */}
      <div className="flex items-center justify-between mb-2">
        <motion.div
          className="flex items-center space-x-2"
          {...getAnimationProps(reduceMotion, {
            animate: isLevelingUp ? { 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            } : {}
          }, {
            animate: {} // No animation for reduced motion
          })}
          transition={{ duration: 0.5, repeat: isLevelingUp ? Infinity : 0 }}
        >
          <div 
            className="text-lg font-bold text-purple-600"
            aria-label={levelAriaLabel}
            role="status"
            aria-live="polite"
          >
            Niveau {safeLevel}
          </div>
          {streakActive && (
            <motion.div
              {...getAnimationProps(reduceMotion, {
                animate: { rotate: 360 }
              }, {
                animate: {} // No rotation for reduced motion
              })}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-yellow-500"
              aria-label="Série active"
              role="img"
            >
              🔥
            </motion.div>
          )}
        </motion.div>
        
        {safeBonusMultiplier > 1 && (
          <div 
            className="text-sm font-semibold text-orange-500"
            aria-label={`Multiplicateur de bonus: ${safeBonusMultiplier} fois`}
            role="status"
          >
            x{safeBonusMultiplier} Bonus!
          </div>
        )}
      </div>

      {/* Main XP Bar Canvas */}
      <div className="relative">
        {/* Hidden progress bar for screen readers */}
        <div className="sr-only">
          <label htmlFor="xp-progress">Progression d'expérience</label>
          <progress 
            id="xp-progress"
            value={safeCurrentXP}
            max={safeMaxXP}
            aria-describedby="xp-details"
          >
            {Math.round(progress)}%
          </progress>
        </div>

        <canvas
          ref={canvasRef}
          width={sizeConfig.width}
          height={sizeConfig.height}
          className={`rounded-lg transition-all duration-300 ${
            interactive ? 'cursor-pointer hover:scale-105 hover:shadow-lg focus:scale-105 focus:shadow-lg focus:outline-2 focus:outline-blue-500' : ''
          } ${isLevelingUp && !reduceMotion ? 'animate-pulse' : ''}`}
          onClick={handleCanvasClick}
          onKeyDown={(e) => {
            if (interactive && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleCanvasClick(e as any);
            }
          }}
          tabIndex={interactive ? 0 : -1}
          role={interactive ? 'button' : 'img'}
          aria-label={interactive ? 
            `Barre d'expérience interactive. ${progressAriaLabel}. Appuyez sur Entrée pour interagir.` : 
            progressAriaLabel
          }
          aria-describedby="xp-details"
          style={{
            background: `linear-gradient(90deg, ${themeConfig.backgroundColor}, rgba(255,255,255,0.1))`,
            border: `${Math.max(1, Math.min(sizeConfig.width / 150, 3))}px solid ${themeConfig.borderColor || themeConfig.glowColor}`,
            boxShadow: `0 0 ${Math.min(sizeConfig.width / 15, 20)}px ${themeConfig.shadowColor || themeConfig.glowColor}40`,
            transition: 'all 0.3s ease-in-out' // Smooth theme transitions
          }}
        />
        
        {/* Progress percentage overlay */}
        <div 
          className="absolute top-0 right-0 -mt-6 text-xs font-semibold text-gray-600"
          aria-hidden="true"
        >
          {Math.round(progress)}%
        </div>
      </div>

      {/* Detailed XP information for screen readers */}
      <div id="xp-details" className="sr-only">
        <p>
          Niveau actuel: {safeLevel}. 
          Expérience: {safeCurrentXP} sur {safeMaxXP} points. 
          Progression: {Math.round(progress)} pour cent.
          {xpToNextLevel > 0 && ` ${xpToNextLevel} points nécessaires pour le niveau suivant.`}
          {streakActive && ' Série d\'apprentissage active.'}
          {safeBonusMultiplier > 1 && ` Multiplicateur de bonus actif: ${safeBonusMultiplier} fois.`}
        </p>
      </div>

      {/* Floating XP Numbers */}
      <AnimatePresence>
        {floatingNumbers.map((floating) => (
          <motion.div
            key={floating.id}
            className="absolute pointer-events-none font-bold text-lg z-10"
            style={{
              left: `${floating.x}%`,
              top: `${floating.y}%`,
              color: floating.color,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.3, 1.2, 0.8],
              y: [-50, -80, -100, -120]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            +{floating.value} XP
            {floating.type === 'bonus' && <span className="text-orange-400"> (Bonus!)</span>}
            {floating.type === 'streak' && <span className="text-yellow-400"> (Série!)</span>}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Recent Achievements Notification */}
      <AnimatePresence>
        {recentAchievements.length > 0 && (
          <motion.div
            className="absolute -bottom-8 left-0 right-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold text-center shadow-lg">
              🏆 {recentAchievements[0]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Celebration */}
      <AnimatePresence>
        {isLevelingUp && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="alert"
            aria-live="assertive"
            aria-label={`Félicitations! Vous avez atteint le niveau ${safeLevel}!`}
          >
            <motion.div
              className="text-center"
              {...getAnimationProps(reduceMotion, {
                initial: { scale: 0, rotate: -180 },
                animate: { scale: 1, rotate: 0 }
              }, {
                initial: { opacity: 0 },
                animate: { opacity: 1 }
              })}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <div 
                className={`text-6xl mb-4 ${!reduceMotion ? 'animate-bounce' : ''}`}
                role="img"
                aria-label="Célébration"
              >
                🎉
              </div>
              <div className="text-white text-4xl font-bold mb-2 drop-shadow-lg">
                NIVEAU {safeLevel}!
              </div>
              <div className="text-white text-xl opacity-90">
                Incroyable progression!
              </div>
              
              {/* Confetti-like particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: themeConfig.particleColors[i % themeConfig.particleColors.length],
                      left: '50%',
                      top: '50%'
                    } as React.CSSProperties}
                    animate={{
                      x: [0, (Math.random() - 0.5) * 400],
                      y: [0, (Math.random() - 0.5) * 400],
                      rotate: [0, 360],
                      scale: [1, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Level Preview */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {safeMaxXP - safeCurrentXP > 0 ? (
          `${safeMaxXP - safeCurrentXP} XP jusqu'au niveau ${safeLevel + 1}`
        ) : (
          'Niveau maximum atteint!'
        )}
      </div>
    </div>
  );
};

export default NextLevelXPSystem; 