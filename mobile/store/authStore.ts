/**
 * Auth Store — Zustand
 * Manages authentication state, user profile, settings
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  language: 'en' | 'hi';
  theme: string;
}

export interface UserSettings {
  wake_word: string;
  voice_speed: number;
  voice_pitch: number;
  notifications: number | boolean;
  offline_mode: number | boolean;
  auto_read_response: number | boolean;
}

interface AuthState {
  user: User | null;
  settings: UserSettings | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, language?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (data: Partial<User & { settings: Partial<UserSettings> }>) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  wake_word: 'hey jarvis',
  voice_speed: 1.0,
  voice_pitch: 1.0,
  notifications: true,
  offline_mode: false,
  auto_read_response: true,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  settings: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  /**
   * Login with email/password
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { token, user, settings } = response.data;

      await SecureStore.setItemAsync('auth_token', token);

      set({
        token,
        user,
        settings: settings || DEFAULT_SETTINGS,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  /**
   * Register new account
   */
  register: async (name, email, password, language = 'en') => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register({ name, email, password, language });
      const { token, user } = response.data;

      await SecureStore.setItemAsync('auth_token', token);

      set({
        token,
        user,
        settings: DEFAULT_SETTINGS,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  /**
   * Logout — clear all stored data
   */
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({
      user: null,
      settings: null,
      token: null,
      isAuthenticated: false,
    });
  },

  /**
   * Load stored token on app start
   */
  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await authApi.getMe();
      const { user, settings } = response.data;

      set({
        token,
        user,
        settings: settings || DEFAULT_SETTINGS,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      // Token invalid or expired
      await SecureStore.deleteItemAsync('auth_token');
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  /**
   * Update user profile and settings
   */
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.updateProfile(data);

      set((state) => ({
        user: state.user ? { ...state.user, ...data } : state.user,
        settings: data.settings
          ? { ...(state.settings || DEFAULT_SETTINGS), ...data.settings }
          : state.settings,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Update failed', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
