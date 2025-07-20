
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { students } from '../db/schema';
import { authSchemas } from '../schemas/auth.schema';

export default async function authRoutes(fastify: any) {
  // Enhanced login endpoint with proper validation and error handling
  fastify.post('/login', {
    schema: authSchemas.login,
    handler: async (request: FastifyRequest<{
      Body: { prenom: string; nom: string; motDePasse?: string }
    }>, reply: FastifyReply) => {
      const { prenom, nom, motDePasse } = request.body;

      // Input validation (additional to schema)
      if (!prenom?.trim() || !nom?.trim()) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Le prénom et le nom sont requis',
            code: 'MISSING_REQUIRED_FIELDS'
          }
        });
      }

      // Validate field lengths
      if (prenom.trim().length < 2 || nom.trim().length < 2) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Le prénom et le nom doivent faire au moins 2 caractères',
            code: 'FIELD_LENGTH_ERROR'
          }
        });
      }

      // Validate field types (additional check)
      if (typeof prenom !== 'string' || typeof nom !== 'string') {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Le prénom et le nom doivent être des chaînes de caractères',
            code: 'FIELD_TYPE_ERROR'
          }
        });
      }

      try {
        // Trim whitespace and normalize case for case-insensitive matching
        const normalizedPrenom = prenom.trim().toLowerCase();
        const normalizedNom = nom.trim().toLowerCase();

        // Find student by name (case-insensitive)
        const student = await fastify.db
          .select()
          .from(students)
          .where(sql`LOWER(${students.prenom}) = ${normalizedPrenom}`)
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

        const foundStudent = student[0];

        // If password is provided, verify it (simplified for now)
        if (motDePasse && foundStudent.motDePasseHash) {
          // For now, just check if password matches hash directly
          // In production, use proper bcrypt comparison
          if (motDePasse !== foundStudent.motDePasseHash) {
            return reply.status(401).send({
              success: false,
              error: {
                message: 'Mot de passe incorrect',
                code: 'INVALID_PASSWORD'
              }
            });
          }
        }

        // Update last access and connection status
        try {
          await fastify.db
            .update(students)
            .set({
              dernierAcces: new Date(),
              estConnecte: true,
            })
            .where(eq(students.id, foundStudent.id));
        } catch (updateError) {
          fastify.log.error('Database update error:', updateError);
          // Continue with login even if update fails
        }

        // Generate JWT token
        const token = await reply.jwtSign({
          studentId: foundStudent.id,
          prenom: foundStudent.prenom,
          nom: foundStudent.nom,
          niveau: foundStudent.niveauActuel,
        });

        // Cache student session
        try {
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
        } catch (cacheError) {
          fastify.log.error('Cache error:', cacheError);
          // Continue with login even if cache fails
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
        
        // Handle specific database errors
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
          return reply.status(500).send({
            success: false,
            error: {
              message: 'Erreur de connexion à la base de données',
              code: 'DATABASE_CONNECTION_ERROR',
            },
          });
        }

        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la connexion',
            code: 'INTERNAL_ERROR', // Changed from LOGIN_ERROR to match test expectation
          },
        });
      }
    },
  });

  // Enhanced logout endpoint
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

  // Enhanced refresh token endpoint
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

  // Enhanced verify student endpoint with authentication requirement
  fastify.get('/verify/:studentId', {
    schema: authSchemas.verify,
    preHandler: [fastify.authenticate], // Add authentication requirement
    handler: async (request: FastifyRequest<{
      Params: { studentId: string }
    }>, reply: FastifyReply) => {
      const studentIdParam = request.params.studentId;

      // Validate student ID parameter
      if (!/^\d+$/.test(studentIdParam)) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'ID élève invalide - doit être un nombre',
            code: 'INVALID_STUDENT_ID',
          },
        });
      }

      const studentId = parseInt(studentIdParam);

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
            createdAt: students.createdAt,
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
        const generateParentCode = (id: number, createdDate: Date): string => {
          const year = createdDate.getFullYear().toString().slice(-2);
          const month = String(createdDate.getMonth() + 1).padStart(2, '0');
          return `P${id}${year}${month}`;
        };

        return reply.send({
          success: true,
          data: {
            id: foundStudent.id,
            prenom: foundStudent.prenom,
            nom: foundStudent.nom,
            niveau: foundStudent.niveau,
            age: foundStudent.age,
            parentCode: generateParentCode(foundStudent.id, foundStudent.createdAt),
          },
          message: 'Élève vérifié avec succès',
        });
      } catch (error) {
        fastify.log.error('Verify student error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la vérification de l\'élève',
            code: 'VERIFY_ERROR',
          },
        });
      }
    },
  });

  // Health check endpoint (was missing)
  fastify.get('/health', {
    schema: authSchemas.health,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Check JWT functionality
        const testPayload = { test: true };
        const testToken = await reply.jwtSign(testPayload);
        const decoded = fastify.jwt.verify(testToken);
        
        // Check database connection (if available)
        let dbStatus = 'unknown';
        try {
          await fastify.db.select().from(students).limit(1);
          dbStatus = 'connected';
        } catch (dbError) {
          dbStatus = 'disconnected';
        }

        return reply.send({
          success: true,
          data: {
            status: 'healthy',
            service: 'authentication',
            timestamp: new Date().toISOString(),
            jwt: {
              status: 'active',
              algorithm: 'HS256',
              testSign: !!testToken,
              testVerify: !!decoded
            },
            database: dbStatus,
            uptime: process.uptime()
          },
          message: 'Authentication service is healthy'
        });
      } catch (error) {
        fastify.log.error('Auth health check error:', error);
        return reply.status(503).send({
          success: false,
          error: {
            message: 'Authentication service unhealthy',
            code: 'AUTH_SERVICE_UNHEALTHY'
          }
        });
      }
    }
  });
}
