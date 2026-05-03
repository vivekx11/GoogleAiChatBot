/**
 * Automation Store — Zustand
 */

import { create } from 'zustand';
import { automationApi } from '../services/api';
import { executeAction } from '../services/appControl';

export interface AutomationAction {
  type: string;
  app?: string;
  message?: string;
  url?: string;
  query?: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: AutomationAction[];
  is_active: boolean;
  run_count: number;
  last_run: string | null;
  created_at: string;
}

interface AutomationState {
  automations: Automation[];
  isLoading: boolean;
  error: string | null;

  load: () => Promise<void>;
  create: (data: { name: string; trigger: string; actions: AutomationAction[] }) => Promise<void>;
  update: (id: string, data: Partial<Automation>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  run: (id: string) => Promise<void>;
  checkTrigger: (commandText: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
  automations: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true });
    try {
      const response = await automationApi.list();
      set({ automations: response.data.automations, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  create: async (data) => {
    set({ isLoading: true });
    try {
      const response = await automationApi.create(data);
      set((state) => ({
        automations: [response.data.automation, ...state.automations],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  update: async (id, data) => {
    try {
      await automationApi.update(id, data);
      set((state) => ({
        automations: state.automations.map(a => a.id === id ? { ...a, ...data } : a),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  remove: async (id) => {
    try {
      await automationApi.remove(id);
      set((state) => ({
        automations: state.automations.filter(a => a.id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  toggle: async (id) => {
    try {
      const response = await automationApi.toggle(id);
      const { is_active } = response.data;
      set((state) => ({
        automations: state.automations.map(a => a.id === id ? { ...a, is_active } : a),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  run: async (id) => {
    try {
      const response = await automationApi.run(id);
      const { actions } = response.data;

      // Execute all actions
      for (const action of actions) {
        await executeAction(action);
      }

      // Update run count locally
      set((state) => ({
        automations: state.automations.map(a =>
          a.id === id
            ? { ...a, run_count: a.run_count + 1, last_run: new Date().toISOString() }
            : a
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  /**
   * Check if a voice command matches any automation trigger
   * Returns true if an automation was triggered
   */
  checkTrigger: async (commandText) => {
    const { automations } = get();
    const lower = commandText.toLowerCase().trim();

    for (const automation of automations) {
      if (automation.is_active && lower.includes(automation.trigger.toLowerCase())) {
        await get().run(automation.id);
        return true;
      }
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
