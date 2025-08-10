import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';
import { LazyErrorBoundary } from '../ErrorBoundary/LazyErrorBoundary';

interface LazyComponentLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

export const LazyComponentLoader: React.FC<LazyComponentLoaderProps> = ({ 
  children, 
  fallback,
  errorFallback
}) => {
  const defaultFallback = (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <LoadingSpinner size="xl" message="" fullScreen={false} />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 font-medium text-lg mt-4"
        >
          🎓 Chargement...
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-sm text-gray-500"
        >
          Préparation de votre espace d'apprentissage
        </motion.div>
      </motion.div>
    </div>
  );

  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={fallback || defaultFallback}>
        {children}
      </React.Suspense>
    </LazyErrorBoundary>
  );
};