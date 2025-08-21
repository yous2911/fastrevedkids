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
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: process.env.NODE_ENV === 'production' 
          ? ["'self'", "'strict-dynamic'"]
          : ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "blob:"],
        connectSrc: process.env.NODE_ENV === 'production'
          ? ["'self'"]
          : ["'self'", "http://localhost:3003", "https://api.revedkids.com", "https://sentry.io", "https://www.google-analytics.com"],
        workerSrc: ["'self'", "blob:"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
        blockAllMixedContent: process.env.NODE_ENV === 'production' ? [] : undefined,
      },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? { policy: 'require-corp' } : false,
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    } : false,
  });

  // Store security headers service for access in other parts
  fastify.decorate('securityHeaders', securityHeaders);

  fastify.log.info('✅ Enhanced security headers (helmet + custom) plugin registered');
}

export default fp(helmetPlugin, {
  name: 'helmet',
});
