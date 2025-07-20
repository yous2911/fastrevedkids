import React from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../../hooks/useSound';

interface ProgressBarProps {
  progress: number; // 0 to 100
  maxValue?: number;
  currentValue?: number;
  variant?: 'default' | 'sparkle' | 'gradient' | 'rainbow';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  maxValue,
  currentValue,
  variant = 'default',
  size = 'md',
  showPercentage = true,
  animated = true,
  className = ''
}) => {
  const { playSound } = useSound();
  
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'sparkle':
        return 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500';
      case 'gradient':
        return 'bg-gradient-to-r from-green-400 to-blue-500';
      case 'rainbow':
        return 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleProgressComplete = () => {
    if (clampedProgress >= 100 && animated) {
      playSound('levelup');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {clampedProgress.toFixed(0)}%
          </span>
        )}
        {maxValue && currentValue && (
          <span className="text-sm text-gray-500">
            {currentValue} / {maxValue}
          </span>
        )}
      </div>
      
      <div className={`relative ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${getVariantClasses()} relative`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: animated ? 1 : 0,
            ease: "easeOut",
            type: "spring",
            stiffness: 100,
            damping: 20
          }}
          onAnimationComplete={handleProgressComplete}
        />
        
        {variant === 'sparkle' && animated && (
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              backgroundSize: "200% 100%",
              backgroundPosition: "100% 0%"
            }}
          />
        )}
        
        {variant === 'rainbow' && animated && (
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: "200% 200%"
            }}
          />
        )}
      </div>
    </div>
  );
}; 