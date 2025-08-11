import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentProgress, useStudentStats } from '../../hooks/useFastRevKidsApi';
import { StudentProgress } from '../../services/fastrevkids-api.service';

interface ProgressTrackerProps {
  className?: string;
  showDetails?: boolean;
  maxItems?: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  className = '',
  showDetails = true,
  maxItems = 5
}) => {
  const { data: progressData, isLoading: progressLoading } = useStudentProgress();
  const { data: statsData, isLoading: statsLoading } = useStudentStats();
  const [selectedProgress, setSelectedProgress] = useState<StudentProgress | null>(null);

  const competenceProgress = progressData?.competenceProgress || [];
  const stats = statsData?.stats || {};

  const getStatusColor = (status: StudentProgress['status']) => {
    switch (status) {
      case 'mastered':
        return 'bg-green-500 text-white';
      case 'learning':
        return 'bg-blue-500 text-white';
      case 'not_started':
        return 'bg-gray-400 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusLabel = (status: StudentProgress['status']) => {
    switch (status) {
      case 'mastered':
        return 'Maîtrisé';
      case 'learning':
        return 'En cours';
      case 'not_started':
        return 'Non commencé';
      case 'failed':
        return 'À revoir';
      default:
        return 'Inconnu';
    }
  };

  const getProgressIcon = (status: StudentProgress['status']) => {
    switch (status) {
      case 'mastered':
        return '🎯';
      case 'learning':
        return '📚';
      case 'not_started':
        return '⏳';
      case 'failed':
        return '🔄';
      default:
        return '❓';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.floor(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  if (progressLoading || statsLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📊 Progression
        </h3>
        <div className="text-sm text-gray-600">
          {competenceProgress.length} compétences
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(stats.averageSuccessRate || 0)}%
          </div>
          <div className="text-xs text-gray-600">Taux de réussite</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.masteredCompetences || 0}
          </div>
          <div className="text-xs text-gray-600">Maîtrisées</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatTime(stats.totalTimeSpent || 0)}
          </div>
          <div className="text-xs text-gray-600">Temps total</div>
        </div>
      </div>

      {/* Progress List */}
      <div className="space-y-3">
        {competenceProgress.slice(0, maxItems).map((progress, index) => (
          <motion.div
            key={progress.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedProgress(progress)}
          >
            <div className="flex items-center justify-between">
              {/* Progress Info */}
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">
                  {getProgressIcon(progress.status)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    Compétence {progress.competenceId}
                  </div>
                  <div className="text-sm text-gray-600">
                    Niveau {progress.currentLevel} • {progress.attemptsCount} tentatives
                  </div>
                </div>
              </div>

              {/* Status and Progress */}
              <div className="flex items-center gap-3">
                {/* Success Rate */}
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">
                    {Math.round(progress.successRate)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {progress.correctAttempts}/{progress.attemptsCount}
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(progress.status)}`}>
                  {getStatusLabel(progress.status)}
                </div>

                {/* Progress Bar */}
                <div className="w-16">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress.successRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-center text-gray-500 mt-1">
                    {Math.round(progress.successRate)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Time info */}
            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>
                Temps: {formatTime(progress.totalTimeSpent / 60)}
              </span>
              {progress.lastPracticeDate && (
                <span>
                  Dernière pratique: {new Date(progress.lastPracticeDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show More */}
      {competenceProgress.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Voir {competenceProgress.length - maxItems} compétences de plus
          </button>
        </div>
      )}

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedProgress && showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedProgress(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Détails de la compétence
                </h3>
                <button
                  onClick={() => setSelectedProgress(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getProgressIcon(selectedProgress.status)}</span>
                  <div>
                    <div className="font-medium">Statut actuel</div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProgress.status)}`}>
                      {getStatusLabel(selectedProgress.status)}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Niveau actuel</div>
                    <div className="text-lg font-bold text-blue-600">
                      {selectedProgress.currentLevel}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Taux de réussite</div>
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(selectedProgress.successRate)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Tentatives</div>
                    <div className="text-lg font-bold text-purple-600">
                      {selectedProgress.attemptsCount}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Temps passé</div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatTime(selectedProgress.totalTimeSpent / 60)}
                    </div>
                  </div>
                </div>

                {/* Progress Details */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Progression</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${selectedProgress.successRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{selectedProgress.correctAttempts} réussies</span>
                    <span>{selectedProgress.attemptsCount} tentatives</span>
                  </div>
                </div>

                {/* Repetition Info */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-700 mb-1">
                    Système de répétition espacée
                  </div>
                  <div className="text-xs text-gray-600">
                    Répétition #{selectedProgress.repetitionNumber} • 
                    Facteur de facilité: {selectedProgress.easinessFactor.toFixed(2)}
                  </div>
                  {selectedProgress.nextReviewDate && (
                    <div className="text-xs text-blue-600 mt-1">
                      Prochaine révision: {new Date(selectedProgress.nextReviewDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProgressTracker;