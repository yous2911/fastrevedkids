
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance, FastifyRequest, FastifyReply, RouteOptions } from 'fastify';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { students } from '../db/schema';
import { authSchemas } from '../schemas/auth.schema';

// Fix: Properly type the Fastify instance with plugins
interface FastifyInstanceWithPlugins extends FastifyInstance {
  db: any;
  cache: any;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

export default async function authRoutes(fastify: FastifyInstanceWithPlugins) {
  // Login endpoint
  fastify.post('/login', {
    schema: authSchemas.login,
    handler: async (request: FastifyRequest<{
      Body: { prenom: string; nom: string; motDePasse?: string }
    }>, reply: FastifyReply) => {
      const { prenom, motDePasse } = request.body;

      try {
        // Find student by name
        const student = await fastify.db
          .select()
          .from(students)
          .where(eq(students.prenom, prenom))
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

        const foundStudent = student[0];

        // If password is provided, verify it
        if (motDePasse && foundStudent.motDePasseHash) {
          const isValidPassword = await bcrypt.compare(motDePasse, foundStudent.motDePasseHash);
          if (!isValidPassword) {
            return reply.status(401).send({
              success: false,
              error: {
                message: 'Mot de passe incorrect',
                code: 'INVALID_PASSWORD',
              },
            });
          }
        }

        // Update last access and connection status
        await fastify.db
          .update(students)
          .set({
            dernierAcces: new Date(),
            estConnecte: true,
          })
          .where(eq(students.id, foundStudent.id));

        // Generate JWT token
        const token = await reply.jwtSign({
          id: foundStudent.id,
          prenom: foundStudent.prenom,
          nom: foundStudent.nom,
          niveauActuel: foundStudent.niveauActuel,
        });

        // Cache student session if available
        if (fastify.cache) {
          await fastify.cache.set(
            `session:${foundStudent.id}`,
            JSON.stringify({
              studentId: foundStudent.id,
              prenom: foundStudent.prenom,
              nom: foundStudent.nom,
              niveau: foundStudent.niveauActuel,
              loginTime: new Date().toISOString(),
            }),
            3600 // 1 hour
          );
        }

        return reply.send({
          success: true,
          data: {
            token,
            student: {
              id: foundStudent.id,
              prenom: foundStudent.prenom,
              nom: foundStudent.nom,
              niveau: foundStudent.niveauActuel,
              age: foundStudent.age,
              totalPoints: foundStudent.totalPoints,
              serieJours: foundStudent.serieJours,
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

  // Logout endpoint
  fastify.post('/logout', {
    schema: authSchemas.logout,
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = (request as any).user;
    try {
      const { studentId } = user;

      // Update connection status
      await fastify.db
        .update(students)
        .set({ estConnecte: false })
        .where(eq(students.id, studentId));

      // Remove cached session if available
      if (fastify.cache) {
        await fastify.cache.del(`session:${studentId}`);
      }

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
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: authSchemas.refresh,
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest & { user: any }, reply: FastifyReply) => {
    try {
      const { studentId, prenom, nom, niveau } = request.user;

      // Check if student still exists and is active
      const student = await fastify.db
        .select()
        .from(students)
        .where(eq(students.id, studentId))
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

      // Generate new token
      const token = await reply.jwtSign({
        id: studentId,
        prenom,
        nom,
        niveauActuel: niveau,
      });

      return reply.send({
        success: true,
        data: { token },
        message: 'Token actualisé',
      });
    } catch (error) {
      fastify.log.error('Refresh token error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Erreur lors du renouvellement du token',
          code: 'REFRESH_ERROR',
        },
      });
    }
  });

  // Verify student endpoint
  fastify.get('/verify/:studentId', {
    schema: authSchemas.verify,
    handler: async (request: FastifyRequest<{
      Params: { studentId: string }
    }>, reply: FastifyReply) => {
      try {
        const { studentId } = request.params;
        
        const student = await fastify.db
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

        const foundStudent = student[0];

        return reply.send({
          success: true,
          data: {
            student: {
              id: foundStudent.id,
              prenom: foundStudent.prenom,
              nom: foundStudent.nom,
              niveau: foundStudent.niveauActuel,
              age: foundStudent.age,
              dernierAcces: foundStudent.dernierAcces,
              estConnecte: foundStudent.estConnecte,
            },
            parentCode: `PAR${foundStudent.id.toString().padStart(4, '0')}`,
          },
          message: 'Élève vérifié avec succès',
        });
      } catch (error) {
        fastify.log.error('Verify student error:', error);
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

  // Health check endpoint
  fastify.get('/health', {
    schema: authSchemas.health,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Count total students
        const totalStudents = await fastify.db
          .select({ count: 'count(*)' })
          .from(students)
          .then((result: any) => result[0]?.count || 0);

        return reply.send({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            totalStudents: parseInt(totalStudents),
            uptime: Math.floor(process.uptime()),
          },
          message: 'Service d\'authentification opérationnel',
        });
      } catch (error) {
        fastify.log.error('Auth health check error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la vérification de l\'état du service',
            code: 'HEALTH_CHECK_ERROR',
          },
        });
      }
    },
  });
}
