import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

const helmetPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });
  fastify.log.info('✅ Helmet security plugin registered successfully');
};

export default fp(helmetPlugin, { name: 'helmet' });
