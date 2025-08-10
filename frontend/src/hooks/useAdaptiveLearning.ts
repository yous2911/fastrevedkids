import { useState, useEffect, useCallback } from 'react';
import { exerciseService } from '../services/exercise.service';
import { adaptiveLearningService } from '../services/adaptive-learning.service';
import { Exercise, ExerciseAttempt } from '../services/exercise.service';
import { AdaptiveMetrics } from '../services/adaptive-learning.service';

export interface AdaptiveLearningState {
  currentExercise: Exercise | null;
  adaptiveMetrics: AdaptiveMetrics | null;
  recommendedNext: Exercise[];
  prerequisites: any[];
  loading: boolean;
  error: string | null;
  insights: {
    masteryLevel: number;
    learningVelocity: number;
    frustrationIndex: number;
    engagementScore: number;
    recommendedConcepts: string[];
  };
}

export interface UseAdaptiveLearningOptions {
  studentId: number;
  targetConcept?: string;
  autoLoad?: boolean;
  refreshInterval?: number;
}

export const useAdaptiveLearning = (options: UseAdaptiveLearningOptions) => {
  const { studentId, targetConcept, autoLoad = true, refreshInterval } = options;
  
  const [state, setState] = useState<AdaptiveLearningState>({
    currentExercise: null,
    adaptiveMetrics: null,
    recommendedNext: [],
    prerequisites: [],
    loading: false,
    error: null,
    insights: {
      masteryLevel: 0,
      learningVelocity: 1,
      frustrationIndex: 0,
      engagementScore: 0.5,
      recommendedConcepts: []
    }
  });

  /**
   * Load adaptive exercises
   */
  const loadAdaptiveExercises = useCallback(async () => {
    if (!studentId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await exerciseService.getAdaptiveExercises(studentId, targetConcept);
      
      setState(prev => ({
        ...prev,
        currentExercise: response.exercise,
        adaptiveMetrics: response.adaptiveMetrics,
        recommendedNext: response.recommendedNext || [],
        prerequisites: response.prerequisites || [],
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load adaptive exercises'
      }));
    }
  }, [studentId, targetConcept]);

  /**
   * Submit exercise attempt with adaptive feedback
   */
  const submitAttempt = useCallback(async (attempt: ExerciseAttempt) => {
    if (!studentId) return;

    try {
      const result = await exerciseService.submitExerciseAttempt(attempt);
      
      // Update insights after submission
      const insights = exerciseService.getAdaptiveInsights();
      
      setState(prev => ({
        ...prev,
        insights
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to submit attempt'
      }));
      throw error;
    }
  }, [studentId]);

  /**
   * Get next exercise in sequence
   */
  const getNextExercise = useCallback(async () => {
    if (state.recommendedNext.length === 0) {
      await loadAdaptiveExercises();
      return;
    }

    const nextExercise = state.recommendedNext[0];
    const remainingExercises = state.recommendedNext.slice(1);

    setState(prev => ({
      ...prev,
      currentExercise: nextExercise,
      recommendedNext: remainingExercises
    }));

    // Load more exercises if running low
    if (remainingExercises.length < 2) {
      loadAdaptiveExercises();
    }
  }, [state.recommendedNext, loadAdaptiveExercises]);

  /**
   * Get adaptive insights for dashboard
   */
  const getInsights = useCallback(() => {
    return exerciseService.getAdaptiveInsights();
  }, []);

  /**
   * Check prerequisites for a concept
   */
  const checkPrerequisites = useCallback((conceptId: string) => {
    // This would need student progress data
    return adaptiveLearningService.checkPrerequisites(conceptId, []);
  }, []);

  /**
   * Get difficulty recommendation
   */
  const getDifficultyRecommendation = useCallback((exercise: Exercise) => {
    if (!state.adaptiveMetrics) return 'maintain';
    return state.adaptiveMetrics.recommendedAdjustment;
  }, [state.adaptiveMetrics]);

  /**
   * Refresh adaptive data
   */
  const refresh = useCallback(() => {
    loadAdaptiveExercises();
  }, [loadAdaptiveExercises]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && studentId) {
      loadAdaptiveExercises();
    }
  }, [autoLoad, studentId, loadAdaptiveExercises]);

  // Set up refresh interval
  useEffect(() => {
    if (!refreshInterval || !studentId) return;

    const interval = setInterval(() => {
      loadAdaptiveExercises();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, studentId, loadAdaptiveExercises]);

  return {
    ...state,
    loadAdaptiveExercises,
    submitAttempt,
    getNextExercise,
    getInsights,
    checkPrerequisites,
    getDifficultyRecommendation,
    refresh
  };
};

export default useAdaptiveLearning; 