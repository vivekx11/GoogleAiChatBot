/**
 * App Control Service
 * Opens apps via deep linking, handles send message intents
 */

import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';
import { APP_REGISTRY, getSearchLink, getWhatsAppMessageLink } from '../constants/apps';

export interface AppAction {
  type: 'OPEN_APP' | 'SEND_MESSAGE' | 'SEARCH' | 'CALL' | 'OPEN_URL';
  app?: string;
  contact?: string;
  phone?: string;
  message?: string;
  query?: string;
  url?: string;
}

/**
 * Execute a device action from AI response
 */
export async function executeAction(action: AppAction): Promise<boolean> {
  try {
    switch (action.type) {
      case 'OPEN_APP':
        return await openApp(action.app || '');

      case 'SEND_MESSAGE':
        return await sendMessage(action.app || 'whatsapp', action.contact || '', action.message || '');

      case 'SEARCH':
        return await openUrl(getSearchLink(action.query || ''));

      case 'CALL':
        return await openUrl(`tel:${action.phone}`);

      case 'OPEN_URL':
        return await openUrl(action.url || '');

      default:
        return false;
    }
  } catch (err) {
    console.error('Action execution error:', err);
    return false;
  }
}

/**
 * Open an app by name
 */
async function openApp(appName: string): Promise<boolean> {
  const normalized = appName.toLowerCase().trim();
  const config = APP_REGISTRY[normalized];

  if (!config) {
    // Try generic URL scheme
    const url = `${normalized}://`;
    return await openUrl(url);
  }

  // Try deep link first
  if (config.deepLink) {
    const canOpen = await Linking.canOpenURL(config.deepLink);
    if (canOpen) {
      await Linking.openURL(config.deepLink);
      return true;
    }
  }

  // Fallback to web URL
  if (config.fallbackUrl) {
    await Linking.openURL(config.fallbackUrl);
    return true;
  }

  return false;
}

/**
 * Send a message via an app
 */
async function sendMessage(app: string, contact: string, message: string): Promise<boolean> {
  const normalized = app.toLowerCase();

  switch (normalized) {
    case 'whatsapp': {
      // If contact looks like a phone number
      if (/^\+?\d+$/.test(contact.replace(/\s/g, ''))) {
        const url = getWhatsAppMessageLink(contact.replace(/\s/g, ''), message);
        return await openUrl(url);
      }
      // Otherwise open WhatsApp and let user pick contact
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      return await openUrl(url);
    }

    case 'telegram': {
      const url = `tg://msg?text=${encodeURIComponent(message)}`;
      return await openUrl(url);
    }

    case 'sms': {
      const url = `sms:${contact}?body=${encodeURIComponent(message)}`;
      return await openUrl(url);
    }

    default:
      return await openApp(normalized);
  }
}

/**
 * Open a URL with error handling
 */
async function openUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    console.warn(`Cannot open URL: ${url}`);
    return false;
  } catch (err) {
    console.error('openUrl error:', err);
    return false;
  }
}

/**
 * Parse action from AI response text
 */
export function parseActionFromText(text: string): AppAction | null {
  try {
    const match = text.match(/\{[^}]*"action"[^}]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        type: parsed.action,
        app: parsed.app,
        contact: parsed.contact,
        message: parsed.message,
        query: parsed.query,
        url: parsed.url,
      };
    }
  } catch (_) {}
  return null;
}
