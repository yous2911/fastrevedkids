import fp from 'fastify-plugin';

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'RevEd Kids Educational Platform API',
        description: `
# RevEd Kids API Documentation

A high-performance educational platform backend built with Fastify, TypeScript, and Drizzle ORM.

## Features
- **Student Authentication**: Secure JWT-based authentication
- **Progress Tracking**: Comprehensive learning progress monitoring
- **Spaced Repetition**: Advanced algorithm for optimal learning
- **Real-time Analytics**: Performance metrics and insights
- **Content Management**: Educational content and exercise management

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting
API requests are rate-limited to ${fastify.config.RATE_LIMIT_MAX} requests per ${fastify.config.RATE_LIMIT_TIME_WINDOW}.

## Error Handling
All errors follow a consistent format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
\`\`\`
        `,
        version: '1.0.0',
        contact: {
          name: 'RevEd Kids Support',
          email: 'support@revedkids.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url:
            fastify.config.NODE_ENV === 'production'
              ? 'https://api.revedkids.com'
              : 'http://localhost:3000',
          description:
            fastify.config.NODE_ENV === 'production' ? 'Production server' : 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for authentication',
          },
        },
      },
      tags: [
        {
          name: 'Authentication',
          description: 'Student authentication and session management',
        },
        {
          name: 'Students',
          description: 'Student profile and data management',
        },
        {
          name: 'Subjects',
          description: 'Educational subjects and curriculum',
        },
        {
          name: 'Exercises',
          description: 'Learning exercises and activities',
        },
        {
          name: 'Progress',
          description: 'Learning progress and analytics',
        },
        {
          name: 'Revisions',
          description: 'Spaced repetition and review system',
        },
        {
          name: 'Monitoring',
          description: 'System health and performance monitoring',
        },
      ],
    },
    hideUntagged: true,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
  });
};

export default fp(swaggerPlugin, {
  name: 'swagger',
  dependencies: ['config'],
});
