import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

interface AnimatedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'exercise' | 'reward' | 'progress' | 'sparkle';
  onClick?: () => void;
  className?: string;
  delay?: number;
  interactive?: boolean;
}

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15
    }
  }
};

const sparkleVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10
    }
  },
  sparkle: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

const exerciseVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  },
  correct: {
    scale: [1, 1.1, 1],
    backgroundColor: ["#fef3c7", "#fbbf24", "#fef3c7"],
    transition: {
      duration: 0.5,
      times: [0, 0.5, 1]
    }
  },
  incorrect: {
    x: [-10, 10, -10, 10, 0],
    backgroundColor: ["#fef2f2", "#fecaca", "#fef2f2"],
    transition: {
      duration: 0.4
    }
  }
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'default',
  onClick,
  className = '',
  delay = 0,
  interactive = true
}) => {
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  const handleClick = () => {
    if (onClick) {
      playSound('click');
      triggerHaptic('light');
      onClick();
    }
  };

  const getVariants = () => {
    switch (variant) {
      case 'exercise':
        return exerciseVariants;
      case 'sparkle':
        return sparkleVariants;
      default:
        return cardVariants;
    }
  };

  const getCardClasses = () => {
    const baseClasses = 'relative overflow-hidden rounded-xl shadow-lg backdrop-blur-sm';
    const variantClasses = {
      default: 'bg-white/90 border border-gray-200',
      exercise: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200',
      reward: 'bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-200',
      progress: 'bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200',
      sparkle: 'bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${className}`;
  };

  return (
    <motion.div
      variants={getVariants()}
      initial="hidden"
      animate="visible"
      whileHover={interactive ? "hover" : undefined}
      whileTap={interactive ? "tap" : undefined}
      onClick={handleClick}
      className={`${getCardClasses()} ${interactive ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {variant === 'sparkle' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate="sparkle"
        >
          <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="absolute bottom-4 left-4 w-2 h-2 bg-pink-400 rounded-full" />
          <div className="absolute top-1/2 left-2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
        </motion.div>
      )}
      
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
}; 