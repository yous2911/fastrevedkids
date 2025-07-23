// CP2025 Complete Type Definitions

export type Difficulte = 'decouverte' | 'entrainement' | 'maitrise' | 'consolidation' | 'approfondissement';

export type TypeExercice = 'QCM' | 'CALCUL' | 'TEXTE_LIBRE' | 'DRAG_DROP' | 'CONJUGAISON' | 'LECTURE' | 'GEOMETRIE' | 'PROBLEME' | 'TEXT_INPUT';

export type NiveauScolaire = 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | 'CP-CE1';

export type Matiere = 'FRANCAIS' | 'MATHEMATIQUES' | 'SCIENCES' | 'ANGLAIS';

export interface CP2025Exercise {
  titre: string;
  consigne: string;
  type: TypeExercice;
  difficulte: Difficulte;
  moduleId?: number;
  configuration: any; // Make it flexible to handle all demo data
  metadata?: {
    competenceCode?: string;
    cognitiveLoad?: 'low' | 'medium' | 'high';
    engagement?: 'low' | 'medium' | 'high';
    storyContext?: string;
  };
}

export interface CP2025Module {
  id: number;
  titre: string;
  description: string;
  niveau: NiveauScolaire;
  matiere: Matiere;
  periode: string;
  ordre: number;
  metadata: {
    competenceDomain: string;
    cp2025: boolean;
  };
}

export interface CP2025Data {
  exercises: CP2025Exercise[];
  modules: CP2025Module[];
}

export interface CP2025Statistics {
  totalExercises: number;
  totalModules?: number;
  exercisesByDifficulty: Record<Difficulte, number>;
  exercisesByType: Record<TypeExercice, number>;
  exercisesByLevel: Record<NiveauScolaire, number>;
  exercisesBySubject: Record<Matiere, number>;
} 