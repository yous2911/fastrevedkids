
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authSchemas } from '../schemas/auth.schema';
import { db } from '../db/connection';
import { students } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Type definitions for request bodies
interface LoginRequestBody {
  prenom: string;
  nom: string;
  motDePasse?: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint with mock data
  fastify.post('/login', {
    schema: authSchemas.login,
    handler: async (
      request: FastifyRequest<{ Body: LoginRequestBody }>, 
      reply: FastifyReply
    ) => {
      const { prenom, nom } = request.body;

      try {
        // Look up student in database
        const student = await db.select().from(students).where(
          and(
            eq(students.prenom, prenom),
            eq(students.nom, nom)
          )
        ).limit(1);

        if (student.length === 0) {
          return reply.status(401).send({
            success: false,
            error: {
              message: 'Identifiants incorrects',
              code: 'INVALID_CREDENTIALS',
            },
          });
        }

        const foundStudent = student[0];

        // Generate JWT token
        const tokenPayload = {
          studentId: foundStudent.id,
          prenom: foundStudent.prenom,
          nom: foundStudent.nom,
          niveau: foundStudent.niveauActuel,
        };

        const token = await reply.jwtSign(tokenPayload, {
          expiresIn: '24h'
        });

        return reply.send({
          success: true,
          data: {
            token,
            student: foundStudent,
          },
          message: 'Connexion réussie',
        });

      } catch (error) {
        fastify.log.error('Login error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la connexion',
            code: 'LOGIN_ERROR',
          },
        });
      }
    },
  });

  // Logout endpoint
  fastify.post('/logout', {
    schema: authSchemas.logout,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return reply.send({
          success: true,
          message: 'Déconnexion réussie',
        });
      } catch (error) {
        fastify.log.error('Logout error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la déconnexion',
            code: 'LOGOUT_ERROR',
          },
        });
      }
    },
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: authSchemas.refresh,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get student from JWT token
        const decoded = await request.jwtVerify() as any;
        const studentId = decoded.studentId;

        // Get student from database
        const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);

        if (student.length === 0) {
          return reply.status(401).send({
            success: false,
            error: {
              message: 'Étudiant non trouvé',
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        const foundStudent = student[0];

        const newTokenPayload = {
          studentId: foundStudent.id,
          prenom: foundStudent.prenom,
          nom: foundStudent.nom,
          niveau: foundStudent.niveauActuel,
        };

        const newToken = await reply.jwtSign(newTokenPayload, {
          expiresIn: '24h'
        });

        return reply.send({
          success: true,
          data: {
            token: newToken,
            student: foundStudent,
          },
          message: 'Token rafraîchi',
        });

      } catch (error) {
        fastify.log.error('Token refresh error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors du rafraîchissement',
            code: 'REFRESH_ERROR',
          },
        });
      }
    },
  });

  // Health check for auth service
  fastify.get('/health', {
    schema: authSchemas.health,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return reply.send({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'mock',
            totalStudents: 1,
            uptime: process.uptime(),
            redis: 'disabled',
          },
          message: 'Service d\'authentification opérationnel (mock)',
        });

      } catch (error) {
        fastify.log.error('Auth health check error:', error);
        return reply.status(503).send({
          success: false,
          error: {
            message: 'Service d\'authentification indisponible',
            code: 'SERVICE_UNAVAILABLE',
          },
        });
      }
    },
  });
}
