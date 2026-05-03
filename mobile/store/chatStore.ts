/**
 * Chat Store — Zustand
 *
 * Two-step flow with RunAnywhere on-device LLM:
 *   1. POST /chat/message  → backend saves user msg, returns history
 *   2. RunAnywhere.generateStream(prompt + history) → streams tokens
 *   3. POST /chat/save     → backend saves AI response
 */

import { create } from 'zustand';
import { chatApi } from '../services/api';
import { chatStream, ChatMessage } from '../services/runanywhereService';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  tokens_used?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  streamingContent: string; // Live token stream for UI
  error: string | null;

  loadSessions: () => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  sendMessage: (text: string, language?: string) => Promise<string>;
  createSession: (title?: string) => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
  setCurrentSession: (id: string | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  isLoading: false,
  isSending: false,
  streamingContent: '',
  error: null,

  loadSessions: async () => {
    set({ isLoading: true });
    try {
      const res = await chatApi.getSessions();
      set({ sessions: res.data.sessions, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadSession: async (id) => {
    set({ isLoading: true });
    try {
      const res = await chatApi.getSession(id);
      set({ currentSessionId: id, messages: res.data.messages, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Send a message and get AI response from on-device LLM
   */
  sendMessage: async (text, language = 'en') => {
    const { currentSessionId } = get();

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: `temp_user_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempUserMsg],
      isSending: true,
      streamingContent: '',
      error: null,
    }));

    try {
      // ── Step 1: Tell backend about the message, get history ──────────────
      const backendRes = await chatApi.sendMessage({
        message: text,
        sessionId: currentSessionId || undefined,
      });
      const { sessionId, history } = backendRes.data;

      // ── Step 2: Run on-device LLM with streaming ─────────────────────────
      const historyForLLM: ChatMessage[] = (history as any[])
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({ role: m.role, content: m.content }));

      // Add a placeholder AI message for streaming
      const tempAiId = `temp_ai_${Date.now()}`;
      set((state) => ({
        messages: [...state.messages, {
          id: tempAiId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        }],
        currentSessionId: sessionId,
      }));

      const aiContent = await chatStream(
        text,
        historyForLLM.slice(0, -1), // Exclude the just-added user message (already in prompt)
        (_, accumulated) => {
          // Update the streaming placeholder in real-time
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === tempAiId ? { ...m, content: accumulated } : m
            ),
            streamingContent: accumulated,
          }));
        }
      );

      // ── Step 3: Save AI response to backend ──────────────────────────────
      await chatApi.saveResponse({ sessionId, content: aiContent });

      // Finalize the message (replace temp ID with stable one)
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempAiId
            ? { ...m, id: `ai_${Date.now()}`, content: aiContent }
            : m
        ),
        isSending: false,
        streamingContent: '',
      }));

      // Refresh sessions list
      get().loadSessions();

      return aiContent;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to send message';
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempUserMsg.id),
        error: errorMsg,
        isSending: false,
        streamingContent: '',
      }));
      throw new Error(errorMsg);
    }
  },

  createSession: async (title) => {
    const res = await chatApi.createSession(title);
    const { session } = res.data;
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: session.id,
      messages: [],
    }));
    return session.id;
  },

  deleteSession: async (id) => {
    await chatApi.deleteSession(id);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
      messages: state.currentSessionId === id ? [] : state.messages,
    }));
  },

  setCurrentSession: (id) => set({ currentSessionId: id }),
  clearMessages: () => set({ messages: [], currentSessionId: null }),
  clearError: () => set({ error: null }),
}));
