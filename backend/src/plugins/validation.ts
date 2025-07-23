// src/plugins/validation.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const validationPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Add validation error handler
  fastify.setValidatorCompiler(({ schema }) => {
    return (data) => {
      // Simple validation - you can enhance this with Zod or Joi
      if (schema && typeof schema === 'object') {
        // Basic validation logic here
        return { value: data };
      }
      return { value: data };
    };
  });

  fastify.log.info('✅ Validation plugin registered successfully');
};

export default fp(validationPlugin, { name: 'validation' });
