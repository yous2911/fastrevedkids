import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ExercicePedagogique } from '../../../types/api.types';
import { Card } from '../../ui/Card';

export interface ExerciseTextLibreProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: any) => void;
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
  const { question, bonneReponse, targetWord, concept } = exercise.configuration;
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.toString() || '');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onAnswerChange(value);
  }, [onAnswerChange]);

  const isAnswerCorrect = () => {
    if (!currentAnswer || !bonneReponse) return false;
    
    const userAnswer = currentAnswer.toString().toLowerCase().trim();
    const correctAnswer = bonneReponse.toString().toLowerCase().trim();
    const targetAnswer = targetWord?.toLowerCase().trim();
    
    return userAnswer === correctAnswer || 
           (targetAnswer && userAnswer === targetAnswer);
  };

  const getValidationStyle = () => {
    if (!showValidation) return '';
    
    if (isAnswerCorrect()) {
      return 'border-green-500 bg-green-50';
    } else {
      return 'border-red-500 bg-red-50';
    }
  };

  const getInputType = () => {
    // Determine if we need a textarea for longer responses
    const expectedLength = bonneReponse?.toString().length || 0;
    return expectedLength > 50 ? 'textarea' : 'input';
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-relaxed">
          {question}
        </h2>
        {concept && (
          <p className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg inline-block">
            📚 {concept}
          </p>
        )}
      </div>

      {/* Answer Input */}
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {getInputType() === 'textarea' ? (
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              disabled={disabled}
              placeholder="Écris ta réponse ici..."
              rows={4}
              className={`
                w-full p-4 rounded-xl border-2 resize-none
                transition-all duration-200 disabled:cursor-not-allowed
                ${getValidationStyle()}
                ${!showValidation ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : ''}
              `}
            />
          ) : (
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              disabled={disabled}
              placeholder="Écris ta réponse ici..."
              className={`
                w-full text-center text-xl font-medium p-4 rounded-xl border-2 
                transition-all duration-200 disabled:cursor-not-allowed
                ${getValidationStyle()}
                ${!showValidation ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : ''}
              `}
            />
          )}
          
          {showValidation && (
            <div className="absolute right-3 top-4 text-2xl">
              {isAnswerCorrect() ? '✅' : '❌'}
            </div>
          )}
        </motion.div>
        
        {/* Character count for longer responses */}
        {getInputType() === 'textarea' && (
          <div className="text-right text-sm text-gray-500 mt-2">
            {inputValue.length} caractères
          </div>
        )}
      </div>

      {/* Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-8"
        >
          <Card className="max-w-md mx-auto p-6">
            {isAnswerCorrect() ? (
              <div className="text-green-600">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-bold text-lg mb-2">Excellente réponse !</h3>
                <p className="text-sm text-gray-600">
                  Tu as écrit la bonne réponse !
                </p>
              </div>
            ) : (
              <div className="text-orange-600">
                <div className="text-4xl mb-3">🤔</div>
                <h3 className="font-bold text-lg mb-2">Pas tout à fait...</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Continue, tu es sur la bonne voie !
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <strong>Une bonne réponse était :</strong> {bonneReponse || targetWord}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Hint for word length */}
      {!showValidation && targetWord && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full text-sm">
            <span>💡</span>
            Le mot fait {targetWord.length} lettres
          </div>
        </div>
      )}
    </div>
  );
}; 