import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExercicePedagogique } from '../../../types/api.types';
import { Card } from '../../ui/Card';

export interface ExerciseQCMProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

export const ExerciseQCM: React.FC<ExerciseQCMProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const { question, choix = [] } = exercise.configuration;

  const handleChoiceSelect = useCallback((choice: string) => {
    if (disabled) return;
    onAnswerChange(choice);
  }, [disabled, onAnswerChange]);

  const getChoiceVariant = (choice: string, index: number) => {
    if (showValidation) {
      if (choice === exercise.configuration.bonneReponse) {
        return 'success'; // Correct answer - always green when validation shown
      } else if (choice === currentAnswer && choice !== exercise.configuration.bonneReponse) {
        return 'danger'; // Wrong selected answer - red
      }
    }
    
    if (choice === currentAnswer) {
      return 'primary'; // Selected but not validated yet
    }
    
    return 'default';
  };

  const getChoiceStyles = (variant: string) => {
    const styles = {
      default: 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50',
      primary: 'bg-blue-500 border-2 border-blue-500 text-white',
      success: 'bg-green-500 border-2 border-green-500 text-white',
      danger: 'bg-red-500 border-2 border-red-500 text-white'
    };
    return styles[variant as keyof typeof styles] || styles.default;
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {question}
        </h2>
      </div>

      {/* Choices */}
      <div className="grid gap-4 max-w-2xl mx-auto">
        {choix.map((choice, index) => {
          const variant = getChoiceVariant(choice, index);
          const isSelected = choice === currentAnswer;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => handleChoiceSelect(choice)}
                disabled={disabled}
                className={`
                  w-full p-4 rounded-xl transition-all duration-200 text-left
                  font-medium disabled:cursor-not-allowed
                  ${getChoiceStyles(variant)}
                  ${!disabled && variant === 'default' ? 'hover:scale-102' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? 'border-current' : 'border-gray-300'}
                  `}>
                    {isSelected && (
                      <div className={`
                        w-3 h-3 rounded-full
                        ${variant === 'primary' ? 'bg-white' : 'bg-current'}
                      `} />
                    )}
                  </div>
                  <span className="flex-1">{choice}</span>
                  {showValidation && choice === exercise.configuration.bonneReponse && (
                    <span className="text-xl">✅</span>
                  )}
                  {showValidation && choice === currentAnswer && choice !== exercise.configuration.bonneReponse && (
                    <span className="text-xl">❌</span>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <Card variant="elevated" padding="md" className="max-w-md mx-auto">
            {currentAnswer === exercise.configuration.bonneReponse ? (
              <div className="text-green-600">
                <span className="text-2xl">🎉</span>
                <p className="font-medium mt-2">Excellente réponse !</p>
              </div>
            ) : (
              <div className="text-orange-600">
                <span className="text-2xl">🤔</span>
                <p className="font-medium mt-2">Pas tout à fait...</p>
                <p className="text-sm mt-1">La bonne réponse était : {exercise.configuration.bonneReponse}</p>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 