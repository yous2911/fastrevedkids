import React from 'react';
import { useKioskMode } from '../hooks/useKioskMode';

interface KioskModeActivatorProps {
  children: React.ReactNode;
  className?: string;
}

export const KioskModeActivator: React.FC<KioskModeActivatorProps> = ({ 
  children, 
  className = '' 
}) => {
  const { activateKioskMode, isActive } = useKioskMode();

  if (isActive) {
    return null; // Don't show activator when already in kiosk mode
  }

  return (
    <button
      onClick={activateKioskMode}
      className={`
        fixed bottom-4 right-4 z-50
        bg-gradient-to-r from-blue-500 to-purple-600
        text-white px-6 py-3 rounded-full
        shadow-lg hover:shadow-xl
        transform hover:scale-105
        transition-all duration-200
        font-medium text-sm
        ${className}
      `}
      title="Activer le mode concentration"
    >
      {children}
    </button>
  );
}; 