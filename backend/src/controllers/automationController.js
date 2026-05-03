/**
 * Automation Controller
 * Manages user-defined workflows (trigger → actions)
 *
 * Example automation:
 * {
 *   name: "Study Mode",
 *   trigger: "start study mode",
 *   actions: [
 *     { type: "OPEN_APP", app: "spotify" },
 *     { type: "NOTIFY", message: "Study mode activated!" }
 *   ]
 * }
 */

const { getDb } = require('../database/migrate');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/automation
 */
function list(req, res, next) {
  try {
    const db = getDb();
    const automations = db.prepare(`
      SELECT * FROM automations WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    // Parse JSON actions
    const parsed = automations.map(a => ({
      ...a,
      actions: JSON.parse(a.actions),
      is_active: Boolean(a.is_active),
    }));

    res.json({ automations: parsed });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/automation
 * Body: { name, trigger, actions[] }
 */
function create(req, res, next) {
  try {
    const { name, trigger, actions } = req.body;

    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'name, trigger, and actions[] are required' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO automations (id, user_id, name, trigger, actions)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.id, name, trigger.toLowerCase().trim(), JSON.stringify(actions));

    res.status(201).json({
      automation: { id, name, trigger, actions, is_active: true, run_count: 0 },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/automation/:id
 */
function update(req, res, next) {
  try {
    const { name, trigger, actions } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) return res.status(404).json({ error: 'Automation not found' });

    db.prepare(`
      UPDATE automations SET
        name = COALESCE(?, name),
        trigger = COALESCE(?, trigger),
        actions = COALESCE(?, actions),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      name,
      trigger ? trigger.toLowerCase().trim() : null,
      actions ? JSON.stringify(actions) : null,
      req.params.id,
      req.user.id
    );

    res.json({ message: 'Automation updated' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/automation/:id
 */
function remove(req, res, next) {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM automations WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Automation not found' });

    res.json({ message: 'Automation deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/automation/:id/run
 * Manually trigger an automation
 */
function run(req, res, next) {
  try {
    const db = getDb();
    const automation = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    if (!automation.is_active) return res.status(400).json({ error: 'Automation is disabled' });

    const actions = JSON.parse(automation.actions);

    // Update run stats
    db.prepare(`
      UPDATE automations SET run_count = run_count + 1, last_run = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(automation.id);

    res.json({
      message: `Automation "${automation.name}" triggered`,
      actions, // Client executes these actions
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/automation/:id/toggle
 */
function toggle(req, res, next) {
  try {
    const db = getDb();
    const automation = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!automation) return res.status(404).json({ error: 'Automation not found' });

    const newState = automation.is_active ? 0 : 1;
    db.prepare('UPDATE automations SET is_active = ? WHERE id = ?').run(newState, automation.id);

    res.json({ is_active: Boolean(newState) });
  } catch (err) {
    next(err);
  }
}

/**
 * Match voice command against user automations
 * Called internally by voice controller
 */
function matchAutomation(userId, commandText) {
  const db = getDb();
  const automations = db.prepare(`
    SELECT * FROM automations WHERE user_id = ? AND is_active = 1
  `).all(userId);

  const lower = commandText.toLowerCase().trim();
  for (const automation of automations) {
    if (lower.includes(automation.trigger)) {
      return { ...automation, actions: JSON.parse(automation.actions) };
    }
  }
  return null;
}

module.exports = { list, create, update, remove, run, toggle, matchAutomation };
