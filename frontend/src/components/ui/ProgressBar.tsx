import React from 'react';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number;
  variant?: 'default' | 'sparkle';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  variant = 'default', 
  size = 'md',
  showPercentage = false,
  className = '',
  ...props
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-gray-200',
    sparkle: 'bg-gradient-to-r from-blue-200 to-purple-200'
  };

  return (
    <div className={`w-full rounded-full overflow-hidden ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      <div 
        className={`h-full transition-all duration-300 ease-out ${
          variant === 'sparkle' 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
            : 'bg-blue-500'
        }`}
        style={{ width: `${clampedProgress}%` }}
      >
        {showPercentage && (
          <span className="text-xs text-white font-medium px-2">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    </div>
  );
}; 