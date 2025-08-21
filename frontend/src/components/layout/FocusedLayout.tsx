import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKioskMode } from '../../hooks/useKioskMode';
import { useApp } from '../../context/AppContext';

interface FocusedLayoutProps {
  children: React.ReactNode;
  showProgress?: boolean;
  allowPause?: boolean;
  sessionDuration?: number; // in minutes
  onSessionEnd?: () => void;
}

export const FocusedLayout: React.FC<FocusedLayoutProps> = ({
  children,
  showProgress = true,
  allowPause = false,
  sessionDuration = 30,
  onSessionEnd
}) => {
  const { isActive, isFullscreen } = useKioskMode();
  const { state } = useApp();
  
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  const getSessionProgress = useCallback(() => {
    if (!sessionDuration) return 0;
    const elapsed = (Date.now() - sessionStartTime) / 1000 / 60; // minutes
    return Math.min((elapsed / sessionDuration) * 100, 100);
  }, [sessionDuration, sessionStartTime]);

  const getTimeRemaining = useCallback(() => {
    if (!sessionDuration) return '';
    const elapsed = (Date.now() - sessionStartTime) / 1000 / 60; // minutes
    const remaining = Math.max(sessionDuration - elapsed, 0);
    const minutes = Math.floor(remaining);
    const seconds = Math.floor((remaining - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [sessionDuration, sessionStartTime]);

  const handlePause = useCallback(() => {
    if (allowPause) {
      setShowPauseDialog(true);
    }
  }, [allowPause]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Check for session end - moved before conditional return
  useEffect(() => {
    if (sessionDuration && getSessionProgress() >= 100) {
      onSessionEnd?.();
    }
  }, [sessionDuration, onSessionEnd, getSessionProgress]);

  // Only show kiosk mode UI when kiosk mode is active
  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 h-15 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 z-20">
        <div className="flex items-center justify-between px-6 py-3">
          
          {/* Left: Session Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold text-gray-800">Mode Concentration</span>
            </div>
            
            {showProgress && sessionDuration && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  Progression: {Math.round(getSessionProgress())}%
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getSessionProgress()}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {getTimeRemaining()}
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            
            {/* Pause Button */}
            {allowPause && (
              <motion.button
                onClick={handlePause}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isPaused}
              >
                <span className="text-lg">⏸️</span>
              </motion.button>
            )}

            {/* Sound Toggle */}
            <motion.button
              onClick={() => {}}
              className={`
                p-2 rounded-lg transition-colors
                ${state.soundEnabled 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{state.soundEnabled ? '🔊' : '🔇'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 h-[calc(100vh-60px)] overflow-hidden">
        
        {/* Distraction-Free Zone */}
        <div className="h-full w-full flex items-center justify-center p-4">
          <div className="w-full max-w-6xl mx-auto h-full">
            
            {/* Content Container with Focus Effects */}
            <motion.div
              className="h-full bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              
              {/* Ambient Border Animation */}
              <div className="absolute inset-0 rounded-2xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-20 animate-pulse" />
                <div className="absolute inset-[2px] rounded-2xl bg-white" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 h-full overflow-auto">
                {isPaused ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        className="text-8xl mb-6"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ⏸️
                      </motion.div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Session en Pause
                      </h2>
                      <p className="text-gray-600 mb-8">
                        Prends le temps dont tu as besoin, puis continue quand tu es prêt !
                      </p>
                      <motion.button
                        onClick={handleResume}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Continuer l'apprentissage
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    {children}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ambient Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          
          {/* Floating Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                delay: i * 0.5
              }}
              style={{
                left: `${10 + (i * 7)}%`,
                top: `${20 + (i * 5)}%`
              } as React.CSSProperties}
            />
          ))}

          {/* Gentle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50" />
        </div>
      </div>

      {/* Pause Dialog */}
      <AnimatePresence>
        {showPauseDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">⏸️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Prendre une Pause ?
              </h3>
              <p className="text-gray-600 mb-6">
                Tu peux faire une pause si tu en as besoin. Ton progrès sera sauvegardé.
              </p>
              
              <div className="flex gap-4">
                <motion.button
                  onClick={() => setShowPauseDialog(false)}
                  className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continuer
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsPaused(true);
                    setShowPauseDialog(false);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Faire une Pause
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session End Warning */}
      <AnimatePresence>
        {sessionDuration && getSessionProgress() > 90 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-orange-500 text-white px-6 py-4 rounded-xl shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <div className="font-bold">Session bientôt terminée</div>
                <div className="text-sm opacity-90">
                  Plus que {getTimeRemaining()} !
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 