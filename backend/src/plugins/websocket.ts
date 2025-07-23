// src/plugins/websocket.ts
import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

// Extend FastifyInstance to include our custom properties
declare module 'fastify' {
  interface FastifyInstance {
    websocket: {
      broadcast(message: string): void;
      getConnectionCount(): number;
    };
  }
}

const websocketPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      verifyClient: (info: any) => {
        // Add custom client verification logic here
        return true;
      },
    },
  });

  // WebSocket connection tracking
  const connections = new Set<WebSocket>();

  fastify.decorate('websocket', {
    broadcast: (message: string) => {
      for (const socket of connections) {
        if (socket.readyState === 1) { // WebSocket.OPEN
          socket.send(message);
        }
      }
    },
    getConnectionCount: () => connections.size,
  });

  fastify.log.info('✅ WebSocket plugin registered successfully');
};

export default fp(websocketPlugin, { name: 'websocket' });
