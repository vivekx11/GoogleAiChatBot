/**
 * Database Migration — SQLite Schema
 * Creates all tables on first run, safe to re-run (IF NOT EXISTS)
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/jarvis.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

/**
 * Get singleton DB connection
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * Run all migrations
 */
function initDatabase() {
  const database = getDb();

  database.exec(`
    -- ─── Users ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      language    TEXT NOT NULL DEFAULT 'en',
      theme       TEXT NOT NULL DEFAULT 'dark',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── Chat Sessions ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL DEFAULT 'New Chat',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── Chat Messages ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content     TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── Voice Commands Log ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS voice_commands (
      id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      transcript    TEXT NOT NULL,
      intent        TEXT,
      action_taken  TEXT,
      success       INTEGER DEFAULT 1,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── Automations ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS automations (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      trigger     TEXT NOT NULL,
      actions     TEXT NOT NULL,  -- JSON array of action objects
      is_active   INTEGER DEFAULT 1,
      run_count   INTEGER DEFAULT 0,
      last_run    DATETIME,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── User Settings ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      wake_word           TEXT DEFAULT 'hey jarvis',
      voice_speed         REAL DEFAULT 1.0,
      voice_pitch         REAL DEFAULT 1.0,
      notifications       INTEGER DEFAULT 1,
      offline_mode        INTEGER DEFAULT 0,
      auto_read_response  INTEGER DEFAULT 1,
      updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── Indexes ─────────────────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id);
    CREATE INDEX IF NOT EXISTS idx_automations_user ON automations(user_id);
  `);

  logger.info('✅ Database initialized successfully');
  return database;
}

module.exports = { getDb, initDatabase };
