/**
 * Intent Service — Rule-based NLP (no OpenAI)
 *
 * All heavy AI (LLM chat, STT, TTS) runs on-device via RunAnywhere SDK.
 * The backend only needs lightweight intent classification for routing
 * voice commands to the right handler (weather, news, app control, etc.)
 */

// ─── Intent patterns ──────────────────────────────────────────────
const INTENT_PATTERNS = [
  // OPEN_APP
  {
    intent: 'OPEN_APP',
    patterns: [
      /\b(open|launch|start|run)\s+(\w+)/i,
      /\b(go to|switch to)\s+(\w+)/i,
    ],
    extractEntities: (text) => {
      const match = text.match(/\b(?:open|launch|start|run|go to|switch to)\s+(\w+)/i);
      return { app: match ? match[1].toLowerCase() : null };
    },
  },

  // SEND_MESSAGE
  {
    intent: 'SEND_MESSAGE',
    patterns: [
      /\b(send|message|text|whatsapp|telegram)\s+.*(to|:)\s*(\w+)/i,
      /\b(send message to|message)\s+(\w+)/i,
    ],
    extractEntities: (text) => {
      const contactMatch = text.match(/(?:to|message)\s+(\w+)/i);
      const msgMatch = text.match(/:\s*(.+)$/i) || text.match(/saying\s+(.+)/i);
      const appMatch = text.match(/\b(whatsapp|telegram|sms|text)\b/i);
      return {
        contact: contactMatch ? contactMatch[1] : null,
        message: msgMatch ? msgMatch[1].trim() : null,
        app: appMatch ? appMatch[1].toLowerCase() : 'whatsapp',
      };
    },
  },

  // WEATHER
  {
    intent: 'WEATHER',
    patterns: [
      /\b(weather|temperature|forecast|rain|sunny|cloudy|humidity|wind)\b/i,
      /\bhow('s| is) (the )?weather\b/i,
      /\bwhat('s| is) (the )?weather\b/i,
    ],
    extractEntities: (text) => {
      const locMatch = text.match(/\bin\s+([A-Za-z\s]+?)(?:\s*\?|$)/i);
      return { location: locMatch ? locMatch[1].trim() : null };
    },
  },

  // NEWS
  {
    intent: 'NEWS',
    patterns: [
      /\b(news|headlines|latest|today's news|top stories)\b/i,
      /\bwhat('s| is) happening\b/i,
      /\btell me (the |about )?(news|headlines)\b/i,
    ],
    extractEntities: (text) => {
      const catMatch = text.match(/\b(technology|sports|business|health|science|entertainment)\b/i);
      return { category: catMatch ? catMatch[1].toLowerCase() : 'general' };
    },
  },

  // SEARCH
  {
    intent: 'SEARCH',
    patterns: [
      /\b(search|google|look up|find|what is|who is|tell me about)\s+(.+)/i,
    ],
    extractEntities: (text) => {
      const match = text.match(/\b(?:search|google|look up|find|what is|who is|tell me about)\s+(.+)/i);
      return { query: match ? match[1].trim() : text };
    },
  },

  // REMINDER
  {
    intent: 'REMINDER',
    patterns: [
      /\b(remind|reminder|set (a )?reminder|alert me)\b/i,
      /\b(remind me (to|at|in))\b/i,
    ],
    extractEntities: (text) => {
      const timeMatch = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
        || text.match(/\bin\s+(\d+\s+(?:minutes?|hours?))/i);
      const taskMatch = text.match(/\bto\s+(.+?)(?:\s+at|\s+in|$)/i);
      return {
        time: timeMatch ? timeMatch[1] : null,
        task: taskMatch ? taskMatch[1].trim() : null,
      };
    },
  },

  // CALL
  {
    intent: 'CALL',
    patterns: [
      /\b(call|phone|dial|ring)\s+(\w+)/i,
    ],
    extractEntities: (text) => {
      const match = text.match(/\b(?:call|phone|dial|ring)\s+(\w+)/i);
      return { contact: match ? match[1] : null };
    },
  },

  // TIME / DATE
  {
    intent: 'TIME',
    patterns: [
      /\b(what time|current time|time now|what('s| is) the time)\b/i,
      /\b(what('s| is) (today's )?date|what day is it)\b/i,
    ],
    extractEntities: () => ({}),
  },

  // AUTOMATION
  {
    intent: 'AUTOMATION',
    patterns: [
      /\b(create|add|make|set up)\s+(an?\s+)?automation\b/i,
      /\bwhen I say\b/i,
    ],
    extractEntities: () => ({}),
  },
];

// ─── Known app names for quick lookup ─────────────────────────────────────
const KNOWN_APPS = new Set([
  'whatsapp', 'instagram', 'youtube', 'spotify', 'gmail', 'maps',
  'chrome', 'twitter', 'telegram', 'facebook', 'settings', 'camera',
  'netflix', 'snapchat', 'tiktok', 'uber', 'swiggy', 'zomato',
]);

/**
 * Detect intent from text
 * @param {string} text
 * @returns {{ intent: string, confidence: number, entities: object }}
 */
function detectIntent(text) {
  const lower = text.toLowerCase().trim();

  for (const { intent, patterns, extractEntities } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        const entities = extractEntities(lower);
        return {
          intent,
          confidence: 0.85,
          entities,
        };
      }
    }
  }

  // Fallback: if text contains a known app name, treat as OPEN_APP
  for (const app of KNOWN_APPS) {
    if (lower.includes(app)) {
      return {
        intent: 'OPEN_APP',
        confidence: 0.7,
        entities: { app },
      };
    }
  }

  // Default to CHAT — the on-device LLM will handle it
  return {
    intent: 'CHAT',
    confidence: 0.5,
    entities: {},
  };
}

/**
 * Build a simple response for non-chat intents
 * (Chat responses come from the on-device LLM)
 */
function buildQuickResponse(intent, entities, language = 'en') {
  const hi = language === 'hi';

  switch (intent) {
    case 'OPEN_APP':
      return hi
        ? `${entities.app} खोल रहा हूं...`
        : `Opening ${entities.app}...`;

    case 'SEND_MESSAGE':
      return hi
        ? `${entities.contact} को संदेश भेज रहा हूं...`
        : `Sending message to ${entities.contact}...`;

    case 'CALL':
      return hi
        ? `${entities.contact} को कॉल कर रहा हूं...`
        : `Calling ${entities.contact}...`;

    case 'REMINDER':
      return hi
        ? `रिमाइंडर सेट कर रहा हूं...`
        : `Setting reminder${entities.task ? ` to ${entities.task}` : ''}...`;

    case 'TIME': {
      const now = new Date();
      const time = now.toLocaleTimeString(hi ? 'hi-IN' : 'en-US', {
        hour: '2-digit', minute: '2-digit',
      });
      const date = now.toLocaleDateString(hi ? 'hi-IN' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      return hi
        ? `अभी ${time} बजे हैं। आज ${date} है।`
        : `It's ${time}. Today is ${date}.`;
    }

    case 'SEARCH':
      return hi
        ? `"${entities.query}" खोज रहा हूं...`
        : `Searching for "${entities.query}"...`;

    default:
      return null; // Let on-device LLM handle CHAT / AUTOMATION / WEATHER / NEWS
  }
}

module.exports = { detectIntent, buildQuickResponse };
