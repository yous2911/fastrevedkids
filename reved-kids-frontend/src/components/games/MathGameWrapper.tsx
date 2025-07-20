import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard } from '../ui/AnimatedCard';
import { ProgressBar } from '../ui/ProgressBar';
import { SparkleElements, MagicElements, CelebrationElements } from '../ui/FloatingElements';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

// Import your existing game component
// import RoyaumeNombresMagiques from './RoyaumeNombresMagiques';

interface MathGameWrapperProps {
  children: React.ReactNode; // Your existing game component
  onGameComplete?: (score: number, timeSpent: number) => void;
  onGameSkip?: () => void;
  className?: string;
}

export const MathGameWrapper: React.FC<MathGameWrapperProps> = ({
  children,
  onGameComplete,
  onGameSkip,
  className = ''
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'complete' | 'celebration'>('intro');
  const [currentScore, setCurrentScore] = useState(0);
  const [gameProgress, setGameProgress] = useState(0);
  
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  useEffect(() => {
    // Start with magical intro
    playSound('sparkle');
    triggerHaptic('light');
    
    setTimeout(() => {
      setShowIntro(false);
      setGameState('playing');
    }, 3000);
  }, [playSound, triggerHaptic]);

  const handleGameComplete = (score: number, timeSpent: number) => {
    setCurrentScore(score);
    setGameState('complete');
    playSound('levelup');
    triggerHaptic('success');
    
    setTimeout(() => {
      setGameState('celebration');
    }, 2000);
    
    if (onGameComplete) {
      onGameComplete(score, timeSpent);
    }
  };

  if (showIntro) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden ${className}`}>
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
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex justify-center space-x-4"
            >
              <div className="text-center">
                <div className="text-2xl">✨</div>
                <div className="text-sm text-gray-500">Animations Magiques</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">🎵</div>
                <div className="text-sm text-gray-500">Sons Enchantés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">📱</div>
                <div className="text-sm text-gray-500">Retour Haptique</div>
              </div>
            </motion.div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  if (gameState === 'celebration') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden ${className}`}>
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
                  <div className="text-2xl font-bold text-green-800">{currentScore}</div>
                  <div className="text-sm text-green-600">Points Gagnés</div>
                </div>
                <div className="bg-blue-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-800">100%</div>
                  <div className="text-sm text-blue-600">Progression</div>
                </div>
              </div>
            </motion.div>
            
            <motion.button
              onClick={() => {
                setGameState('playing');
                setGameProgress(0);
                setCurrentScore(0);
              }}
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

  return (
    <div className={`relative ${className}`}>
      {/* Progress overlay */}
      <div className="fixed top-4 left-4 z-50">
        <AnimatedCard variant="progress" className="w-64">
          <div className="text-center mb-2">
            <h3 className="text-sm font-bold text-gray-700">Progression</h3>
          </div>
          <ProgressBar 
            progress={gameProgress} 
            variant="sparkle" 
            size="sm"
            showPercentage={true}
          />
        </AnimatedCard>
      </div>

      {/* Floating elements during gameplay */}
      <div className="fixed inset-0 pointer-events-none z-30">
        <SparkleElements />
      </div>

      {/* Your existing game component */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}; 