import React from 'react';
import { motion } from 'framer-motion';
import { ExercicePedagogique } from '../../types/api.types';

export interface ExerciseCardProps {
  exercise: ExercicePedagogique;
  progress?: {
    completed: boolean;
    score?: number;
    attempts: number;
  };
  onClick: (exercise: ExercicePedagogique) => void;
  disabled?: boolean;
  className?: string;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  progress,
  onClick,
  disabled = false,
  className = ''
}) => {
  const difficultyColors = {
    FACILE: 'from-green-400 to-green-600',
    MOYEN: 'from-yellow-400 to-orange-500', 
    DIFFICILE: 'from-red-400 to-red-600'
  };

  const typeIcons = {
    QCM: '🎯',
    CALCUL: '🧮',
    TEXTE_LIBRE: '✍️',
    DRAG_DROP: '🎲',
    CONJUGAISON: '📝',
    LECTURE: '📚',
    GEOMETRIE: '📐',
    PROBLEME: '🧩'
  };

  const handleClick = () => {
    if (!disabled) {
      onClick(exercise);
    }
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl border-2 border-transparent
        bg-white shadow-lg cursor-pointer transition-all duration-300
        hover:shadow-xl hover:scale-105 hover:border-purple-500
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${progress?.completed ? 'ring-2 ring-green-400' : ''}
        ${className}
      `}
      onClick={handleClick}
      whileHover={!disabled ? { y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Difficulty Badge */}
      <div className={`
        absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold text-white
        bg-gradient-to-r ${difficultyColors[exercise.difficulte]}
      `}>
        {exercise.difficulte}
      </div>

      {/* Completion Badge */}
      {progress?.completed && (
        <div className="absolute top-3 left-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
      )}

      {/* Card Content */}
      <div className="p-6">
        {/* Exercise Type Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
          <span className="text-2xl">{typeIcons[exercise.type]}</span>
        </div>

        {/* Exercise Info */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {exercise.type.replace('_', ' ')}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {exercise.configuration.question || 'Exercice interactif'}
          </p>

          {/* XP Points */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-yellow-500">⭐</span>
            <span className="text-sm font-semibold text-gray-700">
              {exercise.xp} XP
            </span>
          </div>

          {/* Progress Info */}
          {progress && (
            <div className="text-xs text-gray-500">
              {progress.completed ? (
                <span className="text-green-600 font-semibold">
                  Terminé {progress.score ? `(${progress.score}%)` : ''}
                </span>
              ) : (
                <span>
                  {progress.attempts > 0 ? `${progress.attempts} tentative(s)` : 'Nouveau'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Magical Sparkle Effect */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-2 right-8 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-8 left-4 w-1 h-1 bg-pink-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
    </motion.div>
  );
}; 