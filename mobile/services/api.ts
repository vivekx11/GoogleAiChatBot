/**
 * API Service — Axios instance with auth interceptors
 */

import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor — Attach JWT ─────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Handle 401 ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear stored token on auth failure
      await SecureStore.deleteItemAsync('auth_token');
      // Navigation to login is handled by auth store
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; language?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: object) => api.put('/auth/profile', data),
};

// ─── Chat API ──────────────────────────────────────────────────────────────
export const chatApi = {
  // Send user message → get session ID + history for on-device LLM
  sendMessage: (data: { message: string; sessionId?: string }) =>
    api.post('/chat/message', data),

  // Save AI response generated on-device back to server
  saveResponse: (data: { sessionId: string; content: string; tokensUsed?: number }) =>
    api.post('/chat/save', data),

  getSessions: () => api.get('/chat/sessions'),

  createSession: (title?: string) => api.post('/chat/sessions', { title }),

  getSession: (id: string) => api.get(`/chat/sessions/${id}`),

  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
};

// ─── Voice API ─────────────────────────────────────────────────────────────
// STT and TTS are now on-device via RunAnywhere SDK.
// This API only handles intent routing and command logging.
export const voiceApi = {
  // Send transcript to backend for intent detection + action routing
  processCommand: (text: string, language = 'en') =>
    api.post('/voice/command', { text, language }),

  getHistory: (limit = 20) => api.get(`/voice/history?limit=${limit}`),
};

// ─── Automation API ────────────────────────────────────────────────────────
export const automationApi = {
  list: () => api.get('/automation'),

  create: (data: { name: string; trigger: string; actions: object[] }) =>
    api.post('/automation', data),

  update: (id: string, data: object) => api.put(`/automation/${id}`, data),

  remove: (id: string) => api.delete(`/automation/${id}`),

  run: (id: string) => api.post(`/automation/${id}/run`),

  toggle: (id: string) => api.post(`/automation/${id}/toggle`),
};

// ─── Integrations API ──────────────────────────────────────────────────────
export const integrationsApi = {
  getWeather: (location: string, lang = 'en') =>
    api.get(`/integrations/weather?location=${encodeURIComponent(location)}&lang=${lang}`),

  getNews: (category = 'general', lang = 'en') =>
    api.get(`/integrations/news?category=${category}&lang=${lang}`),
};
