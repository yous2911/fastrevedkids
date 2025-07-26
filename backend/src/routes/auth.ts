
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authSchemas } from '../schemas/auth.schema';

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
        // Mock successful login for testing
        const mockStudent = {
          id: 1,
          prenom: prenom,
          nom: nom,
          dateNaissance: '2015-01-01',
          niveauActuel: 'CP',
          totalPoints: 0,
          serieJours: 0,
          mascotteType: 'dragon',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        };

        // Generate mock JWT token
        const tokenPayload = {
          studentId: mockStudent.id,
          prenom: mockStudent.prenom,
          nom: mockStudent.nom,
          niveau: mockStudent.niveauActuel,
        };

        const token = await reply.jwtSign(tokenPayload, {
          expiresIn: '24h'
        });

        return reply.send({
          success: true,
          data: {
            token,
            student: mockStudent,
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
        const mockStudent = {
          id: 1,
          prenom: 'Alice',
          nom: 'Dupont',
          niveauActuel: 'CP',
        };

        const newTokenPayload = {
          studentId: mockStudent.id,
          prenom: mockStudent.prenom,
          nom: mockStudent.nom,
          niveau: mockStudent.niveauActuel,
        };

        const newToken = await reply.jwtSign(newTokenPayload, {
          expiresIn: '24h'
        });

        return reply.send({
          success: true,
          data: {
            token: newToken,
            student: mockStudent,
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
