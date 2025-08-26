import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

interface MentalMathExerciseProps {
  difficulty: number;
  onComplete: (correct: boolean, timeSpent: number) => void;
}

const MentalMathExercise: React.FC<MentalMathExerciseProps> = ({ difficulty, onComplete }) => {
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const generateProblem = () => {
    let num1: number, num2: number, answer: number;
    
    switch (difficulty) {
      case 0: // BLACKOUT
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        break;
      case 1: // HARD
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        break;
      case 2: // DIFFICULT
        num1 = Math.floor(Math.random() * 100) + 1;
        num2 = Math.floor(Math.random() * 100) + 1;
        break;
      case 3: // GOOD
        num1 = Math.floor(Math.random() * 200) + 1;
        num2 = Math.floor(Math.random() * 200) + 1;
        break;
      case 4: // EASY
        num1 = Math.floor(Math.random() * 500) + 1;
        num2 = Math.floor(Math.random() * 500) + 1;
        break;
      default: // PERFECT
        num1 = Math.floor(Math.random() * 1000) + 1;
        num2 = Math.floor(Math.random() * 1000) + 1;
    }

    answer = num1 + num2;
    const wrongAnswer1 = answer + Math.floor(Math.random() * 10) + 1;
    const wrongAnswer2 = answer - Math.floor(Math.random() * 10) + 1;
    const wrongAnswer3 = answer + Math.floor(Math.random() * 20) - 10;

    const options = [answer, wrongAnswer1, wrongAnswer2, wrongAnswer3]
      .sort(() => Math.random() - 0.5);

    setCurrentProblem({
      question: `${num1} + ${num2} = ?`,
      answer,
      options
    });
    setUserAnswer(null);
    setShowResult(false);
    setStartTime(Date.now());
  };

  useEffect(() => {
    generateProblem();
  }, [difficulty]);

  const handleAnswerSelect = (selectedAnswer: number) => {
    if (showResult) return;
    
    setUserAnswer(selectedAnswer);
    const correct = selectedAnswer === currentProblem?.answer;
    setIsCorrect(correct);
    setShowResult(true);

    setTimeout(() => {
      const timeSpent = (Date.now() - startTime) / 1000;
      onComplete(correct, timeSpent);
      generateProblem();
    }, 2000);
  };

  if (!currentProblem) return null;

  return (
    <div className="space-y-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-3xl font-bold text-gray-800 mb-4">
          Calcul Mental
        </h3>
        <div className="text-sm text-gray-600 mb-6">
          Niveau: {difficulty === 0 ? 'BLACKOUT' : difficulty === 1 ? 'HARD' : difficulty === 2 ? 'DIFFICULT' : difficulty === 3 ? 'GOOD' : difficulty === 4 ? 'EASY' : 'PERFECT'}
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            SuperMemo: {difficulty === 0 ? 'BLACKOUT' : difficulty === 1 ? 'HARD' : difficulty === 2 ? 'DIFFICULT' : difficulty === 3 ? 'GOOD' : difficulty === 4 ? 'EASY' : 'PERFECT'}
          </span>
        </div>
      </motion.div>

      {/* Question */}
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-2xl shadow-xl text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="text-6xl font-bold mb-4">
          {currentProblem.question}
        </div>
        <div className="text-2xl opacity-90">
          Choisis la bonne réponse !
        </div>
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <AnimatePresence>
          {currentProblem.options.map((option, index) => (
            <Button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              variant={
                showResult
                  ? option === currentProblem.answer
                    ? 'success'
                    : option === userAnswer && option !== currentProblem.answer
                    ? 'danger'
                    : 'secondary'
                  : 'warning'
              }
              size="lg"
              className={`
                p-6 text-2xl font-bold
                ${showResult
                  ? option === currentProblem.answer
                    ? 'scale-110'
                    : option === userAnswer && option !== currentProblem.answer
                    ? 'scale-95'
                    : ''
                  : ''
                }
              `}
            >
              {option}
            </Button>
          ))}
        </AnimatePresence>
      </div>

      {/* Résultat */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className={`text-4xl mb-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrect ? '🎉 BRAVO !' : '❌ Essaie encore !'}
            </div>
            <div className="text-lg text-gray-600">
              {isCorrect 
                ? `Temps: ${((Date.now() - startTime) / 1000).toFixed(1)}s`
                : `La bonne réponse était: ${currentProblem.answer}`
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentalMathExercise; 