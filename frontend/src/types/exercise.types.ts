// frontend/src/types/exercise.types.ts
// Unified exercise types to resolve all conflicts

export interface ChoiceOption {
  id: string;
  text: string; // Standardized to 'text' instead of 'label'
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

export interface ExerciseValidationResult {
  correct: boolean;
  score: number;
  feedback?: string;
  hints?: string[];
}

// Common props interface for all exercise components
export interface BaseExerciseProps {
  exercise: import('./api.types').ExercicePedagogique;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
} 