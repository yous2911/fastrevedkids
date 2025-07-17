import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'magical';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  animated?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-white shadow-md',
  elevated: 'bg-white shadow-xl',
  outlined: 'bg-white border-2 border-neutral-200',
  magical: 'bg-gradient-to-br from-white to-magical-violet-glow shadow-magical border border-magical-violet-light animate-magical-glow'
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
};

const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl'
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  animated = false,
  hoverable = false,
  onClick
}) => {
  const baseClasses = 'transition-all duration-200';
  const hoverClasses = hoverable ? 'hover:shadow-lg cursor-pointer' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    roundedClasses[rounded],
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  if (animated) {
    return (
      <motion.div
        className={classes}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hoverable ? { y: -2, scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}; 