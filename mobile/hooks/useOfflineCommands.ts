/**
 * useOfflineCommands — Basic command processing without internet
 * Handles simple intents locally when offline
 */

import { useCallback } from 'react';
import { executeAction } from '../services/appControl';

interface OfflineResult {
  response: string;
  action?: object;
}

// Simple keyword-based intent matching for offline mode
const OFFLINE_PATTERNS: Array<{
  patterns: RegExp[];
  handler: (match: RegExpMatchArray, text: string) => OfflineResult;
}> = [
  {
    patterns: [/open\s+(\w+)/i, /launch\s+(\w+)/i, /start\s+(\w+)/i],
    handler: (match) => ({
      response: `Opening ${match[1]}...`,
      action: { type: 'OPEN_APP', app: match[1].toLowerCase() },
    }),
  },
  {
    patterns: [/what time is it/i, /current time/i, /time now/i],
    handler: () => ({
      response: `It's ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    }),
  },
  {
    patterns: [/what.*date/i, /today.*date/i, /what day/i],
    handler: () => ({
      response: `Today is ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
    }),
  },
  {
    patterns: [/hello|hi jarvis|hey jarvis/i],
    handler: () => ({
      response: "Hello! I'm Jarvis. I'm currently in offline mode, so some features are limited.",
    }),
  },
  {
    patterns: [/search\s+(.+)/i, /google\s+(.+)/i],
    handler: (match) => ({
      response: `Searching for "${match[1]}"...`,
      action: { type: 'SEARCH', query: match[1] },
    }),
  },
  {
    patterns: [/call\s+(.+)/i, /phone\s+(.+)/i],
    handler: (match) => ({
      response: `Calling ${match[1]}...`,
      action: { type: 'CALL', contact: match[1] },
    }),
  },
];

export function useOfflineCommands() {
  const processOffline = useCallback(async (text: string): Promise<OfflineResult> => {
    const lower = text.toLowerCase().trim();

    for (const { patterns, handler } of OFFLINE_PATTERNS) {
      for (const pattern of patterns) {
        const match = lower.match(pattern);
        if (match) {
          const result = handler(match, lower);
          if (result.action) {
            await executeAction(result.action as any);
          }
          return result;
        }
      }
    }

    return {
      response: "I'm in offline mode. I can open apps, tell you the time, and do basic tasks. Connect to the internet for full AI capabilities.",
    };
  }, []);

  return { processOffline };
}
