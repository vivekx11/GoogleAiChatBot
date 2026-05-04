/**
 * AI Service — Real implementation
 *
 * LLM  : Backend API (OpenAI / your server)
 * STT  : expo-av recording → backend transcription (or silence detection)
 * TTS  : expo-speech (on-device, works in Expo Go)
 *
 * Drop-in replacement for the old @runanywhere SDK.
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { api } from './api';

// ─── Model IDs (kept for compatibility with modelService) ──────────────────
export const MODEL_IDS = {
  llm: 'backend-llm',
  stt: 'expo-av-stt',
  tts: 'expo-speech-tts',
} as const;

// ─── Jarvis system prompt ──────────────────────────────────────────────────
export const JARVIS_SYSTEM_PROMPT = `You are Jarvis, a highly intelligent personal AI assistant — like Tony Stark's AI.
You are helpful, witty, and concise. You can answer questions, help with tasks, and have natural conversations.
Keep responses brief (2-3 sentences) unless detail is requested.
You support both English and Hindi.`;

// ─── Progress callback type ────────────────────────────────────────────────
export type DownloadProgress = {
  modelId: string;
  progress: number;
};

// ─── SDK Init (no-op — nothing to initialize) ─────────────────────────────
let _initialized = false;

export async function initializeSDK(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
}

export async function isModelDownloaded(_modelId: string): Promise<boolean> {
  return true; // Backend/expo-speech need no download
}

export async function downloadModel(
  _modelId: string,
  onProgress?: (p: DownloadProgress) => void
): Promise<void> {
  onProgress?.({ modelId: _modelId, progress: 100 });
}

export async function loadLLM(): Promise<void> {}
export async function loadSTT(): Promise<void> {}
export async function loadTTS(): Promise<void> {}

// ─── Chat ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Stream chat via backend API.
 * Falls back to non-streaming if backend doesn't support it.
 */
export async function chatStream(
  userMessage: string,
  history: ChatMessage[] = [],
  onToken?: (token: string, accumulated: string) => void
): Promise<string> {
  try {
    const messages = [
      { role: 'system', content: JARVIS_SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: userMessage },
    ];

    const response = await api.post('/chat/ai', { messages });
    const content: string = response.data?.content || response.data?.message || '';

    // Simulate streaming for UI consistency
    if (onToken) {
      const words = content.split(' ');
      let accumulated = '';
      for (const word of words) {
        accumulated += (accumulated ? ' ' : '') + word;
        onToken(word + ' ', accumulated);
        await new Promise((r) => setTimeout(r, 20));
      }
    }

    return content;
  } catch (err: any) {
    // If backend not available, return a helpful message
    const fallback = "I'm having trouble connecting to the server. Please check your connection.";
    onToken?.(fallback, fallback);
    return fallback;
  }
}

export async function chat(userMessage: string, history: ChatMessage[] = []): Promise<string> {
  return chatStream(userMessage, history);
}

// ─── Audio Recording ───────────────────────────────────────────────────────

let _recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Microphone permission denied');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  _recording = recording;
}

export async function stopAndTranscribe(language = 'en'): Promise<string> {
  if (!_recording) return '';

  await _recording.stopAndUnloadAsync();
  const uri = _recording.getURI();
  _recording = null;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  if (!uri) return '';

  try {
    // Send audio to backend for transcription
    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('language', language);

    const response = await api.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    return response.data?.text || '';
  } catch (_err) {
    // Transcription failed — return empty so caller shows "try again"
    return '';
  }
}

export async function cancelRecording(): Promise<void> {
  if (_recording) {
    try {
      await _recording.stopAndUnloadAsync();
    } catch (_) {}
    _recording = null;
  }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

// ─── Text-to-Speech ────────────────────────────────────────────────────────

export async function speak(
  text: string,
  options: { rate?: number; pitch?: number; volume?: number } = {}
): Promise<void> {
  const { rate = 1.0, pitch = 1.0 } = options;

  const cleanText = text
    .replace(/\{[^}]*"action"[^}]*\}/g, '')
    .replace(/[*_`#]/g, '')
    .trim();

  if (!cleanText) return;

  return new Promise((resolve) => {
    Speech.speak(cleanText, {
      rate,
      pitch,
      onDone: () => resolve(),
      onError: () => resolve(), // Don't crash on TTS error
    });
  });
}

export async function stopSpeaking(): Promise<void> {
  Speech.stop();
}
