/**
 * Voice Controller
 *
 * NOTE: STT and TTS now run fully on-device via RunAnywhere SDK.
 * This controller only handles:
 *   - Saving voice command logs
 *   - Rule-based intent detection (no OpenAI)
 *   - Routing to weather/news APIs
 *   - Returning action payloads for the mobile client to execute
 */

const { getDb } = require('../database/migrate');
const { detectIntent, buildQuickResponse } = require('../services/intentService');
const { getWeather } = require('../services/weatherService');
const { getNews } = require('../services/newsService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * POST /api/voice/command
 * Body: { text, language?, sessionId? }
 *
 * The mobile app sends the transcript (already produced on-device by
 * RunAnywhere STT) and receives back an intent + action + response text.
 * The response text is spoken on-device by RunAnywhere TTS.
 */
async function processCommand(req, res, next) {
  try {
    const { text, language = 'en' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Command text is required' });
    }

    const db = getDb();

    // ── 1. Detect intent (rule-based, zero latency) ──────────────────────
    const { intent, confidence, entities } = detectIntent(text);

    let response = '';
    let action = null;

    // ── 2. Route to appropriate handler ──────────────────────────────────
    switch (intent) {
      case 'WEATHER': {
        const location = entities.location || 'auto';
        const weatherData = await getWeather(location, language);
        response = weatherData.description;
        action = { type: 'WEATHER', data: weatherData };
        break;
      }

      case 'NEWS': {
        const newsData = await getNews(language, entities.category || 'general');
        response = newsData.summary;
        action = { type: 'NEWS', data: newsData };
        break;
      }

      case 'OPEN_APP': {
        response = buildQuickResponse('OPEN_APP', entities, language);
        action = { type: 'OPEN_APP', app: entities.app };
        break;
      }

      case 'SEND_MESSAGE': {
        response = buildQuickResponse('SEND_MESSAGE', entities, language);
        action = {
          type: 'SEND_MESSAGE',
          app: entities.app || 'whatsapp',
          contact: entities.contact,
          message: entities.message,
        };
        break;
      }

      case 'CALL': {
        response = buildQuickResponse('CALL', entities, language);
        action = { type: 'CALL', contact: entities.contact };
        break;
      }

      case 'SEARCH': {
        response = buildQuickResponse('SEARCH', entities, language);
        action = { type: 'SEARCH', query: entities.query };
        break;
      }

      case 'TIME': {
        response = buildQuickResponse('TIME', entities, language);
        // No device action needed — just speak the time
        break;
      }

      case 'REMINDER': {
        response = buildQuickResponse('REMINDER', entities, language);
        action = { type: 'REMINDER', task: entities.task, time: entities.time };
        break;
      }

      default:
        // CHAT / AUTOMATION / UNKNOWN — handled by on-device LLM
        // Return empty response so the mobile app knows to use RunAnywhere.chat()
        response = '';
        action = null;
        break;
    }

    // ── 3. Log command ────────────────────────────────────────────────────
    db.prepare(`
      INSERT INTO voice_commands (id, user_id, transcript, intent, action_taken, success)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(uuidv4(), req.user.id, text, intent, JSON.stringify(action));

    res.json({
      transcript: text,
      intent,
      confidence,
      response,   // Empty string → mobile uses on-device LLM
      action,
      useLocalLLM: intent === 'CHAT' || !response, // Signal to mobile
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/voice/history
 */
function getHistory(req, res, next) {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit) || 20;

    const commands = db.prepare(`
      SELECT id, transcript, intent, action_taken, success, created_at
      FROM voice_commands
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(req.user.id, limit);

    res.json({ commands });
  } catch (err) {
    next(err);
  }
}

module.exports = { processCommand, getHistory };
