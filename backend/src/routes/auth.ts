
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance } from 'fastify';
import { databaseService } from '../services/database.service.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Student login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', minLength: 1 }
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
                    niveauActuel: { type: 'string' },
                    totalPoints: { type: 'number' }
                  }
                },
                token: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { code } = request.body as { code: string };
      
      // Use real database service
      const student = await databaseService.getStudentByCode(code);
      
      if (!student) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid student code'
          }
        });
      }

      // Update last access
      await databaseService.updateStudent(student.id, {
        dernierAcces: new Date(),
        estConnecte: true
      });

      // Generate JWT token
      const token = fastify.jwt.sign({ 
        studentId: student.id,
        prenom: student.prenom,
        niveau: student.niveauActuel
      });

      return {
        success: true,
        data: {
          student: {
            id: student.id,
            prenom: student.prenom,
            nom: student.nom,
            niveauActuel: student.niveauActuel,
            totalPoints: student.totalPoints
          },
          token
        }
      };
    } catch (error) {
      fastify.log.error('Login error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    }
  });

  // Student logout
  fastify.post('/logout', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      
      // Update connection status
      await databaseService.updateStudent(studentId, {
        estConnecte: false
      });

      return {
        success: true,
        data: { message: 'Logged out successfully' }
      };
    } catch (error) {
      fastify.log.error('Logout error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    }
  });

  // Get current student profile
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
            age: student.age,
            niveauActuel: student.niveauActuel,
            totalPoints: student.totalPoints,
            serieJours: student.serieJours,
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
          message: 'Internal server error'
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
            age: updatedStudent.age,
            niveauActuel: updatedStudent.niveauActuel,
            totalPoints: updatedStudent.totalPoints,
            serieJours: updatedStudent.serieJours,
            preferences: updatedStudent.preferences
          }
        }
      };
    } catch (error) {
      fastify.log.error('Update profile error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    }
  });

  // Health check for authentication service
  fastify.get('/health', async (request, reply) => {
    try {
      const dbHealth = await databaseService.healthCheck();
      
      return {
        success: true,
        data: {
          service: 'authentication',
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
      fastify.log.error('Auth health check error:', error);
      return reply.status(503).send({
        success: false,
        error: {
          code: 'SERVICE_UNHEALTHY',
          message: 'Authentication service is unhealthy'
        }
      });
    }
  });
}
