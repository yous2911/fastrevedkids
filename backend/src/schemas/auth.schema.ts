import { z } from 'zod';
import { FastifySchema } from 'fastify';

// Zod schemas for validation
export const loginSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  motDePasse: z.string().optional(),
});

export const logoutSchema = z.object({});

export const refreshSchema = z.object({});

export const verifySchema = z.object({
  studentId: z.string().regex(/^\d+$/, "L'ID doit être un nombre"),
});

// Fastify JSON schemas
export const authSchemas = {
  login: {
    description: 'Student login endpoint',
    tags: ['auth'],
    body: {
      type: 'object',
      required: ['prenom', 'nom'],
      properties: {
        prenom: {
          type: 'string',
          minLength: 2,
          maxLength: 50,
          pattern: '^[a-zA-ZÀ-ÿ\\s\\-\']+$',
          description: 'Student first name (2-50 characters, letters only)'
        },
        nom: {
          type: 'string',
          minLength: 2,
          maxLength: 50,
          pattern: '^[a-zA-ZÀ-ÿ\\s\\-\']+$',
          description: 'Student last name (2-50 characters, letters only)'
        },
        motDePasse: {
          type: 'string',
          minLength: 4,
          maxLength: 100,
          description: 'Optional password for enhanced security'
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              student: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  prenom: { type: 'string' },
                  nom: { type: 'string' },
                  niveau: { type: 'string' },
                  age: { type: 'number' },
                  totalPoints: { type: 'number' },
                  serieJours: { type: 'number' },
                },
              },
            },
          },
          message: { type: 'string' },
        },
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
  } as FastifySchema,

  logout: {
    description: 'Student logout endpoint',
    tags: ['auth'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' }
        }
      },
      401: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' }
            }
          }
        }
      }
    }
  } as FastifySchema,

  refresh: {
    description: 'Refresh JWT token',
    tags: ['auth'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' }
            }
          },
          message: { type: 'string' }
        }
      },
      401: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' }
            }
          }
        }
      }
    }
  } as FastifySchema,

  verify: {
    description: 'Verify student exists and get basic info',
    tags: ['auth'],
    params: {
      type: 'object',
      required: ['studentId'],
      properties: {
        studentId: {
          type: 'string',
          pattern: '^\\d+$',
          description: 'Student ID to verify (numeric)'
        }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              student: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  prenom: { type: 'string' },
                  nom: { type: 'string' },
                  niveau: { type: 'string' },
                  age: { type: 'number' },
                  dernierAcces: { type: 'string', format: 'date-time' },
                  estConnecte: { type: 'boolean' },
                },
              },
              parentCode: { type: 'string' },
            },
          },
          message: { type: 'string' },
        },
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
  } as FastifySchema,

  health: {
    description: 'Authentication service health check',
    tags: ['auth'],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              service: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              jwt: { type: 'object' },
              database: { type: 'string' },
              uptime: { type: 'number' }
            }
          },
          message: { type: 'string' }
        }
      },
      503: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' }
            }
          }
        }
      }
    }
  } as FastifySchema,
};

// Validation helpers
export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data);
}

export function validateVerify(data: unknown) {
  return verifySchema.safeParse(data);
}
