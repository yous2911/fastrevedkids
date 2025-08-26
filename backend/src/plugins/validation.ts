// src/plugins/validation.ts - Simplified validation plugin
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const validationPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register basic validation support
  fastify.log.info('Validation plugin loaded');

  // Add basic request validation hook
  fastify.addHook('preHandler', async (request, reply) => {
    // Basic request size validation
    const maxBodySize = 10 * 1024 * 1024; // 10MB
    const contentLength = parseInt(request.headers['content-length'] || '0');
    
    if (contentLength > maxBodySize) {
      reply.code(413).send({
        success: false,
        error: {
          message: 'Request body too large',
          code: 'BODY_TOO_LARGE'
        }
      });
      return;
    }
  });

  // Add request ID for tracing
  fastify.addHook('onRequest', async (request, reply) => {
    request.id = request.id || Math.random().toString(36).substr(2, 9);
  });

  // Add basic error handling
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    
    if (error.validation) {
      reply.status(400).send({
        success: false,
        error: {
          message: 'Validation error',
          details: error.validation,
          code: 'VALIDATION_ERROR'
        }
      });
      return;
    }

    if (error.statusCode) {
      reply.status(error.statusCode).send({
        success: false,
        error: {
          message: error.message,
          code: 'CLIENT_ERROR'
        }
      });
      return;
    }

    reply.status(500).send({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  });
};

export default fp(validationPlugin, {
  name: 'validation'
});