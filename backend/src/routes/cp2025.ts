import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CP2025DatabaseService } from '../services/cp2025-database.service';
import { logger } from '../utils/logger';

// Request/Response schemas
const ModuleSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    titre: { type: 'string' },
    description: { type: 'string' },
    niveau: { type: 'string', enum: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'CP-CE1'] },
    matiere: { type: 'string', enum: ['FRANCAIS', 'MATHEMATIQUES', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE', 'ANGLAIS'] },
    periode: { type: 'string' },
    ordre: { type: 'number' },
    competence_domain: { type: 'string' },
    cp2025: { type: 'boolean' },
    metadata: { type: 'object' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
};

const ExerciseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    titre: { type: 'string' },
    consigne: { type: 'string' },
    type: { type: 'string', enum: ['QCM', 'CALCUL', 'DRAG_DROP', 'TEXT_INPUT', 'LECTURE', 'GEOMETRIE', 'PROBLEME'] },
    difficulte: { type: 'string', enum: ['decouverte', 'entrainement', 'consolidation', 'approfondissement'] },
    module_id: { type: 'number' },
    competence_code: { type: 'string' },
    metadata: { type: 'object' },
    configuration: { type: 'object' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
};

const StatisticsSchema = {
  type: 'object',
  properties: {
    total_modules: { type: 'number' },
    total_exercises: { type: 'number' },
    decouverte_count: { type: 'number' },
    entrainement_count: { type: 'number' },
    consolidation_count: { type: 'number' },
    approfondissement_count: { type: 'number' },
    qcm_count: { type: 'number' },
    calcul_count: { type: 'number' },
    drag_drop_count: { type: 'number' },
    text_input_count: { type: 'number' },
    cp_modules: { type: 'number' },
    cp_ce1_modules: { type: 'number' },
    francais_modules: { type: 'number' },
    mathematiques_modules: { type: 'number' }
  }
};

export default async function cp2025Routes(fastify: FastifyInstance) {
  const cp2025Service = new CP2025DatabaseService(fastify.pg);

  // Get all modules with optional filtering
  fastify.get('/modules', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          niveau: { type: 'string' },
          matiere: { type: 'string' },
          periode: { type: 'string' },
          cp2025: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: ModuleSchema
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filters = request.query as any;
      const modules = await cp2025Service.getModules(filters);
      
      logger.info(`Retrieved ${modules.length} modules`);
      return reply.send(modules);
    } catch (error) {
      logger.error('Error fetching modules:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get a single module by ID
  fastify.get('/modules/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: ModuleSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const module = await cp2025Service.getModuleById(id);
      
      if (!module) {
        return reply.status(404).send({ error: 'Module not found' });
      }
      
      return reply.send(module);
    } catch (error) {
      logger.error('Error fetching module:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get module with exercises
  fastify.get('/modules/:id/with-exercises', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ...ModuleSchema.properties,
            exercises: {
              type: 'array',
              items: ExerciseSchema
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const moduleWithExercises = await cp2025Service.getModuleWithExercises(id);
      
      if (!moduleWithExercises) {
        return reply.status(404).send({ error: 'Module not found' });
      }
      
      return reply.send(moduleWithExercises);
    } catch (error) {
      logger.error('Error fetching module with exercises:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get exercise progression for a module
  fastify.get('/modules/:id/progression', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            decouverte: { type: 'array', items: ExerciseSchema },
            entrainement: { type: 'array', items: ExerciseSchema },
            consolidation: { type: 'array', items: ExerciseSchema },
            approfondissement: { type: 'array', items: ExerciseSchema }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const progression = await cp2025Service.getModuleExerciseProgression(id);
      
      return reply.send(progression);
    } catch (error) {
      logger.error('Error fetching exercise progression:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get all exercises with optional filtering
  fastify.get('/exercises', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          module_id: { type: 'number' },
          type: { type: 'string' },
          difficulte: { type: 'string' },
          competence_code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: ExerciseSchema
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filters = request.query as any;
      const exercises = await cp2025Service.getExercises(filters);
      
      logger.info(`Retrieved ${exercises.length} exercises`);
      return reply.send(exercises);
    } catch (error) {
      logger.error('Error fetching exercises:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get a single exercise by ID
  fastify.get('/exercises/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: ExerciseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const exercise = await cp2025Service.getExerciseById(id);
      
      if (!exercise) {
        return reply.status(404).send({ error: 'Exercise not found' });
      }
      
      return reply.send(exercise);
    } catch (error) {
      logger.error('Error fetching exercise:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Search exercises by keyword
  fastify.get('/exercises/search/:keyword', {
    schema: {
      params: {
        type: 'object',
        properties: {
          keyword: { type: 'string' }
        },
        required: ['keyword']
      },
      response: {
        200: {
          type: 'array',
          items: ExerciseSchema
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { keyword } = request.params as { keyword: string };
      const exercises = await cp2025Service.searchExercises(keyword);
      
      logger.info(`Found ${exercises.length} exercises matching "${keyword}"`);
      return reply.send(exercises);
    } catch (error) {
      logger.error('Error searching exercises:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get random exercises
  fastify.get('/exercises/random', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 },
          niveau: { type: 'string' },
          matiere: { type: 'string' },
          difficulte: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: ExerciseSchema
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = 10, niveau, matiere, difficulte } = request.query as any;
      const exercises = await cp2025Service.getRandomExercises(limit, { niveau, matiere, difficulte });
      
      logger.info(`Retrieved ${exercises.length} random exercises`);
      return reply.send(exercises);
    } catch (error) {
      logger.error('Error fetching random exercises:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get exercises by competence code
  fastify.get('/exercises/competence/:code', {
    schema: {
      params: {
        type: 'object',
        properties: {
          code: { type: 'string' }
        },
        required: ['code']
      },
      response: {
        200: {
          type: 'array',
          items: ExerciseSchema
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code } = request.params as { code: string };
      const exercises = await cp2025Service.getExercisesByCompetenceCode(code);
      
      logger.info(`Retrieved ${exercises.length} exercises for competence code ${code}`);
      return reply.send(exercises);
    } catch (error) {
      logger.error('Error fetching exercises by competence code:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get exercises by type
  fastify.get('/exercises/type/:type', {
    schema: {
      params: {
        type: 'object',
        properties: {
          type: { type: 'string' }
        },
        required: ['type']
      },
      response: {
        200: {
          type: 'array',
          items: ExerciseSchema
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { type } = request.params as { type: string };
      const exercises = await cp2025Service.getExercisesByType(type);
      
      logger.info(`Retrieved ${exercises.length} exercises of type ${type}`);
      return reply.send(exercises);
    } catch (error) {
      logger.error('Error fetching exercises by type:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get exercises by difficulty
  fastify.get('/exercises/difficulty/:difficulte', {
    schema: {
      params: {
        type: 'object',
        properties: {
          difficulte: { type: 'string' }
        },
        required: ['difficulte']
      },
      response: {
        200: {
          type: 'array',
          items: ExerciseSchema
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { difficulte } = request.params as { difficulte: string };
      const exercises = await cp2025Service.getExercisesByDifficulty(difficulte);
      
      logger.info(`Retrieved ${exercises.length} exercises of difficulty ${difficulte}`);
      return reply.send(exercises);
    } catch (error) {
      logger.error('Error fetching exercises by difficulty:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get database statistics
  fastify.get('/statistics', {
    schema: {
      response: {
        200: StatisticsSchema
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const statistics = await cp2025Service.getStatistics();
      
      if (!statistics) {
        return reply.status(404).send({ error: 'Statistics not available' });
      }
      
      return reply.send(statistics);
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get all competence codes
  fastify.get('/competence-codes', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              code: { type: 'string' },
              niveau: { type: 'string' },
              matiere: { type: 'string' },
              domaine: { type: 'string' },
              numero: { type: 'number' },
              competence: { type: 'number' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const competenceCodes = await cp2025Service.getCompetenceCodes();
      
      logger.info(`Retrieved ${competenceCodes.length} competence codes`);
      return reply.send(competenceCodes);
    } catch (error) {
      logger.error('Error fetching competence codes:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Create a new module
  fastify.post('/modules', {
    schema: {
      body: {
        type: 'object',
        properties: {
          titre: { type: 'string' },
          description: { type: 'string' },
          niveau: { type: 'string' },
          matiere: { type: 'string' },
          periode: { type: 'string' },
          ordre: { type: 'number' },
          competence_domain: { type: 'string' },
          cp2025: { type: 'boolean' },
          metadata: { type: 'object' }
        },
        required: ['titre', 'description', 'niveau', 'matiere', 'periode', 'ordre']
      },
      response: {
        201: ModuleSchema
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const moduleData = request.body as any;
      const newModule = await cp2025Service.createModule(moduleData);
      
      logger.info(`Created new module: ${newModule.titre}`);
      return reply.status(201).send(newModule);
    } catch (error) {
      logger.error('Error creating module:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Create a new exercise
  fastify.post('/exercises', {
    schema: {
      body: {
        type: 'object',
        properties: {
          titre: { type: 'string' },
          consigne: { type: 'string' },
          type: { type: 'string' },
          difficulte: { type: 'string' },
          module_id: { type: 'number' },
          competence_code: { type: 'string' },
          metadata: { type: 'object' }
        },
        required: ['titre', 'consigne', 'type', 'difficulte', 'module_id']
      },
      response: {
        201: ExerciseSchema
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const exerciseData = request.body as any;
      const newExercise = await cp2025Service.createExercise(exerciseData);
      
      logger.info(`Created new exercise: ${newExercise.titre}`);
      return reply.status(201).send(newExercise);
    } catch (error) {
      logger.error('Error creating exercise:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update a module
  fastify.put('/modules/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          titre: { type: 'string' },
          description: { type: 'string' },
          niveau: { type: 'string' },
          matiere: { type: 'string' },
          periode: { type: 'string' },
          ordre: { type: 'number' },
          competence_domain: { type: 'string' },
          cp2025: { type: 'boolean' },
          metadata: { type: 'object' }
        }
      },
      response: {
        200: ModuleSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const updates = request.body as any;
      
      const updatedModule = await cp2025Service.updateModule(id, updates);
      
      if (!updatedModule) {
        return reply.status(404).send({ error: 'Module not found' });
      }
      
      logger.info(`Updated module: ${updatedModule.titre}`);
      return reply.send(updatedModule);
    } catch (error) {
      logger.error('Error updating module:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update an exercise
  fastify.put('/exercises/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          titre: { type: 'string' },
          consigne: { type: 'string' },
          type: { type: 'string' },
          difficulte: { type: 'string' },
          module_id: { type: 'number' },
          competence_code: { type: 'string' },
          metadata: { type: 'object' }
        }
      },
      response: {
        200: ExerciseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const updates = request.body as any;
      
      const updatedExercise = await cp2025Service.updateExercise(id, updates);
      
      if (!updatedExercise) {
        return reply.status(404).send({ error: 'Exercise not found' });
      }
      
      logger.info(`Updated exercise: ${updatedExercise.titre}`);
      return reply.send(updatedExercise);
    } catch (error) {
      logger.error('Error updating exercise:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete a module
  fastify.delete('/modules/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const deleted = await cp2025Service.deleteModule(id);
      
      if (!deleted) {
        return reply.status(404).send({ error: 'Module not found' });
      }
      
      logger.info(`Deleted module with ID: ${id}`);
      return reply.send({ success: true, message: 'Module deleted successfully' });
    } catch (error) {
      logger.error('Error deleting module:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete an exercise
  fastify.delete('/exercises/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: number };
      const deleted = await cp2025Service.deleteExercise(id);
      
      if (!deleted) {
        return reply.status(404).send({ error: 'Exercise not found' });
      }
      
      logger.info(`Deleted exercise with ID: ${id}`);
      return reply.send({ success: true, message: 'Exercise deleted successfully' });
    } catch (error) {
      logger.error('Error deleting exercise:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Export all data
  fastify.get('/export', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            modules: { type: 'array', items: ModuleSchema },
            exercises: { type: 'array', items: ExerciseSchema },
            statistics: StatisticsSchema,
            competenceCodes: { type: 'array' },
            exportedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await cp2025Service.exportData();
      
      logger.info('Exported CP2025 data');
      return reply.send(data);
    } catch (error) {
      logger.error('Error exporting data:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 