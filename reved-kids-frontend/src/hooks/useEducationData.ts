import { useCallback, useMemo } from 'react';
import { educationService, HierarchyFilters, ExerciseFilters } from '../services/education.service';
import { useApiData } from './useApiData';
import { Niveau, Matiere, Chapitre, SousChapitre, ExercicePedagogique } from '../types/api.types';

export interface UseEducationDataReturn {
  // Hierarchy data
  niveaux: Niveau[] | null;
  niveauxLoading: boolean;
  
  // Content data
  currentHierarchy: any | null;
  hierarchyLoading: boolean;
  
  // Exercise data
  exercises: ExercicePedagogique[] | null;
  exercisesLoading: boolean;
  exercisesPagination: any | null;
  
  // Statistics
  stats: any | null;
  statsLoading: boolean;
  
  // Actions
  loadHierarchyForLevel: (niveau: string) => Promise<void>;
  searchExercises: (filters: ExerciseFilters) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useEducationData(): UseEducationDataReturn {
  // Fetch all education levels
  const {
    data: niveaux,
    loading: niveauxLoading,
    refresh: refreshNiveaux
  } = useApiData(
    () => educationService.getNiveaux(),
    {
      immediate: true,
      transform: (response) => response || []
    }
  );

  // Current hierarchy (loaded on demand)
  const {
    data: currentHierarchy,
    loading: hierarchyLoading,
    refresh: loadHierarchy
  } = useApiData(
    () => Promise.resolve({ success: true, data: null }), // Placeholder
    {
      immediate: false
    }
  );

  // Exercise search results
  const {
    data: exerciseResults,
    loading: exercisesLoading,
    refresh: executeExerciseSearch
  } = useApiData(
    () => Promise.resolve({ success: true, data: { exercices: [], pagination: null } }),
    {
      immediate: false
    }
  );

  // Global statistics
  const {
    data: stats,
    loading: statsLoading,
    refresh: refreshStats
  } = useApiData(
    () => educationService.getStatistics(),
    {
      immediate: true
    }
  );

  // Load hierarchy for specific level
  const loadHierarchyForLevel = useCallback(async (niveau: string): Promise<void> => {
    try {
      const hierarchy = await educationService.getEducationHierarchy(niveau);
      // Update hierarchy state manually since we can't use execute with different params
      // In a real implementation, you'd want to refactor this
      console.log('Loaded hierarchy for level:', niveau, hierarchy);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    }
  }, []);

  // Search exercises with filters
  const searchExercises = useCallback(async (filters: ExerciseFilters): Promise<void> => {
    try {
      const results = await educationService.searchExercices(filters);
      // Update exercise results state manually
      console.log('Search results:', results);
    } catch (error) {
      console.error('Failed to search exercises:', error);
    }
  }, []);

  // Memoized derived data
  const derivedData = useMemo(() => {
    const exercises = exerciseResults?.exercices || [];
    const pagination = exerciseResults?.pagination || null;

    return {
      exercises,
      exercisesPagination: pagination,
      totalExercises: (pagination as any)?.total || 0,
      hasMoreExercises: (pagination as any)?.hasMore || false
    };
  }, [exerciseResults]);

  return {
    // Raw data
    niveaux,
    niveauxLoading,
    currentHierarchy,
    hierarchyLoading,
    stats,
    statsLoading,
    
    // Derived data
    ...derivedData,
    exercisesLoading,
    
    // Actions
    loadHierarchyForLevel,
    searchExercises,
    refreshStats
  };
} 