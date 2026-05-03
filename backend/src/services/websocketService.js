/**
 * WebSocket Service
 * Real-time communication for voice streaming and live responses
 */
//-------------------------------------------------------------
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let wss;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via query param token
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.userId;
      logger.info(`WebSocket connected: user ${ws.userId}`);
    } catch (err) {
      ws.close(4001, 'Invalid token');
      return;
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      logger.info(`WebSocket disconnected: user ${ws.userId}`);
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error:', err.message);
    });

    // Send welcome
    ws.send(JSON.stringify({ type: 'connected', message: 'Jarvis online' }));
  });

  logger.info('WebSocket server initialized');
}

async function handleMessage(ws, message) {
  const { type, payload } = message;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'voice_chunk':
      // Handle streaming audio chunks (future: real-time transcription)
      ws.send(JSON.stringify({ type: 'ack', chunkId: payload?.chunkId }));
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
  }
}

/**
 * Broadcast to a specific user's connections
 */
function sendToUser(userId, data) {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

module.exports = { initWebSocket, sendToUser };
