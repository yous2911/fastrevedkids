
import { FastifyInstance } from 'fastify';
import { databaseService } from '../services/database.service.js';
import crypto from 'crypto';

export default async function studentRoutes(fastify: FastifyInstance) {
  // Get all students (for login selection)
  fastify.get('/', async (request, reply) => {
    try {
      // For now, return mock data since database service might not be fully implemented
      const mockStudents = [
        {
          id: 1,
          prenom: 'Alice',
          nom: 'Dupont',
          niveauActuel: 'CP',
          totalPoints: 150,
          serieJours: 5,
          mascotteType: 'dragon',
          dernierAcces: new Date().toISOString(),
          estConnecte: false
        },
        {
          id: 2,
          prenom: 'Lucas',
          nom: 'Martin',
          niveauActuel: 'CE1',
          totalPoints: 320,
          serieJours: 12,
          mascotteType: 'robot',
          dernierAcces: new Date().toISOString(),
          estConnecte: false
        },
        {
          id: 3,
          prenom: 'Emma',
          nom: 'Bernard',
          niveauActuel: 'CP',
          totalPoints: 85,
          serieJours: 3,
          mascotteType: 'fairy',
          dernierAcces: new Date().toISOString(),
          estConnecte: false
        }
      ];

      return {
        success: true,
        data: mockStudents
      };
    } catch (error) {
      fastify.log.error('Get all students error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get students list'
        }
      });
    }
  });

  // Get student profile
  fastify.get('/profile', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      
      const student = await databaseService.getStudentById(studentId);
      
      if (!student) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found'
          }
        });
      }

      return {
        success: true,
        data: {
          student: {
            id: student.id,
            prenom: student.prenom,
            nom: student.nom,
            dateNaissance: student.dateNaissance,
            niveauActuel: student.niveauActuel,
            totalPoints: student.totalPoints,
            serieJours: student.serieJours,
            mascotteType: student.mascotteType,
            dernierAcces: student.dernierAcces,
            estConnecte: student.estConnecte
          }
        }
      };
    } catch (error) {
      fastify.log.error('Get profile error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get student profile'
        }
      });
    }
  });

  // Update student profile
  fastify.put('/profile', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          prenom: { type: 'string', minLength: 1 },
          nom: { type: 'string', minLength: 1 },
          age: { type: 'number', minimum: 3, maximum: 18 },
          preferences: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const updates = request.body as any;
      
      const updatedStudent = await databaseService.updateStudent(studentId, updates);

      return {
        success: true,
        data: {
          student: {
            id: updatedStudent.id,
            prenom: updatedStudent.prenom,
            nom: updatedStudent.nom,
            dateNaissance: updatedStudent.dateNaissance,
            niveauActuel: updatedStudent.niveauActuel,
            totalPoints: updatedStudent.totalPoints,
            serieJours: updatedStudent.serieJours,
            mascotteType: updatedStudent.mascotteType
          }
        }
      };
    } catch (error) {
      fastify.log.error('Update profile error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update student profile'
        }
      });
    }
  });

  // Get student progress
  fastify.get('/progress', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          matiere: { type: 'string' },
          limit: { type: 'number', default: 50 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const { matiere, limit } = request.query as { matiere?: string; limit?: number };
      
      const progress = await databaseService.getStudentProgress(studentId, matiere, limit);

      return {
        success: true,
        data: {
          progress,
          count: progress.length,
          matiere: matiere || 'all'
        }
      };
    } catch (error) {
      fastify.log.error('Get progress error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get student progress'
        }
      });
    }
  });

  // Get student statistics
  fastify.get('/stats', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      
      const stats = await databaseService.getStudentStats(studentId);

      return {
        success: true,
        data: { stats }
      };
    } catch (error) {
      fastify.log.error('Get stats error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get student statistics'
        }
      });
    }
  });

  // Get student sessions
  fastify.get('/sessions', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const { limit } = request.query as { limit?: number };
      
      const sessions = await databaseService.getStudentSessions(studentId, limit);

      return {
        success: true,
        data: {
          sessions,
          count: sessions.length
        }
      };
    } catch (error) {
      fastify.log.error('Get sessions error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get student sessions'
        }
      });
    }
  });

  // Create new session
  fastify.post('/sessions', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['dateDebut'],
        properties: {
          dateDebut: { type: 'string', format: 'date-time' },
          dureeSecondes: { type: 'number', default: 0 },
          exercicesCompletes: { type: 'number', default: 0 },
          pointsGagnes: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const sessionData = request.body as any;
      
      const session = await databaseService.createSession({
        id: crypto.randomUUID(),
        studentId,
        data: JSON.stringify({
          dateDebut: sessionData.dateDebut,
          dureeSecondes: sessionData.dureeSecondes || 0,
          exercicesCompletes: sessionData.exercicesCompletes || 0,
          pointsGagnes: sessionData.pointsGagnes || 0,
          actionsUtilisateur: [],
          metadata: {}
        }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        data: { session }
      };
    } catch (error) {
      fastify.log.error('Create session error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create session'
        }
      });
    }
  });

  // Update session
  fastify.put('/sessions/:sessionId', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          dateFin: { type: 'string', format: 'date-time' },
          dureeSecondes: { type: 'number' },
          exercicesCompletes: { type: 'number' },
          pointsGagnes: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const { sessionId } = request.params as { sessionId: number };
      const updates = request.body as any;
      
      // Verify session belongs to student
      const sessions = await databaseService.getStudentSessions(studentId, 100);
      const studentSession = sessions.find(s => s.id === sessionId.toString());
      
      if (!studentSession) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found'
          }
        });
      }

      // Parse existing data and merge with updates
      const existingData = JSON.parse(studentSession.data);
      const updatedData = {
        ...existingData,
        ...updates,
        dateFin: updates.dateFin || existingData.dateFin,
        updatedAt: new Date().toISOString()
      };

      const updatedSession = await databaseService.updateSession(sessionId.toString(), {
        data: JSON.stringify(updatedData)
      });

      return {
        success: true,
        data: { session: updatedSession }
      };
    } catch (error) {
      fastify.log.error('Update session error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update session'
        }
      });
    }
  });

  // Get recommended exercises
  fastify.get('/recommendations', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 5 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const { limit } = request.query as { limit?: number };
      
      const recommendations = await databaseService.getRecommendedExercises(studentId, limit || 5);

      return {
        success: true,
        data: {
          recommendations,
          count: recommendations.length
        }
      };
    } catch (error) {
      fastify.log.error('Get recommendations error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get recommendations'
        }
      });
    }
  });

  // Get weekly progress
  fastify.get('/weekly-progress', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      
      const weeklyProgress = await databaseService.getWeeklyProgress(studentId);

      return {
        success: true,
        data: { weeklyProgress }
      };
    } catch (error) {
      fastify.log.error('Get weekly progress error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get weekly progress'
        }
      });
    }
  });

  // Get subject progress
  fastify.get('/subject-progress', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      
      const subjectProgress = await databaseService.getSubjectProgress(studentId);

      return {
        success: true,
        data: { subjectProgress }
      };
    } catch (error) {
      fastify.log.error('Get subject progress error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get subject progress'
        }
      });
    }
  });

  // Health check for student service
  fastify.get('/health', async (request, reply) => {
    try {
      const dbHealth = await databaseService.healthCheck();
      
      return {
        success: true,
        data: {
          service: 'students',
          status: 'healthy',
          timestamp: new Date(),
          database: dbHealth.status,
          details: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: dbHealth.details
          }
        }
      };
    } catch (error) {
      fastify.log.error('Student health check error:', error);
      return reply.status(503).send({
        success: false,
        error: {
          code: 'SERVICE_UNHEALTHY',
          message: 'Student service is unhealthy'
        }
      });
    }
  });
}
