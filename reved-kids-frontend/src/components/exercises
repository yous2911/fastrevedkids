import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard } from '../ui/AnimatedCard';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'multiple-choice' | 'drag-drop' | 'fill-blank' | 'matching' | 'sequence';
  difficulty: 'easy' | 'medium' | 'hard';
  subject: 'math' | 'reading' | 'science' | 'art' | 'music';
  content: any;
  points: number;
  timeLimit?: number;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onComplete: (exerciseId: string, score: number, timeSpent: number) => void;
  onSkip?: () => void;
  className?: string;
}

const difficultyColors = {
  easy: 'bg-green-100 border-green-300 text-green-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  hard: 'bg-red-100 border-red-300 text-red-800'
};

const subjectIcons = {
  math: '🔢',
  reading: '📚',
  science: '🔬',
  art: '🎨',
  music: '🎵'
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const correct = answer === exercise.content.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      playSound('correct');
      triggerHaptic('success');
    } else {
      playSound('incorrect');
      triggerHaptic('error');
    }

    const timeSpent = (Date.now() - startTime) / 1000;
    const score = correct ? exercise.points : 0;

    setTimeout(() => {
      onComplete(exercise.id, score, timeSpent);
    }, 1500);
  };

  const handleSkip = () => {
    if (onSkip) {
      playSound('click');
      triggerHaptic('light');
      onSkip();
    }
  };

  return (
    <AnimatedCard
      variant="exercise"
      className={`max-w-2xl mx-auto ${className}`}
      delay={0.2}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{subjectIcons[exercise.subject]}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{exercise.title}</h3>
            <p className="text-sm text-gray-600">{exercise.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColors[exercise.difficulty]}`}>
            {exercise.difficulty}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {exercise.points} pts
          </span>
        </div>
      </div>

      {/* Question Content */}
      <div className="mb-6">
        <div className="bg-white/50 rounded-lg p-4 border border-blue-200">
          <p className="text-lg text-gray-800 mb-4">{exercise.content.question}</p>
          
          {exercise.content.image && (
            <div className="mb-4">
              <img 
                src={exercise.content.image} 
                alt="Exercise visual" 
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {exercise.content.options?.map((option: string, index: number) => (
          <motion.button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            disabled={isAnswered}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
              isAnswered
                ? option === exercise.content.correctAnswer
                  ? 'bg-green-100 border-green-400 text-green-800'
                  : option === selectedAnswer
                  ? 'bg-red-100 border-red-400 text-red-800'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
                : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50'
            }`}
            whileHover={!isAnswered ? { scale: 1.02 } : {}}
            whileTap={!isAnswered ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-lg">{option}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mt-6 p-4 rounded-lg ${
              isCorrect 
                ? 'bg-green-100 border border-green-300' 
                : 'bg-red-100 border border-red-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {isCorrect ? '🎉' : '💡'}
              </span>
              <div>
                <h4 className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </h4>
                <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect 
                    ? `Great job! You earned ${exercise.points} points!`
                    : `The correct answer was: ${exercise.content.correctAnswer}`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Button */}
      {onSkip && !isAnswered && (
        <div className="mt-6 text-center">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip this exercise
          </button>
        </div>
      )}
    </AnimatedCard>
  );
}; 