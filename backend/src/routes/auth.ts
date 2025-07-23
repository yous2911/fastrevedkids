
// Fix authentication routes to use consistent response format
// Update src/routes/auth.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import * as schema from '../db/schema';
import type { AuthenticatedRequest } from '../types/fastify-extended';

// Validation schemas
const loginSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
});

const registerSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  age: z.number().min(5).max(12),
  niveauActuel: z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
});

const updateProfileSchema = z.object({
  prenom: z.string().min(2).optional(),
  nom: z.string().min(2).optional(),
  age: z.number().min(5).max(12).optional(),
  niveauActuel: z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']).optional(),
});

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Login endpoint
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { prenom, nom } = loginSchema.parse(request.body);

      // Find student by prenom and nom
      const students = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.prenom, prenom))
        .limit(1);

      const student = students[0];
      if (!student || student.nom !== nom) {
        return reply.status(401).send({
          success: false,
          error: {
            message: 'Student not found',
            code: 'STUDENT_NOT_FOUND',
            statusCode: 401,
          },
        });
      }

      // Update last access and connection status
      await db
        .update(schema.students)
        .set({
          dernierAcces: new Date(),
          estConnecte: true,
        })
        .where(eq(schema.students.id, student.id));

      // Generate token
      const token = fastify.jwt.sign({
        id: student.id,
        prenom: student.prenom,
        nom: student.nom,
        niveauActuel: student.niveauActuel,
      });

      return reply.send({
        success: true,
        data: {
          token,
          student: {
            id: student.id,
            prenom: student.prenom,
            nom: student.nom,
            niveauActuel: student.niveauActuel,
            age: student.age,
            totalPoints: student.totalPoints,
            serieJours: student.serieJours,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.errors,
            statusCode: 400,
          },
        });
      }

      fastify.log.error('Login error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  });

  // Register endpoint
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['prenom', 'nom', 'age', 'niveauActuel'],
        properties: {
          prenom: { type: 'string', minLength: 2 },
          nom: { type: 'string', minLength: 2 },
          age: { type: 'number', minimum: 5, maximum: 12 },
          niveauActuel: { type: 'string', enum: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { prenom, nom, age, niveauActuel } = registerSchema.parse(request.body);

      // Check if student already exists
      const existingStudents = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.prenom, prenom))
        .limit(1);

      if (existingStudents[0] && existingStudents[0].nom === nom) {
        return reply.status(409).send({
          success: false,
          error: {
            message: 'Student already exists',
            code: 'STUDENT_EXISTS',
            statusCode: 409,
          },
        });
      }

      // Create new student
      await db.insert(schema.students).values({
        prenom,
        nom,
        age,
        niveauActuel,
        totalPoints: 0,
        serieJours: 0,
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return reply.status(201).send({
        success: true,
        message: 'Student registered successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.errors,
            statusCode: 400,
          },
        });
      }

      fastify.log.error('Registration error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  });

  // Get current student profile
  fastify.get('/profile', {
    preHandler: fastify.authenticate,
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const studentId = request.user.id;

      const students = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      const student = students[0];
      if (!student) {
        return reply.status(404).send({
          success: false,
          error: {
            message: 'Student not found',
            statusCode: 404,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          student: {
            id: student.id,
            prenom: student.prenom,
            nom: student.nom,
            niveauActuel: student.niveauActuel,
            age: student.age,
            totalPoints: student.totalPoints,
            serieJours: student.serieJours,
            dernierAcces: student.dernierAcces,
            estConnecte: student.estConnecte,
          },
        },
      });
    } catch (error) {
      fastify.log.error('Get profile error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
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
          prenom: { type: 'string', minLength: 2 },
          nom: { type: 'string', minLength: 2 },
          age: { type: 'number', minimum: 5, maximum: 12 },
          niveauActuel: { type: 'string', enum: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const studentId = request.user.id;
      const updates = updateProfileSchema.parse(request.body);

      await db
        .update(schema.students)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.students.id, studentId));

      return reply.send({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.errors,
            statusCode: 400,
          },
        });
      }

      fastify.log.error('Update profile error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  });

  // Logout endpoint
  fastify.post('/logout', {
    preHandler: fastify.authenticate,
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const studentId = request.user.id;

      // Update connection status
      await db
        .update(schema.students)
        .set({
          estConnecte: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.students.id, studentId));

      return reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      fastify.log.error('Logout error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  });
}
