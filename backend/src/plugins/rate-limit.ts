// src/plugins/rate-limit.ts
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '../config/config';

const rateLimitPlugin = async (fastify: any) => {
  // ✨ AMÉLIORATION: Rate limiting plus intelligent
  await fastify.register(rateLimit, {
    ...rateLimitConfig,
    // ⚡ Utilise Redis si disponible pour le partage entre instances
    redis: fastify.redis || undefined,
    // ✨ Skip conditions intelligentes
    skip: (request: any) => {
      // Skip pour les health checks
      if (request.url === '/api/health' || request.url === '/health') {
        return true;
      }
      
      // Skip pour les IPs autorisées
      const clientIP = request.ip;
      return rateLimitConfig.allowList?.includes(clientIP) || false;
    },
    // ✨ Messages d'erreur personnalisés selon la route
    errorResponseBuilder: (request: any, context: any) => {
      const isAuthRoute = request.url.startsWith('/api/auth/');
      
      return {
        success: false,
        error: {
          message: isAuthRoute 
            ? 'Trop de tentatives de connexion' 
            : 'Trop de requêtes',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: context.ttl,
        },
      };
    },
    // ⚡ Headers de rate limit informatifs
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  fastify.log.info('✅ Rate limit plugin registered');
};

export default fp(rateLimitPlugin, { name: 'rateLimit' });
