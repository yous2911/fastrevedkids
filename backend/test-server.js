const fastify = require('fastify')({
  logger: true
});

// Simple test route
fastify.get('/test', async (request, reply) => {
  return { hello: 'world' };
});

fastify.get('/api/health', async (request, reply) => {
  return { 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('Test server running on port 3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 