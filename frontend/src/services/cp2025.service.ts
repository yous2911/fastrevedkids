import { CP2025Data, CP2025Exercise, CP2025Statistics, Difficulte, TypeExercice } from '../types/cp2025.types';

export class CP2025Service {
  private data: CP2025Data = {
    exercises: [],
    modules: []
  };

  constructor(data?: CP2025Data) {
    if (data) {
      this.data = data;
    } else {
      this.loadDefaultData();
    }
  }

  private loadDefaultData(): void {
    // Default empty data - will be loaded from API or JSON
  }

  setData(data: CP2025Data): void {
    this.data = data;
  }

  getData(): CP2025Data {
    return this.data;
  }

  getModules(): any[] {
    return this.data.modules;
  }

  getModuleById(id: number): any {
    return this.data.modules.find(module => module.id === id);
  }

  getExercisesByModuleId(moduleId: number): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => exercise.moduleId === moduleId);
  }

  getExercisesByDifficulty(difficulte: Difficulte): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => exercise.difficulte === difficulte);
  }

  getExercisesByType(type: TypeExercice): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => exercise.type === type);
  }

  getExercisesByCompetenceCode(competenceCode: string): CP2025Exercise[] {
    return this.data.exercises.filter(exercise => 
      exercise.metadata?.competenceCode === competenceCode
    );
  }

  getModuleExerciseProgression(moduleId: number): Record<Difficulte, CP2025Exercise[]> {
    const difficulties: Difficulte[] = ['decouverte', 'entrainement', 'maitrise', 'consolidation', 'approfondissement'];
    const progression: Record<Difficulte, CP2025Exercise[]> = {
      decouverte: [],
      entrainement: [],
      maitrise: [],
      consolidation: [],
      approfondissement: []
    };
    
    difficulties.forEach(difficulte => {
      progression[difficulte] = this.getExercisesByModuleId(moduleId).filter(ex => ex.difficulte === difficulte);
    });
    
    return progression;
  }

  getStatistics(): CP2025Statistics {
    const stats: CP2025Statistics = {
      totalExercises: this.data.exercises.length,
      totalModules: this.data.modules.length,
      exercisesByDifficulty: {
        decouverte: 0,
        entrainement: 0,
        maitrise: 0,
        consolidation: 0,
        approfondissement: 0
      },
      exercisesByType: {
        QCM: 0,
        CALCUL: 0,
        DRAG_DROP: 0,
        TEXTE_LIBRE: 0,
        LECTURE: 0,
        GEOMETRIE: 0,
        PROBLEME: 0,
        CONJUGAISON: 0,
        TEXT_INPUT: 0
      },
      exercisesByLevel: {
        CP: 0,
        CE1: 0,
        CE2: 0,
        CM1: 0,
        CM2: 0,
        'CP-CE1': 0
      },
      exercisesBySubject: {
        FRANCAIS: 0,
        MATHEMATIQUES: 0,
        SCIENCES: 0,
        ANGLAIS: 0
      }
    };

    // Count exercises by category
    this.data.exercises.forEach(exercise => {
      stats.exercisesByDifficulty[exercise.difficulte]++;
      stats.exercisesByType[exercise.type]++;
    });

    return stats;
  }

  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  static fromJSON(jsonData: string): CP2025Service {
    try {
      const data = JSON.parse(jsonData) as CP2025Data;
      return new CP2025Service(data);
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error}`);
    }
  }
}

export const cp2025Service = new CP2025Service();

// Utility functions
export function createCP2025Service(data: CP2025Data): CP2025Service {
  return new CP2025Service(data);
}

export function validateCP2025Data(data: any): data is CP2025Data {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.modules) || !Array.isArray(data.exercises)) return false;
  
  // Basic validation - you can add more specific validation as needed
  return true;
} 