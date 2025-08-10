import { ApiService } from './api.service';
import { ApiResponse } from '../types/api.types';

export interface ProgressData {
  totalExercises?: number;
  correctAnswers?: number;
  currentStreak?: number;
  totalMagicPoints?: number;
  totalCrystals?: number;
  completedChallenges?: string[];
  mistakes?: number;
}

export interface MistakeData {
  challengeId: string;
  targetWord: string;
  attemptedAnswer: string;
  correctAnswer: string;
  mistakeType: 'assembly' | 'matching' | 'spelling' | 'pronunciation';
  difficulty: 'easy' | 'medium' | 'hard';
  period?: string;
  retryCount?: number;
  spacedRepetitionLevel?: number;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  totalExercises: number;
  correctAnswers: number;
  currentStreak: number;
  totalMagicPoints: number;
  totalCrystals: number;
  completedChallenges: string[];
  mistakes: number;
  createdAt: string;
  updatedAt: string;
}

class ProgressService extends ApiService {
  private basePath = '/progress';

  /**
   * Save student progress to backend
   */
  async saveProgress(studentId: string, data: ProgressData): Promise<ApiResponse<StudentProgress>> {
    console.log('🎮 Saving progress for student:', studentId, data);
    
    try {
      const response = await this.post<StudentProgress>(`${this.basePath}/${studentId}`, data);
      console.log('✅ Progress saved successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to save progress:', error);
      throw error;
    }
  }

  /**
   * Get student progress from backend
   */
  async getProgress(studentId: string): Promise<ApiResponse<StudentProgress>> {
    console.log('📊 Fetching progress for student:', studentId);
    
    try {
      const response = await this.get<StudentProgress>(`${this.basePath}/${studentId}`);
      console.log('✅ Progress fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch progress:', error);
      throw error;
    }
  }

  /**
   * Record a mistake for spaced repetition
   */
  async recordMistake(studentId: string, data: MistakeData): Promise<ApiResponse<any>> {
    console.log('❌ Recording mistake for student:', studentId, data);
    
    try {
      const response = await this.post(`${this.basePath}/${studentId}/mistakes`, data);
      console.log('✅ Mistake recorded successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to record mistake:', error);
      throw error;
    }
  }

  /**
   * Update student progress (alias for saveProgress)
   */
  async updateStudentProgress(studentId: string, data: ProgressData): Promise<ApiResponse<StudentProgress>> {
    return this.saveProgress(studentId, data);
  }

  /**
   * Get student statistics
   */
  async getStudentStats(studentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.get(`${this.basePath}/${studentId}/stats`);
      console.log('📈 Student stats fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch student stats:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on student progress
   */
  async getRecommendations(studentId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.get(`${this.basePath}/${studentId}/recommendations`);
      console.log('🎯 Recommendations fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch recommendations:', error);
      throw error;
    }
  }
}

export const progressService = new ProgressService(); 