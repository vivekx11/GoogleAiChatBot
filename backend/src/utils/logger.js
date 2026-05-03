/**
 * Simple logger utility
 * In production, swap with Winston or Pino
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`${colors.cyan}[INFO]${colors.reset} ${timestamp()}`, ...args),
  warn: (...args) => console.warn(`${colors.yellow}[WARN]${colors.reset} ${timestamp()}`, ...args),
  error: (...args) => console.error(`${colors.red}[ERROR]${colors.reset} ${timestamp()}`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.blue}[DEBUG]${colors.reset} ${timestamp()}`, ...args);
    }
  },
  success: (...args) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${timestamp()}`, ...args),
};

module.exports = logger;
