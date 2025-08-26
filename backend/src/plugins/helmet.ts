import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import { SecurityHeadersService } from '../middleware/security-headers.middleware';

async function helmetPlugin(fastify: FastifyInstance): Promise<void> {
  // Enhanced security headers service
  const securityHeaders = new SecurityHeadersService(
    process.env.NODE_ENV === 'production'
      ? SecurityHeadersService.createProductionConfig()
      : SecurityHeadersService.createDevelopmentConfig()
  );

  // Register custom security headers middleware first
  fastify.addHook('preHandler', securityHeaders.createMiddleware());

  // Register Helmet with production-ready config
  if (process.env.NODE_ENV === 'production') {
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'strict-dynamic'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          mediaSrc: ["'self'", "blob:"],
          connectSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
          blockAllMixedContent: [],
        },
      },
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
    });
  } else {
    // Disable helmet for development to avoid CSP issues
    fastify.log.info('Helmet disabled for development');
  }

  // Store security headers service for access in other parts
  fastify.decorate('securityHeaders', securityHeaders);

  fastify.log.info('✅ Enhanced security headers (helmet + custom) plugin registered');
}

export default fp(helmetPlugin, {
  name: 'helmet',
});
