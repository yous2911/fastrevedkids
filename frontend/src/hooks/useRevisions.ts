import { useState, useEffect, useCallback } from 'react';
import { revisionService, RevisionExercise, RevisionStats, RevisionFilters } from '../services/revision.service';

interface UseRevisionsOptions {
  eleveId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: RevisionFilters;
}

interface UseRevisionsReturn {
  // État
  exercises: RevisionExercise[];
  stats: RevisionStats | null;
  loading: boolean;
  error: string | null;
  selectedExercise: RevisionExercise | null;

  // Actions
  loadRevisions: () => Promise<void>;
  selectExercise: (exercise: RevisionExercise) => void;
  clearSelection: () => void;
  recordSuccess: (exerciseId: number, questionId?: string, tempsReponse?: number, score?: number) => Promise<void>;
  recordFailure: (exerciseId: number, questionId?: string, tempsReponse?: number, typeErreur?: string) => Promise<void>;
  postponeRevision: (revisionId: number, newDate: string) => Promise<void>;
  cancelRevision: (revisionId: number) => Promise<void>;
  
  // Utilitaires
  getOverdueExercises: () => RevisionExercise[];
  getHighPriorityExercises: () => RevisionExercise[];
  getExercisesBySubject: (subject: string) => RevisionExercise[];
  refreshStats: () => Promise<void>;
}

export const useRevisions = ({
  eleveId,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
  filters
}: UseRevisionsOptions): UseRevisionsReturn => {
  const [exercises, setExercises] = useState<RevisionExercise[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<RevisionExercise | null>(null);

  // Charger les révisions
  const loadRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [exercisesData, statsData] = await Promise.all([
        revisionService.getExercisesToRevise(eleveId, filters),
        revisionService.getRevisionStats(eleveId)
      ]);

      if (exercisesData.success && exercisesData.data) {
        setExercises(exercisesData.data.exercices || []);
      }

      if (statsData.success && statsData.data) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des révisions:', err);
      setError('Impossible de charger les révisions');
    } finally {
      setLoading(false);
    }
  }, [eleveId, filters]);

  // Actualiser les statistiques
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await revisionService.getRevisionStats(eleveId);
      if (statsData.success && statsData.data) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error('Erreur lors de l\'actualisation des statistiques:', err);
    }
  }, [eleveId]);

  // Enregistrer une réussite
  const recordSuccess = useCallback(async (
    exerciseId: number, 
    questionId?: string, 
    tempsReponse?: number, 
    score?: number
  ) => {
    try {
      await revisionService.recordSuccess(eleveId, {
        exerciceId: exerciseId,
        questionId,
        tempsReponse,
        score
      });

      // Recharger les données
      await loadRevisions();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la réussite:', err);
      throw err;
    }
  }, [eleveId, loadRevisions]);

  // Enregistrer un échec
  const recordFailure = useCallback(async (
    exerciseId: number, 
    questionId?: string, 
    tempsReponse?: number, 
    typeErreur?: string
  ) => {
    try {
      await revisionService.recordFailure(eleveId, {
        exerciceId: exerciseId,
        questionId,
        tempsReponse,
        typeErreur: typeErreur as any
      });

      // Recharger les données
      await loadRevisions();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'échec:', err);
      throw err;
    }
  }, [eleveId, loadRevisions]);

  // Reporter une révision
  const postponeRevision = useCallback(async (revisionId: number, newDate: string) => {
    try {
      await revisionService.postponeRevision(revisionId, newDate, 'Reporté par l\'élève');
      await loadRevisions();
    } catch (err) {
      console.error('Erreur lors du report de la révision:', err);
      throw err;
    }
  }, [loadRevisions]);

  // Annuler une révision
  const cancelRevision = useCallback(async (revisionId: number) => {
    try {
      await revisionService.cancelRevision(revisionId, 'Annulé par l\'élève');
      await loadRevisions();
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la révision:', err);
      throw err;
    }
  }, [loadRevisions]);

  // Sélectionner un exercice
  const selectExercise = useCallback((exercise: RevisionExercise) => {
    setSelectedExercise(exercise);
  }, []);

  // Effacer la sélection
  const clearSelection = useCallback(() => {
    setSelectedExercise(null);
  }, []);

  // Obtenir les exercices en retard
  const getOverdueExercises = useCallback(() => {
    return exercises.filter(exercise => {
      const now = new Date();
      const dueDate = new Date(exercise.datePrevue);
      return dueDate < now;
    });
  }, [exercises]);

  // Obtenir les exercices haute priorité
  const getHighPriorityExercises = useCallback(() => {
    return exercises.filter(exercise => exercise.priorite >= 30);
  }, [exercises]);

  // Obtenir les exercices par matière
  const getExercisesBySubject = useCallback((subject: string) => {
    return exercises.filter(exercise => 
      exercise.exercice.matiere.toLowerCase() === subject.toLowerCase()
    );
  }, [exercises]);

  // Effet initial et auto-refresh
  useEffect(() => {
    loadRevisions();

    if (autoRefresh) {
      const interval = setInterval(loadRevisions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadRevisions, autoRefresh, refreshInterval]);

  return {
    // État
    exercises,
    stats,
    loading,
    error,
    selectedExercise,

    // Actions
    loadRevisions,
    selectExercise,
    clearSelection,
    recordSuccess,
    recordFailure,
    postponeRevision,
    cancelRevision,

    // Utilitaires
    getOverdueExercises,
    getHighPriorityExercises,
    getExercisesBySubject,
    refreshStats
  };
}; 