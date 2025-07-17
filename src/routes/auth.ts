import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { students } from '../db/schema';
import { authSchemas } from '../schemas/auth.schema';

export default async function authRoutes(fastify: any) {
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
          studentId: foundStudent.id,
          prenom: foundStudent.prenom,
          nom: foundStudent.nom,
          niveau: foundStudent.niveauActuel,
        });

        // Cache student session
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
    handler: async (request: any, reply: FastifyReply) => {
      try {
        const { studentId } = request.user;

        // Update connection status
        await fastify.db
          .update(students)
          .set({ estConnecte: false })
          .where(eq(students.id, studentId));

        // Remove cached session
        await fastify.cache.del(`session:${studentId}`);

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
    handler: async (request: any, reply: FastifyReply) => {
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
        const newToken = await reply.jwtSign({
          studentId,
          prenom,
          nom,
          niveau,
        });

        return reply.send({
          success: true,
          data: { token: newToken },
          message: 'Token rafraîchi avec succès',
        });
      } catch (error) {
        fastify.log.error('Token refresh error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors du rafraîchissement du token',
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
      const studentId = parseInt(request.params.studentId);

      if (isNaN(studentId) || studentId <= 0) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'ID élève invalide',
            code: 'INVALID_STUDENT_ID',
          },
        });
      }

      try {
        const student = await fastify.db
          .select({
            id: students.id,
            prenom: students.prenom,
            nom: students.nom,
            niveau: students.niveauActuel,
            age: students.age,
            dateNaissance: students.dateNaissance,
            dernierAcces: students.dernierAcces,
            estConnecte: students.estConnecte,
          })
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

        const foundStudent = student[0];

        // Generate parent code (simplified version)
        const generateParentCode = (id: number, birthDate: Date): string => {
          const date = birthDate.getDate().toString().padStart(2, '0');
          const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
          const idPart = id.toString().padStart(2, '0').slice(-2);
          return `${date}${month}${idPart}`;
        };

        return reply.send({
          success: true,
          data: {
            student: {
              id: foundStudent.id,
              prenom: foundStudent.prenom,
              nom: foundStudent.nom,
              niveau: foundStudent.niveau,
              age: foundStudent.age,
              dernierAcces: foundStudent.dernierAcces,
              estConnecte: foundStudent.estConnecte,
            },
            parentCode: generateParentCode(foundStudent.id, foundStudent.dateNaissance),
          },
          message: 'Élève vérifié',
        });
      } catch (error) {
        fastify.log.error('Student verification error:', error);
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

  // Health check for auth service
  fastify.get('/health', {
    schema: authSchemas.health,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Test database connection and count students
        const result = await fastify.db
          .select({ count: students.id })
          .from(students);

        const totalStudents = result.length;

        return reply.send({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            totalStudents,
            uptime: process.uptime(),
          },
          message: 'Service d\'authentification opérationnel',
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