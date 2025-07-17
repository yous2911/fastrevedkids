// Global type definitions
export interface Student {
  id: number;
  prenom: string;
  nom: string;
  niveauActuel: string;
  totalPoints: number;
  serieJours: number;
  mascotteType: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
} 