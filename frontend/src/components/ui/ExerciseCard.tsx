import React from 'react';
import { motion } from 'framer-motion';

interface ExerciseCardProps {
  id: string;
  title: string;
  description?: string;
  difficulty?: 'facile' | 'moyen' | 'difficile';
  duration?: number;
  progress?: number;
  completed?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  id,
  title,
  description,
  difficulty = 'facile',
  duration,
  progress = 0,
  completed = false,
  onClick,
  className = '',
  children
}) => {
  const difficultyColors = {
    facile: 'bg-green-100 text-green-800 border-green-200',
    moyen: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    difficile: 'bg-red-100 text-red-800 border-red-200'
  };

  const difficultyIcons = {
    facile: '⭐',
    moyen: '⭐⭐',
    difficile: '⭐⭐⭐'
  };

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer transition-all hover:shadow-xl ${className}`}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Status indicator */}
      {completed && (
        <div className="flex justify-end mb-2">
          <span className="text-green-500 text-2xl">✅</span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Difficulty */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${difficultyColors[difficulty]}`}>
            {difficultyIcons[difficulty]} {difficulty}
          </span>

          {/* Duration */}
          {duration && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              🕒 {duration} min
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Progression</span>
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Custom content */}
      {children}

      {/* Action hint */}
      <div className="flex justify-center mt-4">
        <span className="text-xs text-gray-400">Cliquer pour commencer</span>
      </div>
    </motion.div>
  );
};

export default ExerciseCard;