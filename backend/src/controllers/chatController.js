/**
 * Chat Controller
 *
 * With RunAnywhere SDK, the LLM runs fully on-device.
 * This controller's job is:
 *   1. Persist messages to SQLite (chat memory / history)
 *   2. Return conversation history so the mobile app can
 *      feed it as context to the on-device LLM
 *   3. Save the AI response once the mobile app sends it back
 *
 * Flow:
 *   Mobile → POST /chat/message  (user text)
 *          ← { sessionId, history }   (backend returns context)
 *   Mobile runs RunAnywhere.generateStream(prompt + history)
 *   Mobile → POST /chat/save    (saves AI response)
 *          ← { ok }
 */

const { getDb } = require('../database/migrate');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/chat/message
 * Body: { message, sessionId? }
 * Returns session ID + last N messages as context for on-device LLM
 */
function sendMessage(req, res, next) {
  try {
    const { message, sessionId } = req.body;
    const db = getDb();

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = db.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?')
        .get(sessionId, req.user.id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
    } else {
      const newId = uuidv4();
      const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      db.prepare('INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)')
        .run(newId, req.user.id, title);
      session = { id: newId, title };
    }

    // Save user message
    const msgId = uuidv4();
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, user_id, role, content)
      VALUES (?, ?, ?, 'user', ?)
    `).run(msgId, session.id, req.user.id, message);

    // Fetch last 20 messages as context window for on-device LLM
    const history = db.prepare(`
      SELECT role, content FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).all(session.id).reverse();

    // Update session timestamp
    db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(session.id);

    res.json({
      sessionId: session.id,
      messageId: msgId,
      // history is returned so mobile can build the full prompt for RunAnywhere
      history,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/save
 * Body: { sessionId, content, tokensUsed? }
 * Called by mobile after RunAnywhere generates the AI response
 */
function saveResponse(req, res, next) {
  try {
    const { sessionId, content, tokensUsed = 0 } = req.body;
    const db = getDb();

    if (!sessionId || !content) {
      return res.status(400).json({ error: 'sessionId and content are required' });
    }

    const session = db.prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?')
      .get(sessionId, req.user.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    db.prepare(`
      INSERT INTO chat_messages (id, session_id, user_id, role, content, tokens_used)
      VALUES (?, ?, ?, 'assistant', ?, ?)
    `).run(uuidv4(), sessionId, req.user.id, content, tokensUsed);

    db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(sessionId);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/chat/sessions
 */
function getSessions(req, res, next) {
  try {
    const db = getDb();
    const sessions = db.prepare(`
      SELECT s.*, COUNT(m.id) as message_count
      FROM chat_sessions s
      LEFT JOIN chat_messages m ON m.session_id = s.id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.updated_at DESC
      LIMIT 50
    `).all(req.user.id);

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/sessions
 */
function createSession(req, res, next) {
  try {
    const { title = 'New Chat' } = req.body;
    const db = getDb();
    const id = uuidv4();

    db.prepare('INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)')
      .run(id, req.user.id, title);

    res.status(201).json({ session: { id, title } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/chat/sessions/:id
 */
function getSession(req, res, next) {
  try {
    const db = getDb();
    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const messages = db.prepare(`
      SELECT id, role, content, tokens_used, created_at
      FROM chat_messages WHERE session_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id);

    res.json({ session, messages });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/chat/sessions/:id
 */
function deleteSession(req, res, next) {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });

    res.json({ message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendMessage, saveResponse, getSessions, createSession, getSession, deleteSession };
