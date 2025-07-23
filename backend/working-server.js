const fastify = require('fastify')({
  logger: true
});

// Auth routes
fastify.post('/auth/login', async (request, reply) => {
  return {
    success: true,
    message: 'Login endpoint working',
    timestamp: new Date().toISOString()
  };
});

fastify.get('/api/health', async (request, reply) => {
  return {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  };
});

fastify.get('/', async (request, reply) => {
  return {
    success: true,
    message: 'RevEd Kids API - Working!',
    timestamp: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('✅ Backend server running on port 3001');
    console.log('📍 http://localhost:3001');
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

start(); 