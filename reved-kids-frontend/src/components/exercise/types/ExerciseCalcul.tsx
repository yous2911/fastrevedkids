import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExercicePedagogique } from '../../../types/api.types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

export interface ExerciseCalculProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: number) => void;
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
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.toString() || '');
  const { operation, question } = exercise.configuration;

  const handleInputChange = useCallback((value: string) => {
    // Only allow numbers and basic math characters
    const cleanValue = value.replace(/[^0-9\-+.,]/g, '');
    setInputValue(cleanValue);
    
    const numericValue = parseFloat(cleanValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      onAnswerChange(numericValue);
    }
  }, [onAnswerChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
      // Trigger validation if auto-submit is enabled
    }
  }, [disabled]);

  // Number pad for younger students
  const handleNumberClick = useCallback((num: string) => {
    if (disabled) return;
    
    if (num === 'C') {
      setInputValue('');
      onAnswerChange(0);
    } else if (num === '⌫') {
      const newValue = inputValue.slice(0, -1);
      setInputValue(newValue);
      const numericValue = parseFloat(newValue.replace(',', '.'));
      onAnswerChange(isNaN(numericValue) ? 0 : numericValue);
    } else {
      const newValue = inputValue + num;
      handleInputChange(newValue);
    }
  }, [disabled, inputValue, handleInputChange, onAnswerChange]);

  const getValidationColor = () => {
    if (!showValidation) return '';
    const isCorrect = Number(currentAnswer) === Number(exercise.configuration.resultat);
    return isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  };

  const numberPadButtons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '⌫']
  ];

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {question || 'Résous cette opération'}
        </h2>
        
        {operation && (
          <div className="text-4xl font-mono font-bold text-blue-600 mb-6">
            {operation} = ?
          </div>
        )}
      </div>

      {/* Answer Input */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Ta réponse..."
            className={`
              w-full text-center text-3xl font-bold py-4 px-6 rounded-xl
              border-2 transition-all duration-200 focus:outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${getValidationColor() || 'border-gray-300 focus:border-blue-500'}
            `}
          />
          
          {showValidation && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
              {Number(currentAnswer) === Number(exercise.configuration.resultat) ? '✅' : '❌'}
            </div>
          )}
        </div>
      </div>

      {/* Number Pad */}
      <div className="max-w-xs mx-auto">
        <Card variant="outlined" padding="md">
          <div className="grid grid-cols-3 gap-3">
            {numberPadButtons.flat().map((btn, index) => (
              <Button
                key={index}
                variant={btn === 'C' ? 'danger' : btn === '⌫' ? 'warning' : 'secondary'}
                size="lg"
                onClick={() => handleNumberClick(btn)}
                disabled={disabled}
                className="aspect-square text-xl font-bold"
              >
                {btn}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <Card variant="elevated" padding="md" className="max-w-md mx-auto">
            {Number(currentAnswer) === Number(exercise.configuration.resultat) ? (
              <div className="text-green-600">
                <span className="text-2xl">🎯</span>
                <p className="font-medium mt-2">Parfait ! Tu as trouvé la bonne réponse !</p>
              </div>
            ) : (
              <div className="text-orange-600">
                <span className="text-2xl">🤔</span>
                <p className="font-medium mt-2">Pas tout à fait...</p>
                <p className="text-sm mt-1">
                  La bonne réponse était : <strong>{exercise.configuration.resultat}</strong>
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 