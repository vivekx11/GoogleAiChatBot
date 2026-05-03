/**
 * Voice Store — Zustand
 *
 * Uses RunAnywhere SDK for all AI:
 *   - STT: on-device Whisper (via ONNX)
 *   - LLM: on-device LFM2 (via LlamaCPP)
 *   - TTS: on-device Piper (via ONNX)
 *
 * Backend is only called for intent routing (weather, news, app actions).
 */

import { create } from 'zustand';
import { voiceApi } from '../services/api';
import {
  startRecording,
  stopAndTranscribe,
  cancelRecording,
  chatStream,
  speak,
  stopSpeaking,
} from '../services/runanywhereService';
import { executeAction } from '../services/appControl';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceCommand {
  id: string;
  transcript: string;
  intent: string;
  response: string;
  timestamp: string;
}

interface VoiceStoreState {
  state: VoiceState;
  transcript: string;
  response: string;
  intent: string | null;
  isRecording: boolean;
  error: string | null;
  history: VoiceCommand[];

  startListening: () => Promise<void>;
  stopListening: (language?: string) => Promise<void>;
  cancelListening: () => Promise<void>;
  processTextCommand: (text: string, language?: string) => Promise<void>;
  speakText: (text: string, language?: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceStoreState>((set, get) => ({
  state: 'idle',
  transcript: '',
  response: '',
  intent: null,
  isRecording: false,
  error: null,
  history: [],

  /**
   * Start microphone recording (RunAnywhere.Audio)
   */
  startListening: async () => {
    try {
      set({ state: 'listening', error: null, transcript: '', response: '' });
      await startRecording();
      set({ isRecording: true });
    } catch (err: any) {
      set({ state: 'error', error: err.message, isRecording: false });
    }
  },

  /**
   * Stop recording → on-device Whisper STT → process command
   */
  stopListening: async (language = 'en') => {
    try {
      set({ state: 'processing', isRecording: false });

      // On-device transcription via RunAnywhere Whisper
      const transcript = await stopAndTranscribe(language);
      set({ transcript });

      if (!transcript.trim()) {
        set({ state: 'idle', error: 'Could not understand. Please try again.' });
        return;
      }

      await get().processTextCommand(transcript, language);
    } catch (err: any) {
      set({ state: 'error', error: err.message, isRecording: false });
    }
  },

  /**
   * Cancel recording
   */
  cancelListening: async () => {
    await cancelRecording();
    set({ state: 'idle', isRecording: false, transcript: '', response: '' });
  },

  /**
   * Process a text command:
   *   1. Ask backend for intent + action (weather, news, app control)
   *   2. If backend says useLocalLLM=true → run on-device LFM2
   *   3. Execute device action if any
   *   4. Speak response via on-device Piper TTS
   */
  processTextCommand: async (text, language = 'en') => {
    set({ state: 'processing', transcript: text });

    try {
      // ── Step 1: Backend intent routing ──────────────────────────────────
      const backendRes = await voiceApi.processCommand(text, language);
      const { intent, response: backendResponse, action, useLocalLLM } = backendRes.data;

      let finalResponse = backendResponse;

      // ── Step 2: On-device LLM for chat/unknown intents ───────────────────
      if (useLocalLLM || !finalResponse) {
        finalResponse = await chatStream(text, [], (_, accumulated) => {
          // Optionally update UI with streaming tokens
          set({ response: accumulated });
        });
      }

      set({
        intent,
        response: finalResponse,
        history: [
          {
            id: Date.now().toString(),
            transcript: text,
            intent,
            response: finalResponse,
            timestamp: new Date().toISOString(),
          },
          ...get().history.slice(0, 49),
        ],
      });

      // ── Step 3: Execute device action ────────────────────────────────────
      if (action) {
        await executeAction(action);
      }

      // ── Step 4: On-device TTS ─────────────────────────────────────────────
      await get().speakText(finalResponse, language);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Command failed';
      set({ state: 'error', error: msg });
    }
  },

  /**
   * Speak text via on-device Piper TTS
   */
  speakText: async (text, language = 'en') => {
    set({ state: 'speaking' });
    try {
      await speak(text);
    } finally {
      set({ state: 'idle' });
    }
  },

  stopSpeaking: async () => {
    await stopSpeaking();
    set({ state: 'idle' });
  },

  clearError: () => set({ error: null, state: 'idle' }),
  reset: () => set({ state: 'idle', transcript: '', response: '', intent: null, error: null }),
}));
