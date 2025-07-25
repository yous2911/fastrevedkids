
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { students } from '../db/schema';
import { authSchemas } from '../schemas/auth.schema';
import { testConnection } from '../db/connection';

// Type definitions for request bodies
interface LoginRequestBody {
  prenom: string;
  nom: string;
  motDePasse?: string;
}

// Type for authenticated requests
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    studentId: number;
    prenom: string;
    nom: string;
    niveau: string;
  };
}



export default async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint with proper typing
  fastify.post('/login', {
    schema: authSchemas.login,
    handler: async (
      request: FastifyRequest<{ Body: LoginRequestBody }>, 
      reply: FastifyReply
    ) => {
      const { prenom, nom, motDePasse } = request.body;

      try {
        // Find student by name with proper validation
        const studentResult = await fastify.db
          .select()
          .from(students)
          .where(and(
            eq(students.prenom, prenom.trim()),
            eq(students.nom, nom.trim())
          ))
          .limit(1);

        if (studentResult.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Élève non trouvé',
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        const foundStudent = studentResult[0];

        // Password verification if provided
        // Note: Current schema doesn't include password hash, so we accept login without password
        // TODO: Add password field to schema if needed
        if (motDePasse) {
          // For now, we'll accept any password since the schema doesn't include password hash
          // In a real implementation, you would verify against stored hash
          console.log('Password provided but schema doesn\'t include password verification');
        }

        // Update student status
        await fastify.db
          .update(students)
          .set({
            dernierAcces: new Date(),
            estConnecte: true,
          })
          .where(eq(students.id, foundStudent.id));

        // Generate JWT token with proper payload
        const tokenPayload = {
          studentId: foundStudent.id,
          prenom: foundStudent.prenom,
          nom: foundStudent.nom,
          niveau: foundStudent.niveauActuel,
        };

        const token = await reply.jwtSign(tokenPayload, {
          expiresIn: '24h'
        });

        // Cache student session if Redis is available
        if ((fastify as any).redis) {
          try {
            await (fastify as any).redis.setex(
              `session:${foundStudent.id}`,
              3600, // 1 hour
              JSON.stringify({
                ...tokenPayload,
                loginTime: new Date().toISOString(),
              })
            );
          } catch (cacheError) {
            fastify.log.warn('Redis cache failed:', cacheError);
          }
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
              totalPoints: foundStudent.totalPoints || 0,
              serieJours: foundStudent.serieJours || 0,
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

  // Logout endpoint with proper authentication
  fastify.post('/logout', {
    schema: authSchemas.logout,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { studentId } = (request as any).user;

        // Update connection status
        await fastify.db
          .update(students)
          .set({ estConnecte: false })
          .where(eq(students.id, studentId));

        // Remove cached session if Redis is available
        if ((fastify as any).redis) {
          try {
            await (fastify as any).redis.del(`session:${studentId}`);
          } catch (cacheError) {
            fastify.log.warn('Redis cache cleanup failed:', cacheError);
          }
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
        const { studentId } = (request as any).user;

        // Verify student still exists and is active
        const studentResult = await fastify.db
          .select()
          .from(students)
          .where(eq(students.id, studentId))
          .limit(1);

        if (studentResult.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Élève non trouvé',
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        const student = studentResult[0];

        // Generate new token
        const newTokenPayload = {
          studentId: student.id,
          prenom: student.prenom,
          nom: student.nom,
          niveau: student.niveauActuel,
        };

        const newToken = await reply.jwtSign(newTokenPayload, {
          expiresIn: '24h'
        });

        return reply.send({
          success: true,
          data: {
            token: newToken,
            student: {
              id: student.id,
              prenom: student.prenom,
              nom: student.nom,
              niveau: student.niveauActuel,
            },
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

  // Student verification endpoint (for parent code generation)
  fastify.post('/verify', {
    schema: authSchemas.verify,
    handler: async (
      request: FastifyRequest<{ Body: { prenom: string; nom: string } }>,
      reply: FastifyReply
    ) => {
      const { prenom, nom } = request.body;

      try {
        const studentResult = await fastify.db
          .select()
          .from(students)
          .where(and(
            eq(students.prenom, prenom.trim()),
            eq(students.nom, nom.trim())
          ))
          .limit(1);

        if (studentResult.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'Élève non trouvé',
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        const foundStudent = studentResult[0];

        // Generate parent code (simple implementation)
        const generateParentCode = (id: number): string => {
          const idPart = id.toString().padStart(3, '0').slice(-3);
          const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          return `P${idPart}${randomPart}`;
        };

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
            parentCode: generateParentCode(foundStudent.id),
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
        // Test database connection
        const result = await testConnection();
        
        // Count total students
        const studentCount = await fastify.db
          .select()
          .from(students);

        return reply.send({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            totalStudents: studentCount.length,
            uptime: process.uptime(),
            redis: (fastify as any).redis ? 'connected' : 'disabled',
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
