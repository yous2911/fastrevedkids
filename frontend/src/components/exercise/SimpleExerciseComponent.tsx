import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Exercise } from '../../services/fastrevkids-api.service';

interface SimpleExerciseComponentProps {
  exercise: Exercise;
  onComplete: (result: any) => void;
  onExit: () => void;
}

export const SimpleExerciseComponent: React.FC<SimpleExerciseComponentProps> = ({
  exercise,
  onComplete,
  onExit
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Use exercise properties directly from the fastrevkids-api.service Exercise type
  const question = exercise.question;
  const correctAnswer = exercise.correctAnswer;

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    setAttempts(prev => prev + 1);
    
    // Check if answer is correct
    const isAnswerCorrect = checkAnswer(userAnswer.trim(), correctAnswer);
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    if (isAnswerCorrect) {
      // Show success feedback for 2 seconds, then complete
      setTimeout(() => {
        onComplete({
          exerciseId: exercise.id,
          correct: true,
          attempts: attempts + 1,
          xpEarned: exercise.xpReward
        });
      }, 2000);
    } else {
      // Clear feedback after 3 seconds for retry
      setTimeout(() => {
        setShowFeedback(false);
        setIsCorrect(null);
        setUserAnswer('');
      }, 3000);
    }
  };

  const checkAnswer = (userAnswer: string, correctAnswer: any): boolean => {
    // Handle different answer formats
    if (typeof correctAnswer === 'number') {
      return Number(userAnswer) === correctAnswer;
    }
    if (typeof correctAnswer === 'string') {
      return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    }
    return userAnswer === correctAnswer;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{question}</h2>
        {/* Optional explanation could be added here */}
      </motion.div>

      {/* Answer Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center space-y-4"
      >
        <div className="w-full max-w-md">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Votre réponse..."
            className="w-full px-4 py-3 text-xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            disabled={showFeedback}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!userAnswer.trim() || showFeedback}
          variant="primary"
          size="lg"
        >
          Valider
        </Button>
      </motion.div>

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            {isCorrect ? (
              <div className="bg-green-100 border-2 border-green-400 rounded-lg p-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">Correct!</h3>
                <p className="text-green-700">Félicitations! Vous avez trouvé la bonne réponse!</p>
              </div>
            ) : (
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6">
                <div className="text-6xl mb-4">😅</div>
                <h3 className="text-2xl font-bold text-red-800 mb-2">Incorrect</h3>
                <p className="text-red-700">Essayez encore! La bonne réponse était: {correctAnswer}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attempts Counter */}
      {attempts > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-600"
        >
          Tentatives: {attempts}
        </motion.div>
      )}
    </div>
  );
}; 