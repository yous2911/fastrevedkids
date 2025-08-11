import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useXpTracking } from '../../hooks/useFastRevKidsApi';
import { useAuth } from '../../contexts/FastRevKidsAuth';

interface XPTrackerProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showLevel?: boolean;
  showAnimation?: boolean;
}

export const XPTracker: React.FC<XPTrackerProps> = ({
  className = '',
  size = 'medium',
  showLevel = true,
  showAnimation = true
}) => {
  const { student } = useAuth();
  const { currentXp, currentLevel, xpGained, showXpAnimation, addXp } = useXpTracking();
  const [displayXp, setDisplayXp] = useState(currentXp);

  // Calculate XP for current level (assuming 100 XP per level for now)
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const currentLevelXp = Math.max(0, currentXp - xpForCurrentLevel);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (currentLevelXp / xpNeededForNextLevel) * 100;

  // Animate XP counter
  useEffect(() => {
    if (showAnimation && displayXp !== currentXp) {
      const difference = currentXp - displayXp;
      const increment = Math.ceil(Math.abs(difference) / 20);
      const timer = setInterval(() => {
        setDisplayXp(prev => {
          const next = difference > 0 
            ? Math.min(prev + increment, currentXp)
            : Math.max(prev - increment, currentXp);
          
          if (next === currentXp) {
            clearInterval(timer);
          }
          return next;
        });
      }, 50);

      return () => clearInterval(timer);
    }
  }, [currentXp, displayXp, showAnimation]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          bar: 'h-2',
          text: 'text-sm',
          level: 'text-lg'
        };
      case 'medium':
        return {
          container: 'p-4',
          bar: 'h-3',
          text: 'text-base',
          level: 'text-xl'
        };
      case 'large':
        return {
          container: 'p-6',
          bar: 'h-4',
          text: 'text-lg',
          level: 'text-2xl'
        };
      default:
        return {
          container: 'p-4',
          bar: 'h-3',
          text: 'text-base',
          level: 'text-xl'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${sizeClasses.container} ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        {showLevel && (
          <div className="flex items-center gap-2">
            <div className={`font-bold text-purple-600 ${sizeClasses.level}`}>
              Niveau {currentLevel}
            </div>
            <div className="text-2xl">⭐</div>
          </div>
        )}
        
        <div className={`text-gray-600 ${sizeClasses.text}`}>
          {Math.floor(displayXp).toLocaleString()} XP
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Background */}
        <div className={`w-full bg-gray-200 rounded-full ${sizeClasses.bar}`}>
          {/* Progress Fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-full ${sizeClasses.bar} relative overflow-hidden`}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-30"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
                delay: 1
              }}
            />
          </motion.div>
        </div>

        {/* Progress Text */}
        <div className={`mt-2 flex justify-between items-center ${sizeClasses.text} text-gray-500`}>
          <span>{currentLevelXp} / {xpNeededForNextLevel}</span>
          <span>{Math.floor(progressPercentage)}%</span>
        </div>
      </div>

      {/* XP Gained Animation */}
      <AnimatePresence>
        {showXpAnimation && xpGained > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { duration: 0.5 }
            }}
            exit={{ 
              opacity: 0, 
              scale: 1.2, 
              y: -20,
              transition: { duration: 0.5, delay: 2 }
            }}
            className="absolute -top-8 right-4 bg-green-500 text-white px-3 py-1 rounded-full font-bold shadow-lg"
          >
            <span className="mr-1">🎉</span>
            +{xpGained} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showXpAnimation && progressPercentage >= 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: [1, 1.2, 1],
              transition: { duration: 0.8 }
            }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5, delay: 3 }
            }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl"
          >
            <div className="text-center text-white">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: 2 }}
                className="text-4xl mb-2"
              >
                🎊
              </motion.div>
              <div className="font-bold text-lg">NIVEAU SUPÉRIEUR!</div>
              <div className="text-sm">Niveau {currentLevel + 1}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      {size === 'large' && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-sm text-gray-600">
          <div className="text-center">
            <div className="font-medium text-gray-800">{student?.totalXp || 0}</div>
            <div className="text-xs">Total XP</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-800">{currentLevel}</div>
            <div className="text-xs">Niveau</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-800">{student?.currentStreak || 0}</div>
            <div className="text-xs">Série</div>
          </div>
        </div>
      )}

      {/* Development Controls */}
      {process.env.NODE_ENV === 'development' && size === 'large' && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => addXp(10)}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded"
          >
            +10 XP
          </button>
          <button
            onClick={() => addXp(25)}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          >
            +25 XP
          </button>
          <button
            onClick={() => addXp(50)}
            className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
          >
            +50 XP
          </button>
        </div>
      )}
    </div>
  );
};

export default XPTracker;