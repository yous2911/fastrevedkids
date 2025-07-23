// src/plugins/auth.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/config';

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
    verify: {
      extractToken: (request) => {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.slice(7);
        }
        return undefined;
      },
    },
  });

  // Add authentication decorator
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
    }
  });

  fastify.log.info('✅ Authentication plugin registered successfully');
};

export default fp(authPlugin, { name: 'auth' });
