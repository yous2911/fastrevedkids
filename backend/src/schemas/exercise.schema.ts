import { FastifySchema } from 'fastify';

export const exerciseSchemas = {
  createModule: {
    description: 'Create pedagogical module',
    tags: ['exercises'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['titre', 'description', 'niveau', 'matiere', 'periode'],
      properties: {
        titre: { type: 'string', minLength: 3, maxLength: 200 },
        description: { type: 'string', minLength: 10, maxLength: 1000 },
        niveau: { type: 'string', enum: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
        matiere: { type: 'string', enum: ['MATHEMATIQUES', 'FRANCAIS', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE', 'ANGLAIS'] },
        periode: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4', 'P5'] },
        ordre: { type: 'number', minimum: 1 },
        competenceCode: { type: 'string', pattern: '^(CP|CE1|CE2|CM1|CM2)\\.(FR|MA)\\.[A-Z]+\\d+\\.\\d+$' },
        metadata: { type: 'object' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          message: { type: 'string' }
        }
      }
    }
  } as FastifySchema,

  createExercise: {
    description: 'Create exercise with CP 2025 competence mapping',
    tags: ['exercises'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['titre', 'consigne', 'type', 'moduleId', 'competenceCode', 'configuration'],
      properties: {
        titre: { type: 'string', minLength: 3, maxLength: 200 },
        consigne: { type: 'string', minLength: 10, maxLength: 1000 },
        type: { type: 'string', enum: ['QCM', 'CALCUL', 'TEXTE_LIBRE', 'DRAG_DROP', 'CONJUGAISON', 'LECTURE', 'GEOMETRIE', 'PROBLEME'] },
        difficulte: { type: 'string', enum: ['decouverte', 'entrainement', 'consolidation', 'approfondissement'] },
        moduleId: { type: 'number', minimum: 1 },
        competenceCode: { type: 'string', pattern: '^(CP|CE1|CE2|CM1|CM2)\\.(FR|MA)\\.[A-Z]+\\d+\\.\\d+$' },
        configuration: { type: 'object' },
        pointsReussite: { type: 'number', minimum: 1, maximum: 100 },
        dureeEstimee: { type: 'number', minimum: 1, maximum: 60 },
        ordre: { type: 'number', minimum: 1 },
        metadata: { type: 'object' }
      }
    }
  } as FastifySchema,

  bulkGenerate: {
    description: 'Bulk generate exercises from CP 2025 competences',
    tags: ['exercises'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['competenceCodes', 'moduleId', 'baseConfiguration'],
      properties: {
        competenceCodes: { 
          type: 'array', 
          items: { type: 'string', pattern: '^(CP|CE1|CE2|CM1|CM2)\\.(FR|MA)\\.[A-Z]+\\d+\\.\\d+$' },
          minItems: 1,
          maxItems: 50
        },
        moduleId: { type: 'number', minimum: 1 },
        baseConfiguration: { type: 'object' },
        generateVariations: { type: 'boolean' }
      }
    }
  } as FastifySchema,

  getByCompetence: {
    description: 'Get exercises by competence code',
    tags: ['exercises'],
    params: {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string', pattern: '^(CP|CE1|CE2|CM1|CM2)\\.(FR|MA)\\.[A-Z]+\\d+\\.\\d+$' }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'string', pattern: '^\\d+$' },
        offset: { type: 'string', pattern: '^\\d+$' },
        difficulte: { type: 'string', enum: ['decouverte', 'entrainement', 'consolidation', 'approfondissement'] }
      }
    }
  } as FastifySchema,

  updateExercise: {
    description: 'Update exercise',
    tags: ['exercises'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' }
      }
    }
  } as FastifySchema,

  deleteExercise: {
    description: 'Delete exercise',
    tags: ['exercises'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' }
      }
    }
  } as FastifySchema
}; 