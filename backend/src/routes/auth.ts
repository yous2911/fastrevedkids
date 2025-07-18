
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest, LoginBody } from '../types/fastify-extended.js';
import { students } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // FIXED: Line 7:51 - Replace any with proper types
  fastify.post<{ Body: LoginBody }>('/login', {
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
    handler: async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const { prenom, nom } = request.body;

      try {
        const student = await fastify.db
          .select()
          .from(students)
          .where(and(eq(students.prenom, prenom), eq(students.nom, nom)))
          .limit(1);

        if (student.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Élève non trouvé',
              code: 'STUDENT_NOT_FOUND'
            }
          });
        }

        const token = await reply.jwtSign({ 
          studentId: student[0].id,
          prenom: student[0].prenom,
          nom: student[0].nom 
        });

        return reply.send({
          success: true,
          data: {
            token,
            student: student[0]
          },
          message: 'Connexion réussie'
        });
      } catch (error) {
        fastify.log.error('Login error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la connexion',
            code: 'LOGIN_ERROR'
          }
        });
      }
    }
  });

  // FIXED: Lines 116:30, 150:30 - Replace any with proper types
  fastify.get('/me', {
    preHandler: fastify.authenticate,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        data: request.user,
        message: 'Profil récupéré avec succès'
      });
    }
  });

  fastify.post('/logout', {
    preHandler: fastify.authenticate,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      // In a real app, you might want to blacklist the token
      return reply.send({
        success: true,
        message: 'Déconnexion réussie'
      });
    }
  });
};

export default authRoutes;
