import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard } from '../ui/AnimatedCard';
import { ProgressBar } from '../ui/ProgressBar';
import { SparkleElements, MagicElements, CelebrationElements } from '../ui/FloatingElements';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

// Enhanced version of your CP math game with integrated animations
export const EnhancedMathGame: React.FC = () => {
  // Game state
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'complete' | 'celebration'>('intro');
  const [showMagicEffects, setShowMagicEffects] = useState(false);
  
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  // Sample CP math exercises (you can replace with your actual exercises)
  const exercises = [
    {
      id: 1,
      question: "Combien y a-t-il d'objets ?",
      image: "🍎🍎🍎",
      answer: 3,
      options: [2, 3, 4, 5],
      level: 1
    },
    {
      id: 2,
      question: "2 + 3 = ?",
      image: "🔢",
      answer: 5,
      options: [4, 5, 6, 7],
      level: 1
    },
    {
      id: 3,
      question: "Compte les étoiles",
      image: "⭐⭐⭐⭐⭐",
      answer: 5,
      options: [4, 5, 6, 7],
      level: 1
    }
  ];

  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (gameState === 'intro') {
      setTimeout(() => {
        setGameState('playing');
        playSound('sparkle');
        triggerHaptic('light');
      }, 3000);
    }
  }, [gameState, playSound, triggerHaptic]);

  const handleAnswerSelect = (answer: number) => {
    setSelectedAnswer(answer);
    const correct = answer === exercises[currentExercise].answer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      playSound('correct');
      triggerHaptic('success');
      setScore(prev => prev + 10);
      setShowMagicEffects(true);
      
      setTimeout(() => {
        setShowMagicEffects(false);
        if (currentExercise < exercises.length - 1) {
          setCurrentExercise(prev => prev + 1);
          setProgress(((currentExercise + 2) / exercises.length) * 100);
        } else {
          setGameState('complete');
          playSound('levelup');
          triggerHaptic('success');
        }
        setShowFeedback(false);
        setSelectedAnswer(null);
      }, 2000);
    } else {
      playSound('incorrect');
      triggerHaptic('error');
      
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  const resetGame = () => {
    setCurrentExercise(0);
    setScore(0);
    setProgress(0);
    setGameState('playing');
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowMagicEffects(false);
  };

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <SparkleElements />
          <MagicElements />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <AnimatedCard variant="sparkle" className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-6"
            >
              <span className="text-8xl">🔢</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-bold text-gray-800 mb-4"
            >
              Le Royaume des Nombres Magiques
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-lg text-gray-600 mb-6"
            >
              Prépare-toi à rencontrer des créatures magiques et à résoudre des défis mathématiques extraordinaires !
            </motion.p>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  if (gameState === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <CelebrationElements />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <AnimatedCard variant="reward" className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-6"
            >
              <span className="text-8xl">🎉</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-800 mb-4"
            >
              Félicitations !
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4 mb-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-800">{score}</div>
                  <div className="text-sm text-green-600">Points Gagnés</div>
                </div>
                <div className="bg-blue-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-800">100%</div>
                  <div className="text-sm text-blue-600">Progression</div>
                </div>
              </div>
            </motion.div>
            
            <motion.button
              onClick={resetGame}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              🎮 Rejouer
            </motion.button>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  const exercise = exercises[currentExercise];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <SparkleElements />
        {showMagicEffects && <MagicElements />}
      </div>

      {/* Progress bar */}
      <div className="fixed top-4 left-4 z-50">
        <AnimatedCard variant="progress" className="w-64">
          <div className="text-center mb-2">
            <h3 className="text-sm font-bold text-gray-700">Progression</h3>
          </div>
          <ProgressBar 
            progress={progress} 
            variant="sparkle" 
            size="sm"
            showPercentage={true}
          />
        </AnimatedCard>
      </div>

      {/* Score display */}
      <div className="fixed top-4 right-4 z-50">
        <AnimatedCard variant="reward" className="w-32 text-center">
          <div className="text-2xl font-bold text-yellow-600">{score}</div>
          <div className="text-sm text-gray-600">Points</div>
        </AnimatedCard>
      </div>

      {/* Main game area */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <AnimatedCard variant="exercise" className="max-w-2xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Question {currentExercise + 1} sur {exercises.length}
            </h2>
            <p className="text-lg text-gray-600">{exercise.question}</p>
          </div>

          {/* Exercise content */}
          <div className="bg-white/50 rounded-lg p-6 mb-6 text-center">
            <div className="text-4xl mb-4">{exercise.image}</div>
          </div>

          {/* Answer options */}
          <div className="grid grid-cols-2 gap-4">
            {exercise.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={selectedAnswer !== null}
                className={`p-6 rounded-xl border-2 text-xl font-bold transition-all ${
                  selectedAnswer === option
                    ? isCorrect
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-red-100 border-red-400 text-red-800'
                    : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
                whileHover={selectedAnswer === null ? { scale: 1.05 } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
              >
                {option}
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mt-6 p-4 rounded-lg text-center ${
                  isCorrect 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-red-100 border border-red-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl">
                    {isCorrect ? '🎉' : '💡'}
                  </span>
                  <div>
                    <h4 className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                      {isCorrect ? 'Correct!' : 'Pas tout à fait'}
                    </h4>
                    <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect 
                        ? 'Excellent travail !'
                        : `La bonne réponse était ${exercise.answer}`
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatedCard>
      </div>
    </div>
  );
}; 