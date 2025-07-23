import { ChoiceOption, DragItem, DropZone } from './exercise.types';

// Fix ApiResponse structure to match backend
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | {
    message: string;
    code?: string;
    details?: any;
  };
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<{
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}> {}

// Request configuration types
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export interface UseApiDataOptions {
  immediate?: boolean;
  dependencies?: any[];
  cache?: boolean;
}

export interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Exercise component types
export interface ExerciseDragDropProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

// Core entities matching backend models
export interface Niveau {
  id: number;
  nom: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2';
  createdAt: string;
  updatedAt: string;
}

export interface Matiere {
  id: number;
  nom: 'MATHEMATIQUES' | 'FRANCAIS' | 'SCIENCES' | 'HISTOIRE_GEOGRAPHIE' | 'ANGLAIS';
  niveauId: number;
  niveau?: Niveau;
  createdAt: string;
  updatedAt: string;
}

export interface Chapitre {
  id: number;
  titre: string;
  description?: string;
  matiereId: number;
  matiere?: Matiere;
  createdAt: string;
  updatedAt: string;
}

export interface SousChapitre {
  id: number;
  titre: string;
  description?: string;
  hasAnimation: boolean;
  videoUrl?: string;
  chapitreId: number;
  chapitre?: Chapitre;
  createdAt: string;
  updatedAt: string;
}

// Fix ExerciceConfiguration to include missing properties
export interface ExerciceConfiguration {
  question: string;
  choix?: ChoiceOption[] | string[]; // Allow both formats
  bonneReponse?: string | number;
  solution?: any;
  operation?: string;
  resultat?: number;
  type?: string;
  donnees?: any;
  concept?: string;
  targetWord?: string;
  hint?: string;
  successMessage?: string;
  items?: DragItem[];
  zones?: DropZone[];
  timeLimit?: number;
  audioRequired?: boolean;
  image?: {
    url_placeholder: string;
    description: string;
  };
  phrase_template?: string;
  inputType?: string;
  dragItems?: DragItem[];
}

export interface ExercicePedagogique {
  id: number;
  type: 'QCM' | 'CALCUL' | 'TEXTE_LIBRE' | 'DRAG_DROP' | 'CONJUGAISON' | 'LECTURE' | 'GEOMETRIE' | 'PROBLEME';
  configuration: ExerciceConfiguration;
  xp: number;
  difficulte: 'FACILE' | 'MOYEN' | 'DIFFICILE';
  sousChapitre?: SousChapitre;
  createdAt: string;
  updatedAt: string;
}

export interface Eleve {
  id: number;
  prenom: string;
  nom: string;
  dateNaissance: string;
  niveauActuel: string;
  totalPoints: number;
  serieJours: number;
  mascotteType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  dernierExercice?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TentativeExercice {
  reponse: any;
  reussi: boolean;
  tempsSecondes: number;
  aidesUtilisees: number;
}

export interface TentativeResponse {
  success: boolean;
  data: {
    reussi: boolean;
    pointsGagnes: number;
    nouveauStatut: string;
    tauxReussite: number;
    nombreTentatives: number;
    feedback?: string;
    session: {
      exercicesReussis: number;
      exercicesTentes: number;
      pointsTotal: number;
      tauxReussite: number;
    };
  };
  message: string;
}

// Error types
export class ApiError extends Error {
  public status: number;
  public code?: string;
  
  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  public field: string;
  
  constructor(message: string, field: string) {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Erreur de connexion') {
    super(message);
    this.name = 'NetworkError';
  }
} 