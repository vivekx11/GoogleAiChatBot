/**
 * Jarvis Backend — Entry Point
 * Express server with WebSocket support for real-time voice streaming
 */
//--------------------------------------------------------------------
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initWebSocket } = require('./services/websocketService');
const { initDatabase } = require('./database/migrate');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Initialize database on startup
initDatabase();

// Create HTTP server (needed for WebSocket upgrade)
const server = http.createServer(app);

// Attach WebSocket server
initWebSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 Jarvis Backend running on port ${PORT}`);
  logger.info(`📡 WebSocket ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
