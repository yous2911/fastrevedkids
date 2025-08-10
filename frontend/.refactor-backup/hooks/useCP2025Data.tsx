import React, { useState, useEffect, useMemo } from 'react';
import { CP2025Service, createCP2025Service, validateCP2025Data } from '../services/cp2025.service';
import { CP2025Data, CP2025Module, CP2025Exercise, Difficulte, TypeExercice } from '../types';

// ==========================================
// CP2025 DATA HOOK
// ==========================================

interface UseCP2025DataOptions {
  initialData?: CP2025Data;
  autoLoad?: boolean;
  dataUrl?: string;
}

interface UseCP2025DataReturn {
  // Service instance
  service: CP2025Service | null;
  
  // Data
  data: CP2025Data | null;
  modules: CP2025Module[];
  exercises: CP2025Exercise[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Service methods (wrapped for convenience)
  getModuleById: (id: number) => CP2025Module | undefined;
  getExercisesByModuleId: (moduleId: number) => CP2025Exercise[];
  getExercisesByDifficulty: (difficulte: Difficulte) => CP2025Exercise[];
  getExercisesByType: (type: TypeExercice) => CP2025Exercise[];
  getModuleExerciseProgression: (moduleId: number) => Record<Difficulte, CP2025Exercise[]>;
  
  // Actions
  loadData: (data: CP2025Data) => void;
  loadDataFromJSON: (jsonData: string) => void;
  clearData: () => void;
  
  // Statistics
  statistics: ReturnType<CP2025Service['getStatistics']> | null;
}

export function useCP2025Data(options: UseCP2025DataOptions = {}): UseCP2025DataReturn {
  const { initialData, autoLoad = false, dataUrl } = options;
  
  const [data, setData] = useState<CP2025Data | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create service instance
  const service = useMemo(() => {
    if (!data) return null;
    return createCP2025Service(data);
  }, [data]);

  // Extract modules and exercises
  const modules = useMemo(() => data?.modules || [], [data]);
  const exercises = useMemo(() => data?.exercises || [], [data]);

  // Statistics
  const statistics = useMemo(() => {
    if (!service) return null;
    return service.getStatistics();
  }, [service]);

  // Load data from URL
  useEffect(() => {
    if (!autoLoad || !dataUrl) return;

    const loadDataFromUrl = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        
        if (!validateCP2025Data(jsonData)) {
          throw new Error('Invalid CP2025 data structure');
        }
        
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromUrl();
  }, [autoLoad, dataUrl]);

  // Actions
  const loadData = (newData: CP2025Data) => {
    if (!validateCP2025Data(newData)) {
      setError('Invalid CP2025 data structure');
      return;
    }
    setData(newData);
    setError(null);
  };

  const loadDataFromJSON = (jsonData: string) => {
    try {
      const parsedData = JSON.parse(jsonData);
      loadData(parsedData);
    } catch (err) {
      setError('Invalid JSON data');
    }
  };

  const clearData = () => {
    setData(null);
    setError(null);
  };

  // Wrapped service methods
  const getModuleById = (id: number) => service?.getModuleById(id);
  const getExercisesByModuleId = (moduleId: number) => service?.getExercisesByModuleId(moduleId) || [];
  const getExercisesByDifficulty = (difficulte: Difficulte) => service?.getExercisesByDifficulty(difficulte) || [];
  const getExercisesByType = (type: TypeExercice) => service?.getExercisesByType(type) || [];
  const getModuleExerciseProgression = (moduleId: number) => service?.getModuleExerciseProgression(moduleId) || {
    decouverte: [],
    entrainement: [],
    maitrise: [],
    consolidation: [],
    approfondissement: []
  };

  return {
    service,
    data,
    modules,
    exercises,
    isLoading,
    error,
    getModuleById,
    getExercisesByModuleId,
    getExercisesByDifficulty,
    getExercisesByType,
    getModuleExerciseProgression,
    loadData,
    loadDataFromJSON,
    clearData,
    statistics
  };
}

// ==========================================
// SPECIALIZED HOOKS
// ==========================================

/**
 * Hook for working with a specific module
 */
export function useCP2025Module(moduleId: number, cp2025Data: UseCP2025DataReturn) {
  const module = cp2025Data.getModuleById(moduleId);
  const exercises = cp2025Data.getExercisesByModuleId(moduleId);
  const progression = cp2025Data.getModuleExerciseProgression(moduleId);

  return {
    module,
    exercises,
    progression,
    hasModule: !!module,
    exerciseCount: exercises.length
  };
}

/**
 * Hook for working with exercises of a specific difficulty
 */
export function useCP2025ExercisesByDifficulty(difficulte: Difficulte, cp2025Data: UseCP2025DataReturn) {
  const exercises = cp2025Data.getExercisesByDifficulty(difficulte);
  
  return {
    exercises,
    count: exercises.length,
    byType: exercises.reduce((acc, exercise) => {
      acc[exercise.type] = (acc[exercise.type] || 0) + 1;
      return acc;
    }, {} as Record<TypeExercice, number>)
  };
}

/**
 * Hook for working with exercises of a specific type
 */
export function useCP2025ExercisesByType(type: TypeExercice, cp2025Data: UseCP2025DataReturn) {
  const exercises = cp2025Data.getExercisesByType(type);
  
  return {
    exercises,
    count: exercises.length,
    byDifficulty: exercises.reduce((acc, exercise) => {
      acc[exercise.difficulte] = (acc[exercise.difficulte] || 0) + 1;
      return acc;
    }, {} as Record<Difficulte, number>)
  };
} 