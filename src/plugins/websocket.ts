import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/config';

const websocketPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      verifyClient: (info, callback) => {
        // Add authentication logic here if needed
        callback(true);
      },
    },
  });

  // WebSocket connection management
  const connections = new Map<string, any>();

  fastify.get('/ws', { websocket: true }, (connection, request) => {
    const connectionId = request.id;
    connections.set(connectionId, connection);

    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            connection.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          case 'subscribe':
            // Handle subscriptions (e.g., progress updates, notifications)
            break;
          default:
            fastify.log.warn('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        fastify.log.error('WebSocket message parsing error:', error);
      }
    });

    connection.socket.on('close', () => {
      connections.delete(connectionId);
      fastify.log.info(`WebSocket connection ${connectionId} closed`);
    });

    connection.socket.on('error', (error) => {
      fastify.log.error(`WebSocket connection ${connectionId} error:`, error);
      connections.delete(connectionId);
    });

    fastify.log.info(`WebSocket connection ${connectionId} established`);
  });

  // Broadcast helper
  fastify.decorate('broadcast', (message: any) => {
    const payload = JSON.stringify(message);
    connections.forEach((connection, id) => {
      try {
        connection.socket.send(payload);
      } catch (error) {
        fastify.log.error(`Failed to send message to connection ${id}:`, error);
        connections.delete(id);
      }
    });
  });

  // Heartbeat to keep connections alive
  setInterval(() => {
    connections.forEach((connection, id) => {
      try {
        connection.socket.ping();
      } catch (error) {
        fastify.log.error(`Failed to ping connection ${id}:`, error);
        connections.delete(id);
      }
    });
  }, config.WS_HEARTBEAT_INTERVAL);

  fastify.log.info('✅ WebSocket plugin registered successfully');
};

export default fp(websocketPlugin, { name: 'websocket' }); 