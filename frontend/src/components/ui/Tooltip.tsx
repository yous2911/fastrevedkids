import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'magical' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  className?: string;
}

const POSITION_CLASSES = {
  top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
};

const ARROW_CLASSES = {
  top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800',
  bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800',
  left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800',
  right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800'
};

const VARIANT_CLASSES = {
  default: 'bg-gray-800 text-white',
  magical: 'bg-gradient-to-r from-magical-violet to-magical-blue text-white shadow-magical',
  dark: 'bg-black text-white'
};

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base'
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  variant = 'default',
  size = 'md',
  delay = 200,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const BASE_CLASSES = 'absolute z-50 rounded-lg shadow-lg whitespace-nowrap';
  const tooltipClasses = [
    BASE_CLASSES,
    POSITION_CLASSES[position],
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  ].filter(Boolean).join(' ');

  const arrowClasses = [
    'absolute w-0 h-0 border-4 border-transparent',
    ARROW_CLASSES[position]
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={tooltipClasses}
            initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0, x: position === 'left' ? 10 : position === 'right' ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0, x: position === 'left' ? 10 : position === 'right' ? -10 : 0 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative">
              {content}
              <div className={arrowClasses} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
