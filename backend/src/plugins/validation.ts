// src/plugins/validation.ts
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';

async function validationPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(sensible);

  // Global error handler for validation
  fastify.setErrorHandler(async (error, request, reply) => {
    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.validation,
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Handle other errors
    const statusCode = (error as any).statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        message: error.message,
        statusCode,
      },
      timestamp: new Date().toISOString(),
    });
  });
}

export default fp(validationPlugin, {
  name: 'validation',
});
