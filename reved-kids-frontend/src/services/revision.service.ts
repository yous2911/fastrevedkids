import { apiService } from './api.service';

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
    
    return apiService.get(url);
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
    
    return apiService.get(url);
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
    
    return apiService.post(url, data);
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
    
    return apiService.post(url, data);
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
    
    return apiService.put(url, { nouvelleDate, raison });
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
    
    return apiService.delete(url, { raison });
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
    
    return apiService.get(url);
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
    
    return apiService.post(url);
  }

  /**
   * Méthodes utilitaires pour la gestion des révisions
   */

  /**
   * Calcule la priorité d'affichage d'un exercice
   */
  calculateDisplayPriority(exercise: RevisionExercise): number {
    const now = new Date();
    const dueDate = new Date(exercise.datePrevue);
    const daysOverdue = Math.max(0, (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return exercise.priorite + (daysOverdue * 10);
  }

  /**
   * Vérifie si un exercice est en retard
   */
  isOverdue(exercise: RevisionExercise): boolean {
    const now = new Date();
    const dueDate = new Date(exercise.datePrevue);
    return dueDate < now;
  }

  /**
   * Formate la date de révision pour l'affichage
   */
  formatDueDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `En retard (${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''})`;
    } else if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Demain';
    } else if (diffDays < 7) {
      return `Dans ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  /**
   * Obtient la couleur de priorité pour l'affichage
   */
  getPriorityColor(priority: number): string {
    if (priority >= 50) return 'red';
    if (priority >= 30) return 'orange';
    if (priority >= 15) return 'yellow';
    return 'green';
  }

  /**
   * Obtient l'icône de difficulté
   */
  getDifficultyIcon(difficulty: number): string {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  }

  /**
   * Filtre les exercices par matière
   */
  filterBySubject(exercises: RevisionExercise[], subject?: string): RevisionExercise[] {
    if (!subject) return exercises;
    return exercises.filter(ex => ex.exercice.matiere.toLowerCase() === subject.toLowerCase());
  }

  /**
   * Trie les exercices par priorité
   */
  sortByPriority(exercises: RevisionExercise[]): RevisionExercise[] {
    return [...exercises].sort((a, b) => {
      const priorityA = this.calculateDisplayPriority(a);
      const priorityB = this.calculateDisplayPriority(b);
      return priorityB - priorityA; // Priorité décroissante
    });
  }

  /**
   * Groupe les exercices par matière
   */
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