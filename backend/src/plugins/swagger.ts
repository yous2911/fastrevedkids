// src/plugins/swagger.ts
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'RevEd Kids API',
        description: 'Educational platform API documentation',
        version: '2.0.0',
      },
      host: 'localhost:3001',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  // Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  fastify.log.info('✅ Swagger plugin registered successfully');
};

export default fp(swaggerPlugin, { name: 'swagger' });
