import { apiService } from './api.service';
import { 
  ApiResponse, 
  PaginatedResponse,
  Niveau, 
  Matiere, 
  Chapitre, 
  SousChapitre, 
  ExercicePedagogique 
} from '../types/api.types';

export interface HierarchyFilters {
  niveau?: string;
  matiere?: string;
  type?: string;
}

export interface ExerciseFilters extends HierarchyFilters {
  limite?: number;
  page?: number;
}

export interface StatisticsData {
  niveaux: number;
  matieres: number;
  chapitres: number;
  sousChapitres: number;
  exercices: number;
  timestamp: string;
}

export class EducationService {
  private readonly basePath = '/hierarchie';

  // Cache TTL matching backend settings
  private readonly CACHE_TTL = {
    hierarchy: 86400, // 24 hours
    content: 43200,   // 12 hours
    stats: 3600       // 1 hour
  };

  // Get all education levels
  async getNiveaux(): Promise<ApiResponse<Niveau[]>> {
    return apiService.get<Niveau[]>(
      `${this.basePath}/niveaux`,
      { cache: true }
    );
  }

  // Get subjects for a level
  async getMatieresByNiveau(niveauId: number): Promise<ApiResponse<Matiere[]>> {
    return apiService.get<Matiere[]>(
      `${this.basePath}/niveaux/${niveauId}/matieres`,
      { cache: true }
    );
  }

  // Get chapters for a subject
  async getChapitresByMatiere(matiereId: number): Promise<ApiResponse<Chapitre[]>> {
    return apiService.get<Chapitre[]>(
      `${this.basePath}/matieres/${matiereId}/chapitres`,
      { cache: true }
    );
  }

  // Get sub-chapters for a chapter
  async getSousChapitresByCharpitre(chapitreId: number): Promise<ApiResponse<SousChapitre[]>> {
    return apiService.get<SousChapitre[]>(
      `${this.basePath}/chapitres/${chapitreId}/sous-chapitres`,
      { cache: true }
    );
  }

  // Get sub-chapter details with exercises
  async getSousChapitreDetails(sousChapitreId: number): Promise<ApiResponse<SousChapitre & { exercices: ExercicePedagogique[] }>> {
    return apiService.get(
      `${this.basePath}/sous-chapitres/${sousChapitreId}/details`,
      { cache: true }
    );
  }

  // Search exercises with filters and pagination
  async searchExercices(filters: ExerciseFilters = {}): Promise<PaginatedResponse<ExercicePedagogique[]>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `${this.basePath}/exercices${queryString ? `?${queryString}` : ''}`;

    return apiService.get<any>(endpoint, { cache: true });
  }

  // Get global statistics
  async getStatistics(): Promise<ApiResponse<StatisticsData>> {
    return apiService.get<StatisticsData>(
      `${this.basePath}/stats`,
      { cache: true }
    );
  }

  // Get education hierarchy for a specific level (optimized call)
  async getEducationHierarchy(niveau: string): Promise<{
    niveau: Niveau;
    matieres: (Matiere & { 
      chapitres: (Chapitre & { 
        sousChapitres: SousChapitre[] 
      })[] 
    })[];
  }> {
    // This would be a single optimized backend call in production
    // For now, we'll compose it from multiple calls with caching
    const niveauxResponse = await this.getNiveaux();
    const targetNiveau = niveauxResponse.data?.find(n => n.nom === niveau);
    
    if (!targetNiveau) {
      throw new Error(`Niveau ${niveau} non trouvé`);
    }

    const matieresResponse = await this.getMatieresByNiveau(targetNiveau.id);
    const matieres = matieresResponse.data || [];

    // Fetch chapters for all subjects in parallel
    const matieresWithChapitres = await Promise.all(
      matieres.map(async (matiere) => {
        const chapitresResponse = await this.getChapitresByMatiere(matiere.id);
        const chapitres = chapitresResponse.data || [];

        // Fetch sub-chapters for all chapters in parallel
        const chapitresWithSousChapitres = await Promise.all(
          chapitres.map(async (chapitre) => {
            const sousChapitresResponse = await this.getSousChapitresByCharpitre(chapitre.id);
            return {
              ...chapitre,
              sousChapitres: sousChapitresResponse.data || []
            };
          })
        );

        return {
          ...matiere,
          chapitres: chapitresWithSousChapitres
        };
      })
    );

    return {
      niveau: targetNiveau,
      matieres: matieresWithChapitres
    };
  }
}

export const educationService = new EducationService(); 