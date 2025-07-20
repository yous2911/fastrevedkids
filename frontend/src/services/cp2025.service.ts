import { 
  CP2025Data, 
  CP2025Module, 
  CP2025Exercise, 
  Difficulte, 
  TypeExercice,
  NiveauScolaire,
  Matiere 
} from '../types';

// ==========================================
// CP2025 DATA SERVICE
// ==========================================

export class CP2025Service {
  private data: CP2025Data;

  constructor(data: CP2025Data) {
    this.data = data;
  }

  // ==========================================
  // MODULE OPERATIONS
  // ==========================================

  /**
   * Get all modules
   */
  getModules(): CP2025Module[] {
    return this.data.modules;
  }

  /**
   * Get module by ID
   */
  getModuleById(id: number): CP2025Module | undefined {
    return this.data.modules.find(module => module.id === id);
  }

  /**
   * Get modules by level and subject
   */
  getModulesByLevelAndSubject(niveau: NiveauScolaire, matiere: Matiere): CP2025Module[] {
    return this.data.modules.filter(module => 
      module.niveau === niveau && module.matiere === matiere
    );
  }

  /**
   * Get modules by period
   */
  getModulesByPeriod(periode: string): CP2025Module[] {
    return this.data.modules.filter(module => module.periode === periode);
  }

  /**
   * Get modules ordered by sequence
   */
  getModulesOrdered(): CP2025Module[] {
    return [...this.data.modules].sort((a, b) => a.ordre - b.ordre);
  }

  // ==========================================
  // EXERCISE OPERATIONS
  // ==========================================

  /**
   * Get all exercises
   */
  getExercises(): CP2025Exercise[] {
    return this.data.exercises;
  }

  /**
   * Get exercises by module ID
   */
  getExercisesByModuleId(moduleId: number): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => exercise.moduleId === moduleId);
  }

  /**
   * Get exercises by difficulty level
   */
  getExercisesByDifficulty(difficulte: Difficulte): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => exercise.difficulte === difficulte);
  }

  /**
   * Get exercises by type
   */
  getExercisesByType(type: TypeExercice): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => exercise.type === type);
  }

  /**
   * Get exercises by competence code
   */
  getExercisesByCompetenceCode(competenceCode: string): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => 
      exercise.metadata.competenceCode === competenceCode
    );
  }

  /**
   * Get exercises for a specific module and difficulty
   */
  getExercisesByModuleAndDifficulty(moduleId: number, difficulte: Difficulte): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => 
      exercise.moduleId === moduleId && exercise.difficulte === difficulte
    );
  }

  /**
   * Get exercises progression for a module (all difficulties)
   */
  getModuleExerciseProgression(moduleId: number): Record<Difficulte, CP2025Exercise[]> {
    const difficulties: Difficulte[] = ['decouverte', 'entrainement', 'consolidation', 'approfondissement'];
    const progression: Record<Difficulte, CP2025Exercise[]> = {} as Record<Difficulte, CP2025Exercise[]>;
    
    difficulties.forEach(difficulte => {
      progression[difficulte] = this.getExercisesByModuleAndDifficulty(moduleId, difficulte);
    });

    return progression;
  }

  // ==========================================
  // VALIDATION & UTILITIES
  // ==========================================

  /**
   * Validate competence code format
   */
  static validateCompetenceCode(code: string): boolean {
    const pattern = /^(CP|CE1|CE2|CM1|CM2)\.(FR|MA)\.[A-Z]+\d+\.\d+$/;
    return pattern.test(code);
  }

  /**
   * Extract competence information from code
   */
  static parseCompetenceCode(code: string): {
    niveau: NiveauScolaire;
    matiere: Matiere;
    domaine: string;
    periode: string;
    competence: string;
  } | null {
    if (!this.validateCompetenceCode(code)) {
      return null;
    }

    const parts = code.split('.');
    return {
      niveau: parts[0] as NiveauScolaire,
      matiere: parts[1] as Matiere,
      domaine: parts[2],
      periode: parts[2].replace(/\d+$/, ''),
      competence: parts[3]
    };
  }

  /**
   * Get statistics for modules and exercises
   */
  getStatistics(): {
    totalModules: number;
    totalExercises: number;
    exercisesByDifficulty: Record<Difficulte, number>;
    exercisesByType: Record<TypeExercice, number>;
    modulesByLevel: Record<NiveauScolaire, number>;
    modulesBySubject: Record<Matiere, number>;
  } {
    const exercisesByDifficulty: Record<Difficulte, number> = {
      decouverte: 0,
      entrainement: 0,
      consolidation: 0,
      approfondissement: 0
    };

    const exercisesByType: Record<TypeExercice, number> = {
      QCM: 0,
      CALCUL: 0,
      DRAG_DROP: 0,
      TEXT_INPUT: 0,
      LECTURE: 0,
      GEOMETRIE: 0,
      PROBLEME: 0
    };

    const modulesByLevel: Record<NiveauScolaire, number> = {
      CP: 0,
      CE1: 0,
      CE2: 0,
      CM1: 0,
      CM2: 0
    };

    const modulesBySubject: Record<Matiere, number> = {
      FRANCAIS: 0,
      MATHEMATIQUES: 0,
      SCIENCES: 0,
      HISTOIRE_GEOGRAPHIE: 0,
      ANGLAIS: 0
    };

    // Count exercises
    this.data.exercises.forEach(exercise => {
      exercisesByDifficulty[exercise.difficulte]++;
      exercisesByType[exercise.type]++;
    });

    // Count modules
    this.data.modules.forEach(module => {
      modulesByLevel[module.niveau]++;
      modulesBySubject[module.matiere]++;
    });

    return {
      totalModules: this.data.modules.length,
      totalExercises: this.data.exercises.length,
      exercisesByDifficulty,
      exercisesByType,
      modulesByLevel,
      modulesBySubject
    };
  }

  /**
   * Export data as JSON
   */
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Import data from JSON
   */
  static fromJSON(jsonData: string): CP2025Service {
    try {
      const data = JSON.parse(jsonData) as CP2025Data;
      return new CP2025Service(data);
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error}`);
    }
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Create a CP2025 service instance from your JSON data
 */
export function createCP2025Service(data: CP2025Data): CP2025Service {
  return new CP2025Service(data);
}

/**
 * Validate CP2025 data structure
 */
export function validateCP2025Data(data: any): data is CP2025Data {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.modules) || !Array.isArray(data.exercises)) return false;
  
  // Basic validation - you can add more specific validation as needed
  return true;
} 