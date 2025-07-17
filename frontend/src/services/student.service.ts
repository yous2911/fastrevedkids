import { apiService } from './api.service';
import { 
  ApiResponse, 
  Eleve, 
  ExercicePedagogique, 
  TentativeExercice, 
  TentativeResponse,
  ValidationError
} from '../types/api.types';

export interface StudentProgress {
  exerciceId: number;
  statut: 'NOUVEAU' | 'EN_COURS' | 'ACQUIS' | 'DIFFICILE';
  nombreTentatives: number;
  nombreReussites: number;
  derniereTentative?: string;
  moyenneTemps: number;
  progression: number;
}

export interface StudentSession {
  id: number;
  eleveId: number;
  dateDebut: string;
  dateFin?: string;
  dureeMinutes: number;
  exercicesReussis: number;
  exercicesTentes: number;
  pointsGagnes: number;
  tauxReussite: number;
}

export interface StudentDashboard {
  eleve: Eleve;
  stats: {
    totalExercises: number;
    completedExercises: number;
    successRate: number;
    totalTime: number;
    streak: number;
  };
  recentProgress: StudentProgress[];
  recommendations: ExercicePedagogique[];
  achievements: any[];
}

export class StudentService {
  private readonly basePath = '/eleves';

  // Get student by ID
  async getStudent(studentId: number): Promise<ApiResponse<Eleve>> {
    return apiService.get<Eleve>(`${this.basePath}/${studentId}`);
  }

  // Get student dashboard with all relevant data
  async getStudentDashboard(studentId: number): Promise<ApiResponse<StudentDashboard>> {
    return apiService.get<StudentDashboard>(
      `${this.basePath}/${studentId}/dashboard`,
      { cache: true }
    );
  }

  // Get student progress for specific exercises
  async getStudentProgress(studentId: number, exerciseIds?: number[]): Promise<ApiResponse<StudentProgress[]>> {
    const params = exerciseIds ? `?exercices=${exerciseIds.join(',')}` : '';
    return apiService.get<StudentProgress[]>(
      `${this.basePath}/${studentId}/progression${params}`,
      { cache: true }
    );
  }

  // Get recommended exercises for student
  async getRecommendations(studentId: number, limit: number = 5): Promise<ApiResponse<ExercicePedagogique[]>> {
    return apiService.get<ExercicePedagogique[]>(
      `${this.basePath}/${studentId}/recommendations?limite=${limit}`,
      { cache: true }
    );
  }

  // Submit exercise attempt
  async submitExerciseAttempt(
    studentId: number, 
    exerciseId: number, 
    attempt: TentativeExercice
  ): Promise<TentativeResponse> {
    // Enhanced validation with proper error handling
    this.validateAttempt(attempt);

    const payload = {
      exerciceId: exerciseId,
      tentative: attempt
    };

    const response = await apiService.post<TentativeResponse['data']>(
      `${this.basePath}/${studentId}/exercices`,
      payload,
      { timeout: 15000, retries: 2 } // Longer timeout for exercise submission
    );

    return response as TentativeResponse;
  }

  // Get student sessions history
  async getStudentSessions(
    studentId: number, 
    limit: number = 10,
    offset: number = 0
  ): Promise<ApiResponse<{ sessions: StudentSession[]; total: number }>> {
    return apiService.get(
      `${this.basePath}/${studentId}/sessions?limite=${limit}&offset=${offset}`
    );
  }

  // Update student profile
  async updateStudentProfile(studentId: number, updates: Partial<Eleve>): Promise<ApiResponse<Eleve>> {
    // Remove readonly fields
    const { id, createdAt, updatedAt, ...allowedUpdates } = updates;
    
    return apiService.put<Eleve>(
      `${this.basePath}/${studentId}`,
      allowedUpdates
    );
  }

  // Create new student
  async createStudent(studentData: Omit<Eleve, 'id' | 'totalPoints' | 'serieJours' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Eleve>> {
    return apiService.post<Eleve>(this.basePath, studentData);
  }

  // Delete student
  async deleteStudent(studentId: number): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.basePath}/${studentId}`);
  }

  // Enhanced validation with proper error handling
  private validateAttempt(attempt: TentativeExercice): void {
    // Fix: Add proper type checking
    if (typeof attempt.reussi !== 'boolean') {
      throw new ValidationError('Le statut de réussite est requis', 'reussi');
    }
    
    // Fix: Ensure positive numbers only
    if (!Number.isFinite(attempt.tempsSecondes) || attempt.tempsSecondes < 0) {
      throw new ValidationError('Le temps de réponse doit être un nombre positif', 'tempsSecondes');
    }
    
    // Fix: Validate aids count
    if (!Number.isInteger(attempt.aidesUtilisees) || attempt.aidesUtilisees < 0) {
      throw new ValidationError('Le nombre d\'aides utilisées doit être un entier positif', 'aidesUtilisees');
    }
    
    // Fix: Better response validation
    if (attempt.reponse === undefined || attempt.reponse === null || attempt.reponse === '') {
      throw new ValidationError('Une réponse est requise', 'reponse');
    }
  }

  // Get student achievements
  async getStudentAchievements(studentId: number): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.basePath}/${studentId}/achievements`);
  }

  // Start new session
  async startSession(studentId: number): Promise<ApiResponse<{ sessionId: number }>> {
    return apiService.post(`${this.basePath}/${studentId}/sessions/start`);
  }

  // End current session
  async endSession(studentId: number, sessionId: number): Promise<ApiResponse<StudentSession>> {
    return apiService.post(`${this.basePath}/${studentId}/sessions/${sessionId}/end`);
  }
}

export const studentService = new StudentService(); 