import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useKioskMode } from '../hooks/useKioskMode';
import { useSound } from '../hooks/useSound';
import { useHaptic } from '../hooks/useHaptic';

interface KioskModeContextType {
  isActive: boolean;
  isFullscreen: boolean;
  wakeLockActive: boolean;
  activateKioskMode: () => Promise<void>;
  deactivateKioskMode: () => Promise<void>;
  isSupported: any;
}

const KioskModeContext = createContext<KioskModeContextType | undefined>(undefined);

interface KioskModeProviderProps {
  children: React.ReactNode;
  autoActivate?: boolean;
  exitCode?: string; // Secret code to exit kiosk mode
  sessionTimeout?: number; // Auto-exit after inactivity (ms)
}

export const KioskModeProvider: React.FC<KioskModeProviderProps> = ({
  children,
  autoActivate = false,
  exitCode = 'PARENT123',
  sessionTimeout = 30 * 60 * 1000 // 30 minutes
}) => {
  const kioskMode = useKioskMode({
    enableFullscreen: true,
    preventNavigation: true,
    disableContextMenu: true,
    preventScreenSaver: true,
    muteSystemNotifications: true,
    blockF11Key: true,
    hideSystemUI: true,
    preventZoom: true
  });

  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitCodeInput, setExitCodeInput] = useState('');
  const [exitAttempts, setExitAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Auto-activate on mount if enabled
  useEffect(() => {
    if (autoActivate && !kioskMode.isActive) {
      const timer = setTimeout(() => {
        kioskMode.activateKioskMode();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoActivate, kioskMode]);

  // Session timeout handling
  useEffect(() => {
    if (!kioskMode.isActive || !sessionTimeout) return;

    const checkTimeout = () => {
      const timeSinceLastActivity = Date.now() - kioskMode.lastActivity;
      if (timeSinceLastActivity > sessionTimeout) {
        kioskMode.deactivateKioskMode();
        playSound('error');
      }
    };

    const interval = setInterval(checkTimeout, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [kioskMode.isActive, sessionTimeout, kioskMode.lastActivity]);

  // Handle exit code sequence (Konami-style)
  useEffect(() => {
    if (!kioskMode.isActive) return;

    let sequence = '';
    let sequenceTimeout: NodeJS.Timeout;

    const handleKeySequence = (e: KeyboardEvent) => {
      // Special exit sequence: Ctrl + Shift + X three times quickly
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        setExitAttempts(prev => prev + 1);
        
        if (exitAttempts >= 2) {
          setShowExitDialog(true);
          setExitAttempts(0);
          playSound('click');
          triggerHaptic('light');
        }

        // Reset attempts after 3 seconds
        setTimeout(() => setExitAttempts(0), 3000);
        return;
      }

      // Build exit code sequence
      if (e.key.length === 1) {
        sequence += e.key.toUpperCase();
        
        clearTimeout(sequenceTimeout);
        sequenceTimeout = setTimeout(() => {
          sequence = '';
        }, 2000);

        // Check if sequence matches exit code
        if (sequence.includes(exitCode)) {
          setShowExitDialog(true);
          sequence = '';
          playSound('click');
          triggerHaptic('medium');
        }
      }
    };

    document.addEventListener('keydown', handleKeySequence, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeySequence, { capture: true });
      clearTimeout(sequenceTimeout);
    };
  }, [kioskMode.isActive, exitCode, exitAttempts]);

  // Handle exit dialog submission
  const handleExitSubmit = () => {
    if (exitCodeInput === exitCode) {
      kioskMode.deactivateKioskMode();
      setShowExitDialog(false);
      setExitCodeInput('');
      setIsBlocked(false);
      playSound('success');
      triggerHaptic('success');
    } else {
      setExitAttempts(prev => prev + 1);
      setExitCodeInput('');
      
      if (exitAttempts >= 3) {
        setIsBlocked(true);
        setTimeout(() => {
          setIsBlocked(false);
          setExitAttempts(0);
        }, 60000); // Block for 1 minute
      }
      
      playSound('error');
      triggerHaptic('error');
    }
  };

  const contextValue: KioskModeContextType = {
    isActive: kioskMode.isActive,
    isFullscreen: kioskMode.isFullscreen,
    wakeLockActive: kioskMode.wakeLockActive,
    activateKioskMode: kioskMode.activateKioskMode,
    deactivateKioskMode: kioskMode.deactivateKioskMode,
    isSupported: kioskMode.IS_SUPPORTED
  };

  return (
    <KioskModeContext.Provider value={contextValue}>
      {children}
      
      {/* Kiosk Mode Status Indicator */}
      <AnimatePresence>
        {kioskMode.isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg"
          >
            🔒 Mode Apprentissage
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wake Lock Status */}
      <AnimatePresence>
        {kioskMode.wakeLockActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg"
          >
            🌟 Écran Toujours Actif
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🔓</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Sortir du Mode Apprentissage
                </h2>
                <p className="text-gray-600">
                  Code parental requis pour continuer
                </p>
              </div>

              {isBlocked ? (
                <div className="text-center">
                  <div className="text-4xl mb-4">⏱️</div>
                  <p className="text-red-600 font-semibold">
                    Trop de tentatives incorrectes.
                    <br />
                    Veuillez patienter 1 minute.
                  </p>
                  <Button
                    onClick={() => setShowExitDialog(false)}
                    variant="secondary"
                    size="md"
                  >
                    Fermer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="password"
                    value={exitCodeInput}
                    onChange={(e) => setExitCodeInput(e.target.value)}
                    placeholder="Entrez le code parental"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    maxLength={10}
                  />
                  
                  {exitAttempts > 0 && (
                    <p className="text-red-500 text-sm text-center">
                      Code incorrect. Tentatives restantes: {4 - exitAttempts}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setShowExitDialog(false);
                        setExitCodeInput('');
                      }}
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleExitSubmit}
                      disabled={!exitCodeInput}
                      variant="primary"
                      size="lg"
                      className="flex-1"
                    >
                      Confirmer
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </KioskModeContext.Provider>
  );
};

// Hook to use kiosk mode context
export const useKioskModeContext = () => {
  const context = useContext(KioskModeContext);
  if (context === undefined) {
    throw new Error('useKioskModeContext must be used within a KioskModeProvider');
  }
  return context;
};

// Quick activation component for parents/teachers
export const KioskModeActivator: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = '', children }) => {
  const { isActive, activateKioskMode, isSupported } = useKioskModeContext();
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  const handleActivate = async () => {
    playSound('click');
    triggerHaptic('medium');
    await activateKioskMode();
  };

  if (isActive) return null;

  return (
    <motion.button
      onClick={handleActivate}
      className={`
        bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl
        font-bold shadow-lg hover:scale-105 transition-transform
        flex items-center gap-2 ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={!isSupported.fullscreen}
    >
      <span className="text-xl">🔒</span>
      {children || 'Activer le Mode Apprentissage'}
    </motion.button>
  );
}; 