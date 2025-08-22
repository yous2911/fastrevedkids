import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from '../ui';
import { Exercise } from '../../services/fastrevkids-api.service';
import { ExercicePedagogique } from '../../types/api.types';
import { useExerciseSubmission } from '../../hooks/useFastRevKidsApi';
import { useAuth } from '../../contexts/FastRevKidsAuth';
import { useToast } from '../ui/Toast';


// Exercise type components
import { ExerciseQCM } from './types/ExerciseQCM';
import { ExerciseCalcul } from './types/ExerciseCalcul';
import { ExerciseTextLibre } from './types/ExerciseTextLibre';
import { ExerciseDragDrop } from './types/ExerciseDragDrop';

export interface ExerciseEngineProps {
  exercise: Exercise;
  onComplete: (result: any) => void;
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

// Helper function to convert Exercise to ExercicePedagogique format
const convertToExercicePedagogique = (exercise: Exercise): ExercicePedagogique => {
  // Map exercise types to the expected format
  let mappedType: ExercicePedagogique['type'];
  switch (exercise.type) {
    case 'MENTAL_MATH':
      mappedType = 'CALCUL';
      break;
    case 'ECRITURE':
    case 'COMPREHENSION':
      mappedType = 'TEXTE_LIBRE';
      break;
    default:
      mappedType = exercise.type as ExercicePedagogique['type'];
      break;
  }

  return {
    id: exercise.id,
    type: mappedType,
    configuration: {
      question: exercise.question,
      choix: exercise.options,
      bonneReponse: exercise.correctAnswer
    },
    xp: exercise.xpReward,
    difficulte: exercise.difficultyLevel === 1 ? 'FACILE' : exercise.difficultyLevel === 2 ? 'MOYEN' : 'DIFFICILE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper function to get exercise hints
const getExerciseHints = (exercise: Exercise): string[] => {
  const hints: string[] = [];
  
  if (exercise.hintsText) {
    try {
      const hintsArray = Array.isArray(exercise.hintsText) 
        ? exercise.hintsText 
        : JSON.parse(exercise.hintsText as string);
      hints.push(...hintsArray);
    } catch {
      hints.push(exercise.hintsText as string);
    }
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
    case 'MENTAL_MATH':
      hints.push('Utilise les techniques de calcul mental que tu connais');
      hints.push('Décompose le calcul si nécessaire');
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
const validateAnswer = (exercise: Exercise, answer: any): boolean => {
  if (!answer) return false;
  
  try {
    const correctAnswer = exercise.correctAnswer;
    
    switch (exercise.type) {
      case 'QCM':
        return answer === correctAnswer;
      case 'CALCUL':
      case 'MENTAL_MATH':
        return Number(answer) === Number(correctAnswer);
      case 'DRAG_DROP':
        // Validate drag and drop answer structure
        if (typeof answer !== 'object') return false;
        return JSON.stringify(answer) === JSON.stringify(correctAnswer);
      default:
        return String(answer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
    }
  } catch (error) {
    console.error('Error validating answer:', error);
    return false;
  }
};

export const ExerciseEngine: React.FC<ExerciseEngineProps> = memo(({
  exercise,
  onComplete,
  onExit,
  autoSubmit = false,
  showHints = true,
  timeLimit
}) => {
  const { student } = useAuth();
  const { submitExercise, isSubmitting } = useExerciseSubmission();
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
    if (isSubmitting || exerciseState.isCompleted) return;
    
    if (!exerciseState.currentAnswer && !timeExpired) {
      showError('Veuillez donner une réponse avant de valider');
      return;
    }

    setExerciseState(prev => ({ ...prev, showValidation: true }));

    try {
      const isCorrect = validateAnswer(exercise, exerciseState.currentAnswer);
      const result = await submitExercise(exercise.id, {
        score: isCorrect ? 100 : 0,
        timeSpent: exerciseState.timeElapsed,
        completed: true,
        attempts: exerciseState.attempts + 1,
        hintsUsed: exerciseState.hintsUsed,
        answerGiven: String(exerciseState.currentAnswer)
      });
      
      setExerciseState(prev => ({ 
        ...prev, 
        isCompleted: true,
        attempts: prev.attempts + 1
      }));

      if (result.success) {
        // Show feedback
        if (isCorrect) {
          success(`Bravo ! +${result.xpEarned || exercise.xpReward} XP`, { duration: 4000 });
        } else {
          showError('Pas tout à fait... Réessaye !', { duration: 3000 });
        }

        // Call completion handler after a short delay for feedback
        setTimeout(() => {
          onComplete(result);
        }, isCorrect ? 2000 : 1500);
      } else {
        showError(result.error?.message || 'Erreur lors de la soumission');
        setExerciseState(prev => ({ ...prev, showValidation: false }));
      }

    } catch (err: any) {
      showError(err.message || 'Erreur lors de la soumission');
      setExerciseState(prev => ({ ...prev, showValidation: false }));
    }
  }, [
    exercise, 
    exerciseState.currentAnswer, 
    exerciseState.timeElapsed, 
    exerciseState.hintsUsed,
    exerciseState.attempts,
    exerciseState.isCompleted,
    isSubmitting,
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
    exercise: convertToExercicePedagogique(exercise),
    onAnswerChange: handleAnswerChange,
    disabled: isSubmitting || exerciseState.isCompleted,
    currentAnswer: exerciseState.currentAnswer,
    showValidation: exerciseState.showValidation
  }), [exercise, handleAnswerChange, isSubmitting, exerciseState.isCompleted, exerciseState.currentAnswer, exerciseState.showValidation]);

  // Memoized render appropriate exercise component
  const renderExerciseComponent = useMemo(() => {
    switch (exercise.type) {
      case 'QCM':
        return <ExerciseQCM {...exerciseComponentProps} />;
      case 'CALCUL':
      case 'MENTAL_MATH':
        return <ExerciseCalcul {...exerciseComponentProps} />;
      case 'DRAG_DROP':
        return <ExerciseDragDrop {...exerciseComponentProps} />;
      case 'LECTURE':
      case 'ECRITURE':
      case 'COMPREHENSION':
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
                  Difficulté: {exercise.difficultyLevel} • {exercise.xpReward} XP
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
        <Card variant="default" padding="lg" rounded="lg" className="shadow-xl border border-purple-200">
          {renderExerciseComponent}
        </Card>
      </div>

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <div className="flex items-center justify-between">
            {/* Help Button */}
            {showHints && (
              <Button
                onClick={handleHintRequest}
                disabled={exerciseState.isCompleted}
                variant="ghost"
                size="md"
              >
                <span>💡</span>
                Indice
              </Button>
            )}

            <div className="flex-1" />

            {/* Submit Button */}
            {!autoSubmit && (
              <Button
                onClick={() => handleSubmit()}
                disabled={!exerciseState.currentAnswer || isSubmitting || exerciseState.isCompleted}
                variant="primary"
                size="lg"
                loading={isSubmitting}
              >
                {exerciseState.isCompleted ? (
                  <>
                    <span>✅</span>
                    Terminé
                  </>
                ) : (
                  'Valider'
                )}
              </Button>
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
    prevProps.autoSubmit === nextProps.autoSubmit &&
    prevProps.showHints === nextProps.showHints &&
    prevProps.timeLimit === nextProps.timeLimit
  );
}); 