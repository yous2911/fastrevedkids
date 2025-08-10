import { useState, useEffect, useCallback } from 'react';
import { revisionService, RevisionExercise, RevisionStats, RevisionFilters } from '../services/revision.service';

export const useRevisions = (eleveId: number) => {
  const [exercises, setExercises] = useState<RevisionExercise[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExercises = useCallback(async (filters?: RevisionFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const [exercisesData, statsData] = await Promise.all([
        revisionService.getExercisesToRevise(eleveId, filters),
        revisionService.getRevisionStats(eleveId)
      ]);

      if (exercisesData.data) {
        setExercises(exercisesData.data.exercices || []);
      }

      if (statsData.data) {
        setStats(statsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revisions');
    } finally {
      setLoading(false);
    }
  }, [eleveId]);

  const refreshStats = useCallback(async () => {
    try {
      const statsData = await revisionService.getRevisionStats(eleveId);
      if (statsData.data) {
        setStats(statsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    }
  }, [eleveId]);

  const recordFailure = useCallback(async (exerciseId: number, questionId?: string) => {
    try {
      const result = await revisionService.recordFailure(eleveId, {
        exerciceId: exerciseId,
        questionId
      });
      
      if (result.data) {
        // Refresh exercises after recording failure
        await loadExercises();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record failure');
      throw err;
    }
  }, [eleveId, loadExercises]);

  const recordSuccess = useCallback(async (exerciseId: number, questionId?: string, score?: number) => {
    try {
      const result = await revisionService.recordSuccess(eleveId, {
        exerciceId: exerciseId,
        questionId,
        score
      });
      
      if (result.data) {
        // Refresh exercises after recording success
        await loadExercises();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record success');
      throw err;
    }
  }, [eleveId, loadExercises]);

  const postponeRevision = useCallback(async (revisionId: number, nouvelleDate: string, raison: string) => {
    try {
      const result = await revisionService.postponeRevision(revisionId, nouvelleDate, raison);
      
      if (result.data) {
        // Refresh exercises after postponing
        await loadExercises();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to postpone revision');
      throw err;
    }
  }, [loadExercises]);

  const cancelRevision = useCallback(async (revisionId: number, raison?: string) => {
    try {
      const result = await revisionService.cancelRevision(revisionId, raison);
      
      if (result.data) {
        // Refresh exercises after cancelling
        await loadExercises();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel revision');
      throw err;
    }
  }, [loadExercises]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  return {
    exercises,
    stats,
    loading,
    error,
    loadExercises,
    refreshStats,
    recordFailure,
    recordSuccess,
    postponeRevision,
    cancelRevision,
    // Utility functions from service
    calculateDisplayPriority: revisionService.calculateDisplayPriority.bind(revisionService),
    isOverdue: revisionService.isOverdue.bind(revisionService),
    formatDueDate: revisionService.formatDueDate.bind(revisionService),
    getPriorityColor: revisionService.getPriorityColor.bind(revisionService),
    getDifficultyIcon: revisionService.getDifficultyIcon.bind(revisionService),
    filterBySubject: revisionService.filterBySubject.bind(revisionService),
    sortByPriority: revisionService.sortByPriority.bind(revisionService),
    groupBySubject: revisionService.groupBySubject.bind(revisionService)
  };
}; 