import { apiService } from './api.service';
import { ApiResponse } from '../types/api.types';

export interface Student {
  id: number;
  prenom: string;
  nom: string;
  niveauActuel: string;
  age: number;
  totalPoints: number;
  serieJours: number;
  preferences: any;
  dernierAcces: string;
  estConnecte: boolean;
}

export interface ExerciseAttempt {
  reponse: any;
  reussi: boolean;
  tempsSecondes: number;
  aidesUtilisees?: number;
}

export class StudentService {
  private basePath = '/students';

  // Login student
  async login(prenom: string, nom: string): Promise<ApiResponse<{ token: string; student: Student }>> {
    return apiService.post('/auth/login', { prenom, nom });
  }

  // Get student info
  async getStudent(studentId: number): Promise<ApiResponse<Student>> {
    return apiService.get(`${this.basePath}/${studentId}`);
  }

  // Get recommendations
  async getRecommendations(studentId: number, options: {
    limit?: number;
    niveau?: string;
    matiere?: string;
  } = {}): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.niveau) params.set('niveau', options.niveau);
    if (options.matiere) params.set('matiere', options.matiere);
    
    return apiService.get(`${this.basePath}/${studentId}/recommendations?${params}`);
  }

  // Submit exercise attempt
  async submitAttempt(
    studentId: number, 
    exerciseId: number, 
    attempt: ExerciseAttempt
  ): Promise<ApiResponse<any>> {
    return apiService.post(`${this.basePath}/${studentId}/attempts`, {
      exerciseId,
      attempt
    });
  }

  // Get student progress
  async getProgress(studentId: number, options: {
    matiere?: string;
    limit?: number;
  } = {}): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (options.matiere) params.set('matiere', options.matiere);
    if (options.limit) params.set('limit', options.limit.toString());
    
    return apiService.get(`${this.basePath}/${studentId}/progress?${params}`);
  }

  // Update student preferences
  async updatePreferences(studentId: number, preferences: any): Promise<ApiResponse<Student>> {
    return apiService.put(`${this.basePath}/${studentId}/preferences`, { preferences });
  }

  // Get student statistics
  async getStatistics(studentId: number): Promise<ApiResponse<any>> {
    return apiService.get(`${this.basePath}/${studentId}/statistics`);
  }

  // Get student achievements
  async getAchievements(studentId: number): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.basePath}/${studentId}/achievements`);
  }

  // Update student level
  async updateLevel(studentId: number, newLevel: string): Promise<ApiResponse<Student>> {
    return apiService.put(`${this.basePath}/${studentId}/level`, { niveauActuel: newLevel });
  }

  // Get student's learning streak
  async getStreak(studentId: number): Promise<ApiResponse<{ serieJours: number; lastActivity: string }>> {
    return apiService.get(`${this.basePath}/${studentId}/streak`);
  }

  // Log student activity
  async logActivity(studentId: number, activity: {
    type: string;
    details?: any;
    duration?: number;
  }): Promise<ApiResponse<any>> {
    return apiService.post(`${this.basePath}/${studentId}/activity`, activity);
  }
}

export const studentService = new StudentService(); 