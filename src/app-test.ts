import Fastify from 'fastify';

export async function build() {
  const fastify = Fastify({
    logger: false, // Disable logging in tests
  });

  // Register plugins (same as main app but for testing)
  await fastify.register(import('./plugins/database'));
  await fastify.register(import('./plugins/redis'));
  await fastify.register(import('./plugins/auth'));
  await fastify.register(import('./plugins/validation'));

  // Register routes
  await fastify.register(import('./routes/auth'), { prefix: '/api/auth' });
  await fastify.register(import('./routes/students'), { prefix: '/api/students' });
  await fastify.register(import('./routes/monitoring'), { prefix: '/api/monitoring' });

  // Health check
  fastify.get('/api/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'test',
    };
  });

  return fastify;
} 