// src/plugins/security.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { SecurityConfig } from '../types';

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // FIXED: Lines 116:30, 116:36, 125:20 - Replace any with SecurityConfig
  const securityConfig: SecurityConfig = {
    jwtSecret: fastify.config.JWT_SECRET,
    encryptionKey: fastify.config.ENCRYPTION_KEY || 'default-encryption-key',
    rateLimiting: {
      max: fastify.config.RATE_LIMIT_MAX || 100,
      windowMs: fastify.config.RATE_LIMIT_WINDOW || 900000, // 15 minutes
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    cors: {
      origin: fastify.config.CORS_ORIGIN || true,
      credentials: fastify.config.CORS_CREDENTIALS || false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  };

  // Register security plugins with typed config
  await fastify.register(import('@fastify/helmet'));
  await fastify.register(import('@fastify/cors'), securityConfig.cors);
  await fastify.register(import('@fastify/rate-limit'), securityConfig.rateLimiting);

  fastify.log.info('Security plugins registered');
};

export default fp(securityPlugin, {
  name: 'security',
  dependencies: ['config'],
});
