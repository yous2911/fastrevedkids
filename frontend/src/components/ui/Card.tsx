import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'magical';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  animated?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

const VARIANT_CLASSES = {
  default: 'bg-white shadow-md',
  elevated: 'bg-white shadow-xl',
  outlined: 'bg-white border-2 border-neutral-200',
  magical: 'bg-gradient-to-br from-white to-magical-violet-glow shadow-magical border border-magical-violet-light animate-magical-glow'
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
};

const ROUNDED_CLASSES = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl'
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  animated = false,
  hoverable = false,
  onClick,
  ...props
}, ref) => {
  const BASE_CLASSES = 'transition-all duration-200';
  const hoverClasses = hoverable ? 'hover:shadow-lg cursor-pointer' : '';
  
  const CLASSES = [
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    PADDING_CLASSES[padding],
    ROUNDED_CLASSES[rounded],
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  if (animated) {
    return (
      <motion.div
        ref={ref}
        className={CLASSES}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hoverable ? { y: -2, scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={CLASSES} onClick={onClick} {...props}>
      {children}
    </div>
  );
}); 