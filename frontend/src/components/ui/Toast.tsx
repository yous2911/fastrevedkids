import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =====================================================
// TOAST HOOK AND COMPONENT
// =====================================================

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  position = 'top-right',
  onClose,
  ...props
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const TYPE_STYLES = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600'
  };

  const TYPE_ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const POSITION_STYLES = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <motion.div
      className={`fixed ${POSITION_STYLES[position]} z-50 max-w-sm w-full`}
      initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, y: position.includes('top') ? -100 : 100 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      {...props}
    >
      <div className={`${TYPE_STYLES[type]} text-white p-4 rounded-xl shadow-lg border-l-4 flex items-center gap-3`}>
        <span className="text-lg">{TYPE_ICONS[type]}</span>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={() => onClose(id)}
          className="text-white/80 hover:text-white text-lg transition-colors"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

interface ToastItem extends Omit<ToastProps, 'onClose'> {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'success' }), [addToast]);

  const error = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'error' }), [addToast]);

  const warning = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'warning' }), [addToast]);

  const info = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'info' }), [addToast]);

  const ToastContainer = useCallback(() => (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  ), [toasts, removeToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer
  };
}

// =====================================================
// PROGRESS BAR COMPONENT
// =====================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'rainbow';
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  animated = true,
  showLabel = true,
  label,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const SIZE_CLASSES = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    rainbow: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progression'}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${SIZE_CLASSES[size]} overflow-hidden`}>
        <motion.div
          className={`${SIZE_CLASSES[size]} ${variantClasses[variant]} rounded-full ${animated ? 'transition-all duration-500' : ''}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// =====================================================
// FLOATING ELEMENTS COMPONENTS
// =====================================================

interface FloatingElementProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const SparkleElements: React.FC<FloatingElementProps> = ({
  children,
  duration = 2,
  delay = 0,
  intensity = 'medium',
  className = ''
}) => {
  const SPARKLE_COUNT = {
    low: 3,
    medium: 6,
    high: 10
  };

  const sparkles = Array.from({ length: SPARKLE_COUNT[intensity] }, (_, i) => (
    <motion.div
      key={i}
      className="absolute text-yellow-400 pointer-events-none"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180, 360]
      }}
      transition={{ 
        duration,
        delay: delay + (i * 0.1),
        repeat: Infinity,
        repeatDelay: 2
      }}
    >
      ✨
    </motion.div>
  ));

  return (
    <div className={`relative ${className}`}>
      {children}
      {sparkles}
    </div>
  );
};

export const MagicElements: React.FC<FloatingElementProps> = ({
  children,
  duration = 3,
  delay = 0,
  intensity = 'medium',
  className = ''
}) => {
  const elementCount = {
    low: 2,
    medium: 4,
    high: 6
  };

  const MAGIC_EMOJIS = ['🌟', '✨', '💫', '⭐', '🔮', '🎭'];

  const elements = Array.from({ length: elementCount[intensity] }, (_, i) => (
    <motion.div
      key={i}
      className="absolute pointer-events-none"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: [0, 1, 0],
        y: [-20, -40, -60],
        x: [0, Math.random() * 40 - 20, Math.random() * 80 - 40]
      }}
      transition={{ 
        duration,
        delay: delay + (i * 0.3),
        repeat: Infinity,
        repeatDelay: 3
      }}
    >
      {MAGIC_EMOJIS[i % MAGIC_EMOJIS.length]}
    </motion.div>
  ));

  return (
    <div className={`relative ${className}`}>
      {children}
      {elements}
    </div>
  );
};

export const CelebrationElements: React.FC<FloatingElementProps> = ({
  children,
  duration = 1.5,
  delay = 0,
  intensity = 'high',
  className = ''
}) => {
  const PARTICLE_COUNT = {
    low: 5,
    medium: 10,
    high: 20
  };

  const CELEBRATION_EMOJIS = ['🎉', '🎊', '🎈', '🏆', '👏', '🌟', '💯', '🔥'];

  const particles = Array.from({ length: PARTICLE_COUNT[intensity] }, (_, i) => (
    <motion.div
      key={i}
      className="absolute pointer-events-none text-2xl"
      style={{
        left: `${50 + (Math.random() - 0.5) * 100}%`,
        top: `${50 + (Math.random() - 0.5) * 100}%`,
      }}
      initial={{ 
        opacity: 1, 
        scale: 0,
        rotate: 0
      }}
      animate={{ 
        opacity: [1, 1, 0],
        scale: [0, 1.2, 0.8],
        rotate: [0, Math.random() * 360],
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200
      }}
      transition={{ 
        duration,
        delay: delay + (i * 0.05),
        ease: "easeOut"
      }}
    >
      {CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]}
    </motion.div>
  ));

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 pointer-events-none">
        {particles}
      </div>
    </div>
  );
};

// =====================================================
// ERROR BOUNDARY COMPONENT
// =====================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Oups ! Une erreur est survenue
            </h2>
            <p className="text-gray-600 mb-6">
              Quelque chose s'est mal passé. Ne t'inquiète pas, nous allons réparer cela !
            </p>
            <button
              onClick={this.resetError}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors font-medium"
            >
              Réessayer
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Détails techniques
                </summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =====================================================
// INPUT COMPONENT
// =====================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'magical';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const BASE_CLASSES = "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all";
  
  const variantClasses = {
    default: error 
      ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
    magical: error
      ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-gradient-to-r from-red-50 to-pink-50"
      : "border-purple-300 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-blue-50 to-purple-50"
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          className={`
            ${BASE_CLASSES} 
            ${variantClasses[variant]} 
            ${leftIcon ? 'pl-10' : ''} 
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}; 