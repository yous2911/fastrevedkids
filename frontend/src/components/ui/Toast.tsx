import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const typeStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-black',
  info: 'bg-blue-500 text-white'
};

const typeIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
};

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const toastContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            fixed z-50 ${positionClasses[position]} 
            ${typeStyles[type]} 
            px-6 py-4 rounded-lg shadow-lg max-w-sm
            flex items-center gap-3 cursor-pointer
          `}
          initial={{ opacity: 0, x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0, y: position.includes('top') ? -100 : position.includes('bottom') ? 100 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          onClick={handleClose}
        >
          <span className="text-lg">{typeIcons[type]}</span>
          <span className="flex-1 font-medium">{message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="ml-2 text-lg opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(toastContent, document.body);
};

// Toast Manager Hook
export interface ToastItem extends Omit<ToastProps, 'onClose'> {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'success' });

  const error = (message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'error' });

  const warning = (message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'warning' });

  const info = (message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'info' });

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </>
  );

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