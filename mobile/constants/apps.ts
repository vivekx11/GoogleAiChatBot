/**
 * App Deep Link Registry
 * Maps app names to their deep link URLs for Android/iOS
 */

export interface AppConfig {
  name: string;
  displayName: string;
  androidPackage?: string;
  iosScheme?: string;
  deepLink?: string;
  fallbackUrl?: string;
  icon: string;
}

export const APP_REGISTRY: Record<string, AppConfig> = {
  whatsapp: {
    name: 'whatsapp',
    displayName: 'WhatsApp',
    androidPackage: 'com.whatsapp',
    iosScheme: 'whatsapp://',
    deepLink: 'whatsapp://',
    fallbackUrl: 'https://wa.me',
    icon: '💬',
  },
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    androidPackage: 'com.instagram.android',
    iosScheme: 'instagram://',
    deepLink: 'instagram://',
    fallbackUrl: 'https://instagram.com',
    icon: '📸',
  },
  youtube: {
    name: 'youtube',
    displayName: 'YouTube',
    androidPackage: 'com.google.android.youtube',
    iosScheme: 'youtube://',
    deepLink: 'youtube://',
    fallbackUrl: 'https://youtube.com',
    icon: '▶️',
  },
  spotify: {
    name: 'spotify',
    displayName: 'Spotify',
    androidPackage: 'com.spotify.music',
    iosScheme: 'spotify://',
    deepLink: 'spotify://',
    fallbackUrl: 'https://open.spotify.com',
    icon: '🎵',
  },
  gmail: {
    name: 'gmail',
    displayName: 'Gmail',
    androidPackage: 'com.google.android.gm',
    iosScheme: 'googlegmail://',
    deepLink: 'googlegmail://',
    fallbackUrl: 'https://mail.google.com',
    icon: '📧',
  },
  maps: {
    name: 'maps',
    displayName: 'Google Maps',
    androidPackage: 'com.google.android.apps.maps',
    iosScheme: 'comgooglemaps://',
    deepLink: 'geo:0,0',
    fallbackUrl: 'https://maps.google.com',
    icon: '🗺️',
  },
  chrome: {
    name: 'chrome',
    displayName: 'Chrome',
    androidPackage: 'com.android.chrome',
    iosScheme: 'googlechrome://',
    deepLink: 'https://',
    fallbackUrl: 'https://google.com',
    icon: '🌐',
  },
  twitter: {
    name: 'twitter',
    displayName: 'Twitter / X',
    androidPackage: 'com.twitter.android',
    iosScheme: 'twitter://',
    deepLink: 'twitter://',
    fallbackUrl: 'https://twitter.com',
    icon: '🐦',
  },
  telegram: {
    name: 'telegram',
    displayName: 'Telegram',
    androidPackage: 'org.telegram.messenger',
    iosScheme: 'tg://',
    deepLink: 'tg://',
    fallbackUrl: 'https://t.me',
    icon: '✈️',
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook',
    androidPackage: 'com.facebook.katana',
    iosScheme: 'fb://',
    deepLink: 'fb://',
    fallbackUrl: 'https://facebook.com',
    icon: '👥',
  },
  settings: {
    name: 'settings',
    displayName: 'Settings',
    androidPackage: 'com.android.settings',
    iosScheme: 'app-settings:',
    deepLink: 'app-settings:',
    icon: '⚙️',
  },
  camera: {
    name: 'camera',
    displayName: 'Camera',
    deepLink: 'camera://',
    icon: '📷',
  },
};

/**
 * WhatsApp send message deep link
 */
export function getWhatsAppMessageLink(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `whatsapp://send?phone=${phone}&text=${encoded}`;
}

/**
 * Google search deep link
 */
export function getSearchLink(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
