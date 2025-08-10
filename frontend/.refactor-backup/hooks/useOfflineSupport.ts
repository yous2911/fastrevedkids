import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

interface OfflineData {
  exercises: any[];
  progress: any[];
  lastSync: string;
}

export function useOfflineSupport() {
  const { state, addPendingOperation } = useApp();
  const [offlineData, setOfflineData] = useState<OfflineData>({
    exercises: [],
    progress: [],
    lastSync: ''
  });

  // Check if we're online
  const isOnline = state.online;

  // Save data for offline use
  const saveOfflineData = useCallback((key: string, data: any) => {
    try {
      const offlineStore = JSON.parse(localStorage.getItem('offline_data') || '{}');
      offlineStore[key] = {
        data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('offline_data', JSON.stringify(offlineStore));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, []);

  // Load offline data
  const loadOfflineData = useCallback((key: string) => {
    try {
      const offlineStore = JSON.parse(localStorage.getItem('offline_data') || '{}');
      return offlineStore[key]?.data || null;
    } catch (error) {
      console.error('Failed to load offline data:', error);
      return null;
    }
  }, []);

  // Queue operation for when we're back online
  const queueOfflineOperation = useCallback((operation: any) => {
    addPendingOperation({
      ...operation,
      type: 'offline_operation',
      timestamp: new Date().toISOString()
    });
  }, [addPendingOperation]);

  // Simulate exercise submission offline
  const submitExerciseOffline = useCallback((exerciseId: number, attempt: any) => {
    const offlineResult = {
      success: true,
      data: {
        reussi: true, // Optimistic update
        pointsGagnes: 10,
        nouveauStatut: 'OFFLINE_PENDING',
        tauxReussite: 100,
        nombreTentatives: 1,
        session: {
          exercicesReussis: 1,
          exercicesTentes: 1,
          pointsTotal: 10,
          tauxReussite: 100
        }
      },
      message: 'Réponse sauvegardée hors ligne'
    };

    // Queue for sync when online
    queueOfflineOperation({
      type: 'exercise_submission',
      exerciseId,
      attempt,
      studentId: state.currentStudent?.id
    });

    return Promise.resolve(offlineResult);
  }, [state.currentStudent, queueOfflineOperation]);

  // Load cached data on mount
  useEffect(() => {
    const cached = loadOfflineData('app_data');
    if (cached) {
      setOfflineData(cached);
    }
  }, [loadOfflineData]);

  return {
    isOnline,
    offlineData,
    saveOfflineData,
    loadOfflineData,
    submitExerciseOffline,
    queueOfflineOperation
  };
} 