import { apiService } from './api.service';
import { ApiResponse, ExercicePedagogique } from '../types/api.types';
import { adaptiveLearningService, StudentProgress, AdaptiveMetrics } from './adaptive-learning.service';

export interface Exercise extends ExercicePedagogique {
  titre: string;
  consigne: string;
  pointsReussite: number;
  dureeEstimee: number;
  ordre: number;
  moduleTitle?: string;
  moduleMatiere?: string;
}

export interface ExerciseAttempt {
  exerciseId: number;
  answer: any;
  timeSpent: number;
  attempts: number;
  completed: boolean;
  exerciseType?: string;
  typeErreur?: string;
}

export interface AdaptiveExerciseResponse {
  exercise: Exercise;
  adaptiveMetrics: AdaptiveMetrics;
  recommendedNext: Exercise[];
  prerequisites?: any[];
}

export class ExerciseService {
  private studentProgress: StudentProgress[] = [];

  /**
   * Get exercises with adaptive learning recommendations
   */
  async getAdaptiveExercises(
    studentId: number, 
    targetConcept?: string,
    count: number = 5
  ): Promise<AdaptiveExerciseResponse> {
    try {
      // Get student progress for adaptive calculations
      const progress = await this.getStudentProgress(studentId);
      this.studentProgress = progress;

      // Get available exercises
      const response = await apiService.get<ApiResponse<Exercise[]>>('/exercises');
      const availableExercises = (response.data || []) as ExercicePedagogique[];

      if (targetConcept) {
        // Generate adaptive sequence for specific concept
        const adaptiveSequence = adaptiveLearningService.generateAdaptiveSequence(
          studentId,
          targetConcept,
          this.studentProgress,
          availableExercises
        );

        const currentExercise = adaptiveSequence[0] as Exercise;
        const adaptiveMetrics = adaptiveLearningService.calculateAdaptiveDifficulty(
          this.studentProgress,
          currentExercise
        );

        return {
          exercise: currentExercise,
          adaptiveMetrics,
          recommendedNext: adaptiveSequence.slice(1, count + 1) as Exercise[],
          prerequisites: adaptiveLearningService.checkPrerequisites(targetConcept, this.studentProgress)
        };
      } else {
        // Get recommended exercises based on current performance
        const recommendedExercises = await this.getRecommendedExercises(studentId, count);
        
        if (recommendedExercises.length > 0) {
          const currentExercise = recommendedExercises[0];
          const adaptiveMetrics = adaptiveLearningService.calculateAdaptiveDifficulty(
            this.studentProgress,
            currentExercise
          );

          return {
            exercise: currentExercise,
            adaptiveMetrics,
            recommendedNext: recommendedExercises.slice(1)
          };
        }
      }

      throw new Error('No exercises available');
    } catch (error) {
      console.error('Error getting adaptive exercises:', error);
      throw error;
    }
  }

  /**
   * Submit exercise attempt with adaptive learning feedback
   */
  async submitExerciseAttempt(attempt: ExerciseAttempt): Promise<any> {
    try {
      // Submit to backend
      const response = await apiService.post('/exercises/submit', attempt);
      
      // Update local progress for adaptive calculations
      this.updateLocalProgress(attempt);
      
      // Get adaptive recommendations for next exercise
      const adaptiveMetrics = this.getAdaptiveMetricsForExercise(attempt.exerciseId);
      
      return {
        ...response.data,
        adaptiveMetrics,
        recommendedAdjustment: adaptiveMetrics.recommendedAdjustment
      };
    } catch (error) {
      console.error('Error submitting exercise attempt:', error);
      throw error;
    }
  }

  /**
   * Get student progress for adaptive learning
   */
  private async getStudentProgress(studentId: number): Promise<StudentProgress[]> {
    try {
      const response = await apiService.get<ApiResponse<StudentProgress[]>>(`/students/${studentId}/progress`);
      return (response.data || []) as StudentProgress[];
    } catch (error) {
      console.error('Error getting student progress:', error);
      return [];
    }
  }

  /**
   * Get recommended exercises from backend
   */
  private async getRecommendedExercises(studentId: number, count: number): Promise<Exercise[]> {
    try {
      const response = await apiService.get<ApiResponse<Exercise[]>>(`/exercises/recommended?studentId=${studentId}&limit=${count}`);
      return (response.data || []) as Exercise[];
    } catch (error) {
      console.error('Error getting recommended exercises:', error);
      return [];
    }
  }

  /**
   * Update local progress for adaptive calculations
   */
  private updateLocalProgress(attempt: ExerciseAttempt): void {
    const existingProgress = this.studentProgress.find(p => p.exerciceId === attempt.exerciseId);
    
    if (existingProgress) {
      existingProgress.nombreTentatives += 1;
      existingProgress.historique = existingProgress.historique || [];
      existingProgress.historique.unshift({
        timestamp: new Date().toISOString(),
        reussi: attempt.completed,
        tempsReponse: attempt.timeSpent,
        typeErreur: attempt.typeErreur,
        completed: attempt.completed,
        exerciseType: attempt.exerciseType
      });
    } else {
      this.studentProgress.push({
        exerciceId: attempt.exerciseId,
        statut: attempt.completed ? 'TERMINE' : 'EN_COURS',
        nombreTentatives: 1,
        tauxReussite: attempt.completed ? 1 : 0,
        historique: [{
          timestamp: new Date().toISOString(),
          reussi: attempt.completed,
          tempsReponse: attempt.timeSpent,
          typeErreur: attempt.typeErreur,
          completed: attempt.completed,
          exerciseType: attempt.exerciseType
        }]
      });
    }
  }

  /**
   * Get adaptive metrics for a specific exercise
   */
  private getAdaptiveMetricsForExercise(exerciseId: number): AdaptiveMetrics {
    const exercise = this.findExerciseById(exerciseId);
    if (!exercise) {
      return {
        currentDifficulty: 3,
        optimalDifficulty: 3,
        performanceTrend: 'stable',
        learningVelocity: 1,
        frustrationIndex: 0,
        engagementScore: 0.5,
        recommendedAdjustment: 'maintain'
      };
    }

    return adaptiveLearningService.calculateAdaptiveDifficulty(this.studentProgress, exercise);
  }

  /**
   * Find exercise by ID (mock implementation)
   */
  private findExerciseById(exerciseId: number): any {
    // This would typically come from a cache or API call
    return {
      id: exerciseId,
      difficulte: 'MOYEN'
    };
  }

  /**
   * Get adaptive learning insights for dashboard
   */
  getAdaptiveInsights(): any {
    if (this.studentProgress.length === 0) {
      return {
        masteryLevel: 0,
        learningVelocity: 1,
        frustrationIndex: 0,
        engagementScore: 0.5,
        recommendedConcepts: []
      };
    }

    const recentProgress = this.studentProgress.slice(0, 10);
    const avgSuccessRate = recentProgress.reduce((sum, p) => sum + (p.tauxReussite || 0), 0) / recentProgress.length;
    
    return {
      masteryLevel: avgSuccessRate * 100,
      learningVelocity: adaptiveLearningService.calculateLearningVelocity(this.studentProgress),
      frustrationIndex: this.calculateFrustrationIndex(),
      engagementScore: this.calculateEngagementScore(),
      recommendedConcepts: this.getRecommendedConcepts()
    };
  }

  private calculateFrustrationIndex(): number {
    const recentAttempts = this.studentProgress
      .flatMap(p => p.historique || [])
      .slice(0, 20);
    
    const consecutiveErrors = this.getConsecutiveErrors(recentAttempts);
    return Math.min(1, consecutiveErrors * 0.2);
  }

  private calculateEngagementScore(): number {
    const recentAttempts = this.studentProgress
      .flatMap(p => p.historique || [])
      .slice(0, 20);
    
    const completionRate = recentAttempts.filter(a => a.completed).length / Math.max(1, recentAttempts.length);
    return completionRate;
  }

  private getConsecutiveErrors(attempts: any[]): number {
    let CONSECUTIVE = 0;
    for (const attempt of attempts) {
      if (!attempt.reussi) {
        CONSECUTIVE++;
      } else {
        break;
      }
    }
    return CONSECUTIVE;
  }

  private getRecommendedConcepts(): string[] {
    // Analyze progress to recommend concepts to focus on
    const weakConcepts = this.studentProgress
      .filter(p => p.tauxReussite < 0.7)
      .map(p => p.exerciceId.toString());
    
    return weakConcepts.slice(0, 3);
  }

  /**
   * Get exercises by subject
   */
  async getExercisesBySubject(subjectId: number): Promise<ApiResponse<Exercise[]>> {
    try {
      const response = await apiService.get(`/exercises/subject/${subjectId}`);
      return response;
    } catch (error) {
      console.error('Error getting exercises by subject:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to get exercises by subject'
      };
    }
  }

  /**
   * Get random exercise
   */
  async getRandomExercise(options: { niveau?: string; matiere?: string; type?: string; difficulte?: string } = {}): Promise<ApiResponse<Exercise[]>> {
    try {
      const params = new URLSearchParams();
      if (options.niveau) params.append('niveau', options.niveau);
      if (options.matiere) params.append('matiere', options.matiere);
      if (options.type) params.append('type', options.type);
      if (options.difficulte) params.append('difficulte', options.difficulte);
      
      const response = await apiService.get(`/exercises/random?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting random exercise:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to get random exercise'
      };
    }
  }

  /**
   * Search exercises
   */
  async searchExercises(query: string, options: { matiere?: string; niveau?: string; type?: string; limit?: number } = {}): Promise<ApiResponse<Exercise[]>> {
    try {
      const params = new URLSearchParams({ query });
      if (options.matiere) params.append('matiere', options.matiere);
      if (options.niveau) params.append('niveau', options.niveau);
      if (options.type) params.append('type', options.type);
      if (options.limit) params.append('limit', options.limit.toString());
      
      const response = await apiService.get(`/exercises/search?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error searching exercises:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to search exercises'
      };
    }
  }

  /**
   * Validate answer
   */
  async validateAnswer(exerciseId: number, answer: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.post<ApiResponse<any>>(`/exercises/${exerciseId}/validate`, { answer });
      return response;
    } catch (error) {
      console.error('Error validating answer:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to validate answer'
      };
    }
  }

  /**
   * Get hints for exercise
   */
  async getHints(exerciseId: number): Promise<ApiResponse<string[]>> {
    try {
      const response = await apiService.get(`/exercises/${exerciseId}/hints`);
      return response;
    } catch (error) {
      console.error('Error getting hints:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to get hints'
      };
    }
  }
}

export const exerciseService = new ExerciseService(); 