import { useState, useEffect, useCallback } from 'react';
import { wahooEngine } from '../services/WahooEngine';
import { WahooContext, WahooFeedback, WahooIntensity } from '../types/wahoo.types';

export interface UseWahooEngineReturn {
  // Current state
  streak: number;
  totalCorrect: number;
  difficulty: 'easy' | 'medium' | 'hard';
  studentEnergy: number;
  lastWahooIntensity: WahooIntensity;
  sessionDuration: number;
  consecutiveErrors: number;
  averageResponseTime: number;
  engagementLevel: 'low' | 'medium' | 'high';
  mysteryWordsCompleted: number;
  intensityHistory: WahooIntensity[];
  
  // Actions
  recordResponse: (isCorrect: boolean, responseTime: number) => WahooFeedback;
  reset: () => void;
  updateDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  getPerformanceStats: () => WahooContext;
}

export const useWahooEngine = (): UseWahooEngineReturn => {
  const [context, setContext] = useState<WahooContext>(wahooEngine.getContext());
  const [mysteryWordsCompleted, setMysteryWordsCompleted] = useState(0);
  const [intensityHistory, setIntensityHistory] = useState<WahooIntensity[]>([]);

  // Update context when it changes
  useEffect(() => {
    const updateContext = () => {
      setContext(wahooEngine.getContext());
    };

    // Listen for context updates
    window.addEventListener('wahoo-context-updated', updateContext);
    
    return () => {
      window.removeEventListener('wahoo-context-updated', updateContext);
    };
  }, []);

  // Record a response and get feedback
  const recordResponse = useCallback((isCorrect: boolean, responseTime: number): WahooFeedback => {
    const feedback = wahooEngine.evaluateResponse(isCorrect, responseTime);
    
    // Update local state
    setContext(wahooEngine.getContext());
    setIntensityHistory(prev => [...prev, feedback.intensity]);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('wahoo-response', {
      detail: {
        isCorrect,
        responseTime,
        feedback,
        context: wahooEngine.getContext()
      }
    }));
    
    return feedback;
  }, []);

  // Reset the session
  const reset = useCallback(() => {
    wahooEngine.resetSession();
    setContext(wahooEngine.getContext());
    setIntensityHistory([]);
    
    // Dispatch reset event
    window.dispatchEvent(new CustomEvent('wahoo-reset', {
      detail: { context: wahooEngine.getContext() }
    }));
  }, []);

  // Update difficulty
  const updateDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    wahooEngine.setDifficulty(difficulty);
    setContext(wahooEngine.getContext());
    
    // Dispatch difficulty change event
    window.dispatchEvent(new CustomEvent('wahoo-difficulty-changed', {
      detail: { difficulty, context: wahooEngine.getContext() }
    }));
  }, []);

  // Get current performance stats
  const getPerformanceStats = useCallback((): WahooContext => {
    return wahooEngine.getContext();
  }, []);

  // Listen for mystery word completion events
  useEffect(() => {
    const handleMysteryWordCompleted = (event: CustomEvent) => {
      if (event.detail.type === 'mystery_word_completed') {
        setMysteryWordsCompleted(prev => prev + 1);
      }
    };

    window.addEventListener('wahoo-achievement', handleMysteryWordCompleted as EventListener);
    
    return () => {
      window.removeEventListener('wahoo-achievement', handleMysteryWordCompleted as EventListener);
    };
  }, []);

  return {
    // Current state
    streak: context.streak,
    totalCorrect: context.totalCorrect,
    difficulty: context.difficulty,
    studentEnergy: context.studentEnergy,
    lastWahooIntensity: context.lastWahooIntensity,
    sessionDuration: context.sessionDuration,
    consecutiveErrors: context.consecutiveErrors,
    averageResponseTime: context.averageResponseTime,
    engagementLevel: context.engagementLevel,
    mysteryWordsCompleted,
    intensityHistory,
    
    // Actions
    recordResponse,
    reset,
    updateDifficulty,
    getPerformanceStats
  };
}; 