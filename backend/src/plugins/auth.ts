import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { jwtConfig } from '../config/environment';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: number;
      prenom: string;
      nom: string;
      niveauActuel: string;
      iat?: number;
      exp?: number;
    };
    user: {
      id: number;
      prenom: string;
      nom: string;
      niveauActuel: string;
    };
  }
}

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  // Register JWT
  await fastify.register(jwt, {
    secret: jwtConfig.secret,
    sign: {
      expiresIn: jwtConfig.expiresIn,
    },
  });

  // Add authenticate decorator
  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      await request.jwtVerify();
    } catch (err) {
      await reply.status(401).send({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode: 401,
        },
      });
    }
  });
}

export default fp(authPlugin, {
  name: 'auth',
});
