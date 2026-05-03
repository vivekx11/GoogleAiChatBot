/**
 * Global Error Handler Middleware
 */

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path });

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({ error: message });
}

module.exports = { errorHandler };
