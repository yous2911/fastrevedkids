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
  const { question, choix = [], bonneReponse } = exercise.configuration;

  const handleChoiceSelect = useCallback((choice: string) => {
    if (disabled) return;
    onAnswerChange(choice);
  }, [disabled, onAnswerChange]);

  const getChoiceVariant = (choice: string) => {
    if (showValidation) {
      if (choice === bonneReponse) {
        return 'success'; // Correct answer - always green when validation shown
      } else if (choice === currentAnswer && choice !== bonneReponse) {
        return 'danger'; // Wrong selected answer - red
      }
    }
    
    if (choice === currentAnswer) {
      return 'primary'; // Selected but not validated yet
    }
    
    return 'default';
  };

  const getChoiceStyles = (variant: string) => {
    const baseStyles = "w-full p-4 rounded-xl transition-all duration-200 text-left font-medium disabled:cursor-not-allowed border-2";
    
    const variantStyles = {
      default: 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-102 text-gray-800',
      primary: 'bg-blue-500 border-blue-500 text-white shadow-lg scale-105',
      success: 'bg-green-500 border-green-500 text-white shadow-lg scale-105',
      danger: 'bg-red-500 border-red-500 text-white shadow-lg scale-105'
    };
    
    return `${baseStyles} ${variantStyles[variant as keyof typeof variantStyles] || variantStyles.default}`;
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-relaxed">
          {question}
        </h2>
        {exercise.configuration.concept && (
          <p className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg inline-block">
            📚 {exercise.configuration.concept}
          </p>
        )}
      </div>

      {/* Choices */}
      <div className="grid gap-4 max-w-2xl mx-auto">
        {choix.map((choice, index) => {
          const variant = getChoiceVariant(choice);
          const isSelected = choice === currentAnswer;
          const isCorrect = choice === bonneReponse;
          const isWrong = showValidation && isSelected && !isCorrect;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!disabled ? { y: -2 } : {}}
            >
              <button
                onClick={() => handleChoiceSelect(choice)}
                disabled={disabled}
                className={getChoiceStyles(variant)}
              >
                <div className="flex items-center justify-between">
                  {/* Choice indicator */}
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'border-current' : 'border-gray-300'}
                    `}>
                      {isSelected && (
                        <div className={`
                          w-3 h-3 rounded-full
                          ${variant === 'primary' ? 'bg-white' : 'bg-current'}
                        `} />
                      )}
                    </div>
                    
                    {/* Choice letter */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${isSelected 
                        ? 'bg-white bg-opacity-20 text-current' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    
                    {/* Choice text */}
                    <span className="flex-1 text-left">{choice}</span>
                  </div>

                  {/* Validation icons */}
                  {showValidation && (
                    <div className="ml-2 text-2xl">
                      {isCorrect ? (
                        <span className="text-current">✅</span>
                      ) : isWrong ? (
                        <span className="text-current">❌</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Feedback Section */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-8"
        >
          <Card className="max-w-md mx-auto p-6">
            {currentAnswer === bonneReponse ? (
              <div className="text-green-600">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-bold text-lg mb-2">Excellente réponse !</h3>
                <p className="text-sm text-gray-600">
                  {exercise.configuration.successMessage || 'Tu as trouvé la bonne réponse du premier coup !'}
                </p>
              </div>
            ) : (
              <div className="text-orange-600">
                <div className="text-4xl mb-3">🤔</div>
                <h3 className="font-bold text-lg mb-2">Pas tout à fait...</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Ne t'en fais pas, c'est en essayant qu'on apprend !
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <strong>La bonne réponse était :</strong> {bonneReponse}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Progress indicator */}
      {!showValidation && currentAnswer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full text-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Réponse sélectionnée - Clique sur "Valider" pour continuer
          </div>
        </motion.div>
      )}
    </div>
  );
}; 