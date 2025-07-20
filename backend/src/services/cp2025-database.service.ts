import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export interface CP2025Module {
  id: number;
  titre: string;
  description: string;
  niveau: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | 'CP-CE1';
  matiere: 'FRANCAIS' | 'MATHEMATIQUES' | 'SCIENCES' | 'HISTOIRE_GEOGRAPHIE' | 'ANGLAIS';
  periode: string;
  ordre: number;
  competence_domain?: string;
  cp2025: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CP2025Exercise {
  id: number;
  titre: string;
  consigne: string;
  type: 'QCM' | 'CALCUL' | 'DRAG_DROP' | 'TEXT_INPUT' | 'LECTURE' | 'GEOMETRIE' | 'PROBLEME';
  difficulte: 'decouverte' | 'entrainement' | 'consolidation' | 'approfondissement';
  module_id: number;
  competence_code?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  configuration?: any;
}

export interface CP2025Statistics {
  total_modules: number;
  total_exercises: number;
  decouverte_count: number;
  entrainement_count: number;
  consolidation_count: number;
  approfondissement_count: number;
  qcm_count: number;
  calcul_count: number;
  drag_drop_count: number;
  text_input_count: number;
  cp_modules: number;
  cp_ce1_modules: number;
  francais_modules: number;
  mathematiques_modules: number;
}

export interface ModuleWithExercises extends CP2025Module {
  exercises: CP2025Exercise[];
}

export interface ExerciseProgression {
  decouverte: CP2025Exercise[];
  entrainement: CP2025Exercise[];
  consolidation: CP2025Exercise[];
  approfondissement: CP2025Exercise[];
}

export class CP2025DatabaseService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get all modules with optional filtering
   */
  async getModules(filters?: {
    niveau?: string;
    matiere?: string;
    periode?: string;
    cp2025?: boolean;
  }): Promise<CP2025Module[]> {
    try {
      let query = `
        SELECT * FROM cp2025_modules 
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.niveau) {
        query += ` AND niveau = $${paramIndex++}`;
        params.push(filters.niveau);
      }

      if (filters?.matiere) {
        query += ` AND matiere = $${paramIndex++}`;
        params.push(filters.matiere);
      }

      if (filters?.periode) {
        query += ` AND periode = $${paramIndex++}`;
        params.push(filters.periode);
      }

      if (filters?.cp2025 !== undefined) {
        query += ` AND cp2025 = $${paramIndex++}`;
        params.push(filters.cp2025);
      }

      query += ` ORDER BY ordre ASC`;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching modules:', error);
      throw error;
    }
  }

  /**
   * Get a single module by ID
   */
  async getModuleById(id: number): Promise<CP2025Module | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM cp2025_modules WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching module by ID:', error);
      throw error;
    }
  }

  /**
   * Get all exercises with optional filtering
   */
  async getExercises(filters?: {
    module_id?: number;
    type?: string;
    difficulte?: string;
    competence_code?: string;
  }): Promise<CP2025Exercise[]> {
    try {
      let query = `
        SELECT e.*, ec.configuration_data as configuration
        FROM cp2025_exercises e
        LEFT JOIN cp2025_exercise_configurations ec ON e.id = ec.exercise_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.module_id) {
        query += ` AND e.module_id = $${paramIndex++}`;
        params.push(filters.module_id);
      }

      if (filters?.type) {
        query += ` AND e.type = $${paramIndex++}`;
        params.push(filters.type);
      }

      if (filters?.difficulte) {
        query += ` AND e.difficulte = $${paramIndex++}`;
        params.push(filters.difficulte);
      }

      if (filters?.competence_code) {
        query += ` AND e.competence_code = $${paramIndex++}`;
        params.push(filters.competence_code);
      }

      query += ` ORDER BY e.id ASC`;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching exercises:', error);
      throw error;
    }
  }

  /**
   * Get a single exercise by ID
   */
  async getExerciseById(id: number): Promise<CP2025Exercise | null> {
    try {
      const result = await this.pool.query(`
        SELECT e.*, ec.configuration_data as configuration
        FROM cp2025_exercises e
        LEFT JOIN cp2025_exercise_configurations ec ON e.id = ec.exercise_id
        WHERE e.id = $1
      `, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching exercise by ID:', error);
      throw error;
    }
  }

  /**
   * Get exercises by module ID
   */
  async getExercisesByModuleId(moduleId: number): Promise<CP2025Exercise[]> {
    return this.getExercises({ module_id: moduleId });
  }

  /**
   * Get module with all its exercises
   */
  async getModuleWithExercises(moduleId: number): Promise<ModuleWithExercises | null> {
    try {
      const module = await this.getModuleById(moduleId);
      if (!module) return null;

      const exercises = await this.getExercisesByModuleId(moduleId);
      
      return {
        ...module,
        exercises
      };
    } catch (error) {
      logger.error('Error fetching module with exercises:', error);
      throw error;
    }
  }

  /**
   * Get exercise progression by difficulty for a module
   */
  async getModuleExerciseProgression(moduleId: number): Promise<ExerciseProgression> {
    try {
      const exercises = await this.getExercisesByModuleId(moduleId);
      
      const progression: ExerciseProgression = {
        decouverte: [],
        entrainement: [],
        consolidation: [],
        approfondissement: []
      };

      exercises.forEach(exercise => {
        progression[exercise.difficulte].push(exercise);
      });

      return progression;
    } catch (error) {
      logger.error('Error fetching exercise progression:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<CP2025Statistics | null> {
    try {
      const result = await this.pool.query('SELECT * FROM cp2025_statistics');
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Search exercises by keyword
   */
  async searchExercises(keyword: string): Promise<CP2025Exercise[]> {
    try {
      const result = await this.pool.query(`
        SELECT e.*, ec.configuration_data as configuration
        FROM cp2025_exercises e
        LEFT JOIN cp2025_exercise_configurations ec ON e.id = ec.exercise_id
        WHERE e.titre ILIKE $1 OR e.consigne ILIKE $1
        ORDER BY e.id ASC
      `, [`%${keyword}%`]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error searching exercises:', error);
      throw error;
    }
  }

  /**
   * Get exercises by competence code
   */
  async getExercisesByCompetenceCode(competenceCode: string): Promise<CP2025Exercise[]> {
    return this.getExercises({ competence_code: competenceCode });
  }

  /**
   * Get all competence codes
   */
  async getCompetenceCodes(): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT * FROM cp2025_competence_codes 
        ORDER BY code ASC
      `);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching competence codes:', error);
      throw error;
    }
  }

  /**
   * Get exercises by type
   */
  async getExercisesByType(type: string): Promise<CP2025Exercise[]> {
    return this.getExercises({ type });
  }

  /**
   * Get exercises by difficulty
   */
  async getExercisesByDifficulty(difficulte: string): Promise<CP2025Exercise[]> {
    return this.getExercises({ difficulte });
  }

  /**
   * Create a new module
   */
  async createModule(moduleData: Omit<CP2025Module, 'id' | 'created_at' | 'updated_at'>): Promise<CP2025Module> {
    try {
      const result = await this.pool.query(`
        INSERT INTO cp2025_modules (titre, description, niveau, matiere, periode, ordre, competence_domain, cp2025, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        moduleData.titre,
        moduleData.description,
        moduleData.niveau,
        moduleData.matiere,
        moduleData.periode,
        moduleData.ordre,
        moduleData.competence_domain,
        moduleData.cp2025,
        JSON.stringify(moduleData.metadata)
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating module:', error);
      throw error;
    }
  }

  /**
   * Create a new exercise
   */
  async createExercise(exerciseData: Omit<CP2025Exercise, 'id' | 'created_at' | 'updated_at' | 'configuration'>): Promise<CP2025Exercise> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert exercise
      const exerciseResult = await client.query(`
        INSERT INTO cp2025_exercises (titre, consigne, type, difficulte, module_id, competence_code, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        exerciseData.titre,
        exerciseData.consigne,
        exerciseData.type,
        exerciseData.difficulte,
        exerciseData.module_id,
        exerciseData.competence_code,
        JSON.stringify(exerciseData.metadata)
      ]);

      const exercise = exerciseResult.rows[0];

      await client.query('COMMIT');
      return exercise;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating exercise:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update a module
   */
  async updateModule(id: number, updates: Partial<CP2025Module>): Promise<CP2025Module | null> {
    try {
      const fields = Object.keys(updates).filter(key => 
        key !== 'id' && key !== 'created_at' && key !== 'updated_at'
      );

      if (fields.length === 0) {
        return this.getModuleById(id);
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fields.map(field => {
        const value = updates[field as keyof CP2025Module];
        return field === 'metadata' ? JSON.stringify(value) : value;
      })];

      const result = await this.pool.query(`
        UPDATE cp2025_modules 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, values);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating module:', error);
      throw error;
    }
  }

  /**
   * Update an exercise
   */
  async updateExercise(id: number, updates: Partial<CP2025Exercise>): Promise<CP2025Exercise | null> {
    try {
      const fields = Object.keys(updates).filter(key => 
        key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'configuration'
      );

      if (fields.length === 0) {
        return this.getExerciseById(id);
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fields.map(field => {
        const value = updates[field as keyof CP2025Exercise];
        return field === 'metadata' ? JSON.stringify(value) : value;
      })];

      const result = await this.pool.query(`
        UPDATE cp2025_exercises 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, values);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating exercise:', error);
      throw error;
    }
  }

  /**
   * Delete a module (cascades to exercises)
   */
  async deleteModule(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM cp2025_modules WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting module:', error);
      throw error;
    }
  }

  /**
   * Delete an exercise
   */
  async deleteExercise(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM cp2025_exercises WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting exercise:', error);
      throw error;
    }
  }

  /**
   * Get random exercises for practice
   */
  async getRandomExercises(limit: number = 10, filters?: {
    niveau?: string;
    matiere?: string;
    difficulte?: string;
  }): Promise<CP2025Exercise[]> {
    try {
      let query = `
        SELECT e.*, ec.configuration_data as configuration
        FROM cp2025_exercises e
        LEFT JOIN cp2025_exercise_configurations ec ON e.id = ec.exercise_id
        JOIN cp2025_modules m ON e.module_id = m.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.niveau) {
        query += ` AND m.niveau = $${paramIndex++}`;
        params.push(filters.niveau);
      }

      if (filters?.matiere) {
        query += ` AND m.matiere = $${paramIndex++}`;
        params.push(filters.matiere);
      }

      if (filters?.difficulte) {
        query += ` AND e.difficulte = $${paramIndex++}`;
        params.push(filters.difficulte);
      }

      query += ` ORDER BY RANDOM() LIMIT $${paramIndex++}`;
      params.push(limit);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching random exercises:', error);
      throw error;
    }
  }

  /**
   * Get exercises by competence domain
   */
  async getExercisesByCompetenceDomain(domain: string): Promise<CP2025Exercise[]> {
    try {
      const result = await this.pool.query(`
        SELECT e.*, ec.configuration_data as configuration
        FROM cp2025_exercises e
        LEFT JOIN cp2025_exercise_configurations ec ON e.id = ec.exercise_id
        JOIN cp2025_modules m ON e.module_id = m.id
        WHERE m.competence_domain LIKE $1
        ORDER BY e.id ASC
      `, [`${domain}%`]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching exercises by competence domain:', error);
      throw error;
    }
  }

  /**
   * Export all data as JSON
   */
  async exportData(): Promise<any> {
    try {
      const modules = await this.getModules();
      const exercises = await this.getExercises();
      const statistics = await this.getStatistics();
      const competenceCodes = await this.getCompetenceCodes();

      return {
        modules,
        exercises,
        statistics,
        competenceCodes,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  }
} 