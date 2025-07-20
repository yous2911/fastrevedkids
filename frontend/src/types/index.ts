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

// ==========================================
// CP2025 MODULE & EXERCISE TYPES
// ==========================================

export type NiveauScolaire = 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | 'CP-CE1';
export type Matiere = 'FRANCAIS' | 'MATHEMATIQUES' | 'SCIENCES' | 'HISTOIRE_GEOGRAPHIE' | 'ANGLAIS';
export type Periode = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P1-P2' | 'P3-P4' | 'P1-P3' | 'P2-P4' | 'P2-P3' | 'P4-P5' | 'P5-Synthese' | 'Synthese-CE1';
export type Difficulte = 'decouverte' | 'entrainement' | 'consolidation' | 'approfondissement';
export type TypeExercice = 'QCM' | 'CALCUL' | 'DRAG_DROP' | 'TEXT_INPUT' | 'LECTURE' | 'GEOMETRIE' | 'PROBLEME';

export interface ModuleMetadata {
  competenceDomain: string;
  cp2025: boolean;
  [key: string]: unknown;
}

export interface CP2025Module {
  id: number;
  titre: string;
  description: string;
  niveau: NiveauScolaire;
  matiere: Matiere;
  periode: Periode;
  ordre: number;
  metadata: ModuleMetadata;
}

export interface ExerciseMetadata {
  competenceCode: string;
  cognitiveLoad?: 'low' | 'medium' | 'high';
  engagement?: 'low' | 'medium' | 'high';
  storyContext?: string;
  [key: string]: unknown;
}

// Image object interface
export interface ImageObject {
  url_placeholder: string;
  description: string;
}

// Enhanced choice interface
export interface ChoiceOption {
  id: string;
  text: string;
  image?: string | ImageObject;
  audio?: string;
}

// Feedback interface
export interface ExerciseFeedback {
  correct: string;
  incorrect: string;
}

// Visual interface
export interface VisualElement {
  type: 'story' | 'problem_solving' | 'counting_sequence';
  image?: string;
  animation?: string;
}

// Story interface
export interface StoryElement {
  text: string;
  audio?: string;
  image?: string;
}

// Configuration types for different exercise types
export interface QCMConfiguration {
  question: string;
  choix: ChoiceOption[];
  bonneReponse: string;
  audioRequired?: boolean;
  image_url?: string;
  image?: ImageObject;
  phrase_template?: string;
  aide?: string;
  timeLimit?: number;
  feedback?: ExerciseFeedback;
  story?: StoryElement;
}

export interface DragDropConfiguration {
  question: string;
  dragItems: Array<{
    id: string; 
    content: string;
    color?: string;
    sound?: string;
    distractor?: boolean;
  }>;
  zones: Array<{
    id: string; 
    label: string; 
    limit?: number;
    visual?: string;
  }>;
  solution: string[] | Record<string, string[]>;
  feedback?: ExerciseFeedback;
}

export interface CalculConfiguration {
  question: string;
  operation: string;
  resultat: number;
  aide?: string;
  visual?: VisualElement;
  feedback?: ExerciseFeedback;
}

export interface TextInputConfiguration {
  question: string;
  inputType: 'keyboard' | 'clickable_letters' | 'multiline_keyboard';
  bonneReponse: string | string[];
  audioRequired?: boolean;
  lettres?: string[];
  aide?: string;
  feedback?: ExerciseFeedback;
}

export interface GeometryConfiguration {
  question: string;
  image_url?: string;
  image?: ImageObject;
  bonneReponse: string;
  aide?: string;
  feedback?: ExerciseFeedback;
}

export type ExerciseConfiguration = 
  | QCMConfiguration 
  | DragDropConfiguration 
  | CalculConfiguration 
  | TextInputConfiguration 
  | GeometryConfiguration;

export interface CP2025Exercise {
  titre: string;
  consigne: string;
  type: TypeExercice;
  difficulte: Difficulte;
  moduleId: number;
  configuration: ExerciseConfiguration;
  metadata: ExerciseMetadata;
}

export interface CP2025Data {
  modules: CP2025Module[];
  exercises: CP2025Exercise[];
}

// ==========================================
// EXISTING EXERCISE TYPES (for backward compatibility)
// ==========================================

export interface ExerciceConfiguration {
  question: string;
  choix?: string[];
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
  items?: any[];
  zones?: any[];
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

export interface SousChapitre {
  id: number;
  titre: string;
  chapitre: {
    id: number;
    titre: string;
    matiere: {
      id: number;
      nom: string;
    };
  };
} 