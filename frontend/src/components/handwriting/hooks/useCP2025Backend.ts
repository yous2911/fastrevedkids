import { CompetenceEvaluation } from '../utils/EvaluationSystem';

// ==========================================
// BACKEND INTEGRATION CP 2025
// ==========================================

export interface CP2025ProgressData {
  studentId: string;
  competenceCode: string;
  exerciseId: string;
  evaluation: CompetenceEvaluation;
  timestamp: Date;
  sessionDuration: number;
  attempts: number;
}

export const useCP2025Backend = () => {
  const submitCompetenceResult = async (progressData: CP2025ProgressData) => {
    try {
      const response = await fetch('http://localhost:3001/api/competences/cp2025/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });
      
      const result = await response.json();
      console.log('📊 Progression CP 2025 enregistrée:', result);
      
      return result;
    } catch (error) {
      console.error('Erreur sauvegarde progression:', error);
      return { success: false };
    }
  };

  const getStudentCompetences = async (studentId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/competences/cp2025/student/${studentId}`);
      const data = await response.json();
      return data.competences || {};
    } catch (error) {
      console.error('Erreur récupération compétences:', error);
      return {};
    }
  };

  const getRecommendedExercises = async (studentId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/competences/cp2025/recommendations/${studentId}`);
      const data = await response.json();
      return data.exercises || [];
    } catch (error) {
      console.error('Erreur recommandations:', error);
      return [];
    }
  };

  return { 
    submitCompetenceResult, 
    getStudentCompetences, 
    getRecommendedExercises 
  };
}; 