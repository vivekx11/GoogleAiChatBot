/**
 * Auth Controller
 * Handles user registration, login, profile management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { getDb } = require('../database/migrate');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate JWT token
 */
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, language = 'en' } = req.body;
    const db = getDb();

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Insert user
    db.prepare(`
      INSERT INTO users (id, name, email, password, language)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, name, email, hashedPassword, language);

    // Create default settings
    db.prepare(`
      INSERT INTO user_settings (user_id) VALUES (?)
    `).run(userId);

    const token = generateToken(userId);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, name, email, language },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    // Fetch settings
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
        theme: user.theme,
      },
      settings,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
function getMe(req, res) {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);

  res.json({
    user: req.user,
    settings,
  });
}

/**
 * PUT /api/auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { name, language, theme, settings } = req.body;
    const db = getDb();

    if (name || language || theme) {
      db.prepare(`
        UPDATE users SET
          name = COALESCE(?, name),
          language = COALESCE(?, language),
          theme = COALESCE(?, theme),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, language, theme, req.user.id);
    }

    if (settings) {
      db.prepare(`
        UPDATE user_settings SET
          wake_word = COALESCE(?, wake_word),
          voice_speed = COALESCE(?, voice_speed),
          voice_pitch = COALESCE(?, voice_pitch),
          notifications = COALESCE(?, notifications),
          offline_mode = COALESCE(?, offline_mode),
          auto_read_response = COALESCE(?, auto_read_response),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        settings.wake_word,
        settings.voice_speed,
        settings.voice_pitch,
        settings.notifications,
        settings.offline_mode,
        settings.auto_read_response,
        req.user.id
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, updateProfile };
