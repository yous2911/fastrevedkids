
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { students } from '../db/schema';
import { authSchemas } from '../schemas/auth.schema';

// FIXED: Remove custom interface, use standard FastifyInstance
// The decorations are handled by the type declarations in fastify-extended.ts
export default async function authRoutes(fastify: FastifyInstance) {
  
  // Login endpoint
  fastify.post('/login', {
    schema: authSchemas.login,
    handler: async (request: FastifyRequest<{
      Body: { prenom: string; nom: string; motDePasse?: string }
    }>, reply: FastifyReply) => {
      const { prenom, motDePasse } = request.body;

      try {
        // FIXED: Use fastify.db directly (typed via module augmentation)
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

        // Password verification if provided
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

        // Update student status
        await fastify.db
          .update(students)
          .set({
            dernierAcces: new Date(),
            estConnecte: true,
          })
          .where(eq(students.id, foundStudent.id));

        // Generate JWT token
        const token = await reply.jwtSign({
          studentId: foundStudent.id,
          prenom: foundStudent.prenom,
          nom: foundStudent.nom,
          niveau: foundStudent.niveauActuel,
        });

        // FIXED: Optional cache usage with proper checking
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
            3600
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
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // FIXED: Type assertion for authenticated request
        const { studentId } = (request as any).user;

        await fastify.db
          .update(students)
          .set({ estConnecte: false })
          .where(eq(students.id, studentId));

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
    },
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: authSchemas.refresh,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // FIXED: Type assertion for authenticated request
        const { studentId, prenom, nom, niveau } = (request as any).user;

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
          studentId,
          prenom,
          nom,
          niveau,
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
    },
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
        // FIXED: Simple count query without complex aggregation
        const studentsResult = await fastify.db
          .select()
          .from(students);
        
        const totalStudents = studentsResult.length;

        return reply.send({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            totalStudents,
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
