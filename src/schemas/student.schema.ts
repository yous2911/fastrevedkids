import { FastifySchema } from 'fastify';

export const studentSchemas = {
  getStudent: {
    description: 'Get student information',
    tags: ['students'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              prenom: { type: 'string' },
              nom: { type: 'string' },
              niveauActuel: { type: 'string' },
              age: { type: 'number' },
              totalPoints: { type: 'number' },
              serieJours: { type: 'number' },
              preferences: { type: 'object' },
              dernierAcces: { type: 'string', format: 'date-time' },
              estConnecte: { type: 'boolean' },
            },
          },
          message: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  getRecommendations: {
    description: 'Get exercise recommendations for student',
    tags: ['students'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'string', pattern: '^\\d+$' },
        niveau: { type: 'string' },
        matiere: { type: 'string' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                titre: { type: 'string' },
                consigne: { type: 'string' },
                type: { type: 'string' },
                difficulte: { type: 'string' },
                pointsReussite: { type: 'number' },
                dureeEstimee: { type: 'number' },
                moduleTitle: { type: 'string' },
                moduleMatiere: { type: 'string' },
              },
            },
          },
          message: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  submitAttempt: {
    description: 'Submit exercise attempt',
    tags: ['students'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
      },
    },
    body: {
      type: 'object',
      required: ['exerciseId', 'attempt'],
      properties: {
        exerciseId: { type: 'number' },
        attempt: {
          type: 'object',
          required: ['reponse', 'reussi', 'tempsSecondes'],
          properties: {
            reponse: {},
            reussi: { type: 'boolean' },
            tempsSecondes: { type: 'number', minimum: 1, maximum: 3600 },
            aidesUtilisees: { type: 'number', minimum: 0 },
          },
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              reussi: { type: 'boolean' },
              pointsGagnes: { type: 'number' },
              totalPoints: { type: 'number' },
              recommendations: { type: 'string' },
            },
          },
          message: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  getProgress: {
    description: 'Get student progress',
    tags: ['students'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        matiere: { type: 'string' },
        limit: { type: 'string', pattern: '^\\d+$' },
      },
    },
  } as FastifySchema,

  getSessions: {
    description: 'Get student sessions and analytics',
    tags: ['students'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'string', pattern: '^\\d+$' },
        days: { type: 'string', pattern: '^\\d+$' },
      },
    },
  } as FastifySchema,

  createStudent: {
    description: 'Create new student',
    tags: ['students'],
    body: {
      type: 'object',
      required: ['prenom', 'nom', 'dateNaissance', 'niveauActuel'],
      properties: {
        prenom: { type: 'string', minLength: 2, maxLength: 50 },
        nom: { type: 'string', minLength: 2, maxLength: 50 },
        dateNaissance: { type: 'string', format: 'date' },
        niveauActuel: { type: 'string', enum: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
        emailParent: { type: 'string', format: 'email' },
        motDePasse: { type: 'string', minLength: 6 },
      },
    },
  } as FastifySchema,

  updateStudent: {
    description: 'Update student information',
    tags: ['students'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
      },
    },
    body: {
      type: 'object',
      properties: {
        prenom: { type: 'string', minLength: 2, maxLength: 50 },
        nom: { type: 'string', minLength: 2, maxLength: 50 },
        niveauActuel: { type: 'string', enum: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
        emailParent: { type: 'string', format: 'email' },
        preferences: { type: 'object' },
        adaptations: { type: 'object' },
      },
    },
  } as FastifySchema,

  deleteStudent: {
    description: 'Delete student account',
    tags: ['students'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
      },
    },
  } as FastifySchema,
}; 