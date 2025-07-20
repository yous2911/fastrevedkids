import React, { forwardRef, useCallback } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'magical';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  animated?: boolean;
  motionProps?: MotionProps;
  // Nouvelles props pour l'audio/haptique
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  soundVolume?: number;
  hapticIntensity?: number;
  playHoverSound?: boolean;
  sparkyReaction?: boolean; // Si true, Sparky réagit au clic
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-magical-violet to-magical-blue hover:from-magical-violet-light hover:to-magical-blue-light text-white shadow-magical hover:shadow-magical-lg',
  secondary: 'bg-gradient-to-r from-neutral-200 to-neutral-300 hover:from-neutral-300 hover:to-neutral-400 text-neutral-800 shadow-md hover:shadow-lg',
  success: 'bg-gradient-to-r from-success-500 to-magical-green hover:from-success-400 hover:to-magical-green-light text-white shadow-success-glow hover:shadow-lg',
  warning: 'bg-gradient-to-r from-energy-500 to-magical-yellow hover:from-energy-400 hover:to-magical-yellow-light text-white shadow-energy-glow hover:shadow-lg',
  danger: 'bg-gradient-to-r from-fun-500 to-magical-pink hover:from-fun-400 hover:to-magical-pink-light text-white shadow-fun-glow hover:shadow-lg',
  ghost: 'bg-transparent hover:bg-magical-violet-glow text-magical-violet border-2 border-magical-violet hover:border-magical-violet-light',
  magical: 'bg-gradient-to-r from-magical-violet via-magical-blue to-magical-green hover:from-magical-pink hover:via-magical-violet hover:to-magical-blue text-white shadow-sparkle hover:shadow-magical-lg animate-gradient-shift'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-magical',
  lg: 'px-6 py-3 text-lg rounded-magical',
  xl: 'px-8 py-4 text-xl rounded-magical'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  animated = true,
  motionProps,
  className = '',
  children,
  disabled,
  soundEnabled = true,
  hapticEnabled = true,
  soundVolume = 1,
  hapticIntensity = 1,
  playHoverSound = false,
  sparkyReaction = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}, ref) => {
  const { playSoundEvent } = useSound();
  const { triggerHapticEvent } = useHaptic();

  const baseClasses = 'font-magical font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-magical-violet disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform-gpu';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    'hover:scale-105 active:scale-95', // Effet de scale magique
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    // Sons et haptiques
    if (soundEnabled) {
      if (variant === 'success') {
        playSoundEvent({ type: 'button', context: 'success', customVolume: soundVolume });
      } else if (variant === 'danger') {
        playSoundEvent({ type: 'button', context: 'error', customVolume: soundVolume });
      } else if (variant === 'magical') {
        playSoundEvent({ type: 'button', context: 'magical', customVolume: soundVolume });
      } else {
        playSoundEvent({ type: 'button', customVolume: soundVolume });
      }

      // Réaction de Sparky si activée
      if (sparkyReaction) {
        setTimeout(() => {
          playSoundEvent({ type: 'sparky', context: 'happy', customVolume: soundVolume * 0.8 });
        }, 200);
      }
    }

    if (hapticEnabled) {
      if (variant === 'success') {
        triggerHapticEvent({ type: 'button', context: 'success', intensity: hapticIntensity });
      } else if (variant === 'danger') {
        triggerHapticEvent({ type: 'button', context: 'error', intensity: hapticIntensity });
      } else if (variant === 'magical') {
        triggerHapticEvent({ type: 'button', context: 'magical', intensity: hapticIntensity });
      } else {
        triggerHapticEvent({ type: 'button', intensity: hapticIntensity });
      }
    }

    onClick?.(e);
  }, [isDisabled, soundEnabled, hapticEnabled, variant, soundVolume, hapticIntensity, sparkyReaction, playSoundEvent, triggerHapticEvent, onClick]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    // Son de hover si activé
    if (playHoverSound && soundEnabled) {
      playSoundEvent({ type: 'button', context: 'hover', customVolume: soundVolume * 0.3 });
    }

    // Haptique léger au hover
    if (hapticEnabled) {
      triggerHapticEvent({ type: 'button', context: 'hover', intensity: hapticIntensity * 0.3 });
    }

    onMouseEnter?.(e);
  }, [isDisabled, playHoverSound, soundEnabled, hapticEnabled, soundVolume, hapticIntensity, playSoundEvent, triggerHapticEvent, onMouseEnter]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  const buttonContent = (
    <>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <LoadingSpinner size="sm" variant="white" />
        </motion.div>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <motion.span
          className="flex-shrink-0"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {icon}
        </motion.span>
      )}
      <span className="font-medium">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <motion.span
          className="flex-shrink-0"
          whileHover={{ scale: 1.1, rotate: -5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {icon}
        </motion.span>
      )}
    </>
  );

  if (animated) {
    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={!isDisabled ? { 
          scale: 1.05,
          boxShadow: variant === 'magical' 
            ? '0 0 30px rgba(255, 105, 180, 0.6), 0 0 60px rgba(255, 105, 180, 0.3)'
            : '0 8px 25px rgba(138, 43, 226, 0.4)'
        } : undefined}
        whileTap={!isDisabled ? { 
          scale: 0.95,
          transition: { duration: 0.1 }
        } : undefined}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17,
          opacity: { duration: 0.2 },
          y: { duration: 0.3 }
        }}
        {...motionProps}
        {...(props as any)}
      >
        {buttonContent}
        
        {/* Effet de particules magiques pour le variant magical */}
        {variant === 'magical' && !isDisabled && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${20 + (i % 2) * 60}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.button>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {buttonContent}
    </button>
  );
});

Button.displayName = 'Button'; 