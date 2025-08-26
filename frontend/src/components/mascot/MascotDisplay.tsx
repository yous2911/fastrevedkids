import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascot } from '../../hooks/useFastRevKidsApi';
import { Mascot } from '../../services/fastrevkids-api.service';
import SparkyMascot3D from '../ui/SparkyMascot3D';

interface MascotDisplayProps {
  onInteraction?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showDialogue?: boolean;
}

export const MascotDisplay: React.FC<MascotDisplayProps> = ({
  onInteraction,
  className = '',
  size = 'medium',
  showDialogue = true
}) => {
  const { data: mascotData, isLoading, updateEmotion, getDialogue } = useMascot();
  const [currentDialogue, setCurrentDialogue] = useState<string>('');
  const [showDialogueAnimation, setShowDialogueAnimation] = useState(false);

  const mascot = mascotData?.mascot;

  // Use Sparky 3D mascot instead of emojis
  const getMascotSize = () => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'medium';
    }
  };

  // Size classes for container
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-20 h-20';
      case 'medium':
        return 'w-32 h-32';
      case 'large':
        return 'w-48 h-48';
      default:
        return 'w-32 h-32';
    }
  };

  const handleMascotClick = async () => {
    if (onInteraction) {
      onInteraction();
    }

    if (showDialogue && getDialogue) {
      try {
        const dialogue = await getDialogue('greeting');
        if (dialogue) {
          setCurrentDialogue(dialogue.dialogue);
          setShowDialogueAnimation(true);
          setTimeout(() => setShowDialogueAnimation(false), 3000);
        }
      } catch (error) {
        console.error('Error getting mascot dialogue:', error);
      }
    }
  };

  const handlePerformanceUpdate = async (performance: 'excellent' | 'good' | 'average' | 'poor') => {
    if (updateEmotion) {
      await updateEmotion(performance, 'exercise_complete');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${getSizeClasses()} ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Sparky 3D Mascot */}
      <SparkyMascot3D
        mascotType={mascot?.type || 'fairy'}
        emotion={mascot?.currentEmotion || 'idle'}
        items={mascot?.equippedItems?.map(item => item.toString()) || []}
        xpLevel={mascot?.xpLevel || 1}
        size={getMascotSize() as 'small' | 'medium' | 'large'}
        enableInteraction={true}
        onMascotClick={handleMascotClick}
      />

      {/* XP Level Badge */}
      {mascot?.xpLevel && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-white">
          {mascot.xpLevel}
        </div>
      )}

      {/* Dialogue Bubble */}
      <AnimatePresence>
        {showDialogueAnimation && currentDialogue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-200 max-w-xs"
          >
            <div className="text-sm text-gray-800 text-center">
              {currentDialogue}
            </div>
            {/* Speech bubble tail */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emotion Indicators */}
      {mascot?.currentEmotion && mascot.currentEmotion !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg border border-gray-200"
        >
          <span className="text-lg">
            {mascot.currentEmotion === 'happy' && '😊'}
            {mascot.currentEmotion === 'thinking' && '🤔'}
            {mascot.currentEmotion === 'celebrating' && '🎉'}
            {mascot.currentEmotion === 'oops' && '😅'}
          </span>
        </motion.div>
      )}

      {/* Performance Update Buttons (for testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-full mt-2 flex gap-1">
          <button
            onClick={() => handlePerformanceUpdate('excellent')}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded"
          >
            Excellent
          </button>
          <button
            onClick={() => handlePerformanceUpdate('good')}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          >
            Good
          </button>
          <button
            onClick={() => handlePerformanceUpdate('poor')}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded"
          >
            Oops
          </button>
        </div>
      )}
    </div>
  );
};

export default MascotDisplay;