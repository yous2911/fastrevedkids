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

// CP2025 specific data type
export interface CP2025Data {
  letters: string[];
  words: string[];
  sounds: string[];
  exercises: any[];
  progression: {
    level: number;
    completed: string[];
    current: string;
  };
}

// Re-export everything needed
export type { 
  ApiResponse, 
  ExercicePedagogique, 
  TentativeExercice, 
  TentativeResponse,
  Eleve
} from './api.types'; 