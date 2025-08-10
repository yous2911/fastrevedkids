import { DefiPhonique } from '../types/shared';
import { ApiResponse } from '../types/api.types';
import { apiService } from './api.service';

class DefisService {
  private readonly basePath = '/defis';

  /**
   * Get all "massifs" (phonique challenges)
   * Uses the centralized apiService for consistent error handling and caching
   * This replaces the old getAllDefis method
   */
  async getDefisMassifs(): Promise<ApiResponse<DefiPhonique[]>> {
    return apiService.get<DefiPhonique[]>(
      `${this.basePath}/massifs`,
      { cache: true } // Enable caching for better performance
    );
  }

  /**
   * Get a specific phonique challenge by ID
   */
  async getDefiById(id: string): Promise<ApiResponse<DefiPhonique>> {
    return apiService.get<DefiPhonique>(`${this.basePath}/${id}`);
  }

  /**
   * Get phonique challenges by difficulty level
   */
  async getDefisByNiveau(niveau: number): Promise<ApiResponse<DefiPhonique[]>> {
    return apiService.get<DefiPhonique[]>(`${this.basePath}/niveau/${niveau}`);
  }

  /**
   * Get phonique challenges by type
   */
  async getDefisByType(type: DefiPhonique['type']): Promise<ApiResponse<DefiPhonique[]>> {
    return apiService.get<DefiPhonique[]>(`${this.basePath}/type/${type}`);
  }

  /**
   * Get phonique challenges by difficulty
   */
  async getDefisByDifficulte(difficulte: DefiPhonique['difficulte']): Promise<ApiResponse<DefiPhonique[]>> {
    return apiService.get<DefiPhonique[]>(`${this.basePath}/difficulte/${difficulte}`);
  }

  /**
   * Get a random phonique challenge
   */
  async getRandomDefi(): Promise<ApiResponse<DefiPhonique>> {
    return apiService.get<DefiPhonique>(`${this.basePath}/aleatoire`);
  }

  /**
   * Get a random phonique challenge by level
   */
  async getRandomDefiByNiveau(niveau: number): Promise<ApiResponse<DefiPhonique>> {
    return apiService.get<DefiPhonique>(`${this.basePath}/aleatoire/niveau/${niveau}`);
  }

  /**
   * Clear service cache (useful for data refresh)
   */
  clearCache(): void {
    apiService.clearCache();
  }
}

export const defisService = new DefisService(); 