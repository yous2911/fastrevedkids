// src/plugins/auth.ts
import fp from 'fastify-plugin';

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface JWTPayload {
  studentId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateToken: (payload: { studentId: string; email?: string }) => string;
    generateRefreshToken: (payload: { studentId: string }) => string;
    verifyToken: (token: string) => JWTPayload | null;
    hashPassword: (password: string) => Promise<string>;
    verifyPassword: (password: string, hash: string) => Promise<boolean>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register JWT plugin
  await fastify.register(import('@fastify/jwt'), {
    secret: fastify.config.JWT_SECRET,
    sign: {
      expiresIn: '24h',
    },
    verify: {
      maxAge: '24h',
    },
  });

  // Password hashing utility
  fastify.decorate('hashPassword', async (password: string): Promise<string> => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  });

  // Password verification utility
  fastify.decorate('verifyPassword', async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  });

  // Token generation utilities
  fastify.decorate('generateToken', (payload: { studentId: string; email?: string }): string => {
    return jwt.sign(payload, fastify.config.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'reved-kids-api',
      audience: 'reved-kids-app',
    });
  });

  fastify.decorate('generateRefreshToken', (payload: { studentId: string }): string => {
    return jwt.sign(payload, fastify.config.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'reved-kids-api',
      audience: 'reved-kids-app',
    });
  });

  // Token verification utility
  fastify.decorate('verifyToken', (token: string): JWTPayload | null => {
    try {
      const decoded = jwt.verify(token, fastify.config.JWT_SECRET, {
        issuer: 'reved-kids-api',
        audience: 'reved-kids-app',
      }) as JWTPayload;
      return decoded;
    } catch {
      return null;
    }
  });

  // Authentication decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authorization = request.headers.authorization;

      if (!authorization) {
        reply.code(401).send({
          error: {
            code: 'MISSING_AUTH_HEADER',
            message: 'Authorization header is required',
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        return;
      }

      // Extract token from Bearer format
      const [bearer, token] = authorization.split(' ');

      if (bearer !== 'Bearer' || !token) {
        reply.code(401).send({
          error: {
            code: 'INVALID_AUTH_FORMAT',
            message: 'Authorization header must be in format: Bearer <token>',
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        return;
      }

      // Verify token
      const decoded = fastify.verifyToken(token);

      if (!decoded) {
        reply.code(401).send({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        return;
      }

      // Add user info to request
      request.user = {
        id: decoded.studentId,
        studentId: decoded.studentId,
        ...(decoded.email && { email: decoded.email }),
      } as any;
    } catch {
      fastify.log.error('Authentication error');
      reply.code(500).send({
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication service error',
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  });

  // Optional authentication decorator (doesn't fail if no token)
  fastify.decorate('optionalAuth', async (request: FastifyRequest) => {
    try {
      const authorization = request.headers.authorization;

      if (!authorization) {
        return; // No token provided, continue without authentication
      }

      const [bearer, token] = authorization.split(' ');

      if (bearer !== 'Bearer' || !token) {
        return; // Invalid format, continue without authentication
      }

      const decoded = fastify.verifyToken(token);

      if (decoded) {
        request.user = {
          id: decoded.studentId,
          studentId: decoded.studentId,
          ...(decoded.email && { email: decoded.email }),
        } as any;
      }
    } catch {
      // Log error but don't fail the request
      fastify.log.warn('Optional authentication error');
    }
  });

  // Admin authentication decorator
  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    // First check if user is authenticated
    await fastify.authenticate(request, reply);
    
    // Then check admin role (for now, we'll use a simple check)
    // In a real implementation, you'd check against a user roles table
    if (!request.user || !request.user.id) {
      return reply.status(403).send({
        success: false,
        error: {
          message: 'Accès administrateur requis',
          code: 'ADMIN_REQUIRED'
        }
      });
    }
    
    // For development, allow access if user exists
    // In production, you'd check actual admin roles
    fastify.log.info(`Admin access granted for user: ${request.user.id}`);
  });
};

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['config'],
});
