import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExercicePedagogique } from '../../../types/api.types';
import { ChoiceOption } from '../../../types/exercise.types';
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
  const { question, choix = [], bonneReponse } = exercise.configuration;

  // Convert string array to ChoiceOption array if needed
  const choices: ChoiceOption[] = choix.map((choice, index) => {
    if (typeof choice === 'string') {
      return {
        id: `choice-${index}`,
        text: choice,
        value: choice,
        correct: choice === bonneReponse
      };
    }
    return choice as ChoiceOption;
  });

  const handleChoiceSelect = useCallback((choice: ChoiceOption) => {
    if (disabled) return;
    onAnswerChange(choice.value);
  }, [disabled, onAnswerChange]);

  const getChoiceVariant = (choice: ChoiceOption) => {
    if (showValidation) {
      if (choice.correct || choice.value === bonneReponse) {
        return 'success'; // Correct answer - always green when validation shown
      } else if (choice.value === currentAnswer && !choice.correct) {
        return 'danger'; // Wrong selected answer - red
      }
    }
    
    if (choice.value === currentAnswer) {
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
        {choices.map((choice, index) => {
          const variant = getChoiceVariant(choice);
          const isSelected = choice.value === currentAnswer;

          return (
            <motion.div
              key={choice.id}
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
                  ${!disabled && variant === 'default' ? 'hover:scale-105 hover:shadow-md' : ''}
                  ${isSelected ? 'ring-2 ring-blue-300' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1">{choice.text}</span>
                  {showValidation && (
                    <div className="ml-2">
                      {choice.correct || choice.value === bonneReponse ? (
                        <span className="text-white">✓</span>
                      ) : choice.value === currentAnswer ? (
                        <span className="text-white">✗</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}; 