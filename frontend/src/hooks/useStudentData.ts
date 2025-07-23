import { useState, useEffect, useCallback } from 'react';
import { TentativeExercice, TentativeResponse } from '../types/api.types';

interface StudentData {
  id: string;
  name: string;
  age: number;
  grade: string;
  avatar: string;
  xp: number;
  level: number;
  achievements: string[];
  preferences: {
    soundEnabled: boolean;
    hapticEnabled: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

export const useStudentData = (studentId?: number) => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load student data from localStorage or API
    const loadStudentData = async () => {
      try {
        setLoading(true);
        
        // Try to get from localStorage first
        const storedData = localStorage.getItem('studentData');
        if (storedData) {
          setStudentData(JSON.parse(storedData));
        } else {
          // Create default student data
          const defaultData: StudentData = {
            id: '1',
            name: 'Student',
            age: 8,
            grade: 'CP',
            avatar: '/avatars/default.png',
            xp: 0,
            level: 1,
            achievements: [],
            preferences: {
              soundEnabled: true,
              hapticEnabled: true,
              theme: 'light'
            }
          };
          
          setStudentData(defaultData);
          localStorage.setItem('studentData', JSON.stringify(defaultData));
        }
      } catch (err) {
        setError('Failed to load student data');
        console.error('Error loading student data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  const updateStudentData = (updates: Partial<StudentData>) => {
    if (studentData) {
      const updatedData = { ...studentData, ...updates };
      setStudentData(updatedData);
      localStorage.setItem('studentData', JSON.stringify(updatedData));
    }
  };

  const addXP = (amount: number) => {
    if (studentData) {
      const newXP = studentData.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      
      updateStudentData({
        xp: newXP,
        level: newLevel
      });
    }
  };

  const addAchievement = (achievement: string) => {
    if (studentData && !studentData.achievements.includes(achievement)) {
      updateStudentData({
        achievements: [...studentData.achievements, achievement]
      });
    }
  };

  const updatePreferences = (preferences: Partial<StudentData['preferences']>) => {
    if (studentData) {
      updateStudentData({
        preferences: { ...studentData.preferences, ...preferences }
      });
    }
  };

  // Add submitExercise function for ExerciseEngine
  const submitExercise = useCallback(async (exerciseId: number, attempt: TentativeExercice): Promise<TentativeResponse> => {
    // Mock implementation - replace with actual API call
    console.log('Submitting exercise:', { exerciseId, attempt, studentId });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return {
      success: true,
      data: {
        reussi: attempt.reussi,
        pointsGagnes: attempt.reussi ? 10 : 5,
        nouveauStatut: attempt.reussi ? 'completed' : 'attempted',
        tauxReussite: 85,
        nombreTentatives: 1,
        feedback: attempt.reussi ? 'Excellent travail !' : 'Continue tes efforts !',
        session: {
          exercicesReussis: attempt.reussi ? 1 : 0,
          exercicesTentes: 1,
          pointsTotal: attempt.reussi ? 10 : 5,
          tauxReussite: attempt.reussi ? 100 : 0
        }
      },
      message: 'Exercise submitted successfully'
    };
  }, [studentId]);

  return {
    studentData,
    loading,
    error,
    updateStudentData,
    addXP,
    addAchievement,
    updatePreferences,
    submitExercise,
    updateProfile: updateStudentData // Alias for updateProfile
  };
}; 