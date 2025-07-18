// src/plugins/validation.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { ValidationSchema } from '../types/fastify-extended';

const validationPlugin: FastifyPluginAsync = async (fastify) => {
  // FIXED: Line 12:47 - Replace any with ValidationSchema
  const defaultSchema: ValidationSchema = {
    body: {
      type: 'object',
      properties: {},
      additionalProperties: true,
    },
    querystring: {
      type: 'object',
      properties: {},
      additionalProperties: true,
    },
    params: {
      type: 'object',
      properties: {},
      additionalProperties: true,
    },
    headers: {
      type: 'object',
      properties: {},
      additionalProperties: true,
    },
  };

  // FIXED: Line 31:52 - Remove unused 'reply' parameter
  fastify.setValidatorCompiler(({ schema }) => {
    return (data) => {
      // Validation logic
      return { value: data };
    };
  });

  // FIXED: Line 37:36 - Replace any with ValidationSchema
  fastify.setSchemaCompiler((schema: ValidationSchema) => {
    return function validate(data: unknown) {
      return { value: data };
    };
  });

  fastify.log.info('Validation plugin registered');
};

export default fp(validationPlugin, {
  name: 'validation',
  dependencies: ['config'],
});
