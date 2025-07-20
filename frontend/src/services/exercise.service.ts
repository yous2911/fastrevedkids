import { apiService } from './api.service';
import { ApiResponse } from '../types/api.types';

export interface Exercise {
  id: number;
  titre: string;
  consigne: string;
  type: string;
  difficulte: string;
  pointsReussite: number;
  dureeEstimee: number;
  ordre: number;
  configuration: any;
  moduleTitle?: string;
  moduleMatiere?: string;
}

export interface Subject {
  id: number;
  nom: string;
  description: string;
  niveau: string;
  couleur: string;
  icone: string;
  ordre: number;
}

export interface Chapter {
  id: number;
  titre: string;
  description: string;
  ordre: number;
  matiereId: number;
  exercices: Exercise[];
}

export class ExerciseService {
  private basePath = '/subjects';

  // Get exercises by subject
  async getExercisesBySubject(subjectId: number): Promise<ApiResponse<Exercise[]>> {
    return apiService.get(`${this.basePath}/${subjectId}/exercises`);
  }

  // Get all subjects
  async getSubjects(): Promise<ApiResponse<Subject[]>> {
    return apiService.get(this.basePath, { cache: true });
  }

  // Get chapters by subject
  async getChaptersBySubject(subjectId: number): Promise<ApiResponse<Chapter[]>> {
    return apiService.get(`${this.basePath}/${subjectId}/chapters`, { cache: true });
  }

  // Get exercise by ID
  async getExercise(exerciseId: number): Promise<ApiResponse<Exercise>> {
    return apiService.get(`/exercises/${exerciseId}`);
  }

  // Get exercises by difficulty
  async getExercisesByDifficulty(difficulty: string, limit: number = 10): Promise<ApiResponse<Exercise[]>> {
    return apiService.get(`/exercises?difficulte=${difficulty}&limit=${limit}`);
  }

  // Get exercises by type
  async getExercisesByType(type: string, limit: number = 10): Promise<ApiResponse<Exercise[]>> {
    return apiService.get(`/exercises?type=${type}&limit=${limit}`);
  }

  // Get random exercise
  async getRandomExercise(options: {
    niveau?: string;
    matiere?: string;
    type?: string;
    difficulte?: string;
  } = {}): Promise<ApiResponse<Exercise>> {
    const params = new URLSearchParams();
    if (options.niveau) params.set('niveau', options.niveau);
    if (options.matiere) params.set('matiere', options.matiere);
    if (options.type) params.set('type', options.type);
    if (options.difficulte) params.set('difficulte', options.difficulte);
    
    return apiService.get(`/exercises/random?${params}`);
  }

  // Get exercise statistics
  async getExerciseStats(exerciseId: number): Promise<ApiResponse<any>> {
    return apiService.get(`/exercises/${exerciseId}/stats`);
  }

  // Search exercises
  async searchExercises(query: string, options: {
    matiere?: string;
    niveau?: string;
    type?: string;
    limit?: number;
  } = {}): Promise<ApiResponse<Exercise[]>> {
    const params = new URLSearchParams({ q: query });
    if (options.matiere) params.set('matiere', options.matiere);
    if (options.niveau) params.set('niveau', options.niveau);
    if (options.type) params.set('type', options.type);
    if (options.limit) params.set('limit', options.limit.toString());
    
    return apiService.get(`/exercises/search?${params}`);
  }

  // Get exercise categories
  async getExerciseCategories(): Promise<ApiResponse<any[]>> {
    return apiService.get('/exercises/categories', { cache: true });
  }

  // Get exercise types
  async getExerciseTypes(): Promise<ApiResponse<string[]>> {
    return apiService.get('/exercises/types', { cache: true });
  }

  // Get difficulty levels
  async getDifficultyLevels(): Promise<ApiResponse<string[]>> {
    return apiService.get('/exercises/difficulties', { cache: true });
  }

  // Validate exercise answer
  async validateAnswer(exerciseId: number, answer: any): Promise<ApiResponse<{
    correct: boolean;
    feedback?: string;
    points?: number;
    solution?: any;
  }>> {
    return apiService.post(`/exercises/${exerciseId}/validate`, { answer });
  }

  // Get exercise hints
  async getHints(exerciseId: number): Promise<ApiResponse<string[]>> {
    return apiService.get(`/exercises/${exerciseId}/hints`);
  }

  // Get exercise solution
  async getSolution(exerciseId: number): Promise<ApiResponse<any>> {
    return apiService.get(`/exercises/${exerciseId}/solution`);
  }
}

export const exerciseService = new ExerciseService(); 