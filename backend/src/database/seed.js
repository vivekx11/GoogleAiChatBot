/**
 * Database Seed — Creates a demo user for testing
 * Run: node src/database/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDatabase, getDb } = require('./migrate');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  initDatabase();
  const db = getDb();

  const email = 'demo@jarvis.ai';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  if (existing) {
    console.log('Demo user already exists:', email);
    return;
  }

  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  db.prepare(`
    INSERT INTO users (id, name, email, password, language)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, 'Demo User', email, hashedPassword, 'en');

  db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);

  // Sample automation
  db.prepare(`
    INSERT INTO automations (id, user_id, name, trigger, actions)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    userId,
    'Study Mode',
    'start study mode',
    JSON.stringify([
      { type: 'OPEN_APP', app: 'spotify' },
      { type: 'NOTIFY', message: '📚 Study mode activated! Focus time.' },
    ])
  );

  console.log('✅ Seed complete!');
  console.log('Demo credentials:');
  console.log('  Email: demo@jarvis.ai');
  console.log('  Password: demo1234');
}

seed().catch(console.error);
