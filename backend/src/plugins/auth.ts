// Enhanced src/plugins/auth.ts with proper error handling

import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default fp(async function (fastify: FastifyInstance) {
  // Register JWT plugin
  await fastify.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-32-chars-min',
    sign: {
      expiresIn: '24h'
    }
  });

  // Enhanced authenticate decorator with proper error handling
  fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      
      // Check if authorization header exists
      if (!authHeader) {
        return reply.status(401).send({
          success: false,
          error: {
            message: 'Authorization header required',
            code: 'MISSING_AUTH_HEADER'
          }
        });
      }

      // Check if it's a Bearer token
      if (!authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          error: {
            message: 'Invalid authorization header format. Expected: Bearer <token>',
            code: 'INVALID_AUTH_FORMAT'
          }
        });
      }

      // Extract token
      const token = authHeader.substring(7).trim();
      
      // Check if token is empty
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: {
            message: 'Empty Bearer token',
            code: 'EMPTY_TOKEN'
          }
        });
      }

      // Verify JWT token
      try {
        const decoded = await request.jwtVerify();
        request.user = decoded;
      } catch (jwtError: any) {
        let errorCode = 'INVALID_TOKEN';
        let errorMessage = 'Invalid or expired token';
        
        if (jwtError.message?.includes('expired')) {
          errorCode = 'TOKEN_EXPIRED';
          errorMessage = 'Token has expired';
        } else if (jwtError.message?.includes('malformed')) {
          errorCode = 'MALFORMED_TOKEN';
          errorMessage = 'Malformed token';
        }
        
        return reply.status(401).send({
          success: false,
          error: {
            message: errorMessage,
            code: errorCode
          }
        });
      }
    } catch (error) {
      fastify.log.error('Authentication error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Internal authentication error',
          code: 'AUTH_INTERNAL_ERROR'
        }
      });
    }
  });

  // Helper function to extract user from JWT (for tests)
  fastify.decorate('extractUser', function(token: string) {
    try {
      return fastify.jwt.verify(token);
    } catch (error) {
      return null;
    }
  });
});
