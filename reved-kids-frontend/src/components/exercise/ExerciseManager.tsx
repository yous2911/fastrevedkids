import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseCard } from './ExerciseCard';
import { ExercicePedagogique } from '../../types/api.types';
import { ProgressBar } from '../ui/ProgressBar';
import { AnimatedCard } from '../ui/AnimatedCard';
import { CelebrationElements } from '../ui/FloatingElements';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

interface ExerciseSession {
  id: string;
  title: string;
  description: string;
  exercises: ExercicePedagogique[];
  totalPoints: number;
  timeLimit?: number; // in minutes
}

interface ExerciseManagerProps {
  session: ExerciseSession;
  onSessionComplete: (sessionId: string, totalScore: number, timeSpent: number) => void;
  onSessionSkip?: () => void;
  className?: string;
}

interface ExerciseResult {
  exerciseId: string;
  score: number;
  timeSpent: number;
  isCorrect: boolean;
}

export const ExerciseManager: React.FC<ExerciseManagerProps> = ({
  session,
  onSessionComplete,
  onSessionSkip,
  className = ''
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  const currentExercise = session.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / session.exercises.length) * 100;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const correctAnswers = results.filter(result => result.isCorrect).length;

  useEffect(() => {
    if (isSessionComplete) {
      playSound('levelup');
      triggerHaptic('success');
      setShowCelebration(true);
      
      setTimeout(() => {
        const totalTimeSpent = (Date.now() - sessionStartTime) / 1000;
        onSessionComplete(session.id, totalScore, totalTimeSpent);
      }, 3000);
    }
  }, [isSessionComplete, session.id, totalScore, sessionStartTime, onSessionComplete, playSound, triggerHaptic]);

  const handleExerciseComplete = (exerciseId: string, score: number, timeSpent: number) => {
    const isCorrect = score > 0;
    const result: ExerciseResult = {
      exerciseId,
      score,
      timeSpent,
      isCorrect
    };

    setResults(prev => [...prev, result]);

    if (currentExerciseIndex < session.exercises.length - 1) {
      setTimeout(() => {
        setCurrentExerciseIndex(prev => prev + 1);
      }, 2000);
    } else {
      setTimeout(() => {
        setIsSessionComplete(true);
      }, 2000);
    }
  };

  const handleExerciseSkip = () => {
    if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handleSessionSkip = () => {
    if (onSessionSkip) {
      playSound('click');
      triggerHaptic('light');
      onSessionSkip();
    }
  };

  if (isSessionComplete) {
    return (
      <div className={`relative ${className}`}>
        <AnimatedCard variant="reward" className="max-w-2xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-6"
            >
              <span className="text-6xl">🎉</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-gray-800 mb-4"
            >
              Session Complete!
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 mb-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-800">{totalScore}</div>
                  <div className="text-sm text-green-600">Total Points</div>
                </div>
                <div className="bg-blue-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-800">{correctAnswers}/{session.exercises.length}</div>
                  <div className="text-sm text-blue-600">Correct Answers</div>
                </div>
              </div>
              
              <div className="bg-yellow-100 rounded-lg p-4">
                <div className="text-lg font-semibold text-yellow-800">
                  Accuracy: {((correctAnswers / session.exercises.length) * 100).toFixed(0)}%
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedCard>
        
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none">
            <CelebrationElements />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Session Header */}
      <AnimatedCard variant="default" className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{session.title}</h2>
            <p className="text-gray-600">{session.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Exercise</div>
            <div className="text-xl font-bold text-blue-600">
              {currentExerciseIndex + 1} / {session.exercises.length}
            </div>
          </div>
        </div>
        
        <ProgressBar
          progress={progress}
          variant="sparkle"
          size="lg"
          showPercentage={false}
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Total Score: <span className="font-bold text-green-600">{totalScore}</span>
          </div>
          {onSessionSkip && (
            <button
              onClick={handleSessionSkip}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Skip Session
            </button>
          )}
        </div>
      </AnimatedCard>

      {/* Current Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <ExerciseCard
            exercise={currentExercise}
            onClick={() => handleExerciseComplete(currentExercise.id.toString(), 100, 0)}
            disabled={false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}; 