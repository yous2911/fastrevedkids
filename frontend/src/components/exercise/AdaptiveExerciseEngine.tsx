import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseEngine } from './ExerciseEngine';
import { useAdaptiveLearning } from '../../hooks/useAdaptiveLearning';
import { ExerciseAttempt } from '../../services/exercise.service';
import { AdaptiveMetrics } from '../../services/adaptive-learning.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ProgressBar } from '../ui/ProgressBar';
import { Toast } from '../ui/Toast';

export interface AdaptiveExerciseEngineProps {
  studentId: number;
  targetConcept?: string;
  onComplete?: (result: any) => void;
  onExit?: () => void;
  showAdaptiveMetrics?: boolean;
  autoAdvance?: boolean;
}

export const AdaptiveExerciseEngine: React.FC<AdaptiveExerciseEngineProps> = ({
  studentId,
  targetConcept,
  onComplete,
  onExit,
  showAdaptiveMetrics = true,
  autoAdvance = true
}) => {
  const [currentAttempt, setCurrentAttempt] = useState<ExerciseAttempt | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const {
    currentExercise,
    adaptiveMetrics,
    recommendedNext,
    prerequisites,
    loading,
    error,
    insights,
    submitAttempt,
    getNextExercise,
    getDifficultyRecommendation,
    refresh
  } = useAdaptiveLearning({
    studentId,
    targetConcept,
    autoLoad: true,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  // Handle exercise completion
  const handleExerciseComplete = useCallback(async (result: any) => {
    if (!currentExercise || !currentAttempt) return;

    try {
      // Submit attempt with adaptive learning
      const adaptiveResult = await submitAttempt({
        ...currentAttempt,
        completed: result.success,
        timeSpent: result.timeSpent || 0
      });

      // Show adaptive feedback
      const difficultyAdjustment = getDifficultyRecommendation(currentExercise);
      let feedback = result.message || 'Exercise completed!';
      
      if (difficultyAdjustment === 'increase') {
        feedback += ' 🚀 Great job! The difficulty will increase slightly.';
      } else if (difficultyAdjustment === 'decrease') {
        feedback += ' 💪 Keep practicing! The difficulty will be adjusted to help you.';
      }

      setFeedbackMessage(feedback);
      setShowFeedback(true);

      // Auto-advance to next exercise
      if (autoAdvance && recommendedNext.length > 0) {
        setTimeout(() => {
          setShowFeedback(false);
          getNextExercise();
        }, 2000);
      }

      onComplete?.(adaptiveResult);
    } catch (error) {
      console.error('Error submitting adaptive attempt:', error);
      setFeedbackMessage('Error saving your progress. Please try again.');
      setShowFeedback(true);
    }
  }, [currentExercise, currentAttempt, submitAttempt, getDifficultyRecommendation, autoAdvance, recommendedNext, getNextExercise, onComplete]);

  // Handle exercise exit
  const handleExerciseExit = useCallback(() => {
    onExit?.();
  }, [onExit]);

  // Handle answer change
  const handleAnswerChange = useCallback((answer: any) => {
    if (!currentExercise) return;

    setCurrentAttempt({
      exerciseId: currentExercise.id,
      answer,
      timeSpent: 0,
      attempts: 1,
      completed: false,
      exerciseType: currentExercise.type
    });
  }, [currentExercise]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading adaptive exercise...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Exercise</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refresh} variant="primary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Show prerequisites warning
  if (prerequisites.length > 0 && prerequisites.some(p => !p.mastered)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="text-yellow-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Prerequisites Required</h3>
          <p className="text-gray-600 mb-4">
            Before starting this concept, you need to master some prerequisites:
          </p>
          <ul className="space-y-2 mb-4">
            {prerequisites.filter(p => !p.mastered).map((prereq, index) => (
              <li key={index} className="flex items-center text-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {prereq.conceptName} ({prereq.masteryLevel.toFixed(0)}% mastered)
              </li>
            ))}
          </ul>
          <Button onClick={refresh} variant="primary">
            Continue Anyway
          </Button>
        </Card>
      </div>
    );
  }

  // Show adaptive metrics
  const renderAdaptiveMetrics = () => {
    if (!showAdaptiveMetrics || !adaptiveMetrics) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
      >
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Adaptive Learning Insights</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Performance Trend:</span>
            <span className={`ml-2 font-medium ${
              adaptiveMetrics.performanceTrend === 'improving' ? 'text-green-600' :
              adaptiveMetrics.performanceTrend === 'declining' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {adaptiveMetrics.performanceTrend}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Learning Velocity:</span>
            <span className="ml-2 font-medium text-blue-600">
              {adaptiveMetrics.learningVelocity.toFixed(2)}x
            </span>
          </div>
          <div>
            <span className="text-gray-600">Engagement:</span>
            <span className="ml-2 font-medium text-purple-600">
              {(adaptiveMetrics.engagementScore * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Difficulty:</span>
            <span className="ml-2 font-medium text-orange-600">
              {adaptiveMetrics.recommendedAdjustment}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Show progress insights
  const renderProgressInsights = () => {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-4 p-3 bg-gray-50 rounded-lg"
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Mastery Level:</span>
          <ProgressBar 
            progress={insights.masteryLevel} 
            className="w-20 h-2"
            variant={insights.masteryLevel > 80 ? 'gradient' : insights.masteryLevel > 60 ? 'default' : 'sparkle'}
          />
          <span className="font-medium">{insights.masteryLevel.toFixed(0)}%</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Adaptive Metrics */}
      {renderAdaptiveMetrics()}

      {/* Main Exercise Engine */}
      {currentExercise && (
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <ExerciseEngine
            exercise={currentExercise}
            studentId={studentId}
            onComplete={handleExerciseComplete}
            onExit={handleExerciseExit}
            autoSubmit={false}
            showHints={true}
          />
        </motion.div>
      )}

      {/* Progress Insights */}
      {renderProgressInsights()}

      {/* Next Exercise Preview */}
      {recommendedNext.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <h4 className="text-sm font-semibold text-green-800 mb-2">Next Exercise</h4>
          <p className="text-sm text-green-700 mb-3">
            {recommendedNext[0].titre || 'Adaptive exercise'}
          </p>
          <Button 
            onClick={getNextExercise} 
            variant="outline" 
            size="sm"
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            Skip to Next
          </Button>
        </motion.div>
      )}

      {/* Feedback Toast */}
      <AnimatePresence>
        {showFeedback && (
          <Toast
            id="adaptive-feedback"
            message={feedbackMessage}
            type="success"
            onClose={() => setShowFeedback(false)}
            duration={3000}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdaptiveExerciseEngine; 