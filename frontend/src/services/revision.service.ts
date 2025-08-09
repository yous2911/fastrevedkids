import { apiService } from './api.service';
import { ApiResponse } from '../types/api.types';

export interface RevisionExercise {
  revisionId: number;
  exercice: {
    id: number;
    titre: string;
    type: string;
    difficulte: number;
    pointsReussite: number;
    matiere: string;
    niveau: string;
  };
  questionId?: string;
  nombreEchecs: number;
  niveauDifficulte: number;
  datePrevue: string;
  priorite: number;
}

export interface RevisionStats {
  revisionsEnAttente: number;
  revisionsEffectuees: number;
  revisionsAnnulees: number;
  exercicesAReviserAujourdhui: number;
  totalRevisions: number;
  performance?: {
    tauxReussite: number;
    tempsMoyenSecondes: number;
    revisionsEffectueess: number;
    periode: string;
  };
  tendance?: 'amelioration' | 'stable' | 'deterioration';
}

export interface RevisionFilters {
  limite?: number;
  prioriteMin?: number;
  matiere?: 'maths' | 'francais' | 'sciences';
}

export interface FailureData {
  exerciceId: number;
  questionId?: string;
  tempsReponse?: number;
  typeErreur?: 'calcul' | 'comprehension' | 'attention' | 'methode';
  difficultePerçue?: number;
}

export interface SuccessData {
  exerciceId: number;
  questionId?: string;
  tempsReponse?: number;
  score?: number;
  aidesUtilisees?: number;
}

class RevisionService {
  private baseUrl = '/api/revisions';

  /**
   * Récupère les exercices à réviser pour un élève
   */
  async getExercisesToRevise(eleveId: number, filters?: RevisionFilters): Promise<{
    data: {
      exercices: RevisionExercise[];
      total: number;
      affiches: number;
      prochaineSuggestion: RevisionExercise | null;
    };
    message: string;
  }> {
    const params = new URLSearchParams();
    if (filters?.limite) params.append('limite', filters.limite.toString());
    if (filters?.prioriteMin) params.append('prioriteMin', filters.prioriteMin.toString());
    if (filters?.matiere) params.append('matiere', filters.matiere);

    const url = `${this.baseUrl}/eleve/${eleveId}/a-reviser${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await apiService.get(url);
    return {
      data: response.data || { exercices: [], total: 0, affiches: 0, prochaineSuggestion: null },
      message: response.message || 'Exercises retrieved successfully'
    };
  }

  /**
   * Récupère les statistiques de révision pour un élève
   */
  async getRevisionStats(eleveId: number, periode?: 'jour' | 'semaine' | 'mois'): Promise<{
    data: RevisionStats;
    message: string;
  }> {
    const params = new URLSearchParams();
    if (periode) params.append('periode', periode);

    const url = `${this.baseUrl}/eleve/${eleveId}/statistiques${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await apiService.get(url);
    return {
      data: response.data || {
        revisionsEnAttente: 0,
        revisionsEffectuees: 0,
        revisionsAnnulees: 0,
        exercicesAReviserAujourdhui: 0,
        totalRevisions: 0
      },
      message: response.message || 'Stats retrieved successfully'
    };
  }

  /**
   * Enregistre un échec et programme la révision
   */
  async recordFailure(eleveId: number, data: FailureData): Promise<{
    data: {
      revisionProgrammee: boolean;
      prochaineSuggestion: RevisionExercise[];
    };
    message: string;
  }> {
    const url = `${this.baseUrl}/eleve/${eleveId}/enregistrer-echec`;
    
    const response = await apiService.post(url, data);
    return {
      data: response.data || { revisionProgrammee: false, prochaineSuggestion: [] },
      message: response.message || 'Failure recorded successfully'
    };
  }

  /**
   * Enregistre une réussite et met à jour les révisions
   */
  async recordSuccess(eleveId: number, data: SuccessData): Promise<{
    data: {
      exerciceMaitrise: boolean;
      scoreObtenu: number | null;
      exercicesRestants: RevisionExercise[];
    };
    message: string;
  }> {
    const url = `${this.baseUrl}/eleve/${eleveId}/enregistrer-reussite`;
    
    const response = await apiService.post(url, data);
    return {
      data: response.data || { exerciceMaitrise: false, scoreObtenu: null, exercicesRestants: [] },
      message: response.message || 'Success recorded successfully'
    };
  }

  /**
   * Reporte une révision à une date ultérieure
   */
  async postponeRevision(revisionId: number, nouvelleDate: string, raison: string): Promise<{
    data: {
      nouvelleDate: string;
      raison: string;
      nombreReports: number;
    };
    message: string;
  }> {
    const url = `${this.baseUrl}/${revisionId}/reporter`;
    
    const response = await apiService.put(url, { nouvelleDate, raison });
    return {
      data: response.data || { nouvelleDate, raison, nombreReports: 0 },
      message: response.message || 'Revision postponed successfully'
    };
  }

  /**
   * Annule une révision programmée
   */
  async cancelRevision(revisionId: number, raison?: string): Promise<{
    data: {
      raison: string;
    };
    message: string;
  }> {
    const url = `${this.baseUrl}/${revisionId}/annuler`;
    
    const response = await apiService.delete(url, { body: { raison } });
    return {
      data: response.data || { raison: raison || 'No reason provided' },
      message: response.message || 'Revision cancelled successfully'
    };
  }

  /**
   * Récupère toutes les révisions en retard (admin)
   */
  async getOverdueRevisions(): Promise<{
    data: {
      revisions: RevisionExercise[];
      total: number;
    };
    message: string;
  }> {
    const url = `${this.baseUrl}/system/en-retard`;
    
    const response = await apiService.get(url);
    return {
      data: response.data || { revisions: [], total: 0 },
      message: response.message || 'Overdue revisions retrieved successfully'
    };
  }

  /**
   * Nettoie les anciennes révisions (admin)
   */
  async cleanupOldRevisions(): Promise<{
    data: {
      nombreSupprime: number;
    };
    message: string;
  }> {
    const url = `${this.baseUrl}/system/nettoyer`;
    
    const response = await apiService.post(url);
    return {
      data: response.data || { nombreSupprime: 0 },
      message: response.message || 'Cleanup completed successfully'
    };
  }

  // SuperMemo SM-2 Integration
  private readonly SUPERMEMO_QUALITY_LEVELS = {
    0: { name: 'BLACKOUT', priority: 10, color: 'text-red-600 bg-red-100' },
    1: { name: 'HARD', priority: 8, color: 'text-orange-600 bg-orange-100' },
    2: { name: 'DIFFICULT', priority: 6, color: 'text-yellow-600 bg-yellow-100' },
    3: { name: 'GOOD', priority: 4, color: 'text-blue-600 bg-blue-100' },
    4: { name: 'EASY', priority: 2, color: 'text-green-600 bg-green-100' },
    5: { name: 'PERFECT', priority: 1, color: 'text-purple-600 bg-purple-100' }
  };

  // Utility methods
  calculateDisplayPriority(exercise: RevisionExercise): number {
    const basePriority = exercise.priorite;
    const failureMultiplier = Math.pow(1.5, exercise.nombreEchecs);
    const difficultyMultiplier = exercise.niveauDifficulte / 10;
    
    return Math.round(basePriority * failureMultiplier * difficultyMultiplier);
  }

  /**
   * Calculate SuperMemo priority based on quality and repetition
   */
  calculateSuperMemoPriority(
    quality: number,
    repetitionNumber: number,
    daysOverdue: number
  ): number {
    const qualityData = this.SUPERMEMO_QUALITY_LEVELS[quality];
    const basePriority = qualityData.priority;
    
    // Increase priority for overdue items
    const overdueMultiplier = Math.max(1, daysOverdue * 0.5);
    
    // Decrease priority for higher repetition numbers (more mastered)
    const repetitionPenalty = Math.max(0.5, 1 - (repetitionNumber * 0.1));
    
    return Math.round(basePriority * overdueMultiplier * repetitionPenalty);
  }

  /**
   * Get SuperMemo quality level display info
   */
  getSuperMemoQualityInfo(quality: number) {
    return this.SUPERMEMO_QUALITY_LEVELS[quality] || this.SUPERMEMO_QUALITY_LEVELS[3];
  }

  isOverdue(exercise: RevisionExercise): boolean {
    const dueDate = new Date(exercise.datePrevue);
    const today = new Date();
    return dueDate < today;
  }

  formatDueDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `En retard (${Math.abs(diffDays)} jours)`;
    } else if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Demain';
    } else {
      return `Dans ${diffDays} jours`;
    }
  }

  getPriorityColor(priority: number): string {
    if (priority >= 8) return 'text-red-600 bg-red-100';
    if (priority >= 6) return 'text-orange-600 bg-orange-100';
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  }

  getDifficultyIcon(difficulty: number): string {
    if (difficulty >= 8) return '🔥';
    if (difficulty >= 6) return '⚡';
    if (difficulty >= 4) return '💡';
    return '🌟';
  }

  filterBySubject(exercises: RevisionExercise[], subject?: string): RevisionExercise[] {
    if (!subject) return exercises;
    return exercises.filter(exercise => 
      exercise.exercice.matiere.toLowerCase().includes(subject.toLowerCase())
    );
  }

  sortByPriority(exercises: RevisionExercise[]): RevisionExercise[] {
    return [...exercises].sort((a, b) => {
      const priorityA = this.calculateDisplayPriority(a);
      const priorityB = this.calculateDisplayPriority(b);
      return priorityB - priorityA;
    });
  }

  groupBySubject(exercises: RevisionExercise[]): Record<string, RevisionExercise[]> {
    return exercises.reduce((groups, exercise) => {
      const subject = exercise.exercice.matiere;
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(exercise);
      return groups;
    }, {} as Record<string, RevisionExercise[]>);
  }
}

export const revisionService = new RevisionService(); 