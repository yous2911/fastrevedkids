import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExercicePedagogique, TentativeExercice, TentativeResponse } from '../../types/api.types';
import { useStudentData } from '../../hooks/useStudentData';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Exercise type components
import { ExerciseQCM } from './types/ExerciseQCM';
import { ExerciseCalcul } from './types/ExerciseCalcul';
import { ExerciseTextLibre } from './types/ExerciseTextLibre';
import { ExerciseDragDrop } from './types/ExerciseDragDrop';

export interface ExerciseEngineProps {
  exercise: ExercicePedagogique;
  studentId: number;
  onComplete: (result: TentativeResponse) => void;
  onExit: () => void;
  autoSubmit?: boolean;
  showHints?: boolean;
  timeLimit?: number;
}

interface ExerciseState {
  currentAnswer: any;
  startTime: number;
  hintsUsed: number;
  attempts: number;
  isSubmitting: boolean;
  isCompleted: boolean;
  timeElapsed: number;
  showValidation: boolean;
}

export const ExerciseEngine: React.FC<ExerciseEngineProps> = ({
  exercise,
  studentId,
  onComplete,
  onExit,
  autoSubmit = false,
  showHints = true,
  timeLimit
}) => {
  const { submitExercise } = useStudentData(studentId);
  const { state } = useApp();
  const { success, error: showError, warning } = useToast();
  
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    currentAnswer: null,
    startTime: Date.now(),
    hintsUsed: 0,
    attempts: 0,
    isSubmitting: false,
    isCompleted: false,
    timeElapsed: 0,
    showValidation: false
  });

  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update timer every second
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setExerciseState(prev => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - prev.startTime) / 1000)
      }));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Time limit check
  useEffect(() => {
    if (timeLimit && exerciseState.timeElapsed >= timeLimit && !exerciseState.isCompleted) {
      warning('Temps écoulé ! Soumission automatique...', { duration: 3000 });
      setTimeout(() => handleSubmit(true), 1000);
    }
  }, [timeLimit, exerciseState.timeElapsed, exerciseState.isCompleted]);

  // Answer change handler
  const handleAnswerChange = useCallback((answer: any) => {
    setExerciseState(prev => ({
      ...prev,
      currentAnswer: answer,
      showValidation: false
    }));

    // Auto-submit for certain exercise types
    if (autoSubmit && exercise.type === 'QCM') {
      setTimeout(() => handleSubmit(), 500);
    }
  }, [autoSubmit, exercise.type]);

  // Hint request handler
  const handleHintRequest = useCallback(() => {
    if (!showHints) return;

    setExerciseState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));

    // Show contextual hint based on exercise type
    const hints = getExerciseHints(exercise);
    if (hints.length > exerciseState.hintsUsed) {
      warning(hints[exerciseState.hintsUsed], { duration: 5000 });
    } else {
      warning('Plus d\'indices disponibles !', { duration: 3000 });
    }
  }, [exercise, exerciseState.hintsUsed, showHints, warning]);

  // Submit exercise attempt
  const handleSubmit = useCallback(async (timeExpired: boolean = false) => {
    if (exerciseState.isSubmitting || exerciseState.isCompleted) return;
    
    if (!exerciseState.currentAnswer && !timeExpired) {
      showError('Veuillez donner une réponse avant de valider');
      return;
    }

    setExerciseState(prev => ({ ...prev, isSubmitting: true, showValidation: true }));

    try {
      const attempt: TentativeExercice = {
        reponse: exerciseState.currentAnswer,
        reussi: validateAnswer(exercise, exerciseState.currentAnswer),
        tempsSecondes: exerciseState.timeElapsed,
        aidesUtilisees: exerciseState.hintsUsed
      };

      const result = await submitExercise(exercise.id, attempt);
      
      setExerciseState(prev => ({ 
        ...prev, 
        isCompleted: true,
        attempts: prev.attempts + 1
      }));

      // Show feedback
      if (result.data.reussi) {
        success(`Bravo ! +${result.data.pointsGagnes} points`, { duration: 4000 });
      } else {
        showError('Pas tout à fait... Réessaye !', { duration: 3000 });
      }

      // Call completion handler after a short delay for feedback
      setTimeout(() => {
        onComplete(result);
      }, result.data.reussi ? 2000 : 1500);

    } catch (err: any) {
      showError(err.message || 'Erreur lors de la soumission');
      setExerciseState(prev => ({ ...prev, isSubmitting: false, showValidation: false }));
    }
  }, [
    exercise, 
    exerciseState.currentAnswer, 
    exerciseState.timeElapsed, 
    exerciseState.hintsUsed,
    exerciseState.isSubmitting,
    exerciseState.isCompleted,
    submitExercise, 
    onComplete, 
    success, 
    showError
  ]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time color based on remaining time
  const getTimeColor = (): string => {
    if (!timeLimit) return 'text-gray-600';
    const remaining = timeLimit - exerciseState.timeElapsed;
    if (remaining <= 30) return 'text-red-500';
    if (remaining <= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Render appropriate exercise component
  const renderExerciseComponent = () => {
    const commonProps = {
      exercise,
      onAnswerChange: handleAnswerChange,
      disabled: exerciseState.isSubmitting || exerciseState.isCompleted,
      currentAnswer: exerciseState.currentAnswer,
      showValidation: exerciseState.showValidation
    };

    switch (exercise.type) {
      case 'QCM':
        return <ExerciseQCM {...commonProps} />;
      case 'CALCUL':
        return <ExerciseCalcul {...commonProps} />;
      case 'TEXTE_LIBRE':
        return <ExerciseTextLibre {...commonProps} />;
      case 'DRAG_DROP':
        return <ExerciseDragDrop {...commonProps} />;
      case 'CONJUGAISON':
        return <ExerciseTextLibre {...commonProps} />;
      case 'LECTURE':
        return <ExerciseTextLibre {...commonProps} />;
      case 'GEOMETRIE':
        return <ExerciseTextLibre {...commonProps} />;
      case 'PROBLEME':
        return <ExerciseTextLibre {...commonProps} />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Type d'exercice non supporté: {exercise.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card variant="elevated" padding="md" className="bg-white">
          <div className="flex items-center justify-between">
            {/* Exercise Info */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
                icon={<span className="text-xl">←</span>}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Exercice {exercise.type}
                </h1>
                <p className="text-sm text-gray-600">
                  Difficulté: {exercise.difficulte} • {exercise.xp} XP
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className={`text-center ${getTimeColor()}`}>
                <div className="text-lg font-mono font-bold">
                  {formatTime(exerciseState.timeElapsed)}
                </div>
                <div className="text-xs">
                  {timeLimit ? `/ ${formatTime(timeLimit)}` : 'Temps'}
                </div>
              </div>

              {/* Hints */}
              {showHints && (
                <div className="text-center text-gray-600">
                  <div className="text-lg font-bold">
                    {exerciseState.hintsUsed}
                  </div>
                  <div className="text-xs">Indices</div>
                </div>
              )}

              {/* Attempts */}
              <div className="text-center text-gray-600">
                <div className="text-lg font-bold">
                  {exerciseState.attempts}
                </div>
                <div className="text-xs">Tentatives</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Exercise Content */}
      <div className="max-w-4xl mx-auto">
        <Card variant="magical" padding="lg" animated>
          {renderExerciseComponent()}
        </Card>
      </div>

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mt-6">
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            {/* Help Button */}
            {showHints && (
              <Button
                variant="secondary"
                onClick={handleHintRequest}
                icon={<span>💡</span>}
                disabled={exerciseState.isCompleted}
              >
                Indice
              </Button>
            )}

            <div className="flex-1" />

            {/* Submit Button */}
            {!autoSubmit && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleSubmit()}
                loading={exerciseState.isSubmitting}
                disabled={exerciseState.isCompleted}
                icon={exerciseState.isCompleted ? <span>✅</span> : undefined}
              >
                {exerciseState.isCompleted ? 'Terminé' : 'Valider'}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {exerciseState.isSubmitting && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card variant="elevated" padding="lg" className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-lg font-medium">
                Vérification de ta réponse...
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper functions
function validateAnswer(exercise: ExercicePedagogique, answer: any): boolean {
  switch (exercise.type) {
    case 'QCM':
      return answer === exercise.configuration.bonneReponse;
    
    case 'CALCUL':
      return Number(answer) === Number(exercise.configuration.resultat);
    
    case 'TEXTE_LIBRE':
    case 'CONJUGAISON':
    case 'LECTURE':
      const expected = exercise.configuration.solution?.toString().toLowerCase().trim();
      const given = answer?.toString().toLowerCase().trim();
      return expected === given;
    
    case 'DRAG_DROP':
      return JSON.stringify(answer) === JSON.stringify(exercise.configuration.solution);
    
    default:
      return false;
  }
}

function getExerciseHints(exercise: ExercicePedagogique): string[] {
  const baseHints = [
    'Lis bien la question',
    'Prends ton temps pour réfléchir',
    'Essaie de décomposer le problème'
  ];

  switch (exercise.type) {
    case 'QCM':
      return [
        'Élimine d\'abord les réponses qui ne peuvent pas être correctes',
        'Relis chaque choix attentivement',
        ...baseHints
      ];
    
    case 'CALCUL':
      return [
        'Vérifie tes calculs étape par étape',
        'N\'oublie pas l\'ordre des opérations',
        'Tu peux utiliser tes doigts ou dessiner pour t\'aider',
        ...baseHints
      ];
    
    case 'TEXTE_LIBRE':
      return [
        'Fais attention à l\'orthographe',
        'Relis ta réponse avant de valider',
        ...baseHints
      ];
    
    default:
      return baseHints;
  }
} 