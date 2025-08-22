import React from 'react';
import { motion } from 'framer-motion';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'large';
  variant?: 'primary' | 'secondary' | 'white';
  message?: string;
  fullScreen?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  large: 'w-16 h-16'
};

const COLOR_CLASSES = {
  primary: 'border-blue-500',
  secondary: 'border-purple-500',
  white: 'border-white'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  message,
  fullScreen = false,
  ...props
}) => {
  const spinner = (
    <motion.div
      className={`
        ${SIZE_CLASSES[size]} 
        border-2 border-gray-200 
        ${COLOR_CLASSES[variant]} 
        border-t-transparent 
        rounded-full
      `}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50" {...props}>
        <div className="text-center">
          {spinner}
          {message && message.trim() && (
            <p className="mt-4 text-gray-600 font-medium">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" {...props}>
      {spinner}
      {message && message.trim() && <span className="text-gray-600">{message}</span>}
    </div>
  );
}; 