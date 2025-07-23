import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ExercicePedagogique } from '../../../types/api.types';
import { Card } from '../../ui/Card';

export interface ExerciseCalculProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

export const ExerciseCalcul: React.FC<ExerciseCalculProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const { question, operation, resultat, donnees } = exercise.configuration;
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.toString() || '');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Convert to number if it's a valid number, otherwise keep as string
    const numValue = parseFloat(value);
    onAnswerChange(isNaN(numValue) ? value : numValue);
  }, [onAnswerChange]);

  const getValidationStyle = () => {
    if (!showValidation) return '';
    
    const userAnswer = parseFloat(currentAnswer?.toString() || '');
    const correctAnswer = resultat || donnees?.resultat;
    
    if (!isNaN(userAnswer) && userAnswer === correctAnswer) {
      return 'border-green-500 bg-green-50';
    } else {
      return 'border-red-500 bg-red-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-relaxed">
          {question}
        </h2>
        {operation && (
          <div className="text-3xl font-mono bg-blue-50 p-4 rounded-lg inline-block">
            {operation}
          </div>
        )}
      </div>

      {/* Answer Input */}
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="Tape ta réponse ici..."
            className={`
              w-full text-center text-2xl font-bold p-4 rounded-xl border-2 
              transition-all duration-200 disabled:cursor-not-allowed
              ${getValidationStyle()}
              ${!showValidation ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : ''}
            `}
          />
          
          {showValidation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-2xl">
              {parseFloat(currentAnswer?.toString() || '') === (resultat || donnees?.resultat) ? '✅' : '❌'}
            </div>
          )}
        </motion.div>
      </div>

      {/* Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-8"
        >
          <Card className="max-w-md mx-auto p-6">
            {parseFloat(currentAnswer?.toString() || '') === (resultat || donnees?.resultat) ? (
              <div className="text-green-600">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-bold text-lg mb-2">Bravo !</h3>
                <p className="text-sm text-gray-600">
                  Tu as trouvé la bonne réponse : {resultat || donnees?.resultat}
                </p>
              </div>
            ) : (
              <div className="text-orange-600">
                <div className="text-4xl mb-3">🤔</div>
                <h3 className="font-bold text-lg mb-2">Pas tout à fait...</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Continue tes efforts, tu vas y arriver !
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <strong>La bonne réponse était :</strong> {resultat || donnees?.resultat}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 