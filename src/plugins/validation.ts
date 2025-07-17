import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const validationPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Global error handler for validation errors
  fastify.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      reply.status(400).send({
        success: false,
        error: {
          message: 'Données de requête invalides',
          code: 'VALIDATION_ERROR',
          details: error.validation,
        },
      });
      return;
    }

    // Default error handling
    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        message: error.message || 'Erreur interne du serveur',
        code: error.code || 'INTERNAL_ERROR',
      },
    });
  });

  fastify.log.info('✅ Validation plugin registered successfully');
};

export default fp(validationPlugin, { name: 'validation' }); 