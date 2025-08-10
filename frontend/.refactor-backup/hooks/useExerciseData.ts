import { useState, useEffect } from 'react';
import { exerciseService, Exercise } from '../services/exercise.service';
import { studentService } from '../services/student.service';
import { useAuth } from './useAuth';

export function useExerciseData() {
  const { student } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recommendations, setRecommendations] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recommended exercises for student
  useEffect(() => {
    if (student) {
      loadRecommendations();
    }
  }, [student]);

  const loadRecommendations = async () => {
    if (!student) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentService.getRecommendations(student.id, {
        limit: 10,
        niveau: student.niveauActuel
      });
      
      if (response.success && response.data) {
        setRecommendations(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesBySubject = async (subjectId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await exerciseService.getExercisesBySubject(subjectId);
      
      if (response.success && response.data) {
        setExercises(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const submitExerciseResult = async (exerciseId: number, attempt: any) => {
    if (!student) return false;
    
    try {
      const response = await studentService.submitAttempt(student.id, exerciseId, attempt);
      return response.success;
    } catch (err) {
      console.error('Failed to submit exercise result:', err);
      return false;
    }
  };

  const getRandomExercise = async (options: {
    niveau?: string;
    matiere?: string;
    type?: string;
    difficulte?: string;
  } = {}) => {
    try {
      const response = await exerciseService.getRandomExercise(options);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to get random exercise:', err);
      return null;
    }
  };

  const searchExercises = async (query: string, options: {
    matiere?: string;
    niveau?: string;
    type?: string;
    limit?: number;
  } = {}) => {
    try {
      setLoading(true);
      const response = await exerciseService.searchExercises(query, options);
      
      if (response.success && response.data) {
        setExercises(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de recherche');
    } finally {
      setLoading(false);
    }
  };

  const validateAnswer = async (exerciseId: number, answer: any) => {
    try {
      const response = await exerciseService.validateAnswer(exerciseId, answer);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to validate answer:', err);
      return null;
    }
  };

  const getExerciseHints = async (exerciseId: number) => {
    try {
      const response = await exerciseService.getHints(exerciseId);
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Failed to get hints:', err);
      return [];
    }
  };

  return {
    exercises,
    recommendations,
    loading,
    error,
    loadRecommendations,
    loadExercisesBySubject,
    submitExerciseResult,
    getRandomExercise,
    searchExercises,
    validateAnswer,
    getExerciseHints
  };
} 