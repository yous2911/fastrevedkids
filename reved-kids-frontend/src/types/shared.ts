// ===== TYPES PARTAGÉS ENTRE FRONTEND ET BACKEND =====

// Types pour les créatures magiques
export interface CreatureMagique {
  id: string;
  nombre: number;
  nom: string;
  emoji: string;
  couleur: string;
  description: string;
  animation: string;
  pouvoir: string;
}

// Types pour les défis mathématiques
export interface DefiMath {
  id: string;
  type: 'decomposition' | 'complement' | 'addition' | 'soustraction' | 'comparaison';
  niveau: number;
  cible: number;
  pierresDisponibles: number[];
  solutions: number[][];
  consigne: string;
  indice: string;
  creature: CreatureMagique;
  difficulte: 'facile' | 'moyen' | 'difficile';
  bonusObjectif?: string;
  tempsLimite?: number;
}

// Types pour les défis de phonétique
export interface DefiPhonique {
  id: string;
  type: 'assemblage' | 'dictation' | 'speed' | 'creativity';
  niveau: number;
  phonemes: string[];
  mots: string[];
  consigne: string;
  indice: string;
  creature: CreatureMagique;
  difficulte: 'facile' | 'moyen' | 'difficile';
  tempsLimite?: number;
  
  // Add missing properties based on usage
  points?: number;
  progression?: number;
  statut?: 'nouveau' | 'en-cours' | 'termine' | 'reussi';
  dateCreation?: string;
  dateModification?: string;
  tentativesMax?: number;
  recompense?: {
    xp: number;
    badges?: string[];
    message?: string;
  };
  prerequis?: string[];
  objectifsPedagogiques?: string[];
  feedback?: {
    succes: string;
    echec: string;
    indice: string;
  };
  
  // Add properties for drag and drop functionality
  dropZones?: Array<{
    id: string;
    label: string;
    accepts?: string[];
    currentItem?: any;
  }>;
  components?: Array<{
    id: string;
    content: string;
    category?: string;
    type: string;
  }>;
  
  // Add missing properties from FrenchPhonicsGame usage
  targetWord?: string;
  hint?: string;
  difficulty?: string;
  period?: number;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

// Types pour les statistiques
export interface Stats {
  totalDefis: number;
  defisParNiveau: Record<number, number>;
  defisParType: Record<string, number>;
  defisParDifficulte: Record<string, number>;
}

// Types pour la progression d'un élève
export interface ProgressionEleve {
  eleveId: string;
  niveau: string;
  matiere: string;
  chapitreId: string;
  contenuId: string;
  statut: 'non-commence' | 'en-cours' | 'termine' | 'reussi' | 'echec';
  score?: number;
  tempsPasse: number;
  tentatives: number;
  dateDebut?: Date;
  dateFin?: Date;
  erreurs: string[];
  commentaires?: string;
} 