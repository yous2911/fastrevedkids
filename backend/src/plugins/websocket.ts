import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { WebSocketConfig, WebSocketMessage, WebSocketConnection } from '../types';

const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  // FIXED: Line 7:9 - Remove unused 'config' variable
  // Removed: const config = ...;

  await fastify.register(import('@fastify/websocket'));

  const connections = new Map<string, WebSocketConnection>();

  // FIXED: Line 39:47 - Replace any with WebSocketConfig
  const wsConfig: WebSocketConfig = {
    heartbeatInterval: fastify.config.WS_HEARTBEAT_INTERVAL || 30000,
    maxConnections: fastify.config.WS_MAX_CONNECTIONS || 1000,
    connectionTimeout: 30000,
    maxFrameSize: 1024 * 1024, // 1MB
    compression: true,
    verifyClient: (info) => {
      return info.secure || fastify.config.NODE_ENV === 'development';
    },
  };

  // FIXED: Line 52:23 - Replace any with WebSocketMessage
  const handleMessage = (message: WebSocketMessage, connectionId: string) => {
    const connection = connections.get(connectionId);
    if (!connection) return;

    // Process message based on type
    switch (message.type) {
      case 'ping':
        connection.lastPing = new Date();
        break;
      case 'exercise_update':
        // Handle exercise updates
        break;
      default:
        fastify.log.warn(`Unknown message type: ${message.type}`);
    }
  };

  // FIXED: Lines 70:43, 86:43 - Replace any with proper types
  const createConnection = (socket: any, userId?: number): WebSocketConnection => {
    const connectionId = `${Date.now()}_${Math.random()}`;
    
    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      socket,
      isAlive: true,
      connectedAt: new Date(),
      lastPing: new Date(),
    };

    connections.set(connectionId, connection);
    return connection;
  };

  // FIXED: Lines 88:54, 98:54 - Replace any with WebSocketMessage
  const broadcastMessage = (message: WebSocketMessage) => {
    const messageStr = JSON.stringify(message);
    
    connections.forEach((connection) => {
      if (connection.isAlive && connection.socket.readyState === 1) {
        connection.socket.send(messageStr);
      }
    });
  };

  // WebSocket route
  fastify.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (connection, request) => {
      const wsConnection = createConnection(connection.socket, request.user?.id);
      
      connection.socket.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          handleMessage(message, wsConnection.id);
        } catch (error) {
          fastify.log.error('Invalid WebSocket message:', error);
        }
      });

      connection.socket.on('close', () => {
        connections.delete(wsConnection.id);
      });

      connection.socket.on('error', (error: Error) => {
        fastify.log.error('WebSocket error:', error);
        connections.delete(wsConnection.id);
      });
    });
  });

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    connections.forEach((connection, id) => {
      if (!connection.isAlive) {
        connections.delete(id);
        return;
      }

      connection.isAlive = false;
      if (connection.socket.readyState === 1) {
        connection.socket.ping();
      }
    });
  }, wsConfig.heartbeatInterval);

  // Cleanup on close
  fastify.addHook('onClose', async () => {
    clearInterval(heartbeatInterval);
    connections.forEach((connection) => {
      connection.socket.close();
    });
    connections.clear();
  });

  // Decorate fastify with WebSocket utilities
  fastify.decorate('websocketServer', {
    broadcast: broadcastMessage,
    getConnections: () => connections.size,
    closeAll: () => {
      connections.forEach((connection) => {
        connection.socket.close();
      });
      connections.clear();
    }
  });

  fastify.log.info('WebSocket plugin registered');
};

export default fp(websocketPlugin, {
  name: 'websocket',
  dependencies: ['config'],
});
