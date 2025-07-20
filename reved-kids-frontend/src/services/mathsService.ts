import { DefiMath, ApiResponse, Stats } from '../types/shared';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Using shared types from shared.ts

class MathsService {
  private async makeRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/maths${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la requête maths:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Obtenir tous les défis mathématiques
  async getAllDefis(): Promise<ApiResponse<DefiMath[]>> {
    return this.makeRequest<DefiMath[]>('/defis');
  }

  // Obtenir un défi spécifique par ID
  async getDefiById(id: string): Promise<ApiResponse<DefiMath>> {
    return this.makeRequest<DefiMath>(`/defis/${id}`);
  }

  // Obtenir des défis par niveau
  async getDefisByNiveau(niveau: number): Promise<ApiResponse<DefiMath[]>> {
    return this.makeRequest<DefiMath[]>(`/defis/niveau/${niveau}`);
  }

  // Obtenir des défis par type
  async getDefisByType(type: DefiMath['type']): Promise<ApiResponse<DefiMath[]>> {
    return this.makeRequest<DefiMath[]>(`/defis/type/${type}`);
  }

  // Obtenir des défis par difficulté
  async getDefisByDifficulte(difficulte: DefiMath['difficulte']): Promise<ApiResponse<DefiMath[]>> {
    return this.makeRequest<DefiMath[]>(`/defis/difficulte/${difficulte}`);
  }

  // Obtenir un défi aléatoire
  async getRandomDefi(): Promise<ApiResponse<DefiMath>> {
    return this.makeRequest<DefiMath>('/defis/aleatoire');
  }

  // Obtenir un défi aléatoire par niveau
  async getRandomDefiByNiveau(niveau: number): Promise<ApiResponse<DefiMath>> {
    return this.makeRequest<DefiMath>(`/defis/aleatoire/niveau/${niveau}`);
  }

  // Obtenir des défis adaptés au niveau de progression de l'élève
  async getDefisForProgression(niveauEleve: number): Promise<ApiResponse<DefiMath[]>> {
    return this.makeRequest<DefiMath[]>(`/defis/progression/${niveauEleve}`);
  }

  // Obtenir les statistiques des défis
  async getStats(): Promise<ApiResponse<Stats>> {
    return this.makeRequest<Stats>('/stats');
  }

  // Méthodes utilitaires pour le cache local
  private getCachedData<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`maths_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valide pendant 1 heure
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du cache maths:', error);
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`maths_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erreur lors de l\'écriture du cache maths:', error);
    }
  }

  // Version avec cache pour les méthodes principales
  async getAllDefisWithCache(): Promise<ApiResponse<DefiMath[]>> {
    const cached = this.getCachedData<DefiMath[]>('all_defis');
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await this.getAllDefis();
    if (result.success && result.data) {
      this.setCachedData('all_defis', result.data);
    }
    return result;
  }

  async getStatsWithCache(): Promise<ApiResponse<Stats>> {
    const cached = this.getCachedData<Stats>('stats');
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await this.getStats();
    if (result.success && result.data) {
      this.setCachedData('stats', result.data);
    }
    return result;
  }

  // Nettoyer le cache
  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('maths_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erreur lors du nettoyage du cache maths:', error);
    }
  }
}

export const mathsService = new MathsService(); 