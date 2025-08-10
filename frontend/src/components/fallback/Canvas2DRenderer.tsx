import React, { useRef, useEffect, useCallback, useState } from 'react';
import { browserCompat } from '../../utils/browserCompatibility';

export interface Canvas2DRendererProps {
  width: number;
  height: number;
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  emotion: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
  equippedItems?: string[];
  xpLevel?: number;
  onRenderError?: (error: Error) => void;
  className?: string;
}

interface AnimationFrame {
  time: number;
  bounceOffset: number;
  rotationOffset: number;
  scaleOffset: number;
}

export const Canvas2DRenderer: React.FC<Canvas2DRendererProps> = ({
  width = 200,
  height = 200,
  mascotType,
  emotion,
  equippedItems = [],
  xpLevel = 1,
  onRenderError,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // Safari-specific fixes
  const safariFixes = browserCompat.getSafariCanvasFixes();
  const browserInfo = browserCompat.getBrowserInfo();

  // Animation state
  const [animationState, setAnimationState] = useState<AnimationFrame>({
    time: 0,
    bounceOffset: 0,
    rotationOffset: 0,
    scaleOffset: 1
  });

  // Colors for different mascot types
  const MASCOT_COLORS = {
    dragon: { primary: '#FF6B6B', secondary: '#FF8787', accent: '#FFA8A8' },
    fairy: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
    robot: { primary: '#06B6D4', secondary: '#67E8F9', accent: '#A5F3FC' },
    cat: { primary: '#F59E0B', secondary: '#FBBF24', accent: '#FCD34D' },
    owl: { primary: '#6366F1', secondary: '#818CF8', accent: '#A5B4FC' }
  };

  // Emotion-based modifiers
  const EMOTION_MODIFIERS = {
    idle: { bounce: 0.02, scale: 1, speed: 1 },
    happy: { bounce: 0.08, scale: 1.1, speed: 1.5 },
    thinking: { bounce: 0.01, scale: 0.95, speed: 0.8 },
    celebrating: { bounce: 0.15, scale: 1.2, speed: 2 },
    oops: { bounce: 0.05, scale: 0.9, speed: 1.2 }
  };

  const drawMascotShape = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    colors: typeof MASCOT_COLORS.dragon,
    emotion: keyof typeof EMOTION_MODIFIERS
  ) => {
    try {
      const modifier = EMOTION_MODIFIERS[emotion];
      const adjustedSize = size * modifier.scale * animationState.scaleOffset;
      
      // Save context for transformations
      ctx.save();
      
      // Apply Safari-specific fixes
      if (safariFixes.forceContextRestore && browserInfo.name === 'safari') {
        // Force context refresh for Safari
        ctx.globalCompositeOperation = 'source-over';
      }

      // Main body (circle for simplicity, can be enhanced per mascot type)
      ctx.beginPath();
      ctx.arc(centerX, centerY + animationState.bounceOffset, adjustedSize * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();
      
      // Add a subtle gradient if supported
      try {
        const gradient = ctx.createRadialGradient(
          centerX - adjustedSize * 0.2, 
          centerY - adjustedSize * 0.2 + animationState.bounceOffset,
          0,
          centerX,
          centerY + animationState.bounceOffset,
          adjustedSize * 0.6
        );
        gradient.addColorStop(0, colors.accent);
        gradient.addColorStop(1, colors.primary);
        ctx.fillStyle = gradient;
        ctx.fill();
      } catch (gradientError) {
        // Fallback to solid color if gradients fail
        console.warn('Gradient creation failed, using solid color');
      }

      // Head (smaller circle on top)
      ctx.beginPath();
      ctx.arc(centerX, centerY - adjustedSize * 0.4 + animationState.bounceOffset, adjustedSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = colors.secondary;
      ctx.fill();

      // Eyes based on emotion
      const eyeY = centerY - adjustedSize * 0.5 + animationState.bounceOffset;
      const eyeSize = adjustedSize * 0.08;
      
      if (emotion === 'happy') {
        // Happy eyes (curved lines)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX - adjustedSize * 0.15, eyeY, eyeSize, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + adjustedSize * 0.15, eyeY, eyeSize, 0, Math.PI);
        ctx.stroke();
      } else if (emotion === 'oops') {
        // Surprised eyes (large circles)
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(centerX - adjustedSize * 0.15, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + adjustedSize * 0.15, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - adjustedSize * 0.15, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + adjustedSize * 0.15, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal eyes (circles)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - adjustedSize * 0.15, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + adjustedSize * 0.15, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mascot-specific features
      switch (mascotType) {
        case 'dragon':
          // Dragon wings
          ctx.fillStyle = colors.accent;
          ctx.beginPath();
          ctx.ellipse(centerX - adjustedSize * 0.7, centerY + animationState.bounceOffset, 
                     adjustedSize * 0.3, adjustedSize * 0.5, -Math.PI/4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(centerX + adjustedSize * 0.7, centerY + animationState.bounceOffset, 
                     adjustedSize * 0.3, adjustedSize * 0.5, Math.PI/4, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'fairy':
          // Fairy wings (more delicate)
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 2;
          ctx.fillStyle = colors.accent + '40'; // Semi-transparent
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + animationState.rotationOffset;
            const wingX = centerX + Math.cos(angle) * adjustedSize * 0.6;
            const wingY = centerY + Math.sin(angle) * adjustedSize * 0.4 + animationState.bounceOffset;
            ctx.beginPath();
            ctx.ellipse(wingX, wingY, adjustedSize * 0.2, adjustedSize * 0.35, angle, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          break;
          
        case 'robot':
          // Robot antenna
          ctx.strokeStyle = colors.secondary;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - adjustedSize * 0.7 + animationState.bounceOffset);
          ctx.lineTo(centerX, centerY - adjustedSize * 0.9 + animationState.bounceOffset);
          ctx.stroke();
          
          // Antenna tip
          ctx.fillStyle = colors.accent;
          ctx.beginPath();
          ctx.arc(centerX, centerY - adjustedSize * 0.9 + animationState.bounceOffset, adjustedSize * 0.05, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'cat':
          // Cat ears
          ctx.fillStyle = colors.secondary;
          ctx.beginPath();
          ctx.moveTo(centerX - adjustedSize * 0.25, centerY - adjustedSize * 0.6 + animationState.bounceOffset);
          ctx.lineTo(centerX - adjustedSize * 0.4, centerY - adjustedSize * 0.8 + animationState.bounceOffset);
          ctx.lineTo(centerX - adjustedSize * 0.1, centerY - adjustedSize * 0.7 + animationState.bounceOffset);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(centerX + adjustedSize * 0.25, centerY - adjustedSize * 0.6 + animationState.bounceOffset);
          ctx.lineTo(centerX + adjustedSize * 0.4, centerY - adjustedSize * 0.8 + animationState.bounceOffset);
          ctx.lineTo(centerX + adjustedSize * 0.1, centerY - adjustedSize * 0.7 + animationState.bounceOffset);
          ctx.fill();
          break;
          
        case 'owl':
          // Owl "horns" (tufts)
          ctx.fillStyle = colors.secondary;
          ctx.beginPath();
          ctx.ellipse(centerX - adjustedSize * 0.2, centerY - adjustedSize * 0.7 + animationState.bounceOffset, 
                     adjustedSize * 0.1, adjustedSize * 0.2, -Math.PI/6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(centerX + adjustedSize * 0.2, centerY - adjustedSize * 0.7 + animationState.bounceOffset, 
                     adjustedSize * 0.1, adjustedSize * 0.2, Math.PI/6, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    } catch (error) {
      console.error('Error drawing mascot shape:', error);
      if (onRenderError) {
        onRenderError(error instanceof Error ? error : new Error('Unknown drawing error'));
      }
    }
  }, [animationState, mascotType, onRenderError, safariFixes, browserInfo]);

  const drawEquippedItems = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number
  ) => {
    try {
      equippedItems.forEach(itemId => {
        ctx.save();
        
        switch (itemId) {
          case 'wizard_hat':
            // Simple wizard hat
            ctx.fillStyle = '#8B5CF6';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - size * 0.9 + animationState.bounceOffset);
            ctx.lineTo(centerX - size * 0.2, centerY - size * 0.5 + animationState.bounceOffset);
            ctx.lineTo(centerX + size * 0.2, centerY - size * 0.5 + animationState.bounceOffset);
            ctx.closePath();
            ctx.fill();
            
            // Hat brim
            ctx.fillStyle = '#7C3AED';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY - size * 0.5 + animationState.bounceOffset, 
                       size * 0.25, size * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
            
          case 'crown_gold':
            // Simple crown
            ctx.fillStyle = '#F59E0B';
            ctx.strokeStyle = '#D97706';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 5; i++) {
              const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
              const x = centerX + Math.cos(angle) * size * 0.25;
              const y = centerY - size * 0.6 + animationState.bounceOffset + Math.sin(angle) * size * 0.1;
              
              ctx.beginPath();
              ctx.arc(x, y, size * 0.04, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            break;
            
          case 'magic_wand':
            // Magic wand (held to the side)
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX + size * 0.8, centerY + size * 0.2 + animationState.bounceOffset);
            ctx.lineTo(centerX + size * 1.2, centerY - size * 0.2 + animationState.bounceOffset);
            ctx.stroke();
            
            // Wand star
            ctx.fillStyle = '#FFD700';
            const starX = centerX + size * 1.2;
            const starY = centerY - size * 0.2 + animationState.bounceOffset;
            
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
              const x = starX + Math.cos(angle) * size * 0.08;
              const y = starY + Math.sin(angle) * size * 0.08;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
        }
        
        ctx.restore();
      });
    } catch (error) {
      console.error('Error drawing equipped items:', error);
    }
  }, [equippedItems, animationState]);

  const animate = useCallback((currentTime: number) => {
    try {
      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      // Frame rate limiting for performance
      if (deltaTime < 16.67) { // Cap at 60fps
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const modifier = EMOTION_MODIFIERS[emotion];
      const time = currentTime * 0.001 * modifier.speed;

      setAnimationState(prev => ({
        time,
        bounceOffset: Math.sin(time * 2) * modifier.bounce * 20,
        rotationOffset: Math.sin(time) * 0.1,
        scaleOffset: 1 + Math.sin(time * 3) * 0.02
      }));

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas with Safari compatibility
      if (safariFixes.avoidGetImageData) {
        // Use clearRect instead of getImageData for Safari
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Draw background
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw mascot
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const size = Math.min(canvas.width, canvas.height) * 0.4;
      const colors = MASCOT_COLORS[mascotType];

      drawMascotShape(ctx, centerX, centerY, size, colors, emotion);
      drawEquippedItems(ctx, centerX, centerY, size);

      // XP level indicator
      if (xpLevel > 1) {
        ctx.fillStyle = '#059669';
        ctx.font = `bold ${Math.max(12, size * 0.1)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${xpLevel}`, centerX, canvas.height - 10);
      }

    } catch (error) {
      console.error('Animation error:', error);
      setRenderError(`Animation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (onRenderError) {
        onRenderError(error instanceof Error ? error : new Error('Unknown animation error'));
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [emotion, mascotType, xpLevel, drawMascotShape, drawEquippedItems, safariFixes, onRenderError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size with device pixel ratio consideration
    const pixelRatio = Math.min(window.devicePixelRatio || 1, browserCompat.isLowEndDevice() ? 1 : 2);
    
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderError('Could not get 2D rendering context');
      return;
    }

    // Scale context for high DPI displays
    ctx.scale(pixelRatio, pixelRatio);
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) {
      (ctx as any).imageSmoothingQuality = browserCompat.isLowEndDevice() ? 'low' : 'high';
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, animate]);

  // Error display
  if (renderError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-sm text-gray-600">
            Render Error
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Using simplified display
          </div>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        imageRendering: browserCompat.isLowEndDevice() ? 'pixelated' : 'auto'
      }}
    />
  );
};

export default Canvas2DRenderer;