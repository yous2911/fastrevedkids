import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';

async function websocketPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      verifyClient: (info: any) => {
        // Add authentication logic here if needed
        return true;
      },
    },
  });

  // WebSocket route for real-time updates
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, request) => {
      connection.socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          switch (data.type) {
            case 'ping':
              connection.socket.send(JSON.stringify({ type: 'pong' }));
              break;
            case 'subscribe':
              // Handle subscription logic
              connection.socket.send(JSON.stringify({ 
                type: 'subscribed', 
                channel: data.channel 
              }));
              break;
            default:
              connection.socket.send(JSON.stringify({ 
                type: 'error', 
                message: 'Unknown message type' 
              }));
          }
        } catch (error) {
          connection.socket.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid JSON' 
          }));
        }
      });

      connection.socket.on('close', () => {
        fastify.log.info('WebSocket connection closed');
      });

      // Send welcome message
      connection.socket.send(JSON.stringify({ 
        type: 'welcome', 
        message: 'Connected to RevEd Kids WebSocket' 
      }));
    });
  });
}

export default fp(websocketPlugin, {
  name: 'websocket',
});
