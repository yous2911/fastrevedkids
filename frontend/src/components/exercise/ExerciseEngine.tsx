import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExercicePedagogique, TentativeExercice, TentativeResponse, ApiResponse } from '../../types/api.types';
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

// Mock exercise submission service
const submitExerciseAttempt = async (exerciseId: number, tentative: TentativeExercice): Promise<ApiResponse<any>> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation logic
    const isCorrect = Math.random() > 0.3; // 70% success rate for demo
    
    return {
      success: true,
      data: {
        reussi: isCorrect,
        pointsGagnes: isCorrect ? 10 : 0,
        nouveauStatut: isCorrect ? 'reussi' : 'echec',
        tauxReussite: 0.7,
        nombreTentatives: 1,
        feedback: isCorrect ? 'Excellent travail !' : 'Essaie encore !',
        session: {
          exercicesReussis: isCorrect ? 1 : 0,
          exercicesTentes: 1,
          pointsTotal: isCorrect ? 10 : 0,
          tauxReussite: isCorrect ? 1 : 0
        }
      },
      message: isCorrect ? 'Exercice réussi !' : 'Presque ! Essaie encore.'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erreur lors de la soumission'
    };
  }
};

export const ExerciseEngine: React.FC<ExerciseEngineProps> = ({
  exercise,
  studentId,
  onComplete,
  onExit,
  autoSubmit = false,
  showHints = true,
  timeLimit
}) => {
  const { addXP } = useStudentData();
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

  // Fix useRef initialization
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
      warning('Temps écoulé !');
      handleSubmit();
    }
  }, [exerciseState.timeElapsed, timeLimit, exerciseState.isCompleted]);

  // Handle answer change
  const handleAnswerChange = useCallback((answer: any) => {
    setExerciseState(prev => ({
      ...prev,
      currentAnswer: answer,
      showValidation: false
    }));

    // Auto-submit for certain exercise types
    if (autoSubmit && answer !== null) {
      setTimeout(() => handleSubmit(), 500);
    }
  }, [autoSubmit]);

  // Handle exercise submission - FIXED
  const handleSubmit = useCallback(async () => {
    if (exerciseState.isSubmitting || exerciseState.isCompleted) return;

    try {
      setExerciseState(prev => ({ 
        ...prev, 
        isSubmitting: true,
        attempts: prev.attempts + 1
      }));
      
      const tentative: TentativeExercice = {
        reponse: exerciseState.currentAnswer,
        reussi: false, // Will be determined by backend
        tempsSecondes: exerciseState.timeElapsed,
        aidesUtilisees: exerciseState.hintsUsed
      };
      
      // Fix API call to handle ApiResponse properly
      const response = await submitExerciseAttempt(exercise.id, tentative);
      
      if (response.success && response.data) {
        setExerciseState(prev => ({ 
          ...prev, 
          isCompleted: true,
          showValidation: true 
        }));
        
        // Create proper TentativeResponse
        const tentativeResponse: TentativeResponse = {
          success: true,
          data: response.data,
          message: response.message || 'Exercise completed successfully'
        };
        
        onComplete(tentativeResponse);
        
        if (response.data.reussi) {
          success('Excellent ! Exercice réussi !');
          addXP(response.data.pointsGagnes || 10);
        } else {
          warning('Presque ! Essaie encore.');
        }
      } else {
        throw new Error(typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Submission failed'
        );
      }
    } catch (error) {
      console.error('Exercise submission error:', error);
      showError(error instanceof Error ? error.message : 'Failed to submit exercise');
      
      setExerciseState(prev => ({ 
        ...prev, 
        showValidation: true 
      }));
    } finally {
      setExerciseState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [exercise.id, exerciseState, onComplete, success, warning, showError, addXP]);

  // Handle hint usage
  const handleUseHint = useCallback(() => {
    if (!showHints) return;
    
    setExerciseState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));
    
    // Show hint logic here
    const hint = exercise.configuration.hint;
    if (hint) {
      warning(`💡 ${hint}`);
    }
  }, [showHints, exercise.configuration.hint, warning]);

  // Render exercise based on type
  const renderExercise = () => {
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
      default:
        return (
          <div className="text-center text-gray-500">
            Type d'exercice non supporté: {exercise.type}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onExit}>
              ← Retour
            </Button>
            <div className="text-sm text-gray-600">
              Difficulté: {exercise.difficulte}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {timeLimit && (
              <div className="text-sm text-gray-600">
                ⏱️ {Math.max(0, timeLimit - exerciseState.timeElapsed)}s
              </div>
            )}
            <div className="text-sm text-gray-600">
              Tentatives: {exerciseState.attempts}
            </div>
            {exerciseState.hintsUsed > 0 && (
              <div className="text-sm text-orange-600">
                💡 {exerciseState.hintsUsed}
              </div>
            )}
          </div>
        </div>

        {/* Exercise Content */}
        <Card className="p-6 mb-6">
          {renderExercise()}
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {showHints && exercise.configuration.hint && (
              <Button
                variant="secondary"
                onClick={handleUseHint}
                disabled={exerciseState.isSubmitting || exerciseState.isCompleted}
              >
                💡 Indice
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {!autoSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={
                  !exerciseState.currentAnswer || 
                  exerciseState.isSubmitting || 
                  exerciseState.isCompleted
                }
                className="min-w-32"
              >
                {exerciseState.isSubmitting ? (
                  <LoadingSpinner size="sm" />
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
}; 