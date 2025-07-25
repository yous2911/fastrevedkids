// src/plugins/auth.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config/config';

const authPlugin = async (fastify: any) => {
  // ✨ AMÉLIORATION 1: Configuration JWT optimisée
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'reved-kids-api',
      audience: 'reved-kids-app',
      algorithm: 'HS256',
    },
    verify: {
      issuer: 'reved-kids-api',
      audience: 'reved-kids-app',
      algorithms: ['HS256'],
      clockTolerance: 30, // 30 secondes de tolérance
    },
  });

  // ✨ AMÉLIORATION 2: Middleware d'authentification plus robuste
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      // Extraction du token plus flexible
      let token = request.headers.authorization;
      
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: { message: 'Token manquant', code: 'NO_TOKEN' },
        });
      }

      // Support Bearer et token direct
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      // ⚡ Vérification avec cache de session
      const decoded = await request.jwtVerify();
      
      // ✨ Vérification de session en cache (optionnel mais recommandé)
      if (fastify.cache) {
        const sessionKey = `session:${decoded.studentId}`;
        const session = await fastify.cache.get(sessionKey);
        
        if (!session) {
          return reply.status(401).send({
            success: false,
            error: { message: 'Session expirée', code: 'SESSION_EXPIRED' },
          });
        }
      }

      // Ajouter user au request
      request.user = decoded;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.debug('Auth failed:', errorMessage);
      
      const errorCode = error instanceof Error && error.name === 'TokenExpiredError' 
        ? 'TOKEN_EXPIRED' 
        : 'INVALID_TOKEN';
        
      return reply.status(401).send({
        success: false,
        error: { message: 'Authentification échouée', code: errorCode },
      });
    }
  });

  // ✨ AMÉLIORATION 3: Middleware optionnel (pour routes publiques/privées mixtes)
  fastify.decorate('optionalAuth', async (request: any, reply: any) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const decoded = await request.jwtVerify();
        request.user = decoded;
      }
      // Continue même sans token
    } catch (error) {
      // Ignore les erreurs d'auth sur les routes optionnelles
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.debug('Optional auth failed, continuing:', errorMessage);
    }
  });

  fastify.log.info('✅ Auth plugin registered');
};

export default fp(authPlugin, { name: 'auth' });

