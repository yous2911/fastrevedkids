// Create unified exercise types to resolve conflicts
export interface ChoiceOption {
  id: string;
  text: string; // Changed from 'label' to 'text' to match usage
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