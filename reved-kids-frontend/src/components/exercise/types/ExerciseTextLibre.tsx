import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExercicePedagogique } from '../../../types/api.types';
import { Card } from '../../ui/Card';

export interface ExerciseTextLibreProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

export const ExerciseTextLibre: React.FC<ExerciseTextLibreProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.toString() || '');
  const { question } = exercise.configuration;

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    onAnswerChange(value.trim());
  }, [onAnswerChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
      // Could trigger submission here if desired
    }
  }, [disabled]);

  const getValidationColor = () => {
    if (!showValidation) return '';
    const expected = exercise.configuration.solution?.toString().toLowerCase().trim();
    const given = currentAnswer?.toString().toLowerCase().trim();
    const isCorrect = expected === given;
    return isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  };

  const getExpectedAnswer = () => {
    return exercise.configuration.solution || exercise.configuration.bonneReponse;
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {question}
        </h2>
      </div>

      {/* Answer Input */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Écris ta réponse ici..."
            rows={4}
            className={`
              w-full text-lg p-4 rounded-xl border-2 resize-none
              transition-all duration-200 focus:outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${getValidationColor() || 'border-gray-300 focus:border-blue-500'}
            `}
          />
          
          {showValidation && (
            <div className="absolute right-4 top-4 text-2xl">
              {currentAnswer?.toString().toLowerCase().trim() === 
               getExpectedAnswer()?.toString().toLowerCase().trim() ? '✅' : '❌'}
            </div>
          )}
        </div>

        {/* Character count */}
        <div className="text-right text-sm text-gray-500 mt-2">
          {inputValue.length} caractères
        </div>
      </div>

      {/* Helper suggestions for common exercise types */}
      {exercise.type === 'CONJUGAISON' && (
        <div className="max-w-md mx-auto">
          <Card variant="outlined" padding="sm">
            <p className="text-sm text-gray-600 text-center">
              💡 Pense au temps, à la personne et aux terminaisons
            </p>
          </Card>
        </div>
      )}

      {exercise.type === 'LECTURE' && (
        <div className="max-w-md mx-auto">
          <Card variant="outlined" padding="sm">
            <p className="text-sm text-gray-600 text-center">
              📖 Relis le texte si tu as besoin
            </p>
          </Card>
        </div>
      )}

      {/* Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <Card variant="elevated" padding="md" className="max-w-md mx-auto">
            {currentAnswer?.toString().toLowerCase().trim() === 
             getExpectedAnswer()?.toString().toLowerCase().trim() ? (
              <div className="text-green-600">
                <span className="text-2xl">📝</span>
                <p className="font-medium mt-2">Très bien écrit !</p>
              </div>
            ) : (
              <div className="text-orange-600">
                <span className="text-2xl">✏️</span>
                <p className="font-medium mt-2">Presque !</p>
                <p className="text-sm mt-1">
                  Réponse attendue : <strong>{getExpectedAnswer()}</strong>
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 