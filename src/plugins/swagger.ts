import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/config';

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'RevEd Kids API',
        description: 'Educational platform API with spaced repetition and gamification',
        version: '2.0.0',
        contact: {
          name: 'RevEd Kids Team',
          email: 'team@revedkids.com',
        },
      },
      host: `localhost:${config.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Enter JWT token with Bearer prefix',
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'students', description: 'Student management endpoints' },
        { name: 'subjects', description: 'Educational content endpoints' },
        { name: 'revisions', description: 'Spaced repetition endpoints' },
        { name: 'monitoring', description: 'System monitoring endpoints' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  fastify.log.info('✅ Swagger documentation plugin registered successfully');
};

export default fp(swaggerPlugin, { name: 'swagger' }); 