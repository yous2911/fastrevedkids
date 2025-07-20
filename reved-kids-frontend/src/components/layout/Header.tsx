import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  actions,
  className = ''
}) => {
  const { state, dispatch } = useApp();
  const { currentStudent, online } = state;

  const handleMenuToggle = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  return (
    <motion.header
      className={`
        bg-white shadow-md border-b border-gray-200 px-4 py-3
        flex items-center justify-between ${className}
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            icon={<span className="text-xl">←</span>}
            className="px-2"
          />
        )}
        
        <button
          onClick={handleMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-6 h-6 flex flex-col justify-center gap-1">
            <div className="w-full h-0.5 bg-gray-600 rounded"></div>
            <div className="w-full h-0.5 bg-gray-600 rounded"></div>
            <div className="w-full h-0.5 bg-gray-600 rounded"></div>
          </div>
        </button>

        {title && (
          <h1 className="text-xl font-bold text-gray-800 truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Center section - Student info */}
      {currentStudent && (
        <div className="hidden md:flex items-center gap-3">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800">
              {currentStudent.prenom} {currentStudent.nom}
            </p>
            <p className="text-xs text-gray-500">
              {currentStudent.niveauActuel} • {currentStudent.totalPoints} points
            </p>
          </div>
          <div className="text-2xl">
            {currentStudent.mascotteType === 'dragon' && '🐉'}
            {currentStudent.mascotteType === 'fairy' && '🧚‍♀️'}
            {currentStudent.mascotteType === 'robot' && '🤖'}
            {currentStudent.mascotteType === 'cat' && '🐱'}
            {currentStudent.mascotteType === 'owl' && '🦉'}
          </div>
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className={`
          w-3 h-3 rounded-full 
          ${online ? 'bg-green-500' : 'bg-red-500'}
        `} title={online ? 'Connecté' : 'Hors ligne'} />

        {/* Actions */}
        {actions}

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          icon={<span className="text-lg">⚙️</span>}
          className="px-2"
        />
      </div>
    </motion.header>
  );
}; 