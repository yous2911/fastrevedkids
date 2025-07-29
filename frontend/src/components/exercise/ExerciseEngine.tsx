import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
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

// Helper function to get exercise hints
const getExerciseHints = (exercise: ExercicePedagogique): string[] => {
  const hints: string[] = [];
  
  if (exercise.configuration.hint) {
    hints.push(exercise.configuration.hint);
  }
  
  // Add contextual hints based on exercise type
  switch (exercise.type) {
    case 'QCM':
      hints.push('Lis bien toutes les options avant de choisir');
      hints.push('Élimine les réponses qui ne peuvent pas être correctes');
      break;
    case 'CALCUL':
      hints.push('Vérifie tes calculs étape par étape');
      hints.push('N\'oublie pas les règles de priorité des opérations');
      break;
    case 'DRAG_DROP':
      hints.push('Associe chaque élément à la bonne catégorie');
      hints.push('Observe bien les indices visuels');
      break;
    default:
      hints.push('Prends ton temps pour réfléchir');
      break;
  }
  
  return hints;
};

// Helper function to validate answers
const validateAnswer = (exercise: ExercicePedagogique, answer: any): boolean => {
  if (!answer) return false;
  
  switch (exercise.type) {
    case 'QCM':
      return answer === exercise.configuration.bonneReponse;
    case 'CALCUL':
      return Number(answer) === Number(exercise.configuration.resultat);
    case 'DRAG_DROP':
      // Validate drag and drop answer structure
      if (typeof answer !== 'object') return false;
      // Add more specific validation logic here
      return true;
    default:
      return answer === exercise.configuration.bonneReponse;
  }
};

export const ExerciseEngine: React.FC<ExerciseEngineProps> = memo(({
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Memoized format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoized time color based on remaining time
  const timeColor = useMemo((): string => {
    if (!timeLimit) return 'text-gray-600';
    const remaining = timeLimit - exerciseState.timeElapsed;
    if (remaining <= 30) return 'text-red-500';
    if (remaining <= 60) return 'text-yellow-500';
    return 'text-green-500';
  }, [timeLimit, exerciseState.timeElapsed]);

  // Memoized exercise hints
  const exerciseHints = useMemo(() => getExerciseHints(exercise), [exercise]);

  // Memoized common props for exercise components
  const exerciseComponentProps = useMemo(() => ({
    exercise,
    onAnswerChange: handleAnswerChange,
    disabled: exerciseState.isSubmitting || exerciseState.isCompleted,
    currentAnswer: exerciseState.currentAnswer,
    showValidation: exerciseState.showValidation
  }), [exercise, handleAnswerChange, exerciseState.isSubmitting, exerciseState.isCompleted, exerciseState.currentAnswer, exerciseState.showValidation]);

  // Memoized render appropriate exercise component
  const renderExerciseComponent = useMemo(() => {
    switch (exercise.type) {
      case 'QCM':
        return <ExerciseQCM {...exerciseComponentProps} />;
      case 'CALCUL':
        return <ExerciseCalcul {...exerciseComponentProps} />;
      case 'TEXTE_LIBRE':
        return <ExerciseTextLibre {...exerciseComponentProps} />;
      case 'DRAG_DROP':
        return <ExerciseDragDrop {...exerciseComponentProps} />;
      case 'CONJUGAISON':
        return <ExerciseTextLibre {...exerciseComponentProps} />;
      case 'LECTURE':
        return <ExerciseTextLibre {...exerciseComponentProps} />;
      case 'GEOMETRIE':
        return <ExerciseTextLibre {...exerciseComponentProps} />;
      case 'PROBLEME':
        return <ExerciseTextLibre {...exerciseComponentProps} />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Type d'exercice non supporté: {exercise.type}</p>
          </div>
        );
    }
  }, [exercise.type, exerciseComponentProps]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <div className="flex items-center justify-between">
            {/* Exercise Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={onExit}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <span className="text-xl">←</span> Retour
              </button>
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
              <div className={`text-center ${timeColor}`}>
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
        </div>
      </div>

      {/* Exercise Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl border border-purple-200 rounded-lg p-6">
          {renderExerciseComponent}
        </div>
      </div>

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <div className="flex items-center justify-between">
            {/* Help Button */}
            {showHints && (
              <button
                onClick={handleHintRequest}
                disabled={exerciseState.isCompleted}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <span>💡</span>
                Indice
              </button>
            )}

            <div className="flex-1" />

            {/* Submit Button */}
            {!autoSubmit && (
              <button
                onClick={() => handleSubmit()}
                disabled={!exerciseState.currentAnswer || exerciseState.isSubmitting || exerciseState.isCompleted}
                className="min-w-32 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exerciseState.isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : exerciseState.isCompleted ? (
                  <>
                    <span>✅</span>
                    Terminé
                  </>
                ) : (
                  'Valider'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    prevProps.exercise.id === nextProps.exercise.id &&
    prevProps.studentId === nextProps.studentId &&
    prevProps.autoSubmit === nextProps.autoSubmit &&
    prevProps.showHints === nextProps.showHints &&
    prevProps.timeLimit === nextProps.timeLimit
  );
}); 