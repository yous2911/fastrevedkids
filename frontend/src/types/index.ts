// frontend/src/types/index.ts - Master export file
// Re-export all types from their proper sources
export * from './api.types';
export * from './shared';

// Exercise-specific types
export interface ChoiceOption {
  id: string;
  text: string;
  value: string | number;
  correct?: boolean;
}

export interface DragItem {
  id: string;
  content: string;
  category?: string;
  type: string;
}

export interface DropZone {
  id: string;
  label: string;
  accepts?: string[];
  currentItem?: DragItem | null;
}

// Additional sound types
export type SoundType = 
  | 'click' | 'hover' | 'success' | 'error' | 'warning' | 'info'
  | 'xp_gain' | 'level_up' | 'achievement' | 'sparky_happy' | 'sparky_thinking'
  | 'button_click' | 'exercise_complete' | 'correct_answer' | 'wrong_answer'
  | 'session_timeout' | 'notification' | 'mascot_interaction';

// Re-export everything needed
export type { 
  ApiResponse, 
  ExercicePedagogique, 
  TentativeExercice, 
  TentativeResponse,
  Eleve
} from './api.types';

// Export CP2025 types explicitly to avoid conflicts
export type {
  Difficulte,
  TypeExercice,
  NiveauScolaire,
  CP2025Exercise,
  CP2025Module,
  CP2025Data,
  CP2025Statistics
} from './cp2025.types'; 