// src/schemas/curriculum.ts
import { z } from 'zod';

const levelEnum = z.enum(['cp', 'ce1', 'ce2', 'cm1', 'cm2', 'cp-ce1']);
const subjectEnum = z.enum(['MATHEMATIQUES', 'FRANCAIS', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE', 'ANGLAIS']);
const difficultyEnum = z.enum(['FACILE', 'MOYEN', 'DIFFICILE']);
const exerciseTypeEnum = z.enum(['QCM', 'CALCUL', 'TEXTE_LIBRE', 'DRAG_DROP', 'CONJUGAISON', 'LECTURE', 'GEOMETRIE', 'PROBLEME']);

export const curriculumSchemas = {
  // GET /curriculum/levels
  getLevels: {
    summary: 'Get all supported educational levels',
    tags: ['curriculum'],
    response: {
      200: z.object({
        success: z.boolean(),
        data: z.array(z.object({
          id: z.string(),
          name: z.string(),
          displayName: z.string(),
          order: z.number(),
          subjectsCount: z.number(),
          available: z.boolean()
        })),
        message: z.string()
      })
    }
  },

  // GET /curriculum/:level
  getCurriculumByLevel: {
    summary: 'Get complete curriculum for a specific level',
    tags: ['curriculum'],
    params: z.object({
      level: levelEnum
    }),
    querystring: z.object({
      subject: subjectEnum.optional(),
      period: z.string().optional()
    }),
    response: {
      200: z.object({
        success: z.boolean(),
        data: z.object({
          level: z.object({
            id: z.string(),
            name: z.string(),
            displayName: z.string(),
            order: z.number()
          }),
          curriculum: z.array(z.object({
            id: z.number(),
            nom: z.string(),
            chapitres: z.array(z.object({
              id: z.number(),
              titre: z.string(),
              description: z.string().optional(),
              sousChapitres: z.array(z.object({
                id: z.number(),
                titre: z.string(),
                description: z.string().optional(),
                exercicesCount: z.number()
              }))
            }))
          })),
          totalExercises: z.number(),
          lastUpdated: z.string()
        }),
        message: z.string()
      }),
      404: z.object({
        success: z.boolean(),
        error: z.object({
          message: z.string(),
          code: z.string(),
          supportedLevels: z.array(z.string()).optional()
        })
      })
    }
  },

  // GET /curriculum/:level/subjects
  getSubjectsByLevel: {
    summary: 'Get subjects for a specific level',
    tags: ['curriculum'],
    params: z.object({
      level: levelEnum
    }),
    response: {
      200: z.object({
        success: z.boolean(),
        data: z.array(z.object({
          id: z.number(),
          nom: subjectEnum,
          chapitresCount: z.number(),
          exercicesCount: z.number()
        })),
        message: z.string()
      }),
      404: z.object({
        success: z.boolean(),
        error: z.object({
          message: z.string(),
          code: z.string()
        })
      })
    }
  },

  // GET /curriculum/:level/exercises
  getExercisesByLevel: {
    summary: 'Get exercises for a specific level with filtering',
    tags: ['curriculum'],
    params: z.object({
      level: levelEnum
    }),
    querystring: z.object({
      subject: subjectEnum.optional(),
      difficulty: difficultyEnum.optional(),
      type: exerciseTypeEnum.optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }),
    response: {
      200: z.object({
        success: z.boolean(),
        data: z.object({
          exercises: z.array(z.object({
            id: z.number(),
            type: exerciseTypeEnum,
            configuration: z.any(),
            xp: z.number(),
            difficulte: difficultyEnum,
            context: z.object({
              sousChapitre: z.string(),
              chapitre: z.string(),
              matiere: z.string(),
              niveau: z.string()
            })
          })),
          pagination: z.object({
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
            hasMore: z.boolean()
          })
        }),
        message: z.string()
      })
    }
  },

  // GET /curriculum/statistics
  getStatistics: {
    summary: 'Get curriculum statistics across all levels',
    tags: ['curriculum'],
    response: {
      200: z.object({
        success: z.boolean(),
        data: z.object({
          levelStatistics: z.array(z.object({
            level: z.string(),
            subjectsCount: z.number(),
            chaptersCount: z.number(),
            subChaptersCount: z.number(),
            exercisesCount: z.number()
          })),
          exerciseTypes: z.array(z.object({
            type: exerciseTypeEnum,
            count: z.number()
          })),
          difficultyDistribution: z.array(z.object({
            difficulty: difficultyEnum,
            count: z.number()
          })),
          totalLevels: z.number(),
          lastUpdated: z.string()
        }),
        message: z.string()
      })
    }
  }
}; 