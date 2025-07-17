import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config/config';
import { getDatabase } from '../db/connection';
import { students } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Removed unused FastifyInstance, request, reply, FastifyJWT

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT plugin
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  });

  // Authentication decorator
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Login route
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['prenom', 'nom'],
        properties: {
          prenom: { type: 'string', minLength: 2 },
          nom: { type: 'string', minLength: 2 },
        },
      },
    },
    handler: async (request, reply) => {
      const { prenom, nom } = request.body as { prenom: string; nom: string };
      const db = getDatabase();

      try {
        const student = await db
          .select()
          .from(students)
          .where(and(eq(students.prenom, prenom), eq(students.nom, nom)))
          .limit(1);

        if (student.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Élève non trouvé',
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        const token = reply.jwtSign({ studentId: student[0].id });

        return reply.send({
          success: true,
          data: {
            token,
            student: {
              id: student[0].id,
              prenom: student[0].prenom,
              nom: student[0].nom,
              niveauActuel: student[0].niveauActuel,
            },
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

  // Logout route
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      // In a real app, you might want to blacklist the token
      return reply.send({
        success: true,
        message: 'Déconnexion réussie',
      });
    },
  });

  // Token refresh route
  fastify.post('/refresh', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const token = reply.jwtSign({ studentId: request.user.studentId });
      return reply.send({
        success: true,
        data: { token },
        message: 'Token actualisé',
      });
    },
  });

  // Student verification route
  fastify.get('/verify/:studentId', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { studentId } = request.params as { studentId: string };
      const db = getDatabase();

      try {
        const student = await db
          .select()
          .from(students)
          .where(eq(students.id, parseInt(studentId)))
          .limit(1);

        if (student.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Élève non trouvé',
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        return reply.send({
          success: true,
          data: {
            id: student[0].id,
            prenom: student[0].prenom,
            nom: student[0].nom,
            niveauActuel: student[0].niveauActuel,
            estConnecte: true,
          },
          message: 'Élève vérifié',
        });
      } catch (error) {
        fastify.log.error('Verification error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la vérification',
            code: 'VERIFICATION_ERROR',
          },
        });
      }
    },
  });

  // Health check route
  fastify.get('/health', async () => {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'auth',
      },
      message: 'Service d\'authentification opérationnel',
    };
  });
};

export default fp(authPlugin); 